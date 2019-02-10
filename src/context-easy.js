import {throttle} from 'lodash/function';
import {bool, func, node, object, shape, string} from 'prop-types';
import {get, omit, set, update} from 'lodash/fp';
import React, {Component} from 'react';

const MSG_PREFIX = 'easy-context method ';
const STATE_KEY = 'context-easy-state';
const VERSION_KEY = '@reduxEasyVersion';

export const EasyContext = React.createContext();

const isProd = process.env.NODE_ENV === 'production';

let initialState = {},
  persist,
  replacerFn,
  reviverFn,
  version;

function copyWithoutFunctions(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value !== 'function') acc[key] = value;
    return acc;
  }, {});
}

let log = (name, state, path, text, ...values) => {
  let msg = name + ' ' + path;
  if (text) msg += ' ' + text;
  console.info('context-easy:', msg, ...values);
  console.info(copyWithoutFunctions(state));
};

const identityFn = state => state;

/**
 * This is called on app startup and
 * again each time the browser window is refreshed.
 * This function is only exported so it can be accessed from a test.
 */
export function loadState() {
  const cleanState = replacerFn(initialState);

  if (!persist) return cleanState;

  const {sessionStorage} = window; // not available in tests

  // If the version passed to reduxEasy does not match the version
  // last saved in sessionStorage, assume that the shape of the state
  // may have changed and revert to initialState.
  const ssVersion = sessionStorage.getItem(VERSION_KEY);
  if (String(version) !== ssVersion) {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(cleanState));
    sessionStorage.setItem(VERSION_KEY, version);
    return cleanState;
  }

  let json;
  try {
    json = sessionStorage ? sessionStorage.getItem(STATE_KEY) : null;
    if (!json || json === '""') return cleanState;

    const state = JSON.parse(json);
    const revived = reviverFn(state);
    return revived;
  } catch (e) {
    return cleanState;
  }
}

const validateArray = (methodName, path, value) => {
  if (Array.isArray(value)) return;
  throw new Error(
    MSG_PREFIX +
      methodName +
      ' requires an array, but ' +
      path +
      ' value is ' +
      value
  );
};

const validateFunction = (methodName, value) => {
  if (typeof value === 'function') return;
  throw new Error(
    MSG_PREFIX + methodName + ' requires a function, but got ' + value
  );
};

const validateNumber = (methodName, path, value) => {
  if (typeof value === 'number') return;
  throw new Error(
    MSG_PREFIX +
      methodName +
      ' requires a number, but ' +
      path +
      ' value is ' +
      value
  );
};

const validatePath = (methodName, path) => {
  if (typeof path === 'string') return;
  throw new Error(
    MSG_PREFIX + methodName + ' requires a string path, but got ' + path
  );
};

/*
 * The options prop value can be an object with these properties:

 * replacerFn: function that is passed the state before it is saved in
 *   sessionStorage and returns the state that should actually be saved there;
 *   can be used to avoid exposing sensitive data
 * reviverFn: function that is passed the state after it is retrieved from
 *   sessionStorage and returns the state that the app should actually use;
 *   can be used to supply sensitive data that is not in sessionStorage
 * persist: optional boolean
 *   (defaults to true; set to false to not save state to sessionStorage)
 * version: a version string that should be changed
 *   when the shape of the state changes
 */
export class EasyProvider extends Component {
  static initialized = false;

  static getDerivedStateFromProps(props) {
    if (EasyProvider.initialized) return null;
    EasyProvider.initialized = true;
    return props.initialState;
  }

  static propTypes = {
    children: node,
    initialState: object,
    log: bool,
    options: shape({
      persist: bool,
      replacerFn: func,
      reviverFn: func,
      version: string
    }),
    validate: bool
  };

  static defaultProps = {
    options: {}
  };

  previousPromise = null;

