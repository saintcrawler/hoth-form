hoth-form
=========

Another way to work with forms in React. See [demo].

Install it
----------

`npm i -S hoth-form`

Test it
-------

`git clone https://github.com/saintcrawler/hoth-form && cd hoth-form`

`npm i && npm test`

Use it
------

Import or require `hoth-form` module. Currently, it exposes these items:

 1. `Form` - React component, which will render your form.
 2. `Field` - React component, which will render your form fields. It is not the only way to render form fields, but you can use it as default.
 3. `config` - Configuration object, which you may tune as you wish.

Make a config object:

```javascript
const fields = {
  username: '',                   // init with default value
  password: {                     // or object
    value: '123',                 // or `initValue`, or nothing (empty string will be used)
    className: 'password-field',  // almost everything will be injected on render
    validation: {                 // except for some non-standard props... 
      required: true              // they will not get to the HTML form controls (input, select, etc.)...
    }                             // only to the custom components (Field, etc.)
  },
  transport: {
    // for multi-values fields you must specify `fields` prop with an array of `value` names or with object with `value` named keys. 
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
```

Use `<Form />` component instead of html `<form />` tag. And any child component with `name` prop, matching against `fields` keys, will be injected with corresponding props. For example:

```javascript
import {Form, Field} from 'hoth-form'

// optional
function onChange(fields, target) {
  // is called AFTER changing a value, so `fields` are up-to-date
  // `target` is React component, that was changed
  // return either object with keys matching form fields or empty object or undefined
  return {
    password: {disabled: !!fields.username.value}
  }
}

// optional
function validate(fields) {  
  // return either object with keys matching form fields 
  // plus special non-field-errors field (defaults to 'nonFieldErrors', 
  // can be changed in the config object by setting 'nonFieldErrorsKey')
  // or empty object or undefined
  // Each object key must be a string or an array of strings
  const errors = {};
  if (!fields.agree.value) errors.agree = 'You must accept something';
  if (fields.username.value.length < 3) errors.username = [
    'You must enter a valid username',
    'Username must be at least 3 characters long'
  ];
  return errors;
}

// required
function onSubmit(form) {
  console.log('submitting form', form);
}

function isSubmitEnabled(form) {
  return {disabled: form.errors}
}

const moreErrors = {
  // This will be injected into fields with corresponding `name` prop.
  // You can use this, for example, to provide server validation errors from another redux state slice.
  // These errors do not affect form `errors` flag.
  username: 'Already taken'
};

//...somewhere in render function...
<Form id="profile"            // optional
      fields={fields}         // required
      onSubmit={onSubmit}     // required
      onChange={onChange}     // optional
      validate={validate}     // optional
      moreErrors={moreErrors} // optional
      >
  // use <Field/> to conveniently display label and field errors
  <Field name="username" placeholder="Username" label="Name" />
  // or use html form tags
  <input name="password" type="password" />
  <fieldset className="group">
    <legend>Transport</legend>
    <Field type="checkbox" name="transport" value="feet" label="Feet" />
    <Field type="checkbox" name="transport" value="car" label="Car" />
    <Field type="checkbox" name="transport" value="bicycle" label="Bicycle" />
    <Field widget="select" multiple name="cars" label="Cars">
      <option value="ford">Ford</option>
      <option value="mazda">Mazda</option>
      <option value="audi">Audi</option>   
    </Field>
  </fieldset>
  <Field type="checkbox" name="agree" label="Agree" />
  <Field widget={null} name="nonFieldErrors" />
  <button hoth={isSubmitEnabled}>Submit</button>
</Form>
```

Structure of a field
--------------------
  
For single values:
  - initialValue
  - value
  - dirty (true/false)
  - active (true/false)
  - errors ([] or null)
  - checked (true/false) - for radio and checkboxes

For multiple values:
  - fields
    - subField1
      - checked (true/false)
    - subField2
    - subField3
  - initialValue ([])
  - value ([])
  - dirty
  - active
  - errors

Single vs Multiple value
------------------------

**Single** can be: `text`-like inputs, `<textarea>`, `checkbox` with `true`/`false` logic.

**Multiple** are: `radio` inputs, `checkboxes` with multi-selection logic, `<select>` elements.

Structure of a form state
-------------------------

  - reset - call this function to reset form fields (see example in demo)
  - errors (true/false) - auto-calculation based only on `errors` prop of each field
  - fields
    - myField1
    - myField2
    - nonFieldErrors

Get form state
--------------

In a component inside your form you can obtain current form state by specifying a function under the `hoth` prop. On render this function will be called and its result will be injected into a component as props.

Accessing deep-level components
-------------------------------

On render, `Form` looks only for its direct children. If your form has a complex html layout you can specify a class for a parent container, that will tell `Form` to also look inside this container's children. That behavior is recursive. By default, value of a class is `group`.

Config object
-------------

```javascript
import {config} from 'hoth-form'

config.nonFieldErrorsKey = 'whatever';   // but should not collide with other fields
config.fieldGroupClassName = /myGroup/;  // or any other regex
```

Field component
---------------

Supports `label` prop. Renders `errors` and `moreErrors` together as a list. Sets `dirty`/`pristine` and `valid`/`invalid` classes.

Custom props that will be filtered out
--------------------------------------

 ['initialValue',
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
 ]

License
-------

ISC

[demo]: http://saintcrawler.github.io