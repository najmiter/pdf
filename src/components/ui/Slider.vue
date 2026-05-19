<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label v-if="label" :for="id" class="text-sm font-medium text-foreground">
        {{ label }}
      </label>
      <span v-if="showValue" class="text-sm text-muted-foreground">
        {{ displayValue }}
      </span>
    </div>
    <div class="relative">
      <input
        :id="id"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        @input="handleInput"
        :class="cn('w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer', 'range-slider')" />
      <div
        class="absolute top-2.5 left-0 z-0 h-2 bg-primary rounded-lg pointer-events-none"
        :style="{ width: `${((modelValue - min) / (max - min)) * 100}%` }"></div>
    </div>
    <div v-if="description" class="text-xs text-muted-foreground">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

interface Props {
  id?: string;
  label?: string;
  description?: string;
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  showValue: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const displayValue = computed(() => {
  if (props.valueFormatter) {
    return props.valueFormatter(props.modelValue);
  }
  return props.modelValue.toString();
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', Number(target.value));
};
</script>

<style scoped>
.range-slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: oklch(81.329% 0.12994 60.273);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid rgb(113, 113, 113);
  z-index: 5;
  position: relative;
}

.range-slider::-moz-range-thumb {
  height: 10px;
  width: 20px;
  border-radius: 50%;
  background: hsl(var(--primary));
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
}

.range-slider::-webkit-slider-track {
  background: transparent;
}

.range-slider::-moz-range-track {
  background: transparent;
}
</style>