  state = {
    decrement: (path, delta = 1) => {
      if (this.shouldValidate) {
        validatePath('decrement', path);
        validateNumber('decrement', 'delta', delta);
        const value = get(path, this.state);
        validateNumber('decrement', path, value);
      }
      return this.performOperation(
        'update',
        path,
        n => n - delta,
        () => log && log('decrement', this.state, path, 'by', delta)
      );
    },

    delete: path => {
      if (this.shouldValidate) validatePath('delete', path);
      return this.performOperation(
        'omit',
        path,
        null,
        () => log && log('delete', this.state, path)
      );
    },

    filter: (path, fn) => {
      if (this.shouldValidate) {
        validatePath('filter', path);
        validateArray('filter', path, get(path, this.state));
        validateFunction('filter', fn);
      }
      return this.performOperation(
        'update',
        path,
        arr => arr.filter(fn),
        () => log && log('filter', this.state, path, 'using', fn)
      );
    },

    get: path => get(path, this.state),

    increment: (path, delta = 1) => {
      if (this.shouldValidate) {
        validatePath('increment', path);
        validateNumber('increment', 'delta', delta);
        const value = get(path, this.state);
        validateNumber('increment', path, value);
      }
      return this.performOperation(
        'update',
        path,
        n => n + delta,
        () => log && log('increment', this.state, path, 'by', delta)
      );
    },

    // Note that this is a method and is different
    // from the `log` function defined above.
    log: (label = '') => {
      console.info(
        'context-easy:',
        label,
        'state =',
        copyWithoutFunctions(this.state)
      );
    },

    map: (path, fn) => {
      if (this.shouldValidate) {
        validatePath('map', path);
        validateArray('map', path, get(path, this.state));
        validateFunction('map', fn);
      }
      return this.performOperation(
        'update',
        path,
        arr => arr.map(fn),
        () => log && log('map', this.state, path, 'using', fn)
      );
    },

    push: (path, ...newValues) => {
      if (this.shouldValidate) {
        validatePath('push', path);
        validateArray('push', path, get(path, this.state));
      }
      return this.performOperation(
        'push',
        path,
        newValues,
        () => log && log('push', this.state, path, 'with', ...newValues)
      );
    },

    set: (path, value) => {
      if (this.shouldValidate) validatePath('set', path);
      return this.performOperation(
        'set',
        path,
        value,
        () => log && log('set', this.state, path, 'to', value)
      );
    },

    toggle: path => {
      const value = get(path, this.state);
      if (this.shouldValidate) {
        validatePath('toggle', path);
        const type = typeof value;
        if (type !== 'boolean' && type !== 'undefined') {
          throw new Error(
            MSG_PREFIX +
              'toggle requires a path to a boolean value, but found' +
              type
          );
        }
      }
      return this.performOperation('toggle', path, () =>
        log('toggle', this.state, path, 'to', !value)
      );
    },

    transform: (path, fn) => {
      if (this.shouldValidate) {
        validatePath('transform', path);
        validateFunction('transform', fn);
      }
      return this.performOperation(
        'update',
        path,
        fn,
        () => log && log('transform', this.state, path, 'using', fn)
      );
    }
  };

  componentDidMount() {
    const {log: shouldLog, options, validate} = this.props;
    if (!shouldLog || isProd) log = () => {}; // noop
    this.shouldValidate = validate && !isProd;

    ({
      initialState = {},
      replacerFn = identityFn,
      reviverFn = identityFn,
      persist = true,
      version = null
    } = options);

    this.setState(loadState());
  }

  performOperation(operation, path, value, callback) {
    const waitFor = this.previousPromise;

    this.previousPromise = new Promise(async resolve => {
      await waitFor; // pending operation to complete

      let newState;
      switch (operation) {
        case 'omit':
          newState = omit(path, this.state);
          break;
        case 'push': {
          const currentValue = get(path, this.state);
          newState = set(path, [...currentValue, ...value], this.state);
          break;
        }
        case 'set':
          newState = set(path, value, this.state);
          break;
        case 'toggle': {
          const currentValue = get(path, this.state);
          newState = set(path, !currentValue, this.state);
          break;
        }
        case 'update':
          newState = update(path, value, this.state);
          break;
        default:
          throw new Error('unhandled operation ' + operation);
      }

      this.setState(newState, () => {
        if (persist) this.throttledSave();
        if (callback) callback();
        resolve();
      });
    });

    return this.previousPromise;
  }

  throttledSave = throttle(() => {
    const json = JSON.stringify(replacerFn(this.state));
    sessionStorage.setItem(STATE_KEY, json);
  }, 1000);

  render() {
    return (
      <EasyContext.Provider value={this.state}>
        {this.props.children}
      </EasyContext.Provider>
    );
  }
}
