import {arrayOf, bool, shape, string} from 'prop-types';
import React, {useContext} from 'react';

import {EasyContext} from './context-easy';

/**
 * This component renders a set of radio buttons.
 * The `list` prop specifies the text and value
 * for each radio button.
 * The `path` prop specifies the state path
 * where the value will be stored.
 * Specify a `className` prop to enable styling the radio-buttons.
 */
export default function RadioButtons(props) {
  const context = useContext(EasyContext);

  const handleChange = event => {
    const {path} = props;
    const {value} = event.target;
    if (path) context.set(path, value);
  };

  const {className, disabled, list, path} = props;

  const extraProps = {};
  const testId = props['data-testid'];

  const value = context.get(path);

  const radioButtons = list.map(obj => {
    if (!obj.value) obj.value = obj.text;
    if (testId) extraProps['data-testid'] = testId + '-' + obj.value;
    return (
      <div className="context-easy-radio-buttons" key={obj.value}>
        <input
          checked={obj.value === value}
          className={obj.value}
          disabled={disabled}
          name={path}
          onChange={handleChange}
          type="radio"
          value={obj.value}
          {...extraProps}
        />
        <label>{obj.text}</label>
      </div>
    );
  });

  return <div className={'radio-buttons ' + className}>{radioButtons}</div>;
}

RadioButtons.propTypes = {
  className: string,
  'data-testid': string,
  disabled: bool,
  list: arrayOf(
    shape({
      text: string.isRequired,
      value: string
    })
  ).isRequired,
  path: string
};
