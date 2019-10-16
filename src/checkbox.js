import {bool, string} from 'prop-types';
import React, {useContext} from 'react';

import {EasyContext} from './context-easy';

/**
 * This component renders a single checkbox.
 * The `className` prop specifies addition CSS classes to be added.
 * The `disabled` prop is a boolean that specifies
 * whether the checkbox should be disabled.
 * The `text` prop specifies its label text.
 * The `path` prop specifies its state path.
 * Specify a `className` prop to enable styling the checkboxes.
 */
export default function Checkbox(props) {
  const {className, disabled, path, text} = props;

  const context = useContext(EasyContext);
  const checked = Boolean(context.get(path));

  const extraProps = {};
  const testId = props['data-testid'];
  if (testId) extraProps['data-testid'] = testId;

  function handleChange(event) {
    if (path) context.set(path, event.target.checked);
  }

  return (
    <label
      className={'context-easy-checkbox' + (className ? ' ' + className : '')}
      key={className}
    >
      <input
        className={className}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        type="checkbox"
        {...extraProps}
      />
      <div>{text}</div>
    </label>
  );
}

Checkbox.propTypes = {
  className: string,
  'data-testid': string,
  disabled: bool,
  text: string.isRequired,
  path: string
};
