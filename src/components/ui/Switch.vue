<template>
  <div class="flex items-center space-x-2">
    <button
      :id="id"
      role="switch"
      type="button"
      :aria-checked="modelValue"
      :disabled="disabled"
      @click="toggle"
      :class="
        cn(
          'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          modelValue ? 'bg-primary' : 'bg-muted'
        )
      ">
      <span
        :class="
          cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-background ring-0 transition-transform',
            modelValue ? 'translate-x-5' : 'translate-x-0'
          )
        " />
    </button>
    <label
      v-if="label"
      :for="id"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {{ label }}
    </label>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';

interface Props {
  id?: string;
  label?: string;
  modelValue: boolean;
  disabled?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
};
</script>
