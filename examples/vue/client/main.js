// Libs
import { Meteor } from 'meteor/meteor';
import Vue from 'vue';
import { Accounts } from 'meteor/accounts-base'

import VueTracker from 'vue-meteor-tracker';
import VueMeta from 'vue-meta';
import '../imports/ui/blaze';
import App from '../imports/ui/App.vue';

window.AccountsConfigSet = window.AccountsConfigSet || true;
if(!window.AccountsConfigSet){
  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL',
  })
}


Vue.use(VueTracker);

Vue.use(VueMeta)

// Main app

Meteor.startup(() => {
  new Vue({
    render: h => h(App),
  }).$mount('app');
});
