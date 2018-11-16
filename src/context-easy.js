import {throttle} from 'lodash/function';
import {bool, func, node, shape, string} from 'prop-types';
import {get, omit, set, update} from 'lodash/fp';
import React, {Component} from 'react';

const MSG_PREFIX = 'easy-context method ';
const STATE_KEY = 'context-easy-state';
const VERSION_KEY = '@reduxEasyVersion';

export const EasyContext = React.createContext();

const isProd = process.env.NODE_ENV === 'production';

let initialState = {},
  replacerFn,
  reviverFn,
  sessionStorageOptOut,
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
  console.info('context-easy:', msg, ...values, copyWithoutFunctions(state));
};

const identityFn = state => state;

/**
 * This is called on app startup and
 * again each time the browser window is refreshed.
 * This function is only exported so it can be accessed from a test.
 */
export function loadState() {
  const cleanState = replacerFn(initialState);

  if (sessionStorageOptOut) return cleanState;

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

const noOp = () => {};

let validateArray = (methodName, path, value) => {
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

let validateFunction = (methodName, value) => {
  if (typeof value === 'function') return;
  throw new Error(
    MSG_PREFIX + methodName + ' requires a function, but got ' + value
  );
};

let validateNumber = (methodName, path, value) => {
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

let validatePath = (methodName, path) => {
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
 * sessionStorageOptOut: optional boolean
 *   (true to not save state to session storage)
 * version: a version string that should be changed
 *   when the shape of the state changes
 */
export class EasyProvider extends Component {
  static initialized = false;
  static getDerivedStateFromProps(props, state) {
    if (EasyProvider.initialized) return null;
    EasyProvider.initialized = true;
    return props.initialState;
  }

  static propTypes = {
    children: node,
    options: shape({
      log: bool,
      replacerFn: func,
      reviverFn: func,
      sessionStorageOptOut: bool,
      validate: bool,
      version: string
    })
  };
  static defaultProps = {
    options: {}
  };

  state = {
    decrement: (path, delta = 1) => {
      validatePath('decrement', path);
      validateNumber('decrement', 'delta', delta);
      const value = get(path, this.state);
      validateNumber('decrement', path, value);
      return new Promise(resolve => {
        this.saveState(
          update(path, n => n - delta, this.state),
          log && log('decrement', this.state, path, 'by', delta)
        );
        resolve();
      });
    },

    delete: path => {
      validatePath('delete', path);
      return new Promise(resolve => {
        this.saveState(
          omit(path, this.state),
          () => log && log('delete', this.state, path)
        );
        resolve();
      });
    },

    filter: (path, fn) => {
      validatePath('filter', path);
      const value = get(path, this.state);
      validateArray('filter', path, value);
      validateFunction('filter', fn);
      return new Promise(resolve => {
        this.saveState(
          update(path, arr => arr.filter(fn)),
          () => log && log('filter', this.state, path, 'using', fn)
        );
        resolve();
      });
    },

    get: path => get(path, this.state),

    increment: (path, delta = 1) => {
      validatePath('increment', path);
      validateNumber('increment', 'delta', delta);
      const value = get(path, this.state);
      validateNumber('increment', path, value);
      return new Promise(resolve => {
        this.saveState(
          update(path, n => n + delta, this.state),
          () => log && log('increment', this.state, path, 'by', delta)
        );
        resolve();
      });
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
      validatePath('map', path);
      const value = get(path, this.state);
      validateArray('map', path, value);
      validateFunction('map', fn);
      return new Promise(resolve => {
        this.saveState(
          update(path, arr => arr.map(fn)),
          () => log && log('map', this.state, path, 'using', fn)
        );
        resolve();
      });
    },

    push: (path, ...newValues) => {
      validatePath('push', path);
      const value = get(path, this.state);
      validateArray('push', path, value);
      return new Promise(resolve => {
        this.saveState(
          set(path, [...value, ...newValues]),
          () => log && log('push', this.state, path, 'with', ...newValues)
        );
        resolve();
      });
    },

    set: (path, value) => {
      console.log('context-easy.js set: path =', path);
      console.log('context-easy.js set: value =', value);
      validatePath('set', path);
      return new Promise(resolve => {
        this.saveState(
          set(path, value, this.state),
          () => log && log('set', this.state, path, 'to', value)
        );
        resolve();
      });
    },

    transform: (path, fn) => {
      validatePath('transform', path);
      validateFunction('transform', fn);
      return new Promise(resolve => {
        this.saveState(
          update(path, fn, this.state),
          () => log && log('transform', this.state, path, 'using', fn)
        );
        resolve();
      });
    }
  };

  componentDidMount() {
    console.log('context-easy.js componentDidMount: entered');
    const {options} = this.props;

    if (!options.log || isProd) log = noOp;

    if (!options.validate || isProd) {
      validateArray = noOp;
      validateFunction = noOp;
      validateNumber = noOp;
      validatePath = noOp;
    }

    ({
      initialState = {},
      replacerFn = identityFn,
      reviverFn = identityFn,
      sessionStorageOptOut,
      version = null
    } = options);

    this.setState(loadState());
  }

  saveState = (stateOrFn, callback) => {
    console.log('context-easy.js saveState: stateOrFn =', stateOrFn);
    if (!this.throttledSave) {
      this.throttledSave = throttle(() => {
        const json = JSON.stringify(replacerFn(this.state));
        sessionStorage.setItem(STATE_KEY, json);
      }, 1000);
    }

    this.setState(stateOrFn, () => {
      if (!sessionStorageOptOut) this.throttledSave();
      if (callback) callback();
    });
  };

  render() {
    console.log('context-easy.js componentDidMount: render');
    return (
      <EasyContext.Provider value={this.state}>
        {this.props.children}
      </EasyContext.Provider>
    );
  }
}
