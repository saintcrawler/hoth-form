import mergeWith from 'lodash/mergeWith'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import sortBy from 'lodash/sortBy'

import config from './config'

export function initFields(fields) {
  const result = {};
  Object.keys(fields).forEach(key => {
    const schema = fields[key];
    let field = {};

    if (isPlainObject(schema)) {
      field = {...schema};
    } else {
      field.value = schema;
      if (typeof schema === 'boolean') {
        field.checked = schema;
      }
    }

    if (!field.hasOwnProperty('initialValue')) {
      field.initialValue = (field.value === undefined) ? '' : field.value;
    }
    if (!field.hasOwnProperty('value')) {
      field.value = field.initialValue;
    }

    if (field.fields) {
      if (typeof field.initialValue === 'string') field.initialValue = [field.initialValue];
      if (typeof field.value === 'string') field.value = [field.value];

      if (!isPlainObject(field.fields)) {
        const obj = {};
        field.fields.forEach(f => obj[f] = {});
        field.fields = obj;
      }

      Object.keys(field.fields).forEach(f => {
        field.fields[f] = {
          ...field.fields[f],
          checked: isChecked(f, field.value)
        };
      });
    } else {
      if (typeof field.value === 'boolean') {
        field.checked = field.value;
      }
    }
    result[key] = field;
  });
  result[config.nonFieldErrorsKey] = {errors: null};
  return result;
}

export function changeValue(fields, element) {
  let result = {...fields};
  if (element) {
    const newFields = elementToField(element);
    result = iterateThroughFields(result, newFields, setValue);
  }
  return result;
}

export function resetFields(fields) {
  let newFields = {};
  Object.keys(fields).forEach(k => newFields[k] = {value: fields[k].initialValue});
  return iterateThroughFields(fields, newFields, setValue);
}

export function additionalChanges(fields, onChange, element) {
  const newFields = onChange && onChange(fields, element) || {};
  return iterateThroughFields(fields, newFields, setValue);
}

export function performValidation(fields, validate) {
  let newFields = validate && validate(fields) || {};
  const adjustedFields = {};
  Object.keys(fields).forEach(k => {
    adjustErrorField(adjustedFields, newFields, fields[k], k);
  });
  newFields = iterateThroughFields(fields, adjustedFields);
  const errors = Object.keys(newFields).some(k => newFields[k].errors);
  return {
    errors,
    fields: newFields
  }
}

export const injectedProps = [
  'initialValue',
  'active',
  'dirty',
  'errors',
  'moreErrors',
  'fields',
  'validation',
  'widget',
  'label',
  'hoth',
  'extra'
];

export function isPlainOldType(el) {
  if (!el) return false;
  const type = (typeof el === 'string') ? el : el.type;
  switch (type) {
    case 'input':
    case 'button':
    case 'select':
    case 'textarea':
      return true;
    
    default:
      return false;
  }
}

export function filterProps(el, props, blockedProps = injectedProps) {
  const result = {...props};
  if (isPlainOldType(el)) {
    blockedProps.forEach(p => delete result[p]);
  }
  return result;
}

function adjustErrorField(adjustedFields, validationFields, oldFields, key) {
  let errors = null;
  let value = validationFields[key];
  if (value) {
    value = value.toJS && value.toJS() || value;       
    if (typeof value === 'string') {
      errors = [value];
    } else {
      errors = value;
    }
  }
  if (value || oldFields.errors) {
    adjustedFields[key] = {errors};
  }
}

function iterateThroughFields(oldFields, newFields, fn) {
  const result = {...oldFields};
  Object.keys(newFields).forEach(key => {
    const oldProps = oldFields[key];
    if (oldProps) {
      const newProps = newFields[key];
      let newField = mergeWith({}, oldProps, newProps, replaceArrays);
      if (fn) {
        newField = fn(newField, newProps);
      }
      result[key] = newField;
    }
  })
  return result;
}

function setValue(newField, newProps) {
  // If value is provided with props, then update all `checked` props if they are exist.
  // If value is NOT provided, but `checked` IS, then update `value` prop.
  if (newProps.hasOwnProperty('value')) {
    if (newField.fields) {
      Object.keys(newField.fields).forEach(k => {
        newField.fields[k].checked = (newField.value.indexOf(k) !== -1);
      });
    } else {
      if (newField.hasOwnProperty('checked')) {
        newField.checked = newField.value;
      }
    }
  } else {
    if (newField.fields) {
      newField.value = Object.keys(newField.fields).filter(i => newField.fields[i].checked)
    } else {
      if (newProps.hasOwnProperty('checked')) {
        newField.value = newProps.checked;
      }
    }
  }
  newField.dirty = isDirty(newField.value, newField.initialValue);
  return newField;
}

function isChecked(fieldName, value) {
  if (!value) return false;
  return value.indexOf(fieldName) !== -1;
}

function isDirty(val, initVal) {
  if (typeof val === 'boolean') {
    return val !== initVal;
  } else {
    return !isEqual(sortBy(val), sortBy(initVal));
  }
}

function replaceArrays(objValue, srcValue) {
  if (isArray(objValue)) {
    return srcValue;
  }
}

function elementToField(element) {
  const {name, type, value} = element;
  const field = {};  
  switch (type) {
    case 'checkbox':
      if (value === 'true' || value === 'false') {
        field.value = element.checked;
      } else {
        field.fields = {[value]: {checked: element.checked}};
      }
      break;

    case 'radio':
      field.value = [value];
      break;

    case 'select':
    case 'select-multiple':
      field.value = optionsToValue(element.options);
      break;

    case 'file':
      field.value = element.files;
      break;

    case undefined:
    default:
      field.value = value;
  }
  return {[name]: field};
}

function optionsToValue(options) {
  return [...options].filter(o => o.selected).map(o => o.value.toString());
}