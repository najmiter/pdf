<template>
  <div
    aria-busy="true"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-md animate-fade-in">
    <div
      class="mx-4 w-full max-w-sm rounded-2xl border border-border/70 bg-card p-8 shadow-xl animate-scale-in">
      <div class="flex flex-col items-center space-y-5">
        <!-- Loading Spinner -->
        <div class="relative grid h-16 w-16 place-content-center">
          <div class="absolute inset-0 rounded-full bg-primary/15 blur-lg" />
          <div class="relative h-12 w-12 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
        </div>

        <!-- Title -->
        <div class="pointer-events-none select-none text-center">
          <h3 class="text-base font-semibold tracking-tight">{{ props.title }}</h3>
          <p class="mt-1 text-sm text-muted-foreground">{{ props.message }}</p>
        </div>

        <!-- Progress Bar (if progress is provided) -->
        <div v-if="props.progress !== null" class="w-full space-y-2">
          <div class="flex justify-between text-xs text-muted-foreground">
            <span class="truncate pr-2">{{ props.currentStep }}</span>
            <span class="font-semibold tabular-nums text-foreground">{{ Math.round(props?.progress ?? 0) }}%</span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-300 ease-out"
              :style="{ width: `${props.progress}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  message: string;
  progress?: number | null;
  currentStep?: string;
  cancellable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  progress: null,
  currentStep: '',
  cancellable: false,
});

defineEmits<{
  cancel: [];
}>();
</script>
