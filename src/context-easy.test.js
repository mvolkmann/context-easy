import {get} from 'lodash/fp';
import React, {useContext} from 'react';
import {render, cleanup, fireEvent} from '@testing-library/react';
import {EasyContext, EasyProvider} from './context-easy';

describe('context-easy', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      foo: {
        bar: 2,
        baz: [1, 2, 3, 4],
        qux: false
      }
    };
  });

  afterEach(cleanup);

  function tester(methodName, methodArgs, expectedValue) {
    let context;

    function TestComponent() {
      context = useContext(EasyContext);
      const doIt = () => context[methodName](...methodArgs);
      return <button onClick={doIt}>Click</button>;
    }

    EasyProvider.initialized = false; // very important!
    const options = {persist: false, validate: true};
    const {getByText} = render(
      <EasyProvider initialState={initialState} options={options}>
        <TestComponent />
      </EasyProvider>
    );

    const button = getByText('Click');
    fireEvent.click(button);

    // Wait a bit for the state change to complete.
    setTimeout(() => {
      const [path] = methodArgs;
      expect(get(path, context)).toEqual(expectedValue);
    }, 100);
  }

  test('decrement', () => {
    tester('decrement', ['foo.bar'], 1);
  });

  test('delete', () => {
    tester('delete', ['foo.bar'], undefined);
  });

  test('filter', () => {
    tester('filter', ['foo.baz', n => n % 2 === 0], [2, 4]);
  });

  test('get', () => {
    tester('get', ['foo.bar'], 2);
  });

  test('increment', () => {
    tester('increment', ['foo.bar'], 3);
  });

  test('map', () => {
    tester('map', ['foo.baz', n => n * 2], [2, 4, 6, 8]);
  });

  test('pop', () => {
    tester('pop', ['foo.baz'], [1, 2, 3, 4]);
  });

  test('push', () => {
    tester('push', ['foo.baz', 5, 6], [1, 2, 3, 4, 5, 6]);
  });

  test('set', () => {
    tester('set', ['foo.bar', 19], 19);
  });

  test('toggle found', () => {
    tester('toggle', ['foo.qux'], true);
  });

  test('toggle not found', () => {
    tester('toggle', ['not.found'], true);
  });

  test('transform', () => {
    tester('transform', ['foo.bar', n => n * 3], 6);
  });

  // This tests making multiple updates.
  test('multiple', done => {
    let context;

    function TestComponent() {
      context = useContext(EasyContext);
      function doIt() {
        context.increment('foo.bar');
        context.transform('foo.bar', n => n * 2);
        context.filter('foo.baz', n => n > 2);
      }
      return <button onClick={doIt}>Click</button>;
    }

    EasyProvider.initialized = false; // very important!
    const options = {validate: true};
    const {getByText} = render(
      <EasyProvider initialState={initialState} options={options}>
        <TestComponent />
      </EasyProvider>
    );

    const button = getByText('Click');
    fireEvent.click(button);
    setTimeout(() => {
      expect(get('foo.bar', context)).toBe(6);
      expect(get('foo.baz', context)).toEqual([3, 4]);
      done();
    });
  });

  test('options', () => {
    let context;

    function TestComponent() {
      context = useContext(EasyContext);
      function doIt() {
        context.increment('foo.bar');
        context.filter('foo.baz', n => n > 2);
      }
      return <button onClick={doIt}>Click</button>;
    }

    EasyProvider.initialized = false; // very important!
    const options = {
      persist: false,
      replacerFn: state => state,
      reviverFn: state => state,
      version: 'some-version'
    };
    render(
      <EasyProvider initialState={initialState} options={options}>
        <TestComponent />
      </EasyProvider>
    );
  });
});
