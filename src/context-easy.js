import {bool, node} from 'prop-types';
import {get, omit, set, update} from 'lodash/fp';
import React, {Component} from 'react';

const MSG_PREFIX = 'easy-context method ';

export const EasyContext = React.createContext();

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

export class EasyProvider extends Component {
  static initialized = false;
  static getDerivedStateFromProps(props, state) {
    if (EasyProvider.initialized) return null;
    EasyProvider.initialized = true;
    return props.initialState;
  }

  static propTypes = {
    children: node,
    log: bool,
    validate: bool
  };
  static defaultProps = {
    log: false,
    validate: false
  };

  state = {
    decrement: (path, delta = 1) => {
      validatePath('decrement', path);
      validateNumber('decrement', 'delta', delta);
      const value = get(path, this.state);
      validateNumber('decrement', path, value);
      this.setState(
        update(path, n => n - delta, this.state),
        log && log('decrement', this.state, path, 'by', delta)
      );
    },

    delete: path => {
      validatePath('delete', path);
      this.setState(
        omit(path, this.state),
        () => log && log('delete', this.state, path)
      );
    },

    filter: (path, fn) => {
      validatePath('filter', path);
      const value = get(path, this.state);
      validateArray('filter', path, value);
      validateFunction('filter', fn);
      this.setState(
        update(path, arr => arr.filter(fn)),
        () => log && log('filter', this.state, path, 'using', fn)
      );
    },

    increment: (path, delta = 1) => {
      validatePath('increment', path);
      validateNumber('increment', 'delta', delta);
      const value = get(path, this.state);
      validateNumber('increment', path, value);
      this.setState(
        update(path, n => n + delta, this.state),
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
      validatePath('map', path);
      const value = get(path, this.state);
      validateArray('map', path, value);
      validateFunction('map', fn);
      this.setState(
        update(path, arr => arr.map(fn)),
        () => log && log('map', this.state, path, 'using', fn)
      );
    },

    push: (path, ...newValues) => {
      validatePath('push', path);
      const value = get(path, this.state);
      validateArray('push', path, value);
      this.setState(
        set(path, [...value, ...newValues]),
        () => log && log('push', this.state, path, 'with', ...newValues)
      );
    },

    set: (path, value) => {
      validatePath('set', path);
      this.setState(
        set(path, value, this.state),
        () => log && log('set', this.state, path, 'to', value)
      );
    },

    transform: (path, fn) => {
      validatePath('transform', path);
      validateFunction('transform', fn);
      this.setState(
        update(path, fn, this.state),
        () => log && log('transform', this.state, path, 'using', fn)
      );
    }
  };

  componentDidMount() {
    const {log: shouldLog, validate} = this.props;
    if (!shouldLog) log = noOp;
    if (!validate) {
      validateArray = noOp;
      validateFunction = noOp;
      validateNumber = noOp;
      validatePath = noOp;
    }
  }

  render() {
    return (
      <EasyContext.Provider value={this.state}>
        {this.props.children}
      </EasyContext.Provider>
    );
  }
}
