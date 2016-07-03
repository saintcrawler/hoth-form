import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import mergeWith from 'lodash/mergeWith'
import isEqual from 'lodash/isEqual'
import sortBy from 'lodash/sortBy'
import { Map, fromJS } from 'immutable'

import config from './config'

const { actionTypes } = config;
const initialState = Map();

export default function(state = initialState, action) {
  switch (action.type) {
    case actionTypes.initForm: 
      return initForm(state, action);

    case actionTypes.changeFocus:
    case actionTypes.additionalChanges:
      return additionalChanges(state, action);

    case actionTypes.editFields:
      return editFields(state, action);

    case actionTypes.setErrors:
      return setErrors(state, action);

    case actionTypes.destroyForm:
      return destroyForm(state, action);

    default:
      return state;
  }
}

function initForm(state, action) {
  const {id, fields} = action.payload;      
  return state.setIn([id, 'fields'], initFields(fromJS(fields)))
              .setIn([id, 'initialized'], true);
}

function destroyForm(state, action) {
  const {id} = action.payload;
  return state.delete(id);
}

function initFields(fields) {
  const result = {};
  fields.forEach((value, key) => {
    const schema = value.toJS && value.toJS() || value;
    let field = {};

    if (isPlainObject(schema)) {
      field = schema;
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
    }
    result[key] = field;
  });
  result[config.nonFieldErrorsKey] = {errors: null};
  return Map(result);
}

function isChecked(fieldName, value) {
  if (!value) return false;
  return value.indexOf(fieldName) !== -1;
}

function editFields(state, action) {
  return iterateThroughFields(state, action, setValue);
}

function iterateThroughFields(state, action, fn) {
  const {id, fields} = action.payload;
  Object.keys(fields).forEach(key => {
    const field = key;
    const props = fields[key];
    state = state.updateIn([id, 'fields', field], f => {
      let newField = mergeWith({}, f, props, replaceArrays);
      if (fn) {
        newField = fn(newField, props);
      }
      return newField;
    });
  })
  return state;
}

function setValue(newField, props) {
  // If value is provided with props, then update all `checked` props if they are exist.
  // If value is NOT provided, but `checked` IS, then update `value` prop.
  if (props.hasOwnProperty('value')) {
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
      if (props.hasOwnProperty('checked')) {
        newField.value = props.checked;
      }
    }
  }
  newField.dirty = isDirty(newField.value, newField.initialValue);
  return newField;
}

function isDirty(val, initVal) {
  if (typeof val === 'boolean') {
    return val !== initVal;
  } else {
    return !isEqual(sortBy(val), sortBy(initVal));
  }
}

function additionalChanges(state, action) {
  return iterateThroughFields(state, action);
}

function setErrors(state, action) {
  const {id, fields} = action.payload;
  const adjustedFields = {};
  const immutableFields = fromJS(fields);
  state.getIn([id, 'fields']).forEach((v, k) => {
    adjustErrorField(adjustedFields, immutableFields, v, k);
  });
  let newAction = fromJS(action);
  newAction = newAction.setIn(['payload', 'fields'], adjustedFields);
  state = iterateThroughFields(state, newAction.toJS());
  const hasErrors = state.getIn([id, 'fields']).some(f => f.errors);
  state = state.setIn([id, 'errors'], hasErrors);
  return state;
}

function adjustErrorField(adjustedFields, actionFields, stateField, key) {
  let errors = null;
  let value = actionFields.get(key);
  if (value) {
    value = value.toJS && value.toJS() || value;       
    if (typeof value === 'string') {
      errors = [value];
    } else {
      errors = value;
    }
  }
  if (value || stateField.errors) {
    adjustedFields[key] = {errors};
  }
}

export function replaceArrays(objValue, srcValue) {
  if (isArray(objValue)) {
    return srcValue;
  }
}