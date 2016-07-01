import chai, { expect } from 'chai'
import chaiSubset from 'chai-subset'
import { Map } from 'immutable'

import reducer from '../reducers'
import config from '../config'

chai.use(chaiSubset);

const { actionTypes } = config;
const initFields = {
  'username': {
    value: 'john',
    disabled: true,
  },
  'password': 'doe',
  'transport': {
    fields: ['feet', 'car', 'bicycle', 'moto', 'turbodesk'],
    value: ['car', 'turbodesk'],
  },
  'transport.feet': {
    fields: ['left', 'right', 'both'],
    value: 'right',
  },
  'transport.car': {
    fields: ['toyota', 'mazda', 'ford'],
    value: ['toyota', 'ford'],
  },
  'transport.car.color': {
    fields: {
      red: {},
      green: {},
      blue: {disabled: true},
    },
    value: 'red',
  },
  'agree': true
};
const initialized = Map({
  testForm1: Map({
    fields: {}
  }),
  testForm2: Map({
    initialized: true,
    fields: Map({
      'username': {
        initialValue: 'john',
        value: 'john',
        disabled: true
      },
      'password': {
        initialValue: 'doe',
        value: 'doe'
      },
      'transport': {
        fields: {
          feet: {checked: false}, 
          car: {checked: true},
          bicycle: {checked: false}, 
          moto: {checked: false}, 
          turbodesk: {checked: true},
        },
        initialValue: ['car', 'turbodesk'],
        value: ['car', 'turbodesk'],
      },
      'transport.feet': {
        fields: {
          left: {checked: false},
          right: {checked: true},
          both: {checked: false},
        },
        initialValue: 'right',
        value: 'right',
      },
      'transport.car': {
        fields: {
          toyota: {checked: true}, 
          mazda: {checked: false},
          ford: {checked: true},
        },
        initialValue: ['toyota', 'ford'],
        value: ['toyota', 'ford'],
      },
      'transport.car.color': {
        fields: {
          red: {checked: true},
          green: {checked: false},
          blue: {disabled: true, checked: false},
        },
        initialValue: 'red',
        value: 'red',
      },
      'agree': {
        initialValue: true,
        value: true,
        checked: true
      },
      'nonFieldErrors': {
        errors: null
      }
    })
  })
});

describe('Form reducer', function() {
  it('has proper initial state', function() {
    const nextState = reducer(undefined, {type: 'TEST'});
    expect(nextState.toJS()).to.eql({});
  });

  it('handles INIT_FORM action', function() {
    const state = Map({
      testForm1: {fields: {}}
    });
    const action = {
      type: actionTypes.initForm,
      payload: {
        id: 'testForm2',
        fields: initFields
      }
    };
    const nextState = reducer(state, action);
    expect(nextState.toJS()).to.eql(initialized.toJS());
  });

  it('handles EDIT_FIELDS action', function() {
    const state = initialized;
    const nextState = reducer(state, {
      type: actionTypes.editFields,
      payload: {
        id: 'testForm2',
        fields: {
          'username': {
            value: 'mark',
            disabled: false
          },
          'agree': {
            value: false
          },
          'transport': {
            fields: {
              feet: {checked: true}
            }
          },
          'transport.car': {
            value: ['mazda']
          }
        },
        setValue: true
      }
    });
    expect(nextState.toJS()).to.eql({
      testForm1: {
        fields: {}
      },
      testForm2: {
        initialized: true,
        fields: {
          'username': {
            initialValue: 'john',
            value: 'mark',
            disabled: false
          },
          'password': {
            initialValue: 'doe',
            value: 'doe'
          },
          'transport': {
            fields: {
              feet: {checked: true}, 
              car: {checked: true},
              bicycle: {checked: false}, 
              moto: {checked: false}, 
              turbodesk: {checked: true},
            },
            initialValue: ['car', 'turbodesk'],
            value: ['feet', 'car', 'turbodesk'], // Potential test failure here.
            // Because values are determined by iteratng through fields' keys and thus are not ordered.
          },
          'transport.feet': {
            fields: {
              left: {checked: false},
              right: {checked: true},
              both: {checked: false},
            },
            initialValue: 'right',
            value: 'right',
          },
          'transport.car': {
            fields: {
              toyota: {checked: false}, 
              mazda: {checked: true},
              ford: {checked: false},
            },
            initialValue: ['toyota', 'ford'],
            value: ['mazda'],
          },
          'transport.car.color': {
            fields: {
              red: {checked: true},
              green: {checked: false},
              blue: {disabled: true, checked: false},
            },
            initialValue: 'red',
            value: 'red',
          },
          'agree': {
            initialValue: true,
            value: false,
            checked: false
          },
          'nonFieldErrors': {
            errors: null
          }
        }
      }
    });
  });

  it('handles CHANGE_FOCUS action');

  it('handles SET_ERRORS action', function() {
    const state = initialized.setIn(['testForm2', 'fields', 'password'], {errors: 'Some error'});
    const nextState = reducer(state, {
      type: actionTypes.setErrors,
      payload: {
        id: 'testForm2',
        fields: {
          username: 'Too many johnes',
          nonFieldErrors: 'Not so fast'
        }
      }
    });
    expect(nextState.toJS()).to.containSubset({
      testForm2: {
        fields: {
          username: {errors: ['Too many johnes']},
          password: {errors: null},
          nonFieldErrors: {errors: ['Not so fast']}
        }
      }
    });
  });

  it('handles DESTROY_FORM action', function() {
    const state = initialized;
    const nextState = reducer(state, {
      type: actionTypes.destroyForm,
      payload: {id: 'testForm2'}
    });
    expect(nextState.toJS()).to.eql({
      'testForm1': {
        fields: {}
      }
    });
  });
});