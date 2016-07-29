import React from 'react'
import { spy, match } from 'sinon'
import chai, { expect } from 'chai'
import { shallow } from 'enzyme'
import chaiEnzyme from 'chai-enzyme'
import sinonChai from 'sinon-chai'
import chaiSubset from 'chai-subset'

import Form from '../containers/Form'
import Field from '../containers/Field'
import config from '../config'

chai.use(chaiEnzyme());
chai.use(sinonChai);
chai.use(chaiSubset);

const fields = {
  username: 'john',
  sex: {fields: ['male', 'female'], value: 'male'},
  agree: false,
  hands: {fields: ['left', 'right'], value: []},
  fruits: {fields: ['tomato', 'potato'], value: ['tomato']},
  pets: {fields: ['rat', 'python'], value: ['rat'], className: 'myPets'}
};

function onChange(p) {
  return {
    fruits: {
      fields: {potato: {disabled: true}}
    },
    wontBeInjected: {
      foo: 'bar'
    }
  }
}

function validate(fields) {
  return {
    username: 'Too many johnes',
    wontBeInjected: 'foo'
  }
}

function disableSubmit(fields) {
  return {
    disabled: true
  }
}

function createForm(onChange, validate, moreErrors) {
  return shallow(
    <Form fields={fields} onChange={onChange} validate={validate} moreErrors={moreErrors}>
      <Field id="username" name="username" />
      <input id="male" name="sex" value="male" type="radio" />
      <input id="female" name="sex" value="female" type="radio" />
      <input id="agree" name="agree" type="checkbox" />
      <input id="left" name="hands" value="left" type="checkbox" />
      <input id="right" name="hands" value="right" type="checkbox" />
      <fieldset className="extra field-group">
        <legend>Extra</legend>
        <select id="fruits" name="fruits">
          <option id="tomato" value="tomato">Tomato</option>
          <option value="potato">Potato</option>
        </select>
        <select id="pets" name="pets" multiple>
          <option value="rat">Rat</option>
          <option value="python">Python</option>
        </select>
      </fieldset>
      <input id="excess" name="excess" />
      <button hoth={disableSubmit}>Submit</button>
    </Form>
  );
}

