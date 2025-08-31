<template>
  <Card
    :class="
      cn(
        'relative cursor-pointer bg-transparent transition-all duration-200 min-w-60 group overflow-hidden hover:bg-foreground/5',
        { 'bg-foreground/5': isSelected },
        props.class
      )
    "
    @click="$emit('select')">
    <div class="aspect-[3/4] rounded-t-lg overflow-hidden relative">
      <!-- Page Number Badge -->
      <div
        class="absolute top-2 left-2 bg-foreground/30 text-white text-xs font-medium px-2 py-1 rounded-md z-10 shadow-sm">
        {{ pageNumber }}
      </div>

      <!-- Selection Indicator -->
      <div
        v-if="isSelected"
        class="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full z-10 shadow-sm flex items-center justify-center">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd" />
        </svg>
      </div>

      <!-- PDF Page Preview -->
      <div class="w-full h-full flex items-center justify-center p-2">
        <VPdf
          :source="pdfUrl"
          :page="pageNumber"
          :scale="5.5"
          :width="200"
          class="rounded shadow-sm"
          @rendering="isLoading = true"
          @rendered="isLoading = false"
          @error="hasError = true" />

        <!-- Loading State -->
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/90 rounded">
          <div class="flex flex-col items-center space-y-2">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <span class="text-xs text-muted-foreground">Loading...</span>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="hasError" class="absolute inset-0 flex items-center justify-center bg-red-50/90 rounded">
          <div class="flex flex-col items-center space-y-2 text-red-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span class="text-xs text-center px-2">Failed to load page</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Page Info -->
    <div class="p-3 space-y-1 border border-t">
      <div class="text-sm font-medium text-foreground truncate" :title="`Page ${pageNumber}`">
        Page {{ pageNumber }}
      </div>
      <div class="text-xs text-muted-foreground truncate" :title="fileName">
        {{ fileName }}
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card.vue';
import VPdf from 'vue-pdf-embed';

interface Props {
  pageNumber: number;
  fileName: string;
  pdfUrl: string;
  isSelected?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
});

defineEmits<{
  select: [];
}>();

const isLoading = ref(true);
const hasError = ref(false);

// Watch for changes in pdfUrl or pageNumber
watch(
  () => [props.pdfUrl, props.pageNumber],
  () => {
    isLoading.value = true;
    hasError.value = false;
  },
  { immediate: true }
);
</script>
