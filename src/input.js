import {bool, func, number, string} from 'prop-types';
import React, {useCallback, useContext} from 'react';

import {EasyContext} from './context-easy';

export default function Input(props) {
  const {autoFocus, onChange, onEnter, path, type} = props;
  const context = useContext(EasyContext);

  const handleChange = useCallback(event => {
    const {checked, value} = event.target;
    console.log('input.js handleChange: value =', value);

    let v = value;
    if (type === 'checkbox') {
      v = checked;
    } else if (type === 'number' || type === 'range') {
      if (value.length) v = Number(value);
    }

    console.log('input.js handleChange: path =', path);
    console.log('input.js handleChange: v =', v);
    if (path) context.set(path, v);
    if (onChange) onChange(event);
  });

  let value = context.get(path);

  const isCheckbox = type === 'checkbox';
  if (value === undefined) value = isCheckbox ? false : '';

  const propName = isCheckbox ? 'checked' : 'value';
  // npm run build fails when object spread is used
  const inputProps = Object.assign({autoFocus, type: 'text'}, props, {
    [propName]: value
  });

  if (onEnter) {
    inputProps.onKeyPress = event => {
      if (event.key === 'Enter') onEnter();
    };
    delete inputProps.onEnter;
  }

  return <input {...inputProps} onChange={handleChange} />;
}

Input.propTypes = {
  autoFocus: bool,
  max: number,
  min: number,
  onChange: func, // called on every change to value
  onEnter: func, // called if user presses enter key
  path: string, // state path that is updated
  type: string // type of the HTML input
};
