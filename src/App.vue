<template>
  <header>
  <div class="top-nav">
    <span v-if="statusStore.error" class="error">
      {{ statusStore.error }}
    </span>
    <span v-if="statusStore.saveStatus" class="save-status">
      {{ statusStore.saveStatus }}
    </span>
    <span v-if="statusStore.activeTool" class="active-tool">
      {{ statusStore.activeTool }}
    </span>
  </div>
  </header>

  <div class="page">
    <RouterView />
  </div>
</template>


<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useStatusStore } from '@/stores/status'

const statusStore = useStatusStore()


</script>

<style scoped>

div.page {
/*  padding: 20px;*/
}

div.top-nav {
  text-align: center;
  min-height: 5vh;
  height: 5vh;
/*  background-color: dimgray;*/
}

.error {
  background-color: red;
  color: white;
  padding: 0.2rem 0.5rem;
}

.save-status, .active-tool {
  margin-left: 1rem;
  font-size: 0.9em;
  color: #666;
}

</style>
