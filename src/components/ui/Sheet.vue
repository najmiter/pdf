<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50">
      <!-- Overlay -->
      <div class="fixed inset-0 bg-black/80" @click="onClose" />

      <!-- Sheet -->
      <div
        :class="
          cn(
            'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
            side === 'right' &&
              'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
            side === 'left' &&
              'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
            side === 'top' &&
              'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
            side === 'bottom' &&
              'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            props.class
          )
        "
        :data-state="open ? 'open' : 'closed'">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  side: 'right',
});

const emit = defineEmits<{
  close: [];
}>();

const onClose = () => {
  emit('close');
};
</script>
