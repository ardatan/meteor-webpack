import {
  Meteor
} from 'meteor/meteor';
import {
  Messages
} from '../imports/collections';

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
  addMessage(message) {
    Messages.insert({
      message,
      date: new Date(),
    });
  },
  removeMessage(_id) {
    Messages.remove(_id);
  },
});


Meteor.publish('messages', function () {
  return Messages.find();
});