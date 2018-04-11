import 'zone.js/dist/zone';
import { Meteor } from 'meteor/meteor';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { enableProdMode } from '@angular/core';

Meteor.startup(() => {
    if(Meteor.isProduction){
        enableProdMode();
    }
    platformBrowserDynamic().bootstrapModule(AppModule);
});