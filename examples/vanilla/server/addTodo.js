import {
    Meteor
} from 'meteor/meteor';
import {
    Todos
} from '../imports/todos';

Meteor.methods({
    addTodo(todoValue) {
        Todos.insert({
            value: todoValue
        });
    }
})