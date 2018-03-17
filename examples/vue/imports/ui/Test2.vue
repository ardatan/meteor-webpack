<template>
<div class="test">
  <h2>{{ message }}</h2>
  <input v-model="message" />
</div>
</template>

<script>
export default {
  data: () => ({
    message: 'hello world',
  }),
}
</script>
