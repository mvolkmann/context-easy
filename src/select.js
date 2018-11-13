import {func, node, string} from 'prop-types';
import React, {useContext} from 'react';

import {EasyContext} from './context-easy';

export default function Select(props) {
  const context = useContext(EasyContext);

  const handleChange = event => {
    const {onChange, path} = props;
    const {value} = event.target;
    if (path) context.set(path, value);
    if (onChange) onChange(event);
  };

  const {children, path} = props;

  let value = context.get(path);
  if (value === undefined) value = '';

  const selectProps = {...props, value};
  delete selectProps.dispatch;

  return (
    <select {...selectProps} onBlur={handleChange} onChange={handleChange}>
      {children}
    </select>
  );
}

Select.propTypes = {
  children: node,
  onChange: func,
  path: string
};
