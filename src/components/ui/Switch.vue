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
          'peer inline-flex h-5.5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          modelValue ? 'bg-primary' : 'bg-muted-foreground/25'
        )
      ">
      <span
        :class="
          cn(
            'pointer-events-none block h-4.5 w-4.5 rounded-full bg-card shadow-sm ring-0 transition-transform duration-200',
            modelValue ? 'translate-x-[18px]' : 'translate-x-0'
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
