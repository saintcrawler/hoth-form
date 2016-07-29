import chai, {expect} from 'chai'
import chaiSubset from 'chai-subset'

import {
  changeValue, 
  additionalChanges, 
  performValidation,
  initFields,
  resetFields } from '../utils'

chai.use(chaiSubset);

const fieldsSchema = {
  username: {
    value: 'john',
    disabled: true,
  },
  password: 'doe',
  transport: {
    fields: ['feet', 'car', 'bicycle', 'moto', 'turbodesk'],
    value: ['car', 'turbodesk'],
  },
  feet: {
    fields: ['left', 'right', 'both'],
    value: 'right',
  },
  car: {
    fields: ['toyota', 'mazda', 'ford'],
    value: ['toyota', 'ford'],
  },
  color: {
    fields: {
      red: {},
      green: {},
      blue: {disabled: true},
    },
    value: 'red',
  },
  agree: false
};

const initializedFields = {    
  username: {
    initialValue: 'john',
    value: 'john',
    disabled: true
  },
  password: {
    initialValue: 'doe',
    value: 'doe'
  },
  transport: {
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
  feet: {
    fields: {
      left: {checked: false},
      right: {checked: true},
      both: {checked: false},
    },
    initialValue: ['right'],
    value: ['right'],
  },
  car: {
    fields: {
      toyota: {checked: true}, 
      mazda: {checked: false},
      ford: {checked: true},
    },
    initialValue: ['toyota', 'ford'],
    value: ['toyota', 'ford'],
  },
  color: {
    fields: {
      red: {checked: true},
      green: {checked: false},
      blue: {disabled: true, checked: false},
    },
    initialValue: ['red'],
    value: ['red'],
  },
  agree: {
    initialValue: false,
    value: false,
    checked: false
  },
  nonFieldErrors: {
    errors: null
  }
};

describe('hoth-form utils', function() {
  describe('initFields', function() {
    it('accepts fields schema and returns initialized fields', function() {
      const initialized = initFields(fieldsSchema);
      expect(initialized).to.eql(initializedFields);
      expect(fieldsSchema).to.not.equal(initialized);
    });
  });

  describe('changeValue', function() {
    describe('accepts form fields and react element and returns form fields with updated value', function() {
      it('changes input value', function() {
        const changes = changeValue(initializedFields, {name: 'username', value: 'mark', type: 'input'});
        expect(changes).to.containSubset({
          username: {
            value: 'mark'
          }
        });
        expect(changes).to.not.equal(initializedFields);  
      });

      it('changes radio value', function() {
        const changes = changeValue(initializedFields, {name: 'feet', value: 'both', type: 'radio'});
        expect(changes).to.containSubset({
          feet: {
            fields: {
              left: {checked: false},
              right: {checked: false},
              both: {checked: true}
            },
            value: ['both']
          }
        });
        expect(changes).to.not.equal(initializedFields);
      });

      it('changes single-checkbox value', function() {
        const changes = changeValue(initializedFields, {name: 'agree', value: 'false', type: 'checkbox', checked: true});
        expect(changes).to.containSubset({
          agree: {
            value: true,
            checked: true
          }
        });
        expect(changes).to.not.equal(initializedFields);
      });

      it('changes multiple-checkbox value', function() {
        const changes = changeValue(initializedFields, {name: 'transport', value: 'feet', checked: true, type: 'checkbox'});
        expect(changes).to.containSubset({
          transport: {
            fields: {
              feet: {checked: true},
              car: {checked: true},
              bicycle: {checked: false},
              moto: {checked: false},
              turbodesk: {checked: true},
            },
            value: ['feet', 'car', 'turbodesk']
          }
        });
        expect(changes).to.not.equal(initializedFields);
      });

      it('changes select value', function() {
        const changes = changeValue(initializedFields, {name: 'color', type: 'select', options: [
          {value: 'red', selected: false},
          {value: 'green', selected: true},
          {value: 'blue', selected: false},
        ]});
        expect(changes).to.containSubset({
          color: {
            fields: {
              red: {checked: false},
              green: {checked: true},
              blue: {checked: false}
            },
            value: ['green']
          }
        });
        expect(changes).to.not.equal(initializedFields);
      });

      it('changes multiple select value', function() {
        const changes = changeValue(initializedFields, {name: 'car', type: 'select-multiple', options: [
          {value: 'toyota', selected: false},
          {value: 'mazda', selected: true},
          {value: 'ford', selected: true},
        ]});
        expect(changes).to.containSubset({
          car: {
            fields: {
              toyota: {checked: false},
              mazda: {checked: true},
              ford: {checked: true},
            },
            value: ['mazda', 'ford']
          }
        });
        expect(changes).to.not.equal(initializedFields);
      });

      it('sets `dirty` flag if `value` differs from `initialValue`', function() {
        let changes = changeValue(initializedFields, {name: 'username', value: 'mark'});
        expect(changes.username.dirty).to.be.true;
        changes = changeValue(initializedFields, {name: 'username', value: 'john'});
        expect(changes.username.dirty).to.be.false;
      });
    });
  });

  describe('additionalChanges', function() {
    it('accepts form fields and callback function and returns updated form fields, but does not recalculate values', function() {
      const changes = additionalChanges(initializedFields, (fields) => {
        const result = {};
        result.username = {disabled: !fields.username.disabled};
        result.password = {disabled: fields.username.disabled};
        return result;
      });
      expect(changes).to.containSubset({
        username: {
          disabled: false
        },
        password: {
          disabled: true
        }
      });
      expect(changes).to.not.equal(initializedFields);
    });
  });

  describe('performValidation', function() {
    it('accepts form fields and callback function and returns from state with fields and errors flag', function() {
      const changes = performValidation(initializedFields, (fields) => {
        const result = {};
        if (fields.username.value === 'john') {
          result.username = 'This field is required';
        }
        result.nonFieldErrors = ['No', 'way'];
        return result;
      });
      expect(changes).to.containSubset({
        errors: true,
        fields: {
          username: {
            errors: ['This field is required']
          },
          nonFieldErrors: {
            errors: ['No', 'way']
          }
        }
      });
      expect(changes).to.not.equal(initializedFields);
    });
  });

  describe('resetFields', function() {
    it('resets all values', function() {
      const dirtyFields = {...initializedFields};
      dirtyFields.username.value = 'tom';
      dirtyFields.username.dirty = true;

      dirtyFields.agree.value = true;
      dirtyFields.agree.dirty = true;
      
      dirtyFields.color.value = ['green'];
      dirtyFields.color.dirty = true;

      const resettedFields = resetFields(dirtyFields);

      expect(resettedFields).to.containSubset({
        username: {
          value: 'john',
          dirty: false
        },
        agree: {
          value: false,
          dirty: false
        },
        color: {
          value: ['red'],
          dirty: false
        }
      });

      expect(dirtyFields).to.not.equal(resettedFields);
    });
  });
});