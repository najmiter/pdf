<template>
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur">
    <div class="w-full">
      <div class="flex flex-col items-center space-y-4">
        <!-- Loading Spinner -->
        <div class="relative">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#8b5424] border-t-[#FFAD66]"></div>
        </div>

        <!-- Title -->
        <div class="text-center text-white pointer-events-none select-none">
          <h3 class="text-lg font-semibold">{{ props.title }}</h3>
          <p class="text-sm mt-1">{{ props.message }}</p>
        </div>

        <!-- Progress Bar (if progress is provided) -->
        <div v-if="props.progress !== null" class="w-full space-y-2">
          <div class="flex justify-between text-xs text-gray-500">
            <span>{{ props.currentStep }}</span>
            <span>{{ Math.round(props.progress) }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
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

console.log('LoadingOverlay props:', props);

defineEmits<{
  cancel: [];
}>();
</script>
