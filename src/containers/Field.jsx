import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'

import { filterProps } from '../utils'

const css = {
  valid: 'valid',
  invalid: 'invalid',
  dirty: 'dirty',
  pristine: 'pristine'
};

function makeErrorsList(errors) {
  if (errors.length > 0) {
    return (
      <ul className="errors">
        {errors.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    )
  } else {
    return null;
  }
}

function showErrors(props) {
  const {errOnDirty, dirty} = props;
  return !errOnDirty || dirty;
}

function getFieldClassName(props) {
  const {dirty, errors, moreErrors, className=''} = props;
  let result = className;
  if (dirty) {
    result = result.replace(css.pristine, '').concat(' ' + css.dirty);
  } else {
    result = result.replace(css.dirty, '').concat(' ' + css.pristine);
  }
  if (errors || moreErrors) {
    result = result.replace(css.valid, '').concat(' ' + css.invalid);
  } else {
    result = result.replace(css.invalid, '').concat(' ' + css.valid);
  }
  return result;
}

function renderWidget(widget, props, children) {
  if (props.fields) {
    children = React.Children.map(children, el => React.cloneElement(el, props.fields[el.props.value], el.props.children));
  }
  return widget && React.createElement(widget, filterProps(widget, props), children);
}

function labeledWidget(props) {
  const {widget = 'input', label, children} = props;
  const className = getFieldClassName(props);
  const finalProps = {...props, className};
  if (props.type === 'file') delete finalProps.value;

  if (label) {
    return (
      <label>
        <span>{label}</span>
        {renderWidget(widget, finalProps, children)}
      </label>
    )
  } else {
    return renderWidget(widget, finalProps, children)
  }
}

export default React.createClass({
  displayName: 'HothField',

  mixins: [PureRenderMixin],
 
  render: function() {
    const {props} = this;
    let {widget, errors, moreErrors, children} = props;
    if (widget === 'select') {
      children = React.Children.map(children, el => 
        React.cloneElement(el, props.fields[el.props.value])
      );
    }
    return (
      <div className="form-group">
        {labeledWidget(props)}
        {showErrors(props) && makeErrorsList([].concat(errors, moreErrors).filter(i => i))}
      </div>
    )
  }
});