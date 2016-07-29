import React from 'react'

import {
  changeValue, 
  additionalChanges, 
  performValidation,
  initFields,
  resetFields,
  filterProps } from '../utils'

import config from '../config'

export default React.createClass({
  displayName: 'HothForm',

  updateForm: function(fields, element) {
    const {onChange, validate} = this.props;
    let changes = changeValue(fields, element);
    changes = additionalChanges(changes, onChange, element);
    changes = performValidation(changes, validate);
    this.setState(changes);
  },

  resetFields: function() {
    const {onChange, validate} = this.props;
    let changes = resetFields(this.state.fields);
    changes = additionalChanges(changes, onChange);
    changes = performValidation(changes, validate);
    this.setState(changes);
  },

  handleFocusChange: function(e) {
    let changes = additionalChanges(this.state.fields, () => {
      return {[e.target.name]: {active: e.type === 'focus'}}
    });
    this.setState({fields: changes});
  },

  getFormState: function() {
    const {fields, errors, reset} = this.state;
    return {fields, errors, reset}
  },

  onFieldChange: function(fn, e) {
    fn && fn(e);
    this.updateForm(this.state.fields, e.target);
  },

  onFieldFocus: function(fn, e) {
    fn && fn(e);
    this.handleFocusChange(e)
  },

  onFieldBlur: function(fn, e) {
    fn && fn(e);
    this.handleFocusChange(e);
  },  

  onFormSubmit: function(e) {
    e.preventDefault();
    const {onSubmit} = this.props;
    onSubmit && onSubmit(this.getFormState());
  },

  componentWillMount: function() {
    const {fields} = this.props;
    if (!fields) throw new Error('You forgot to provide form fields');    
    const initializedFields = initFields(this.props.fields);
    this.setState({fields: initializedFields, reset: this.resetFields});
    this.updateForm(initializedFields);
  },

  render: function() {
    const {children, id} = this.props;

    return (
      <form id={id} onSubmit={this.onFormSubmit}>
        {this.iterateAndInjectProps(children)}
      </form>
    )
  },

  iterateAndInjectProps: function(children) {
    return React.Children.map(children, (el) => {
      if (el && el.props) {
        if (config.fieldGroupClassName.test(el.props.className)) {
          el = React.cloneElement(el, el.props, this.iterateAndInjectProps(el.props.children));
        }
        const getHoth = el.props['hoth'];
        let hothProps = {};
        if (getHoth) {
          hothProps = getHoth(this.getFormState(), el);
        }   
        let fieldProps = this.state.fields[el.props.name];
        if (fieldProps) {
          fieldProps = {...fieldProps, ...el.props, ...hothProps};
          const {moreErrors} = this.props;
          let props = {
            onChange: this.onFieldChange.bind(null, fieldProps.onChange),
            onFocus: this.onFieldFocus.bind(null, fieldProps.onFocus),
            onBlur: this.onFieldBlur.bind(null, fieldProps.onBlur),
            moreErrors: moreErrors && moreErrors[el.props.name]
          };
          if (fieldProps.fields) {
            if (el.type === 'select' || el.props.widget === 'select' || fieldProps.widget === 'select') {
              let value = fieldProps.value;
              if (!el.props.mutiple && !fieldProps.multiple) {
                value = value[0];
              }
              props = {...fieldProps, ...props, value};
            /*} else if (!el.props.value) { // I've forgotten why need this line :D
              const {value, ...newFieldProps} = fieldProps;
              props = {...newFieldProps, ...props};     */             
            } else {
              props = {...fieldProps.fields[el.props.value], ...props};
            }
          } else {
            props = {...fieldProps, ...props};
          }
          return React.cloneElement(el, filterProps(el, props));
        } else {
          if (getHoth) {
            return React.cloneElement(el, filterProps(el, hothProps));
          } else {
            return el;
          }
        }
      } else {
        return el;
      }
    });
  }
});
