export default {
  actionTypes: {
    initForm: 'hoth-form/INIT_FORM',
    destroyForm: 'hoth-form/DESTROY_FORM',
    editFields: 'hoth-form/EDIT_FIELDS',
    changeFocus: 'hoth-form/CHANGE_FOCUS',
    additionalChanges: 'hoth-form/ADDITIONAL_CHANGES',
    setErrors: 'hoth-form/SET_ERRORS'
  },
  selector: function(state) {
    return state.form;
  },
  nonFieldErrorsKey: 'nonFieldErrors'
}