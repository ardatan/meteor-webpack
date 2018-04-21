import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { switchMap } from 'rxjs/operators';
import { Todo } from '../../imports/todo';

import { MeteorObservable } from 'meteor-rxjs';
import { Todos } from '../../imports/todos';

@Component({
    selector: 'app',
    templateUrl: './app.html'
})
export class AppComponent implements OnInit {
    newTodoValue: string;
    todos: Observable<Todo[]>;
    greeting: Observable<string>;
    ngOnInit() {
        this.todos = MeteorObservable.subscribe('todos').pipe(switchMap(() => Todos.find()));
        this.greeting = MeteorObservable.call('greeting');
    }
    addTodo(todoValue) {
        Meteor.call('addTodo', todoValue);
    }
    removeTodo(todoId) {
        Meteor.call('removeTodo', todoId);
    }
}