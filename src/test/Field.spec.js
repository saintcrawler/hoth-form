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

  it('injects all props to the `widget` element', function() {
    expect(shallow(<Field id="name" className="myName" value="john" label="User" />).find('input').props()).to.eql({
      id: 'name',
      className: 'myName',
      value: 'john',
      label: 'User',
      children: undefined
    });
  });
});