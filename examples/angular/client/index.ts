import 'zone.js';
import { Meteor } from 'meteor/meteor';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

Meteor.startup(() => {
    platformBrowserDynamic().bootstrapModule(AppModule);
});