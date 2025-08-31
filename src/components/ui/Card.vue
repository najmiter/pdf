<template>
  <div :class="cn('rounded-xl border border-foreground/10 bg-card text-card-foreground shadow', props.class)">
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
