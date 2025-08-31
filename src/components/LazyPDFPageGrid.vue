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
const batchSize = 20; // Load 20 pages at a time
const loadedBatches = ref<Set<number>>(new Set());
const isLoadingMore = ref(false);
let scrollTimeout: number | null = null;
let intersectionObserver: IntersectionObserver | null = null;

const hasMorePages = computed(() => {
  const totalBatches = Math.ceil(props.totalPages / batchSize);
  return loadedBatches.value.size < totalBatches;
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
      root: null, // viewport
      rootMargin: '100px', // start loading 100px before the sentinel comes into view
      threshold: 0.1,
    }
  );

  intersectionObserver.observe(sentinelRef.value);
};

const loadBatch = async (batchIndex: number) => {
  if (loadedBatches.value.has(batchIndex)) return;

  // only show loading for subsequent batches, not the initial load
  if (loadedBatches.value.size > 0) {
    isLoadingMore.value = true;
  }

  const startPage = batchIndex * batchSize + 1;
  const endPage = Math.min(props.totalPages, (batchIndex + 1) * batchSize);

  const newPages: PageInfo[] = [];
  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    const globalIndex = props.getGlobalPageIndex(props.fileId, pageNum);
    newPages.push({
      pageNumber: pageNum,
      isSelected: props.selectedPages.has(globalIndex),
    });
  }

  // merge with existing visible pages
  const existingPageNumbers = new Set(visiblePages.value.map((p) => p.pageNumber));
  const uniqueNewPages = newPages.filter((p) => !existingPageNumbers.has(p.pageNumber));

  visiblePages.value = [...visiblePages.value, ...uniqueNewPages].sort((a, b) => a.pageNumber - b.pageNumber);
  loadedBatches.value.add(batchIndex);

  // small delay to ensure loading indicator is visible
  if (isLoadingMore.value) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    isLoadingMore.value = false;
  }
};

onMounted(() => {
  // for small PDFs, load all pages immediately
  if (props.totalPages <= 50) {
    for (let batch = 0; batch < Math.ceil(props.totalPages / batchSize); batch++) {
      loadBatch(batch);
    }
  } else {
    // for large PDFs, load first batch and set up intersection observer
    loadBatch(0);

    // use IntersectionObserver for more reliable detection
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
