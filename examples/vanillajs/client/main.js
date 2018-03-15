import { Meteor } from 'meteor/meteor';
import { dynamicprint } from './dynamicprint';
Meteor.startup(async () => {
    const { lazyalert } = await import('./lazyalert');
    lazyalert();
    dynamicprint();
    module.hot.accept('./dynamicprint', () => {
        dynamicprint();
    })
})