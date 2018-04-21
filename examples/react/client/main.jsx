import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';

import App from './ui/App';

Meteor.startup(() => {
  render(<App />, document.getElementById('render-target'));
});

if(module.hot){
  module.hot.accept();
}