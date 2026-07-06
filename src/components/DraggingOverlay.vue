<template>
  <Transition aria-busy="true" name="drag-overlay">
    <div
      v-if="isVisible"
      aria-busy="true"
      class="fixed pointer-events-none inset-0 z-50 m-4 flex items-center justify-center rounded-3xl border-2 border-dashed border-primary bg-background/85 shadow-[inset_0_0_120px_color-mix(in_oklch,var(--primary)_12%,transparent)] backdrop-blur-md">
      <div class="flex flex-col items-center justify-center space-y-6">
        <div class="relative">
          <div class="absolute inset-0 rounded-2xl bg-primary/30 blur-2xl" />
          <div
            class="relative grid h-24 w-24 place-content-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 ring-1 ring-primary/40">
            <Icon :icon="icon" class="h-12 w-12 text-primary" />
          </div>
        </div>

        <div class="space-y-1.5 text-center">
          <h3 class="text-2xl font-bold tracking-tight">{{ title }}</h3>
          <p class="text-base text-muted-foreground">{{ subtitle }}</p>
        </div>

        <div
          class="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Icon icon="lucide:file-text" class="h-3.5 w-3.5 text-primary" />
          <span>PDF files only</span>
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
