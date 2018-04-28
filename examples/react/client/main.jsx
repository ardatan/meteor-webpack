import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';

import App from './ui/App';
import './main.css'

Meteor.startup(() => {
  render(
    <App />,
    document.getElementById('render-target')
  );
});
