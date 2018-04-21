import { Meteor } from 'meteor/meteor';

Meteor.methods({
    greeting() {
        return 'Hello From Meteor Method!';
    }
})