<template>
  <Card
    role="button"
    :aria-label="`Page ${pageNumber}`"
    :class="
      cn(
        'relative min-w-60 max-w-60 group cursor-pointer overflow-hidden transition-all duration-200',
        isSelected
          ? 'border-primary/60 bg-primary/5 shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_20%,transparent)] ring-2 ring-primary/50'
          : 'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
        props.class
      )
    "
    @click="$emit('select')">
    <div class="aspect-[3/4] rounded-t-lg overflow-hidden relative">
      <!-- Page Number Badge -->
      <div
        class="absolute top-2 left-2 z-10 rounded-md border border-border/70 bg-card/90 px-2 py-0.5 text-xs font-semibold tabular-nums shadow-xs backdrop-blur-sm">
        {{ pageNumber }}
      </div>

      <!-- Selection Indicator -->
      <div
        :class="
          cn(
            'absolute top-2 right-2 z-10 grid h-5.5 w-5.5 place-content-center rounded-full border transition-all duration-200',
            isSelected
              ? 'scale-100 border-primary bg-primary text-primary-foreground shadow-sm'
              : 'scale-90 border-border bg-card/90 opacity-0 backdrop-blur-sm group-hover:opacity-100'
          )
        ">
        <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd" />
        </svg>
      </div>

      <!-- PDF Page Preview -->
      <div class="w-full h-full flex items-center justify-center p-2" @contextmenu.prevent>
        <VPdf
          :source="pdfDoc || pdfUrl"
          :page="pageNumber"
          :scale="0.8"
          :width="220"
          class="rounded-lg max-w-60 max-h-74 overflow-hidden grid place-content-center w-fit border border-border"
          @rendering="isLoading = true"
          @rendered="isLoading = false"
          @error="hasError = true" />

        <!-- Loading State -->
        <div
          v-if="isLoading"
          aria-busy="true"
          class="absolute inset-0 flex items-center justify-center bg-foreground/10 rounded">
          <div class="flex flex-col items-center space-y-2">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            <span class="text-xs text-muted-foreground">Loading...</span>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="hasError"
          class="absolute inset-0 flex items-center justify-center bg-red-50/90 dark:bg-red-300/20 rounded">
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
    <div class="border-t border-border/60 px-3 py-2.5">
      <div class="truncate text-sm font-medium" :title="`Page ${pageNumber}`">Page {{ pageNumber }}</div>
      <div class="mt-0.5 truncate text-xs text-muted-foreground" :title="fileName">
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
  pdfDoc?: any;
  isSelected?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
});

defineEmits<{ select: [] }>();

const isLoading = ref(true);
const hasError = ref(false);

watch(
  () => [props.pdfDoc || props.pdfUrl, props.pageNumber],
  () => {
    isLoading.value = true;
    hasError.value = false;
  },
  { immediate: true }
);
</script>
