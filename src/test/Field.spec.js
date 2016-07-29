import React from 'react'
import chai, { expect } from 'chai'
import { shallow } from 'enzyme'
import chaiEnzyme from 'chai-enzyme'

import Field from '../containers/Field'

chai.use(chaiEnzyme());

describe('Field component', function() {
  it('renders `widget` element (if not specified - `input`)', function() {
    expect(shallow(<Field />).find('input')).to.exist;
    expect(shallow(<Field widget="select" />).find('select')).to.exist;
    expect(shallow(<Field widget="textarea" />).find('textarea')).to.exist;
  });

  it('renders `label` element', function() {
    expect(shallow(<Field label="Hello, field!" />).find('label')).to.have.text('Hello, field!');
  });

  it('renders `errors` and `moreErrors`', function() {
    const errors = shallow(<Field errors={['No', 'one']} />).find('.errors li').map(i => i.text());
    expect(errors).to.eql(['No', 'one']);
    
    const moreErrors = shallow(<Field moreErrors={['should', null, 'pass']} />).find('.errors li').map(i => i.text());
    expect(moreErrors).to.eql(['should', 'pass']);
    
    const combined = shallow(<Field errors={['the', undefined]} moreErrors='gates' />).find('.errors li').map(i => i.text());
    expect(combined).to.eql(['the', 'gates']);

    expect(shallow(<Field />).find('.errors')).to.not.exist;
  });

  it('doesn`t render errors if `errOnDirty` is true, field is not dirty and has errors', function() {
    expect(shallow(<Field errOnDirty dirty={true} errors={['No', 'one']} />).find('.errors')).to.exist;
    expect(shallow(<Field errOnDirty dirty={false} errors={['No', 'one']} />).find('.errors')).to.not.exist;
  });

  it('injects all props to the `widget` element if it is custom React component', function() {
    function MyCustom(props) {
      return <div>custom</div>
    }
    expect(shallow(<Field widget={MyCustom} id="name" className="myName" value="john" label="User" />)
      .find('MyCustom')
      .props())
      .to.eql({
        id: 'name',
        value: 'john',
        className: 'myName pristine valid',
        label: 'User',
        widget: MyCustom,
        children: undefined
      });
  });

  it('injects filtered props to the `widget` element if it is plain old form element', function() {
    const injectedProps = {
      id: 'name',
      className: 'myName',
      value: 'john',
      label: 'User',
      hoth: 'test',
      extra: 'test'
    };
    const expectedProps = {
      id: 'name',
      value: 'john',
      className: 'myName pristine valid',
      children: undefined,
    };
    function testFiltering(widget) {
      expect(shallow(<Field widget={widget} {...injectedProps} />)
        .find(widget)
        .props())
        .to.eql(expectedProps);
    }

    testFiltering('input');
    testFiltering('select');
    testFiltering('button');
    testFiltering('textarea');
  });

  it('appends current className with `dirty/pristine` based on `dirty` prop', function() {
    expect(shallow(<Field dirty={true} />)
      .find('input'))
      .to.have.prop('className', ' dirty valid');

    expect(shallow(<Field dirty={false} />)
      .find('input'))
      .to.have.prop('className', ' pristine valid');
  });

  it('appends current className with `valid/invalid` based on `errors` and `moreErors` props', function() {
    expect(shallow(<Field errors={true} />)
      .find('input'))
      .to.have.prop('className', ' pristine invalid');

    expect(shallow(<Field moreErrors={true} />)
      .find('input'))
      .to.have.prop('className', ' pristine invalid');

    expect(shallow(<Field />)
      .find('input'))
      .to.have.prop('className', ' pristine valid');
  });

  it('does not set `value` prop if `type == file`', function() {
    expect(shallow(<Field type="file" value="somefile" />)
      .find('input'))
      .to.not.have.prop('value', 'somefile');

    expect(shallow(<Field type="file" value="" />)
      .find('input'))
      .to.not.have.prop('value', '');
  });

  it('render children with `fields` prop', function() {
    const fields = {
      red: {id: 'red'},
      green: {id: 'green', disabled: true},
      blue: {}
    }
    const f = shallow(
      <Field fields={fields}>
        <option value="red" />
        <option value="green" />
        <option value="blue" />
      </Field>
    );
    expect(f.find('#red')).to.exist;
    expect(f.find('#green')).to.have.prop('disabled', true);
  });
});