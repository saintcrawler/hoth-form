import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'

const Field = React.createClass({
  mixins: [PureRenderMixin],

  makeErrorsList: function(errors) {
    if (errors.length > 0) {
      return (
        <ul className="errors">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )
    } else {
      return null;
    }
  },

  showErrors(props) {
    const {errOnDirty, dirty} = props;
    return !errOnDirty || dirty;
  },

  labeledWidget: function(props) {
    const {label, widget = 'input', children} = props;
    if (label) {
      return <label>{label}{widget && React.createElement(widget, props, children)}</label>
    } else {
      return widget && React.createElement(widget, props, children)
    }
  },

  render: function() {
    let {label, widget, errors, moreErrors, children} = this.props;
    if (widget === 'select') {
      children = React.Children.map(children, el => 
        React.cloneElement(el, this.props.fields[el.props.value])
      );
    }
    return (
      <div className="form-group">
        {this.labeledWidget(this.props)}
        {this.showErrors(this.props) && this.makeErrorsList([].concat(errors, moreErrors).filter(i => i))}
      </div>
    )
  }
});

export default Field