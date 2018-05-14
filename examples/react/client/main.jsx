import React from 'react';
import { render } from 'react-dom';

import App from './ui/App';
import './main.css'
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  render(
    <App />,
    document.getElementById('render-target')
  );
});
