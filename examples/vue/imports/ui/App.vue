<template>
<div class="app">
  <h1>Simple Meteor example using Vue 2.x</h1>
  <div v-blaze="'loginButtons'"></div>
  <p v-if="user">
    You are logged in as <b>{{ user.username }}</b>.
  </p>
  <p>
    You pressed the button {{count}} time(s).
  </p>
  <my-button :label="buttonLabel" @click="addOne"></my-button>
  <p>
    Learn more about the vue integration <a href="https://github.com/Akryum/meteor-vue-component">on GitHub</a>.
  </p>
  <test></test>
  <test2></test2>
  <chat></chat>
</div>
</template>

<script>
import Chat from './Chat.vue';
import MyButton from './MyButton.vue';
import Test from './Test.vue';
import Test2 from './Test2.vue';

import {Session} from 'meteor/session';

Session.setDefault("counter", 0);

let labels = ['Click me!', 'Click me again!', 'Here! Click here!', 'Again! Again!',
'Don\'t click me! No, I\'m just kidding. You can.', 'You like that?',
'Can you stratch me in the back please?', 'You are soooo nice! Click!',
'Hmmmm...', 'You know, you are wasting time clicking me.',
'No really, you can click me as much as you want.', 'Click me to level up!'];

export default {
  data() {
    return {
      buttonLabel: 'Click me!',
      count: 0,
      user: null,
    }
  },
  meteor: {
    data: {
      count () {
        return Session.get('counter');
      },
      user () {
        return Meteor.user()
      },
    }
  },
  methods: {
    addOne() {
      Session.set('counter', this.count + 1);
      this.buttonLabel = labels[Math.round(Math.random()*(labels.length - 1))];
    }
  },
  components: {
    Chat,
    MyButton,
    Test,
    Test2
  },
  metaInfo: {
    title: 'Meteor + Vue',
  },
};
</script>

<style>
body {
  margin: 30px;
}

a {
  color: #40b883;
  text-decoration: none;
}

h1, h2 {
  font-weight: normal;
}
</style>
