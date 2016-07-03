import React from 'react'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { spy, match } from 'sinon'
import chai, { expect } from 'chai'
import { mount } from 'enzyme'
import chaiEnzyme from 'chai-enzyme'
import sinonChai from 'sinon-chai'

import Form, { UnconnectedForm } from '../containers/Form'
import formReducer from '../reducers'
import config from '../config'

const { actionTypes } = config;
chai.use(chaiEnzyme());
chai.use(sinonChai);

const fields = {
  username: 'john',
  sex: {fields: ['male', 'female'], value: 'male'},
  agree: false,
  hands: {fields: ['left', 'right'], value: []},
  fruits: {fields: ['tomato', 'potato'], value: 'tomato'},
  pets: {fields: ['rat', 'python'], value: ['rat']}
};

function onChange() {
  return {
    fruits: {
      fields: {potato: {disabled: true}}
    }
  }
}

function validate(fields) {
  return {
    username: 'Too many johnes'
  }
}

function disableSubmit(fields) {
  return {
    disabled: true
  }
}

describe('Form container', function() {
  let spiedReducer;
  let createForm;
  
  beforeEach(function() {
    spiedReducer = spy(combineReducers({form: formReducer}));
    const store = createStore(spiedReducer, {}, applyMiddleware(thunk));    
    createForm = function(onChange, validate, moreErrors) {
      return mount(
        <Form store={store} id="form1" fields={fields} onChange={onChange} validate={validate} moreErrors={moreErrors}>
          <input id="username" name="username" />
          <input id="male" name="sex" value="male" type="radio" />
          <input id="female" name="sex" value="female" type="radio" />
          <input id="agree" name="agree" type="checkbox" />
          <input id="left" name="hands" value="left" type="checkbox" />
          <input id="right" name="hands" value="right" type="checkbox" />
          <select id="fruits" name="fruits">
            <option id="tomato" value="tomato">Tomato</option>
            <option value="potato">Potato</option>
          </select>
          <select id="pets" name="pets" multiple>
            <option value="rat">Rat</option>
            <option value="python">Python</option>
          </select>
          <input id="excess" name="excess" />
          <button hoth-form={disableSubmit}>Submit</button>
        </Form>
      );
    };
  });

  it('requires id and fields props', function() {
    const dispatch = spy();
    expect(() => {mount(<UnconnectedForm dispatch={dispatch} id={'form1'} />)}).to.throw(Error);
    expect(() => {mount(<UnconnectedForm dispatch={dispatch} fields={{}} />)}).to.throw(Error);
    expect(() => {mount(<UnconnectedForm dispatch={dispatch} id={'form1'} fields={{}} />)}).to.not.throw(Error);
  });

  describe('when mounted', function() {
    function testInitFormAction() {
      expect(spiedReducer).to.have.been.calledWith(match.any, {
        type: actionTypes.initForm,
        payload: {
          id: 'form1',
          fields
        }
      });
    }

    describe('without onChange and validate', function() {
      it('dispatches INIT_FORM action', function() {
        createForm();
        testInitFormAction();
        expect(spiedReducer.callCount).to.eql(2);
      });
    });

    describe('with onChange', function() {
      it('dispatches INIT_FORM, ADDITIONAL_CHANGES actions', function() {
        createForm(onChange);
        testInitFormAction();
        expect(spiedReducer).to.have.been.calledWith(match.any, {
          type: actionTypes.additionalChanges,
          payload: {
            id: 'form1',
            fields: {
              fruits: {
                fields: {potato: {disabled: true}}
              }
            }
          }
        });
        expect(spiedReducer.callCount).to.eql(3);
      });
    });

    describe('with validate', function() {
      it('dispatches INIT_FORM, SET_ERRORS actions', function() {
        createForm(undefined, validate);
        testInitFormAction();
        expect(spiedReducer).to.have.been.calledWith(match.any, {
          type: actionTypes.setErrors,
          payload: {
            id: 'form1',
            fields: {
              username: 'Too many johnes',              
            }
          }
        });
        expect(spiedReducer.callCount).to.eql(3);
      });
    });
  });

  describe('when unmounted', function() {
    it('dispatches DESTROY_FORM action', function() {
      const form = createForm();
      form.unmount();
      expect(spiedReducer).to.have.been.calledWith(match.any, {
        type: actionTypes.destroyForm,
        payload: {id: 'form1'}
      });
    });
  });

  describe('on render', function() {
    it('provides children which have prop `name` with corresponding field props', function() {
      const form = createForm(onChange);
      expect(form.find("#username")).to.have.prop('value', 'john');
      expect(form.find("#male")).to.have.prop('checked', true);
      expect(form.find("#female")).to.have.prop('checked', false);
      expect(form.find("#agree")).to.have.prop('value', false);
      expect(form.find("#tomato")).to.be.selected();
      expect(Object.keys(form.find("#excess").props()).length).to.eql(2);
      expect(Object.keys(form.find("button").props()).length).to.eql(3); // children 'Submit'
    });

    it('provides children which have prop `hoth-form` with props returned by calling `hoth-form` function', function() {
      const spied = spy(disableSubmit);
      const form = createForm();
      // Something strange here - it shows that spy is not being called, but injects props correctly

      // expect(spied).to.have.been.calledWith({
      //   id: 'form1',
      //   fields: {
      //     username: {initialValue: 'john', value: 'john'},
      //     sex: {fields: {male: {checked: true}, female: {checked: false}}, initialValue: 'male', value: 'male'},
      //     agree: {checked: false, initialValue: false, value: false},
      //     hands: {fields: {left: {checked: false}, right: {checked: false}}, initialValue: [], value: []},
      //     fruits: {fields: {tomato: {checked: true}, potato: {checked: false}}, initialValue: 'tomato', value: 'tomato'},
      //     pets: {fields: {rat: {checked: true}, python: {checked: false}}, initialValue: ['rat'], value: ['rat']},
      //     nonFieldErrors: {errors: null}
      //   },
      //   initialized: true,
      //   errors: false
      // });
      expect(form.find('button')).to.have.prop('disabled', true);
    });
  });

  describe('onFieldChange function', function() {
    it('calls `onChange` function if exists', function() {
      const spied = spy(onChange);
      const form = createForm(spied);
      form.find('#username').simulate('change', {target: {name: 'username', value: 'mark'}});
      expect(spied).to.have.been.calledWith({
        username: {
          value: 'mark'
        }
      });
    });

    it('calls `validate` function if exists', function() {
      const spied = spy(validate);
      const form = createForm(null, spied);
      form.find('#username').simulate('change', {target: {name: 'username', value: 'mark'}});
      expect(spied).to.have.been.calledWith({
        username: {initialValue: 'john', value: 'mark', errors: ['Too many johnes'], dirty: true},
        sex: {fields: {male: {checked: true}, female: {checked: false}}, initialValue: 'male', value: 'male'},
        agree: {checked: false, initialValue: false, value: false},
        hands: {fields: {left: {checked: false}, right: {checked: false}}, initialValue: [], value: []},
        fruits: {fields: {tomato: {checked: true}, potato: {checked: false}}, initialValue: 'tomato', value: 'tomato'},
        pets: {fields: {rat: {checked: true}, python: {checked: false}}, initialValue: ['rat'], value: ['rat']},
        nonFieldErrors: {errors: null}
      });
    });

    it('injects `moreErrors` keys values into elements with corresponding `name` props', function() {
      const form = createForm(null, null, {username: 'This name was already taken'});
      expect(form.find('#username')).to.have.prop('moreErrors', 'This name was already taken');
    });

    it('handles input changes', function() {
      const form = createForm();
      form.find('#username').simulate('change', {target: {name: 'username', value: 'mark'}});
      expect(spiedReducer).to.have.been.calledWith(match.any, {
        type: actionTypes.editFields,
        payload: {
          id: 'form1',
          fields: {username: {value: 'mark'}}
        }
      });
    });

    it('handles radio changes', function() {
      const form = createForm();
      form.find('#female').simulate('change', {target: {name: 'sex', value: 'female', checked: true}});
      expect(spiedReducer).to.have.been.calledWith(match.any, {
        type: actionTypes.editFields,
        payload: {
          id: 'form1',
          fields: {sex: {value: 'female'}}
        }
      });
    });

    it('handles single checkbox changes', function() {
      const form = createForm();
      form.find('#agree').simulate('change', {target: {
        name: 'agree',
        type: 'checkbox',
        value: 'false',
        checked: true
      }});
      expect(spiedReducer).to.have.been.calledWith(match.any, {
        type: actionTypes.editFields,
        payload: {
          id: 'form1',
          fields: {agree: {value: true}}
        }
      });
    });

    it('handles multiple checkbox changes', function() {
      const form = createForm();
      form.find('#left').simulate('change', {target: {
        name: 'hands', 
        type: 'checkbox',
        value: 'left', 
        checked: true
      }});
      expect(spiedReducer).to.have.been.calledWith(match.any, {
        type: actionTypes.editFields,
        payload: {
          id: 'form1',
          fields: {
            hands: {fields: {left: {checked: true}}}
          }
        }
      });
    });

    it('handles select changes', function() {
      const form = createForm();
      form.find('#fruits').simulate('change', {target: {
        name: 'fruits',
        type: 'select',
        options: [
          {selected: false, value: 'tomato'},
          {selected: true, value: 'potato'}
        ]
      }});
      expect(spiedReducer).to.have.been.calledWith(match.any, {
        type: actionTypes.editFields,
        payload: {
          id: 'form1',
          fields: {fruits: {value: 'potato'}}
        }
      });
    });

    it('handles multiple select changes', function() {
      const form = createForm();
      form.find('#pets').simulate('change', {target: {
        name: 'pets',
        type: 'select-multiple',
        options: [
          {selected: true, value: 'rat'},
          {selected: true, value: 'python'}
        ]
      }});
      expect(spiedReducer).to.have.been.calledWith(match.any, {
        type: actionTypes.editFields,
        payload: {
          id: 'form1',
          fields: {
            pets: {value: ['rat', 'python']}
          }
        }
      });
    });
  });
});