import React from 'react'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'

import config from '../config'
import * as Actions from '../actions'

const { actionTypes } = config;

export const UnconnectedForm = React.createClass({
  mixins: [PureRenderMixin],

  getFormState: function() {
    const {id, fields, initialized, errors} = this.props;
    return {
      id, 
      fields: fields.toJS(),
      initialized,
      errors
    }
  },

  onFieldChange: function(e) {
    const {dispatch, id, onChange, validate} = this.props;
    dispatch(Actions.changeFieldValue({id, onChange, validate, element: e.target}));    
  },

  onFieldFocus: function(e) {
    this.handleFocusChange(e)
  },

  onFieldBlur: function(e) {
    this.handleFocusChange(e);
  },

  handleFocusChange: function(e) {
    const {dispatch, id} = this.props;
    dispatch(Actions.changeFocus(id, e.target, e.type));
  },

  onFormSubmit: function(e) {
    e.preventDefault();
    const {onSubmit} = this.props;
    onSubmit && onSubmit(this.getFormState());
  },

  componentWillMount: function() {
    const {dispatch, id, fields, onChange, validate} = this.props;
    if (!id) throw new Error('You forgot to provide form id');
    if (!fields) throw new Error('You forgot to provide form fields');
    dispatch(Actions.initForm({id, fields, onChange, validate}));    
  },

  componentWillUnmount: function() {
    const {dispatch, id} = this.props;
    dispatch({
      type: actionTypes.destroyForm,
      payload: {id}
    });
  },
  
  render: function() {
    const {children, id, fields, initialized, moreErrors} = this.props;
    if (!initialized) return null;

    return (
      <form id={id} onSubmit={this.onFormSubmit}>
        {React.Children.map(children, (el) => {
          if (el.props) {
            if (el.props['hoth-form']) {
              const newProps = el.props['hoth-form'](this.getFormState());
              return React.cloneElement(el, newProps);
            }   
            const fieldProps = fields.get(el.props.name);
            if (fieldProps) {
              let props = {
                onChange: this.onFieldChange,
                onFocus: this.onFieldFocus,
                onBlur: this.onFieldBlur,
                moreErrors: moreErrors && moreErrors[el.props.name]
              };
              if (fieldProps.fields) {
                if (el.type === 'select' || el.props.type === 'select') {
                  props = {...props, ...fieldProps};
                } else if (!el.props.value) {
                  const {value, ...newFieldProps} = fieldProps;
                  props = {...props, ...newFieldProps};                  
                } else {
                  props = {...props, ...fieldProps.fields[el.props.value]};
                }
              } else {
                props = {...props, ...fieldProps};
              }
              return React.cloneElement(el, props);
            } else {
              return el;
            }
          } else {
            return el;
          }
        })}
      </form>
    )
  }
});

export function mapStateToProps(state, ownProps) {
  const slice = config.selector(state);
  return {
    fields: slice.getIn([ownProps.id, 'fields']) || ownProps.fields,
    initialized: slice.getIn([ownProps.id, 'initialized']),
    errors: slice.getIn([ownProps.id, 'errors']),
  }
}

export default connect(mapStateToProps)(UnconnectedForm)