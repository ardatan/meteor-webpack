import {
    Meteor
} from 'meteor/meteor';
import {
    Todos
} from '../imports/todos';

Meteor.publish('todos', function () {
    return Todos.find();
})