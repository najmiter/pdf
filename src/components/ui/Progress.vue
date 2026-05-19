<template>
  <div class="relative w-full overflow-hidden rounded-full bg-primary/20">
    <div
      class="h-2 w-full flex-1 bg-primary transition-all"
      :style="{ transform: `translateX(-${100 - (value || 0)}%)` }" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  value?: number;
  class?: string;
}

withDefaults(defineProps<Props>(), {
  value: 0,
});
</script>
