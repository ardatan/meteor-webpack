import {
    Meteor
} from 'meteor/meteor';
import {
    dynamicprint
} from './dynamicprint';
Meteor.startup(async () => {
    const {
        lazyprint
    } = await
    import ('./lazyprint');
    lazyprint();
    dynamicprint();
    module.hot.accept('./dynamicprint', () => {
        dynamicprint();
    })
})