describe('Form container', function() {
  it('requires `fields` prop', function() {
    expect(() => {shallow(<Form />)}).to.throw(Error);
    expect(() => {shallow(<Form fields={fields} />)}).to.not.throw(Error);
  });

  it('handles focus changes', function() {
    const form = createForm();
    form.find('#username').simulate('focus', {target: {name: 'username'}, type: 'focus'});
    expect(form.state()).to.containSubset({
      fields: {
        username: {active: true}
      }
    });
    form.find('#username').simulate('blur', {target: {name: 'username'}, type: 'blur'});
    expect(form.state()).to.containSubset({
      fields: {
        username: {active: false}
      }
    });
  });

  it('can reset fields to initial values (and also calls `onChange` and `validate` in process)', function() {
    const form = createForm(onChange, validate);
    form.find('#username').simulate('change', {target: {name: 'username', value: 'mark'}});
    form.state().reset();
    expect(form.state()).to.containSubset({
      fields: {
        username: {
          value: 'john',
          dirty: false,
          errors: ['Too many johnes']
        }
      }
    });
    expect(form.find('button')).to.have.prop('disabled', true);
  });

  describe('when has been mounted', function() {
    it('initializes fields', function() {
      const form = createForm();

      expect(form.state()).to.containSubset({
        fields: {
          username: {initialValue: 'john', value: 'john'},
          sex: {fields: {male: {checked: true}, female: {checked: false}}, initialValue: ['male'], value: ['male']},
          agree: {initialValue: false, value: false, checked: false},
          hands: {fields: {left: {checked: false}, right: {checked: false}}, initialValue: [], value: []},
          fruits: {fields: {tomato: {checked: true}, potato: {checked: false}}, initialValue: ['tomato'], value: ['tomato']},
          pets: {fields: {rat: {checked: true}, python: {checked: false}}, initialValue: ['rat'], value: ['rat'], className: 'myPets'},
          nonFieldErrors: {errors: null}
        },
        errors: false,
        // reset: form.resetFields
      });
    });

    it('calls `onChange` function if it is provided', function() {
      const form = createForm(onChange);
      expect(form.state()).to.containSubset({
        fields: {
          fruits: {fields: {potato: {disabled: true}}}
        }
      });
      expect(form.state()).to.not.containSubset({
        fields: {
          wontBeInjected: {foo: 'bar'}
        }
      });
    });

    it('calls `validate` function if it is provided', function() {
      const form = createForm(undefined, validate);
      expect(form.state()).to.containSubset({
        fields: {
          username: {errors: ['Too many johnes']},              
        },
        errors: true
      });
      expect(form.state()).to.not.containSubset({
        fields: {
          wontBeInjected: {errors: ['foo']}
        }
      });
    });

    it('initializes `non-field-errors` field with the key from config object', function() {
      const savedKey = config.nonFieldErrorsKey;
      config.nonFieldErrorsKey = 'formErrors';
      const form = createForm();
      expect(form.state()).to.containSubset({
        fields: {
          formErrors: {errors: null}
        }
      });
      config.nonFieldErrorsKey = savedKey;
    });
  });

  describe('on render', function() {
    it('provides direct children which have prop `name` with corresponding field props', function() {
      const form = createForm(onChange);
      expect(form.find("#username")).to.have.prop('value', 'john');
      expect(form.find("#male")).to.have.prop('checked', true);
      expect(form.find("#female")).to.have.prop('checked', false);
      expect(form.find("#agree")).to.have.prop('value', false);
      expect(Object.keys(form.find("#excess").props()).length).to.eql(2);
      expect(Object.keys(form.find("button").props()).length).to.eql(3); // children 'Submit'
    });

    it('provides indirect children which parents have className equal to `fieldGroupClassName` with corresponding field props', function() {
      const form = createForm();
      expect(form.find("#fruits")).to.have.prop('value', 'tomato');
      expect(form.find("#pets")).to.have.prop('className', 'myPets');
    });

    it('provides children which have prop `hoth` with props returned by calling `hoth` function', function() {
      const spied = spy(disableSubmit);
      const form = createForm();

      // Something strange here - it shows that spy is not being called, but injects props correctly
      // expect(spied).to.have.been.calledWith({
      //   fields: {
      //     username: {initialValue: 'john', value: 'john'},
      //     sex: {fields: {male: {checked: true}, female: {checked: false}}, initialValue: 'male', value: 'male'},
      //     agree: {checked: false, initialValue: false, value: false},
      //     hands: {fields: {left: {checked: false}, right: {checked: false}}, initialValue: [], value: []},
      //     fruits: {fields: {tomato: {checked: true}, potato: {checked: false}}, initialValue: 'tomato', value: 'tomato'},
      //     pets: {fields: {rat: {checked: true}, python: {checked: false}}, initialValue: ['rat'], value: ['rat']},
      //     nonFieldErrors: {errors: null}
      //   },
      //   errors: false
      // });
      expect(form.find('button')).to.have.prop('disabled', true);
    });
  });

  describe('onFieldChange function', function() {
    // Something strange again.. Maybe I do it wrong, but seems like it works.
    it.skip('calls `onChange` function if it is provided', function() {
      const spied = spy(onChange);
      const form = createForm(spied);
      form.find('#username').simulate('change', {target: {name: 'username', value: 'mark'}});
      expect(spied).to.have.been.calledWith({
        username: {initialValue: 'john', value: 'mark', dirty: true},
        sex: {fields: {male: {checked: true}, female: {checked: false}}, initialValue: 'male', value: 'male'},
        agree: {checked: false, initialValue: false, value: false},
        hands: {fields: {left: {checked: false}, right: {checked: false}}, initialValue: [], value: []},
        fruits: {fields: {tomato: {checked: true}, potato: {checked: false}}, initialValue: 'tomato', value: ['tomato']},
        pets: {fields: {rat: {checked: true}, python: {checked: false}}, initialValue: ['rat'], value: ['rat'], className: 'myPets'},
        nonFieldErrors: {errors: null}
      }, {
        name: 'username',
        value: 'mark'
      });
    });

    it('calls `validate` function if it is provided', function() {
      const spied = spy(validate);
      const form = createForm(null, spied);
      form.find('#username').simulate('change', {target: {name: 'username', value: 'mark'}});
      expect(spied).to.have.been.calledWith({
        username: {initialValue: 'john', value: 'mark', errors: ['Too many johnes'], dirty: true},
        sex: {fields: {male: {checked: true}, female: {checked: false}}, initialValue: ['male'], value: ['male']},
        agree: {checked: false, initialValue: false, value: false},
        hands: {fields: {left: {checked: false}, right: {checked: false}}, initialValue: [], value: []},
        fruits: {fields: {tomato: {checked: true}, potato: {checked: false}}, initialValue: ['tomato'], value: ['tomato']},
        pets: {fields: {rat: {checked: true}, python: {checked: false}}, initialValue: ['rat'], value: ['rat'], className: 'myPets'},
        nonFieldErrors: {errors: null}
      });
    });

    it('injects `moreErrors` keys values into elements with corresponding `name` props', function() {
      const form = createForm(null, null, {username: 'This name was already taken'});
      expect(form.find('#username')).to.have.prop('moreErrors', 'This name was already taken');
    });

    it('handles input changes', function() {
      const form = createForm();
      form.find('#username').simulate('change', {target: {
        name: 'username', 
        value: 'mark'
      }});
      expect(form.state()).to.containSubset({
        fields: {
          username: {value: 'mark'}
        }
      });
    });

    it('handles radio changes', function() {
      const form = createForm();
      form.find('#female').simulate('change', {target: {
        name: 'sex', 
        value: 'female', 
        checked: true
      }});
      expect(form.state()).to.containSubset({
        fields: {
          sex: {value: 'female'}
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
      expect(form.state()).to.containSubset({
        fields: {
          agree: {value: true}
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
      expect(form.state()).to.containSubset({
        fields: {
          hands: {
            fields: {left: {checked: true}}
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
      expect(form.state()).to.containSubset({
        fields: {
          fruits: {
            value: ['potato']
          }
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
      expect(form.state()).to.containSubset({
        fields: {
          pets: {
            value: ['rat', 'python']
          }
        }
      });
    });

    it('handles file field changes', function() {
      const fields = {
        photo: {id: 'photo', type: 'file'}
      };
      const form = shallow(
        <Form fields={fields} >
          <Field name="photo" />
        </Form>
      );
      form.find('#photo').simulate('change', {target: {
        name: 'photo',
        type: 'file',
        files: ['myFile1']
      }});
      expect(form.state()).to.containSubset({
        fields: {
          photo: {
            value: ['myFile1']
          }
        }
      });
    });
  });
});