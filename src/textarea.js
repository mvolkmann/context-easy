import {func, string} from 'prop-types';
import React, {useContext, useEffect, useRef} from 'react';

import {EasyContext} from './context-easy';

export default function TextArea(props) {
  const context = useContext(EasyContext);

  const cursorRef = useRef();
  const textAreaRef = useRef();

  useEffect(() => {
    const {current} = cursorRef;
    if (current) {
      textAreaRef.current.setSelectionRange(current, current);
    }
  });

  const handleChange = event => {
    const {onChange, path} = props;
    const {value} = event.target;

    cursorRef.current = textAreaRef.current.selectionStart;

    if (path) context.set(path, value);
    if (onChange) onChange(event);
  };

  const {path} = props;
  const value = context.get(path);
  const textAreaProps = {...props, value};
  return (
    <textarea {...textAreaProps} onChange={handleChange} ref={textAreaRef} />
  );
}

TextArea.propTypes = {
  className: string,
  onChange: func,
  path: string
};
