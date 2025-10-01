<template>
  <div class="flex h-full">
    <!-- Main Content Area -->
    <main
      class="flex-1 p-6 overflow-auto"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop">
      <!-- Step 1: File Upload -->
      <div v-if="!selectedFile && !compressionResult" class="h-full flex items-center justify-center">
        <DropZone
          :isProcessing="isCompressing"
          @files-selected="handleFileSelected"
          class="w-full h-full grid place-content-center" />
      </div>

      <!-- Step 2: Compression Settings -->
      <div v-else-if="selectedFile && !compressionResult" class="max-w-4xl mx-auto space-y-8">
        <!-- File Info Header -->
        <div class="border rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="p-3 bg-primary/10 rounded-lg">
                <Icon icon="lucide:file-text" class="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 class="text-lg font-semibold">{{ selectedFile.name }}</h3>
                <p class="text-sm text-muted-foreground">
                  {{ formatFileSize(selectedFile.size) }} • Ready for compression
                </p>
              </div>
            </div>
            <Button variant="soft" @click="resetSelection">
              <Icon icon="lucide:x" class="h-4 w-4" />
              Change File
            </Button>
          </div>
        </div>

        <!-- Compression Settings -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Settings Panel -->
          <div class="space-y-6">
            <div>
              <h2 class="text-xl font-semibold mb-4">Compression Settings</h2>

              <!-- Quick Presets -->
              <div class="space-y-3 mb-6">
                <label class="text-sm font-medium text-foreground">Quick Presets</label>
                <div class="grid grid-cols-3 gap-2">
                  <Button
                    variant="soft"
                    size="sm"
                    :class="currentPreset === 'light' ? 'bg-primary/20 border-primary' : ''"
                    @click="applyPreset('light')"
                    >> Light
                  </Button>
                  <Button
                    variant="soft"
                    size="sm"
                    :class="currentPreset === 'medium' ? 'bg-primary/20 border-primary' : ''"
                    @click="applyPreset('medium')"
                    >> Medium
                  </Button>
                  <Button
                    variant="soft"
                    size="sm"
                    :class="currentPreset === 'aggressive' ? 'bg-primary/20 border-primary' : ''"
                    @click="applyPreset('aggressive')"
                    >> Aggressive
                  </Button>
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
                :value-formatter="(value) => `${Math.round(value * 100)}%`"
                class="mb-6" />

              <!-- Advanced Options -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium">Advanced Options</h3>

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
          </div>

          <!-- Preview Panel -->
          <div class="space-y-6">
            <div>
              <h2 class="text-xl font-semibold mb-4">Compression Preview</h2>

              <!-- Size Estimation -->
              <div class="border rounded-lg p-6 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Original Size</span>
                  <span class="font-medium">{{ formatFileSize(selectedFile.size) }}</span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Estimated Size</span>
                  <span class="font-medium text-green-600">
                    {{ estimatedSize }}
                  </span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Estimated Reduction</span>
                  <span class="font-medium text-green-600"> ~{{ estimatedReduction }}% </span>
                </div>

                <!-- Progress Bar for Estimation -->
                <div class="mt-4">
                  <div class="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Size Reduction</span>
                    <span>{{ estimatedReduction }}%</span>
                  </div>
                  <div class="w-full bg-border rounded-full h-2">
                    <div
                      class="bg-green-500 h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${estimatedReduction}%` }"></div>
                  </div>
                </div>
              </div>

              <!-- Compression Quality Warning -->
              <div
                v-if="compressionSettings.quality < 0.7"
                class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div class="flex items-start space-x-2">
                  <Icon icon="lucide:alert-triangle" class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Quality Warning</h4>
                    <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Very aggressive compression may significantly reduce image quality and text clarity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4 pt-6 border-t">
          <Button variant="soft" @click="resetSelection" :disabled="isCompressing">
            <Icon icon="lucide:arrow-left" class="h-4 w-4" />
            Back
          </Button>
          <Button @click="startCompression" :disabled="isCompressing" class="min-w-32">
            <Icon v-if="!isCompressing" icon="lucide:zap" class="h-4 w-4" />
            <Icon v-else icon="lucide:loader-2" class="h-4 w-4 animate-spin" />
            {{ isCompressing ? 'Compressing...' : 'Compress PDF' }}
          </Button>
        </div>
      </div>

      <!-- Step 3: Results -->
      <div v-else-if="compressionResult" class="max-w-2xl mx-auto space-y-8">
        <!-- Success Header -->
        <div class="text-center space-y-4">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full">
            <Icon icon="lucide:check" class="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 class="text-2xl font-bold">Compression Complete!</h2>
            <p class="text-muted-foreground">Your PDF has been successfully compressed</p>
          </div>
        </div>

        <!-- Results Card -->
        <div class="border rounded-lg p-6 space-y-6">
          <!-- File Info -->
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-primary/10 rounded-lg">
              <Icon icon="lucide:file-text" class="h-6 w-6 text-primary" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold">{{ compressionResult.filename }}</h3>
              <p class="text-sm text-muted-foreground">Ready for download</p>
            </div>
          </div>

          <!-- Size Comparison -->
          <div class="grid grid-cols-2 gap-6 text-center">
            <div class="space-y-2">
              <div class="text-2xl font-bold">{{ originalSizeFormatted }}</div>
              <div class="text-sm text-muted-foreground">Original Size</div>
            </div>
            <div class="space-y-2">
              <div class="text-2xl font-bold text-green-600">{{ compressedSizeFormatted }}</div>
              <div class="text-sm text-muted-foreground">Compressed Size</div>
            </div>
          </div>

          <!-- Reduction Stats -->
          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-green-800 dark:text-green-200">Size Reduction</span>
              <span class="text-lg font-bold text-green-600 dark:text-green-400">
                {{ Math.round(compressedSizeReduction) }}%
              </span>
            </div>
            <div class="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
              <div
                class="bg-green-500 h-2 rounded-full transition-all duration-500"
                :style="{ width: `${compressedSizeReduction}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4">
          <Button variant="soft" @click="compressAnother">
            <Icon icon="lucide:plus" class="h-4 w-4" />
            Compress Another
          </Button>
          <Button @click="downloadFile" class="min-w-32">
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

// File size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Estimated compression calculations
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

// Drag and drop handlers
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

// File selection handlers
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

// Preset handling
const applyPreset = (preset: 'light' | 'medium' | 'aggressive') => {
  currentPreset.value = preset;
  compressionSettings.value = { ...getCompressionPreset(preset) };
};

// Actions
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

// Initialize with medium preset
applyPreset('medium');
</script>
