import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'

export const Field = React.createClass({
  mixins: [PureRenderMixin],

  makeErrorsList: function(errors) {
    if (errors) {
      return (
        <ul className="errors">
          {errors.map((e, i) => e && <li key={i}>{e}</li>)}
        </ul>
      )
    } else {
      return null;
    }
  },

  render: function() {
    const {label, widget, errors, moreErrors, children} = this.props;
    if(errors) errors.tolkien =' jaja';
    return (
      <div>
        {label}
        {widget && React.createElement(widget, this.props, children)}
        {this.makeErrorsList([].concat(errors, moreErrors))}
      </div>
    )
  }
});

export default Field