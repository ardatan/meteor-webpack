import { MongoObservable } from 'meteor-rxjs/dist/ObservableCollection';
import { Todo } from './todo';

export const Todos = new MongoObservable.Collection<Todo>('todos');