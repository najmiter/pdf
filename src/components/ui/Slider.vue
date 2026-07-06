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
    <div class="relative flex h-5 items-center">
      <div class="absolute inset-x-0 h-1.5 rounded-full bg-muted" />
      <div
        class="absolute left-0 z-0 h-1.5 rounded-full bg-gradient-to-r from-primary/70 to-primary pointer-events-none"
        :style="{ width: `${((modelValue - min) / (max - min)) * 100}%` }"></div>
      <input
        :id="id"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        @input="handleInput"
        :class="cn('relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent', 'range-slider')" />
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
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: var(--card);
  cursor: pointer;
  border: 2px solid var(--primary);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  transition: transform 0.15s ease;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.12);
}

.range-slider::-moz-range-thumb {
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: var(--card);
  cursor: pointer;
  border: 2px solid var(--primary);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  transition: transform 0.15s ease;
}

.range-slider::-moz-range-thumb:hover {
  transform: scale(1.12);
}

.range-slider::-webkit-slider-track {
  background: transparent;
}

.range-slider::-moz-range-track {
  background: transparent;
}
</style>
