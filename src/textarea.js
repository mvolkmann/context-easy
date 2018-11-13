import {func, string} from 'prop-types';
import React, {useContext} from 'react';

import {EasyContext} from './context-easy';

export default function TextArea(props) {
  const context = useContext(EasyContext);

  const handleChange = event => {
    const {onChange, path} = props;
    const {value} = event.target;
    if (path) context.set(path, value);
    if (onChange) onChange(event);
  };

  const {path} = props;
  const value = context.get(path);

  const textAreaProps = {...props, value};

  return <textarea {...textAreaProps} onChange={handleChange} />;
}

TextArea.propTypes = {
  onChange: func,
  path: string
};
