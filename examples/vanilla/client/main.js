import {
    Meteor
} from 'meteor/meteor';
import {
    dynamicprint
} from './dynamicprint';
import {
    renderTodos
} from './todo-list-renderer';
Meteor.startup(async () => {
    const {
        lazyprint
    } = await
    import ('./lazyprint');
    lazyprint();
    dynamicprint();
    module.hot.accept('./dynamicprint', dynamicprint);
    renderTodos();
    module.hot.accept('./todo-list-renderer', renderTodos);
})