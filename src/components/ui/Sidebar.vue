<template>
  <div 
    :class="cn(
      'h-full border-l bg-background transition-all duration-300 ease-in-out',
      isOpen ? 'w-96' : 'w-0 overflow-hidden',
      props.class
    )"
  >
    <div class="h-full overflow-auto">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {})
</script>
