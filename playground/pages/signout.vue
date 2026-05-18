<script setup lang="ts">
import { definePageMeta, navigateTo } from '#imports'

definePageMeta({ auth: false })

setTimeout(() => navigateTo('/'), 5000)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 text-center">
    <p class="text-xl text-gray-600 mb-2">You have been signed out.</p>
    <p class="text-sm text-gray-400">Redirecting in 5 seconds...</p>
  </div>
</template>
