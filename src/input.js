import {bool, func, number, string} from 'prop-types';
import React, {useContext, useEffect, useRef} from 'react';

import {EasyContext} from './context-easy';

export default function Input(props) {
  const {autoFocus, onChange, onEnter, onInput, path, type} = props;
  const context = useContext(EasyContext);

  const cursorRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const {current} = cursorRef;
    if (current) {
      inputRef.current.setSelectionRange(current, current);
    }
  });

  function handleChange(event) {
    const {checked, value} = event.target;

    cursorRef.current = inputRef.current.selectionStart;

    let v = value;
    if (type === 'checkbox') {
      v = checked;
    } else if (type === 'number' || type === 'range') {
      if (value.length) v = Number(value);
    }

    if (path) context.set(path, v);
    if (onChange) onChange(event);
  }

  let value = context.get(path);

  const isCheckbox = type === 'checkbox';
  if (value === undefined) value = isCheckbox ? false : '';

  const propName = isCheckbox ? 'checked' : 'value';
  const inputProps = {
    autoFocus,
    type: 'text',
    ...props,
    [propName]: value
  };

  if (onEnter) {
    inputProps.onKeyPress = event => {
      if (event.key === 'Enter') onEnter();
    };
    delete inputProps.onEnter;
  }

  if (type === 'range') {
    const customOnInput = onInput;
    inputProps.onInput = event => {
      if (path) context.set(path, Number(event.target.value));
      if (customOnInput) customOnInput(event);
    };
  }

  return <input {...inputProps} onChange={handleChange} ref={inputRef} />;
}

Input.propTypes = {
  autoFocus: bool,
  className: string,
  max: number,
  min: number,
  onChange: func, // called final changes to value
  onEnter: func, // called if user presses enter key
  onInput: func, // called on every change to value
  path: string, // state path that is updated
  type: string // type of the HTML input
};
