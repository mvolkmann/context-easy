# context-easy

This provides the easiest way to manage state in a React application.
It implements a Context API Provider.
This Provider can manage all the state for a React application
and is highly generic, making it suitable for any application.

When using Redux to manage application state,
all the state is held in a single store.
This can be thought of like a client-side database
that holds multiple collections of object.
It provides the potential for all components
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
is through the `useContext` hook added in React 16.8.
If you are not yet familiar with React hooks,
read about them at
<https://raw.githubusercontent.com/mvolkmann/context-easy/master/hooks.md>.
or watch the video at
<https://objectcomputing.com/resources/events/webinars/get-hooked-on-react/recording#ws_youtube_60542>

To use context-easy:

1. Modify `src/index.js`.

2. Import `EasyProvider`.

   ```js
   import {EasyProvider} from 'context-easy';
   ```

3. Define the initial state. For example:

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

   This could also be imported from a file named `initial-state.js`.

4. Change the call to `render` to use `EasyProvider` to wrap the top component, typically `App`.

   ```js
   const jsx = (
     <EasyProvider initialState={initialState} log validate>
       <App />
     </EasyProvider>
   );
   ReactDOM.render(jsx, document.getElementById('root'));
   ```

In function components that need to access and/or modify this state:

1. Import the `useContext` hook and `EasyContext`.

   ```js
   import React, {useContext} from 'react';
   import {EasyContext} from 'context-easy';
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

The context object currently implements ten methods.

- `context.decrement(path)`\
  This decrements the number at the given path.
  An optional second argument specifies the amount
  by which to decrement and defaults to one.

- `context.delete(path)`\
  This deletes the property at the given path.

- `context.filter(path, fn)`\
  This replaces the array at the given path with a new array
  that is the result of filtering the current elements.
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
  is passed each array element one at a time.
  The new array will contain the return values of each of these calls.

- `context.pop(path)`\
  This replaces the array at the given path with a new array.
  The new array is the old array with the last element removed.

- `context.push(path, newValue1, newValue2, ...)`\
  This replaces the array at the given path with a new array.
  The new array starts with all the existing elements
  and ends with all the specified new values.

- `context.set(path, value)`\
  This sets the value at the given path to the given value.

- `context.toggle(path)`\
  This toggles the boolean value at the given path.

- `context.transform(path, fn)`\
  This sets the value at the given path to
  the value returned by passing the current value
  to the function provided as the second argument.

## Re-rendering

The `useContext` hook subscribes components that call it
to context state updates.
This means that components will be re-rendered
on every context state change.
To only re-render components when specific context state properties are changed,
wrap the component JSX is a call to the `useCallback` hook.

For example, suppose a component only depends on
the context state properties `count` and `person.name`.
The following code inside a function component
will make it so the component is only re-rendered
when those context state properties change.

```js
import React, {useCallback, useContext} from 'react';

export default SomeComponent() {
  const context = useContext(EasyContext);
  const {count, person} = context;
  const {name} = person;
  return useCallback(
    <div>
      ...component JSX goes here...
    </div>,
    [count, name]
  );
}
```

## Options

The `EasyProvider` component accepts props that specify options.

To log all state changes in the devtools console,
include the `log` prop with no value.

To validate all method calls made on the context object
and throw an error when they are called incorrectly,
include the `validate` prop with no value.

These are useful in development,
but typically should not be used in production.
If the `NODE_ENV` environment variable is set to "production",
the `log` and `validate` options are ignored.

Other options are specified in the `options` prop
whose value is an object that specifies their values.

The `persist` option
is described in the "SessionStorage" section below.

The `version` option
is described in the "Versions" section below.

The `replacerFn` and `reviverFn` options
are described in the "Sensitive Data" section below.

## Path Concerns

When the layout of the state changes, it is necessary
to change state paths throughout the code.
For apps that use a small number of state paths
this is likely not a concern.
For apps that use a large number of state paths,
consider creating a source file that exports
constants for the state paths (perhaps named `path-constants.js`) and
use those when calling `context` methods that require a path.

For example:

```js
// In path-constants.js ...
const GAME_HIGH_SCORE = 'game.statistics.highScore';
const USER_CITY = 'user.address.city';

