<template>
  <div :class="cn('rounded-xl border border-border bg-card text-card-foreground', props.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';

interface Props {
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {});
</script>
