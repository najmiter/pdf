<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
        <div class="bg-background/95 border rounded-lg p-8 shadow-2xl max-w-md w-full mx-4">
          <div class="flex flex-col items-center space-y-4">
            <!-- Loading Spinner -->
            <div class="relative">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
              <div
                class="absolute inset-0 rounded-full border-4 border-transparent border-t-primary/40 animate-spin"
                style="animation-duration: 0.8s; animation-direction: reverse"></div>
            </div>

            <!-- Title -->
            <div class="text-center">
              <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
              <p class="text-sm text-muted-foreground mt-1">{{ message }}</p>
            </div>

            <!-- Progress Bar (if progress is provided) -->
            <div v-if="progress !== null" class="w-full space-y-2">
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>{{ currentStep }}</span>
                <span>{{ Math.round(progress) }}%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  :style="{ width: `${progress}%` }"></div>
              </div>
            </div>

            <!-- Cancel Button (if cancellable) -->
            <Button v-if="cancellable" @click="$emit('cancel')" variant="outline" size="sm" class="mt-4">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import Button from './ui/Button.vue';

interface Props {
  isVisible: boolean;
  title: string;
  message: string;
  progress?: number | null;
  currentStep?: string;
  cancellable?: boolean;
}

withDefaults(defineProps<Props>(), {
  progress: null,
  currentStep: '',
  cancellable: false,
});

defineEmits<{
  cancel: [];
}>();
</script>
