# hoth-form

Another way to work with forms in React and Redux.

---
## #Warning#:             
Soon, there will be a new version, which does not require Redux and immutable js

---

### How to use

`npm install hoth-form`

Import or require `hoth-form` module. Currently, it exposes four items:

 1. `Form` - React component, which will render your form state.
 2. `Field` - React component, which will render your form fields. It is not the only way to render form fields, but you can use it as default.
 3. `reducer` - Redux reducer, which you should mount in your state tree.
 4. `config` - Configuration object, which you may tune as you wish.

Mount `reducer` in your redux state. By default, it expects to be mounted at `form` key, but you can change this behavior. To do that, you should override `selector` function in `config` object. For example:

```javascript
import {config} from 'hoth-form'

config.selector = function(state) { // Your redux state
  return state.myForm; // Provide state slice as you want
  //return state.get('myForm'); if you are using immutable.js
}  
```

Use `<Form />` component instead of html `<form />` tag. For example:

```javascript
import {Form, Field} from 'hoth-form'

const fields = {
  username: '',   // init with default value
  password: {     // or object
    value: '123', // or initValue, or nothing (empty string will be used)
    className: 'password-field', // everything will be injected on render
    disabled: true // oops ;)
  },
  transport: {
    // for multi-values fields you must specify `fields` prop with array of `value` names or with object with `value` named keys. 
    fields: ['feet', 'car', 'bicycle'],
    // value should be a string matching one of the `fields` names (for radio-buttons or selects with single selection mode) or an array of strings (for checkboxes or selects with multiple selection) 
    value: ['feet', 'bicycle']
  },
  cars: {
    fields: {
      ford: {}, 
      mazda: {},
      audi: {disabled: true}, 
    },
    value: []
  }, 
  agree: false // single checkbox or radio should be init with true/false value
};

function onChange(fields) {
 // fields - NOT all form fields, but those, which value has been changed by user actions (such as typing in input field or selecting checkbox)
 // return either object with keys matching form fields or empty object or undefined
 if (fields.username && fields.username.value) {
   return {
     password: {disabled: false}
   }
 }
}

function validate(fields) {
  // fields - all form fields
  // return either object with keys matching form fields plus special non-field-errors field (defaults to 'nonFieldErrors', can be changed in config object by setting 'nonFieldErrorsKey') or empty object or undefined
  // Each object key must be a string or an array of strings
  const errors = {};
  if (!fields.agree.value) errors.agree = 'You must accept something';
  if (fields.username.value.length < 3) errors.username = [
    'You must enter a valid username',
    'Username must be at least 3 characters long'
  ];
  return errors;
}

function onSubmit({id, fields}) {
  console.log('submitting form', id, 'with fields', fields);
}

function isSubmitEnabled(formState) {
  return {disabled: formState.errors}
}

const moreErrors = {
  // This will be injected into fields with corresponding `name` prop.
  // You can use this, for example, to provide server validation errors from another redux state slice.
  // Theese errors do not affect form `errors` flag.
  username: 'Already taken'
};

//...somewhere in render function...
<Form id="profile"         // required: key for form state, also serves as html attribute
      fields={fields}      // required
      onSubmit={onSubmit}  // required
      onChange={onChange}  // optional
      validate={validate}  // optional
      moreErrors={moreErrors} // optional
      >
  // use <Field/> to convinietly display label and field errors
  <Field name="username" placeholder="Username" label="Name" />
  // or use html form tags
  <input name="password" type="password" />
  <Field type="checkbox" name="transport" value="feet" label="Feet" />
  <Field type="checkbox" name="transport" value="car" label="Car" />
  <Field type="checkbox" name="transport" value="bicycle" label="Bicycle" />
  <Field widget="select" multiple name="cars" label="Cars">
    <option value="ford">Ford</option>
    <option value="mazda">Mazda</option>
    <option value="audi">Audi</option>   
  </Field>
  <Field type="checkbox" name="agree" label="Agree" />
  <Field widget={null} name="nonFieldErrors" />
  <button hoth-form={isSubmitEnabled}>Submit</button>
</Form>
```

Each form sub-state consists of `fields`, `initialized` flag (will be set after INIT_FORM action), `errors` flag (will be set if any of the fields has errors).
Each field has theese main props: `initialValue`, `value`, `checked` (for radio, checkboxes and select elements), `fields` (see previous), `active` - true, if element has focus, `dirty` - true, if value differs from initial value.

More examples and docs will be available in future.

***LICENSE***: ISC