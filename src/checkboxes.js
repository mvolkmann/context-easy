import {arrayOf, bool, shape, string} from 'prop-types';
import React, {useContext} from 'react';

import {EasyContext} from './context-easy';

const getName = index => 'cb' + index;

/**
 * This component renders a set of checkboxes.
 * The `list` prop specifies the text and state path
 * for each checkbox.
 * Specify a `className` prop to enable styling the checkboxes.
 */
export default function Checkboxes(props) {
  const context = useContext(EasyContext);

  function handleChange(text, event) {
    const {list} = props;
    const {path} = list.find(obj => obj.text === text);
    const value = event.target.checked;
    if (path) context.set(path, value);
  }

  const {className, disabled, list} = props;

  const extraProps = {};
  const testId = props['data-testid'];

  const checkboxes = list.map((obj, index) => {
    const {text, path} = obj;
    const checked = Boolean(context.get(path));
    const name = getName(index);
    if (testId) extraProps['data-testid'] = testId + '-' + name;
    return (
      <label className="context-easy-checkbox" key={name}>
        <input
          className={name}
          checked={checked}
          disabled={disabled}
          id={name}
          onChange={e => handleChange(text, e)}
          type="checkbox"
          {...extraProps}
        />
        <div>{text}</div>
      </label>
    );
  });

  return <div className={'checkboxes ' + className}>{checkboxes}</div>;
}

Checkboxes.propTypes = {
  className: string,
  'data-testid': string,
  disabled: bool,
  list: arrayOf(
    shape({
      text: string.isRequired,
      path: string
    })
  ).isRequired
};
