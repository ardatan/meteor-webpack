import writeText from './text';
import { Meteor } from 'meteor/meteor';
Meteor.startup(() => {
    import('./lazy-alert');
    writeText();
    module.hot.accept('./text', () => writeText());
})
