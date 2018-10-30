# context-easy

This is a module for React that implements a Context API Provider.
This Provider can manage all the state for a React application
and is highly generic, making it suitable for any application.

When using Redux to manage application state,
all the state is held in a single store.
This provides the potential for all components
to have access to any part of the state
and dispatch actions that update any of it.

This is similar to how REST services generally
have access to entire databases
rather than being restricted to subsets.
The same level of access can be provided
using the Context API.
The Provider implemented by context-easy
does exactly this.

The easiest way for components to use this
is through the `useContext` hook added in React 16.7.
If you are not yet familiar with React hooks,
read about them at
<https://raw.githubusercontent.com/mvolkmann/context-easy/master/hooks.md>.

To use context-easy:

1. Import `EasyProvider`.

```js
import {EasyProvider} from './context-easy';
```

2. Define the initial state. For example:

```js
const initialState = {
  count: 0,
  person: {
    name: 'Mark',
    occupation: 'software developer'
  },
  size: 'medium'
};
```

3. Wrap the top-most application component in `EasyProvider`.

```js
export default function App() {
  return (
    <EasyProvider initialState={initialState} log validate>
      {/* top-most components go here */}
    </EasyProvider>
  );
}
```

In function components that need to access and/or modify this state:

1. Import the `useCallback` hook and `EasyContext`.

```js
import React, {useContext} from 'react';
import {EasyContext} from './context-easy';
```

2. Get the context object inside the function component.

```js
const context = useContext(EasyContext);
```

3. Access state from the `context` object. For example:

```js
context.person.name;
```

4. Update state properties at specific paths
   by calling methods on the `context` object.\
   For example, to change the state property at `person.name`,
   call `context.set('person.name', 'Mark')`.

## Context Object Methods

The context object currently implements nine methods.

- `context.decrement(path)`\
  This decrements the number at the given path.
  An optional second argument specifies the amount
  by which to decrement and defaults to one.

- `context.delete(path)`\
  This deletes the property at the given path.

- `context.filter(path, fn)`\
  This filters the array at the given path.
  The function provided as the second argument
  is called on each array element.
  It should return true for elements to be retained
  and false for elements to be filtered out.

- `context.increment(path)`\
  This increments the number at the given path.
  An optional second argument specifies the amount
  by which to increment and defaults to one.

- `context.log(label)`\
  This writes the current state to the devtools console.
  It outputs "context-easy:", followed by
  an optional label that defaults to an empty string,
  "state =", and the state object.

- `context.map(path, fn)`\
  This replaces the array at the given path with a new array.
  The function provided as the second argument
  is called on each array element.
  The new array will contain the return values of each of these calls.

- `context.push(path, newValue1, newValue2, ...)`\
  This replaces the array at the given path with a new array.
  The new array starts with all the existing elements
  and ends with all the specified new values.

- `context.set(path, value)`\
  This sets the value at the given path to the given value.

- `context.transform(path, fn)`\
  This sets the value at the given path to
  the value returned by passing the current value
  to the function provided as the second argument.

## Re-rendering

The `useContext` hook subscribes components that call it
to context state updates.
This means that components will be re-rendered
on every context state change.
To only re-render components will specific context state properties are changed,
wrap the component JSX is a call to the `useCallback` hook.

For example, suppose a component only depends on
the context state properties `count` and `person.name`.
The following code inside a function component
will make it so the component is only re-rendered
when those context state properties change.

```js
const context = useContext(EasyContext);
const {count, person} = context;
const {name} = person;
return useCallback(<div>component JSX goes here.</div>, [count, name]);
```

## Options

The `EasyProvider` component accepts two optional props.

To log all state changes in the devtools console,
add the `log` prop.

To validate all method calls made on the context object
and throw an error when they are called incorrectly,
add the `validate` prop.

These are useful in development, but typically should not be used in production.

The GitHub repository at <https://github.com/mvolkmann/context-easy-demo>
provides an example application that uses context-easy.
