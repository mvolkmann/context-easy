import {get} from 'lodash/fp';
import React, {useContext} from 'react';
import {render, cleanup, fireEvent} from 'react-testing-library';
import {EasyContext, EasyProvider} from './context-easy';

describe('context-easy', () => {
  afterEach(cleanup);

  function tester(methodName, methodArgs, expectedValue) {
    const initialState = {
      foo: {
        bar: 2,
        baz: [1, 2, 3, 4]
      }
    };

    let context;

    function TestComponent() {
      context = useContext(EasyContext);
      const doIt = () => context[methodName](...methodArgs);
      return <button onClick={doIt}>Click</button>;
    }

    EasyProvider.initialized = false; // very important!
    const {getByText} = render(
      <EasyProvider initialState={initialState} validate>
        <TestComponent />
      </EasyProvider>
    );

    const button = getByText('Click');
    fireEvent.click(button);
    const [path] = methodArgs;
    expect(get(path, context)).toEqual(expectedValue);
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

  test('increment', () => {
    tester('increment', ['foo.bar'], 3);
  });

  test('map', () => {
    tester('map', ['foo.baz', n => n * 2], [2, 4, 6, 8]);
  });

  test('push', () => {
    tester('push', ['foo.baz', 5, 6], [1, 2, 3, 4, 5, 6]);
  });

  test('set', () => {
    tester('set', ['foo.bar', 19], 19);
  });

  test('transform', () => {
    tester('transform', ['foo.bar', n => n * 3], 6);
  });
});