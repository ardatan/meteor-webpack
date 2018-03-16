import { Meteor } from 'meteor/meteor';
import { Todos } from '../imports/todos';

Meteor.methods({
    removeTodo(todoId) {
        Todos.remove({
            _id: todoId
        });
    }
})