// In the source file for a component ...
import {GAME_HIGH_SCORE, USER_CITY} from './path-constants';
...
context.set(USER_CITY, 'St. Louis');
context.transform(GAME_HIGH_SCORE, score => score + 1);
```

With this approach, if the layout of the state changes
it is only necessary to update these constants.

## Form Elements Tied to State Paths

It is common to have `input`, `select`, and `textarea` elements
with `onChange` handlers that get their value from `event.target.value`
and update a specific state path.
An alternative is to use the provided
`Input`, `Select`, and `TextArea`, `RadioButtons`, and `Checkboxes`
components as follows:

HTML `input` elements can be replaced by the `Input` component.
For example:

```js
<Input path="user.firstName" />
```

The `type` property defaults to `'text'`,
but can be set to any valid value including `'checkbox'`.

The value used by the `Input` is the state value at the specified path.
When the user changes the value, this component
updates the value at that path in the state.

To perform additional processing of changes such as validation,
supply an `onChange` prop whose value is a function.

HTML `textarea` elements can be replaced by the `TextArea` component.
For example:

```js
<TextArea path="feedback.comment" />
```

HTML `select` elements can be replaced by the `Select` component.
For example:

```js
<Select path="favorite.color">
  <option>red</option>
  <option>green</option>
  <option>blue</option>
</Select>
```

If the `option` elements have a `value` attribute, that value
will be used instead of the text inside the `option`.

For a set of radio buttons, use the `RadioButtons` component.
For example:

```js
<RadioButtons
  className="flavor"
  list={radioButtonList}
  path="favorite.flavor"
/>
```

where `radioButtonList` is set as follows:

```js
const radioButtonList = [
  {text: 'Chocolate', value: 'choc'},
  {text: 'Strawberry', value: 'straw'},
  {text: 'Vanilla', value: 'van'}
];
```

When a radio button is clicked, the state property `favorite.flavor`
will be set to the value of that radio button.

For a set of checkboxes, use the `Checkboxes` component.
For example:

```js
<Checkboxes className="colors" list={checkboxList} />
```

where checkboxList is set as follows:

```js
const checkboxList = [
  {text: 'Red', path: 'color.red'},
  {text: 'Green', path: 'color.green'},
  {text: 'Blue', path: 'color.blue'}
];
```

When a checkbox is clicked, the boolean value at the corresponding path
will be toggled between false and true.

All of these components take a `path` prop
which is used to get the current value of the component
and update the value at that path.

## SessionStorage

Typically React state is lost when users refresh the browser.
To avoid this, `sessionStorage` is used to save all the
context state as a JSON string on every state change.
This is throttled so `sessionStorage` is
not updated more frequently than once per second.
The state in `sessionStorage` is automatically reloaded
into the context state when the browser is refreshed.

To opt out of this behavior, pass an options object to
`EasyProvider` as follows:

```js
const options = {persist: false}; // defaults to true
...
return (
  <EasyProvider initialState={initialState} options={options}>
    ...
  </EasyProvider>
)
```

## Versions

During development when the shape of the initial state changes, it is
desirable to replace what is in `sessionStorage` with the new initial state.

One way do to this is to close the browser tab and open a new one.
If this isn't done, the application may not work properly because it
will expect different data than what is in `sessionStorage`.

A way to force the new initial state to be used is to supply a
version property in the options object passed to `EasyProvider`.
When context-easy sees a new version,
it replaces the data in `sessionStorage` with
the `initialState` value passed to `EasyProvider`.

## Sensitive Data

When the context state contains sensitive data
such as passwords and credit card numbers,
it is a good idea to prevent that data from being
written to `sessionStorage`.

To do this, add `replacerFn` and `reviverFn` functions
to the options object that is passed to `EasyProvider`.
These functions are similar to the optional `replacer` and `reviver` parameters
used by `JSON.stringify` and `JSON.parse`.
Both are passed a state object.
If they wish to change it in any way,
including deleting, modifying, and adding properties,
they should make a copy of the state object,
modify the copy, and return it.
Consider using the lodash function `deepClone` to create the copy.

## Browser Devtools

A nice feature of Redux is the ability to use redux-devtools.
It supports viewing all the actions that have been dispatched
and the state after each action has been processed.

It also supports "time travel debugging" which
shows the state of the UI after a selected action.
In truth I rarely use time travel debugging.

The `log` feature of context-easy outputs a
description of each context method call
and the state after the call.
This is somewhat of a replacement for what redux-devtools provides.

react-devtools displays the data in a context
when its `Provider` element is selected.
It is updated dynamically when context data changes.

## Example app

The GitHub repository at <https://github.com/mvolkmann/context-easy-demo>
provides an example application that uses context-easy.
