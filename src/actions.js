import config from './config'

const { actionTypes } = config;

export function editFields(id, fields) {
  return {
    type: actionTypes.editFields,
    payload: {id, fields}
  }
}

export function changeFocus(id, element, type) {
  const {name} = element;
  return {
    type: actionTypes.changeFocus,
    payload: {
      id,
      fields: {[name]: {active: (type === 'focus') ? true : false}}
    }
  }
}

export function initForm({id, fields, onChange, validate}) {
  return (dispatch, getState) => {
    dispatch({
      type: actionTypes.initForm,
      payload: {id, fields}
    });
    applyAdditionalChanges(id, onChange, dispatch, getActualFields(getState(), id));
    performValidation(id, validate, dispatch, getState);
  }
}

export function changeFieldValue({id, element, onChange, validate}) {
  return (dispatch, getState) => {
    let fields = elementToField(element);
    dispatch(editFields(id, fields));
    applyAdditionalChanges(id, onChange, dispatch, fields);
    performValidation(id, validate, dispatch, getState);
  }
}

function applyAdditionalChanges(id, onChange, dispatch, fields) {
  const changes = onChange && onChange(fields);
  if (changes && Object.keys(changes).length > 0) {
    dispatch({
      type: actionTypes.additionalChanges,
      payload: {id, fields: changes}
    });
  }
}

function performValidation(id, validate, dispatch, getState) {
  const newFields = getActualFields(getState(), id);
  const errors = validate && validate(newFields);
  if (validate) {
    dispatch({
      type: actionTypes.setErrors,
      payload: {id, fields: errors}
    });
  }
}

function getActualFields(state, id) {
  return config.selector(state).getIn([id, 'fields']).toJS();
}

function elementToField(element) {
  const {name, type, value} = element;
  const field = {};  
  switch (type) {
    case 'checkbox':
      if (value === 'true' || value === 'false') {
        field.value = element.checked;
      } else {
        field.fields = {[value]: {checked: element.checked}}
      }
      break;

    case 'select':
      field.value = optionsToValue(element.options)[0];
      break;

    case 'select-multiple':
      field.value = optionsToValue(element.options);
      break;

    case undefined:
    default:
      field.value = value;
  }
  return {[name]: field};
}

function optionsToValue(options) {
  return [...options].filter(o => o.selected).map(o => o.value);
}