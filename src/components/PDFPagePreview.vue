<template>
  <Card
    :class="
      cn(
        'relative cursor-pointer transition-all duration-200 hover:shadow-md border-2',
        isSelected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50',
        props.class
      )
    "
    @click="$emit('select')">
    <div class="aspect-[3/4] bg-white rounded-t-lg overflow-hidden relative">
      <!-- Page Number Badge -->
      <div class="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded z-10">
        {{ pageNumber }}
      </div>

      <!-- PDF Page Preview -->
      <div class="w-full h-full flex items-center justify-center">
        <canvas ref="canvasRef" class="max-w-full max-h-full object-contain" />
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>

      <!-- Selection Overlay -->
      <div v-if="isSelected" class="absolute inset-0 bg-primary/10 border-2 border-primary rounded-t-lg" />
    </div>

    <!-- Page Info -->
    <div class="p-3 space-y-1">
      <div class="text-sm font-medium text-foreground">Page {{ pageNumber }}</div>
      <div class="text-xs text-muted-foreground">
        {{ fileName }}
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card.vue';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface Props {
  pageNumber: number;
  fileName: string;
  pdfDocument: any;
  isSelected?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
});

defineEmits<{
  select: [];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const isLoading = ref(true);

const renderPage = async () => {
  if (!canvasRef.value || !props.pdfDocument) return;

  try {
    const page = await props.pdfDocument.getPage(props.pageNumber);
    const viewport = page.getViewport({ scale: 0.5 });

    const canvas = canvasRef.value;
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    isLoading.value = false;
  } catch (error) {
    console.error('Error rendering PDF page:', error);
    isLoading.value = false;
  }
};

onMounted(() => {
  renderPage();
});
</script>
