import {arrayOf, shape, string} from 'prop-types';
import React, {useContext} from 'react';

import {EasyContext} from './context-easy';

/**
 * This component renders a set of radio buttons.
 * The `list` prop specifies the text and value
 * for each radio button.
 * The `path` prop specifies the Redux state path
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

  const {className, list, path} = props;

  const extraProps = {};
  const testId = props['data-testid'];

  const value = context.get(path);

  const radioButtons = list.map(obj => {
    if (testId) extraProps['data-testid'] = testId + '-' + obj.value;
    return (
      <div key={obj.value}>
        <input
          checked={obj.value === value}
          className={obj.value}
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
  'data-testid': string,
  className: string,
  list: arrayOf(
    shape({
      text: string.isRequired,
      value: string
    })
  ).isRequired,
  path: string
};
