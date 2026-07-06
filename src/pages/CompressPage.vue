<template>
  <div class="flex h-full">
    <!-- Main Content Area -->
    <main
      class="flex-1 p-6 pt-0 overflow-auto"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop">
      <!-- Step 1: File Upload -->
      <div
        v-if="!selectedFile && !compressionResult"
        class="flex min-h-full flex-col items-center justify-center py-10 pt-0">
        <div class="animate-fade-up mb-8 max-w-xl text-center">
          <h1 class="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Shrink your PDFs
            <span class="text-primary">without the upload</span>
          </h1>
          <p class="mx-auto mt-4 max-w-md text-pretty text-base text-muted-foreground">
            Reduce file size with fine-grained control over quality — all processed on your device.
          </p>
        </div>

        <DropZone :isProcessing="isCompressing" @files-selected="handleFileSelected" class="w-full" />
      </div>

      <!-- Step 2: Compression Settings -->
      <div v-else-if="selectedFile && !compressionResult" class="mx-auto max-w-4xl space-y-6 animate-fade-up">
        <!-- File Info Header -->
        <div class="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex min-w-0 items-center gap-4">
              <div class="grid h-12 w-12 shrink-0 place-content-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
                <Icon icon="lucide:file-text" class="h-6 w-6 text-primary" />
              </div>
              <div class="min-w-0">
                <h3 class="truncate text-base font-semibold">{{ selectedFile.name }}</h3>
                <p class="text-sm text-muted-foreground">
                  {{ formatFileSize(selectedFile.size) }}
                  <span class="mx-1 text-border">•</span>
                  Ready for compression
                </p>
              </div>
            </div>
            <Button variant="soft" size="sm" @click="resetSelection">
              <Icon icon="lucide:repeat" class="h-4 w-4" />
              Change File
            </Button>
          </div>
        </div>

        <!-- Compression Settings -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Settings Panel -->
          <div class="space-y-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
            <div>
              <h2 class="text-base font-semibold tracking-tight">Settings</h2>
              <p class="text-xs text-muted-foreground mt-0.5">Tune how aggressively the file is compressed</p>
            </div>

            <!-- Quick Presets -->
            <div class="space-y-2">
              <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preset</label>
              <div class="grid grid-cols-3 gap-1 rounded-xl border border-border/70 bg-muted/50 p-1">
                <button
                  v-for="preset in ['light', 'medium', 'aggressive'] as const"
                  :key="preset"
                  type="button"
                  :class="[
                    'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200',
                    currentPreset === preset
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border/60'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="applyPreset(preset)">
                  {{ preset }}
                </button>
              </div>
            </div>

            <!-- Quality Slider -->
            <Slider
              v-model="compressionSettings.quality"
              label="Compression Quality"
              description="Higher values preserve more quality but result in larger file sizes"
              :min="0.1"
              :max="1"
              :step="0.05"
              :value-formatter="(value) => `${Math.round(value * 100)}%`" />

            <!-- Advanced Options -->
            <div class="space-y-3 border-t border-border/60 pt-5">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Advanced</h3>

              <Switch
                v-model="compressionSettings.removeMetadata"
                label="Remove metadata (author, creation date, etc.)"
                id="remove-metadata" />

              <Switch
                v-model="compressionSettings.optimizeImages"
                label="Optimize embedded images"
                id="optimize-images" />

              <Switch
                v-model="compressionSettings.removeUnusedObjects"
                label="Remove unused objects"
                id="remove-unused" />

              <Switch v-model="compressionSettings.linearize" label="Linearize for fast web view" id="linearize" />

              <Switch
                v-model="compressionSettings.removeAnnotations"
                label="Remove annotations and comments"
                id="remove-annotations" />

              <Switch v-model="compressionSettings.removeBookmarks" label="Remove bookmarks" id="remove-bookmarks" />
            </div>
          </div>

          <!-- Preview Panel -->
          <div class="space-y-4">
            <div class="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 class="text-base font-semibold tracking-tight">Estimated Result</h2>
              <p class="text-xs text-muted-foreground mt-0.5 mb-5">Rough estimate based on your settings</p>

              <!-- Size Estimation -->
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-muted/60 p-4 text-center">
                  <div class="text-xl font-bold tabular-nums tracking-tight">
                    {{ formatFileSize(selectedFile.size) }}
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">Original</div>
                </div>
                <div class="rounded-xl bg-success/10 p-4 text-center ring-1 ring-success/20">
                  <div class="text-xl font-bold tabular-nums tracking-tight text-success">{{ estimatedSize }}</div>
                  <div class="mt-1 text-xs text-muted-foreground">Estimated</div>
                </div>
              </div>

              <!-- Progress Bar for Estimation -->
              <div class="mt-5">
                <div class="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Estimated reduction</span>
                  <span class="font-semibold tabular-nums text-success">~{{ estimatedReduction }}%</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-300"
                    :style="{ width: `${estimatedReduction}%` }"></div>
                </div>
              </div>
            </div>

            <!-- Compression Quality Warning -->
            <div
              v-if="compressionSettings.quality < 0.7"
              class="rounded-2xl border border-warning/30 bg-warning/10 p-4 animate-fade-in">
              <div class="flex items-start gap-3">
                <Icon icon="lucide:alert-triangle" class="mt-0.5 h-4.5 w-4.5 shrink-0 text-warning" />
                <div>
                  <h4 class="text-sm font-semibold">Aggressive compression</h4>
                  <p class="mt-0.5 text-sm text-muted-foreground">
                    Very low quality settings may noticeably reduce image quality and text clarity.
                  </p>
                </div>
              </div>
            </div>

            <!-- Action -->
            <Button @click="startCompression" :disabled="isCompressing" size="lg" class="w-full font-semibold">
              <Icon v-if="!isCompressing" icon="lucide:zap" class="h-4 w-4" />
              <Icon v-else icon="lucide:loader-2" class="h-4 w-4 animate-spin" />
              {{ isCompressing ? 'Compressing…' : 'Compress PDF' }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Step 3: Results -->
      <div v-else-if="compressionResult" class="mx-auto max-w-xl space-y-6 pt-8 animate-scale-in">
        <!-- Success Header -->
        <div class="space-y-4 text-center">
          <div
            class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/12 ring-1 ring-success/25">
            <Icon icon="lucide:check" class="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 class="text-2xl font-bold tracking-tight">Compression complete</h2>
            <p class="mt-1 text-muted-foreground">Your PDF is ready for download</p>
          </div>
        </div>

        <!-- Results Card -->
        <div class="space-y-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <!-- File Info -->
          <div class="flex items-center gap-4">
            <div class="grid h-11 w-11 shrink-0 place-content-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
              <Icon icon="lucide:file-text" class="h-5.5 w-5.5 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="truncate text-sm font-semibold">{{ compressionResult.filename }}</h3>
              <p class="text-xs text-muted-foreground">Ready for download</p>
            </div>
          </div>

          <!-- Size Comparison -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-muted/60 p-4 text-center">
              <div class="text-2xl font-bold tabular-nums tracking-tight">{{ originalSizeFormatted }}</div>
              <div class="mt-1 text-xs text-muted-foreground">Original</div>
            </div>
            <div class="rounded-xl bg-success/10 p-4 text-center ring-1 ring-success/20">
              <div class="text-2xl font-bold tabular-nums tracking-tight text-success">
                {{ compressedSizeFormatted }}
              </div>
              <div class="mt-1 text-xs text-muted-foreground">Compressed</div>
            </div>
          </div>

          <!-- Reduction Stats -->
          <div v-if="compressedSizeReduction > 0">
            <div class="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Size reduction</span>
              <span class="text-sm font-bold tabular-nums text-success">
                {{ Math.round(compressedSizeReduction) }}%
              </span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                :style="{ width: `${compressedSizeReduction}%` }"></div>
            </div>
          </div>
          <div v-else class="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <div class="flex items-start gap-3">
              <Icon icon="lucide:info" class="mt-0.5 h-4.5 w-4.5 shrink-0 text-warning" />
              <div>
                <h4 class="text-sm font-semibold">Already optimized</h4>
                <p class="mt-0.5 text-sm text-muted-foreground">
                  This PDF is already highly optimized — we couldn't reduce its size further using structure
                  compression.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center gap-3">
          <Button variant="soft" @click="compressAnother">
            <Icon icon="lucide:plus" class="h-4 w-4" />
            Compress Another
          </Button>
          <Button @click="downloadFile" class="min-w-40 font-semibold">
            <Icon icon="lucide:download" class="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
    </main>
  </div>

  <!-- Hidden file input -->
  <input ref="fileInputRef" type="file" accept=".pdf,application/pdf" class="hidden" @change="handleFileInput" />

  <!-- Loading Overlay -->
  <LoadingOverlay
    v-if="isCompressing"
    :title="'Compressing PDF'"
    :message="compressionStep"
    :progress="compressionProgress"
    :currentStep="compressionStep"
    :cancellable="false" />

  <!-- Dragging overlay -->
  <DraggingOverlay :isVisible="isDragging" />
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';
import { Icon } from '@iconify/vue';
import { usePDFCompression, type CompressionSettings } from '@/composables/usePDFCompression';
import DropZone from '@/components/DropZone.vue';
import Button from '@/components/ui/Button.vue';
import Slider from '@/components/ui/Slider.vue';
import Switch from '@/components/ui/Switch.vue';
import DraggingOverlay from '@/components/DraggingOverlay.vue';

const LoadingOverlay = defineAsyncComponent(() => import('@/components/LoadingOverlay.vue'));

const {
  isCompressing,
  compressionProgress,
  compressionStep,
  compressionResult,
  compressedSizeReduction,
  compressedSizeFormatted,
  originalSizeFormatted,
  compressPDF,
  downloadCompressedFile,
  resetCompression,
  getCompressionPreset,
  defaultSettings,
} = usePDFCompression();

const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const dragCounter = ref(0);
const currentPreset = ref<'light' | 'medium' | 'aggressive' | 'custom'>('medium');

const compressionSettings = ref<CompressionSettings>({ ...defaultSettings });

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const estimatedSize = computed(() => {
  if (!selectedFile.value) return '0 KB';
  const estimatedBytes = selectedFile.value.size * (1 - estimatedReduction.value / 100);
  return formatFileSize(Math.round(estimatedBytes));
});

const estimatedReduction = computed(() => {
  const qualityFactor = (1 - compressionSettings.value.quality) * 50; // Up to 50% reduction from quality
  const metadataFactor = compressionSettings.value.removeMetadata ? 5 : 0;
  const imageFactor = compressionSettings.value.optimizeImages ? 15 : 0;
  const objectFactor = compressionSettings.value.removeUnusedObjects ? 10 : 0;
  const annotationFactor = compressionSettings.value.removeAnnotations ? 5 : 0;

  return Math.min(80, Math.round(qualityFactor + metadataFactor + imageFactor + objectFactor + annotationFactor));
});

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  dragCounter.value++;
  if (dragCounter.value === 1) {
    isDragging.value = true;
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  if (event.relatedTarget && (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
    return;
  }
  dragCounter.value = Math.max(0, dragCounter.value - 1);
  if (dragCounter.value === 0) {
    isDragging.value = false;
  }
};

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false;
  dragCounter.value = 0;
  const droppedFiles = Array.from(event.dataTransfer?.files || []);
  const pdfFiles = droppedFiles.filter((file) => file.type === 'application/pdf');
  if (pdfFiles.length > 0) {
    selectedFile.value = pdfFiles[0]; // Take only the first PDF
  }
};

const handleFileSelected = (fileList: FileList | File[]) => {
  const files = Array.from(fileList);
  const pdfFiles = files.filter((file) => file.type === 'application/pdf');
  if (pdfFiles.length > 0) {
    selectedFile.value = pdfFiles[0]; // Take only the first PDF
  }
};

const handleFileInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  }
};

const applyPreset = (preset: 'light' | 'medium' | 'aggressive') => {
  currentPreset.value = preset;
  compressionSettings.value = { ...getCompressionPreset(preset) };
};

const resetSelection = () => {
  selectedFile.value = null;
  resetCompression();
  currentPreset.value = 'medium';
  compressionSettings.value = { ...defaultSettings };
};

const startCompression = async () => {
  if (!selectedFile.value) return;

  try {
    await compressPDF(selectedFile.value, compressionSettings.value);
  } catch (error) {
    console.error('Compression failed:', error);
  }
};

const downloadFile = () => {
  if (compressionResult.value) {
    downloadCompressedFile(compressionResult.value);
  }
};

const compressAnother = () => {
  resetSelection();
};

applyPreset('medium');
</script>
