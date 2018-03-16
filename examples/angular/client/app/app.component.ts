import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Todo } from '../../imports/todo';

import { MeteorObservable } from 'meteor-rxjs/dist/MeteorObservable';
import { Todos } from '../../imports/todos';

@Component({
    selector: 'app',
    template: `
        <h1>Hello World</h1>
        <form>
            <input name="todo" [(ngModel)]="newTodoValue">
            <input type="submit" (click)="addTodo(newTodoValue)">
        </form>
        <ul>
            <li *ngFor="let todo of todos | async">
                {{todo.value}}
                <button (click)="removeTodo(todo._id)">
                    Remove
                </button>
            </li>
        </ul>
    `
})
export class AppComponent implements OnInit {
    newTodoValue: string;
    todos: Observable<Todo[]>;
    ngOnInit() {
        this.todos = MeteorObservable.subscribe('todos').switchMap(() => Todos.find());
    }
    addTodo(todoValue) {
        Meteor.call('addTodo', todoValue);
    }
    removeTodo(todoId) {
        Meteor.call('removeTodo', todoId);
    }
}