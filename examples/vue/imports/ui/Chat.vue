<template>
  <div class="chat">
    <h2>Chat</h2>

    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Enter new message" />

    <div v-if="!$subReady.messages">
      Loading...
    </div>

    <div class="message" v-for="msg in messages">
      <span class="content">{{ msg.message }}</span>
      <button @click="removeMessage(msg._id)">x</button>
    </div>
  </div>
</template>

<script>
import { Messages } from '../../imports/collections';
const test = {
  meteor: {
    subscribe: {
      'messages': [],
    },
    messages() {
      return Messages.find({}, {
        sort: { date: -1 },
      });
    },
  },
}

export default {
  name: 'chat',
  mixins: [test],
  data () {
    return {
      newMessage: '',
      messages: [],
    }
  },
  meteor: {
    messages() {
      return Messages.find({}, {
        sort: { date: 1 },
      });
    },
  },
  methods: {
    sendMessage() {
      Meteor.call('addMessage', this.newMessage);
      this.newMessage = '';
    },
    removeMessage(_id) {
      Meteor.call('removeMessage', _id);
    },
  },
};
</script>

<style scoped>
.chat {
  max-width: 300px;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 12px;
  border: solid 1px #ccc;
  border-radius: 3px;
  margin-bottom: 4px;
}

.message {
  margin: 4px 2px;
  display: flex;
  flex-direction: row;
}

.message .content {
  flex: auto 1 1;
}
</style>
