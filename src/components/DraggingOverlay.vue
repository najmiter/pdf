<template>
  <Transition aria-busy="true" name="drag-overlay">
    <div
      v-if="isVisible"
      aria-busy="true"
      class="fixed pointer-events-none inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/40 via-primary/60 dark:via-primary/20 to-secondary/10 backdrop-blur-2xl">
      <div class="flex flex-col items-center justify-center space-y-6 min-w-120 max-w-screen w-1/2 h-1/2">
        <div class="relative">
          <div class="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
          <div class="relative rounded-full bg-black/10 p-6">
            <Icon :icon="icon" class="h-16 w-16 text-white animate-bounce" />
          </div>
        </div>

        <div class="text-center space-y-2">
          <h3 class="text-xl font-semibold text-white">{{ title }}</h3>
          <p class="text-white/80 text-base">{{ subtitle }}</p>
        </div>

        <div class="flex items-center space-x-2 text-white/80 text-sm">
          <Icon icon="lucide:file-text" class="h-4 w-4" />
          <span>Supports PDF files only</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface Props {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  title: 'Drop files here',
  subtitle: 'Release to upload your PDF files',
  icon: 'lucide:upload-cloud',
});
</script>

<style scoped>
.drag-overlay-enter-active,
.drag-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.drag-overlay-enter-from,
.drag-overlay-leave-to {
  opacity: 0;
}

.drag-overlay-enter-to,
.drag-overlay-leave-from {
  opacity: 1;
}
</style>
