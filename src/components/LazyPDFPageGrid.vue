<template>
  <div class="flex flex-wrap gap-4" ref="containerRef">
    <PDFPagePreview
      v-for="page in visiblePages"
      :key="`${fileId}-${page.pageNumber}`"
      :pageNumber="page.pageNumber"
      :fileName="fileName"
      :pdfUrl="pdfUrl"
      :isSelected="page.isSelected"
      @select="() => $emit('select', page.pageNumber)" />

    <!-- Sentinel element to trigger loading more pages -->
    <div v-if="hasMorePages && totalPages > 50" ref="sentinelRef" class="w-full h-10" aria-hidden="true"></div>

    <!-- Loading indicator for large PDFs -->
    <div v-if="isLoadingMore && totalPages > 50" class="flex items-center justify-center w-full py-8">
      <div class="flex flex-col items-center space-y-2">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <span class="text-sm text-muted-foreground">Loading more pages...</span>
      </div>
    </div>

    <!-- Memory limit reached message -->
    <div
      v-if="visiblePages.length >= maxRenderedPages && hasMorePages"
      class="flex items-center justify-center w-full py-8">
      <div class="flex flex-col items-center space-y-2 text-muted-foreground">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm text-center px-4"
          >Memory limit reached. Only first {{ maxRenderedPages }} pages shown.</span
        >
        <span class="text-xs text-center px-4">Scroll up to view loaded pages.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import PDFPagePreview from './PDFPagePreview.vue';

interface PageInfo {
  pageNumber: number;
  isSelected: boolean;
}

interface Props {
  fileId: string;
  fileName: string;
  pdfUrl: string;
  totalPages: number;
  selectedPages: Set<number>;
  getGlobalPageIndex: (fileId: string, pageNumber: number) => number;
}

const props = defineProps<Props>();

defineEmits<{
  select: [pageNumber: number];
}>();

const containerRef = ref<HTMLElement>();
const sentinelRef = ref<HTMLElement>();
const visiblePages = ref<PageInfo[]>([]);
const batchSize = 20;
const maxRenderedPages = 100;
const loadedBatches = ref<Set<number>>(new Set());
const isLoadingMore = ref(false);
let scrollTimeout: number | null = null;
let intersectionObserver: IntersectionObserver | null = null;

const hasMorePages = computed(() => {
  const totalBatches = Math.ceil(props.totalPages / batchSize);
  const reachedMaxRendered = visiblePages.value.length >= maxRenderedPages;
  return loadedBatches.value.size < totalBatches && !reachedMaxRendered;
});

const loadNextBatch = () => {
  if (!hasMorePages.value || isLoadingMore.value) return;

  const nextBatchIndex = loadedBatches.value.size;
  loadBatch(nextBatchIndex);
};

const setupIntersectionObserver = () => {
  if (!sentinelRef.value) return;

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadNextBatch();
        }
      });
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    }
  );

  intersectionObserver.observe(sentinelRef.value);
};

const loadBatch = async (batchIndex: number) => {
  if (loadedBatches.value.has(batchIndex)) return;

  if (visiblePages.value.length >= maxRenderedPages) {
    return;
  }

  if (loadedBatches.value.size > 0) {
    isLoadingMore.value = true;
  }

  const startPage = batchIndex * batchSize + 1;
  const endPage = Math.min(props.totalPages, (batchIndex + 1) * batchSize);
  const remainingCapacity = maxRenderedPages - visiblePages.value.length;
  const actualEndPage = Math.min(endPage, startPage + remainingCapacity - 1);

  const newPages: PageInfo[] = [];
  for (let pageNum = startPage; pageNum <= actualEndPage; pageNum++) {
    const globalIndex = props.getGlobalPageIndex(props.fileId, pageNum);
    newPages.push({
      pageNumber: pageNum,
      isSelected: props.selectedPages.has(globalIndex),
    });
  }

  const existingPageNumbers = new Set(visiblePages.value.map((p) => p.pageNumber));
  const uniqueNewPages = newPages.filter((p) => !existingPageNumbers.has(p.pageNumber));

  visiblePages.value = [...visiblePages.value, ...uniqueNewPages].sort((a, b) => a.pageNumber - b.pageNumber);
  loadedBatches.value.add(batchIndex);

  if (isLoadingMore.value) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    isLoadingMore.value = false;
  }
};

onMounted(() => {
  if (props.totalPages <= 50) {
    for (let batch = 0; batch < Math.ceil(props.totalPages / batchSize); batch++) {
      loadBatch(batch);
    }
  } else {
    loadBatch(0);

    nextTick(() => {
      setupIntersectionObserver();
    });
  }
});

onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});

watch(
  () => props.selectedPages,
  () => {
    visiblePages.value.forEach((page) => {
      const globalIndex = props.getGlobalPageIndex(props.fileId, page.pageNumber);
      page.isSelected = props.selectedPages.has(globalIndex);
    });
  },
  { deep: true }
);
</script>
