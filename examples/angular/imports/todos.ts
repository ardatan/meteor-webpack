import { MongoObservable } from 'meteor-rxjs';
import { Todo } from './todo';

export const Todos = new MongoObservable.Collection<Todo>('todos');