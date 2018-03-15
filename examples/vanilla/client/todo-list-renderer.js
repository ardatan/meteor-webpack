import {
    Meteor
} from 'meteor/meteor';
import {
    Tracker
} from 'meteor/tracker';
import {
    Todos
} from '../imports/todos';

export function renderTodos() {
    Meteor.subscribe('todos');
    Tracker.autorun(() => {
        document.getElementById('todo-list').innerHTML = '';
        const todos = Todos.find().fetch();
        for (const todo of todos) {
            document.getElementById('todo-list').innerHTML += `
                    <li>${todo.value} <button id="remove-todo-button-${todo._id}">Remove</button></li>
                `;
            const removeTodoButton = document.getElementById(`remove-todo-button-${todo._id}`);
            removeTodoButton.addEventListener('click', event => {
                event.preventDefault();
                Meteor.call('removeTodo', todo._id);
            });
        }
    })
    document.getElementById('add-todo-form').addEventListener('submit', event => {
        event.preventDefault();
        const form = event.target;
        const todoValue = form.todo.value;
        Meteor.call('addTodo', todoValue);
    })
}