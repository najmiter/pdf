<template>
  <aside class="flex h-full w-80 shrink-0 flex-col border-l border-border/60 bg-sidebar/80 backdrop-blur-sm">
    <div class="border-b border-border/60 px-5 py-4">
      <h2 class="text-base font-semibold tracking-tight">Tools</h2>
      <p class="mt-0.5 text-xs text-muted-foreground">Everything runs locally in your browser</p>
    </div>

    <div class="flex-1 space-y-2 overflow-y-auto p-4">
      <!-- Accordion tool items -->
      <div
        v-for="tool in tools"
        :key="tool.key"
        :class="[
          'overflow-hidden rounded-xl border transition-all duration-200',
          openTool === tool.key
            ? 'border-primary/40 bg-card shadow-sm'
            : 'border-border/60 bg-card/50 hover:border-border hover:bg-card',
        ]">
        <!-- Item header -->
        <component
          :is="tool.route ? 'router-link' : 'button'"
          :to="tool.route"
          type="button"
          :aria-label="tool.title"
          :aria-expanded="openTool === tool.key"
          class="flex w-full cursor-pointer items-center gap-3 p-3 text-left"
          @click="tool.route ? undefined : toggleTool(tool.key)">
          <div
            :class="[
              'grid h-9 w-9 shrink-0 place-content-center rounded-lg ring-1 transition-colors duration-200',
              tool.key === 'remove' ? 'bg-destructive/10 ring-destructive/20' : 'bg-primary/12 ring-primary/20',
            ]">
            <Icon
              :icon="tool.icon"
              class="h-4.5 w-4.5"
              :class="tool.key === 'remove' ? 'text-destructive' : 'text-primary'" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 text-sm font-medium">
              {{ tool.title }}
              <span
                v-if="tool.needsSelection && selectedPages.size > 0"
                class="rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-semibold tabular-nums text-primary">
                {{ selectedPages.size }}
              </span>
            </div>
            <div class="truncate text-xs text-muted-foreground">{{ tool.description }}</div>
          </div>
          <Icon
            :icon="tool.route ? 'lucide:arrow-up-right' : 'lucide:chevron-down'"
            :class="[
              'h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200',
              openTool === tool.key ? 'rotate-180' : '',
            ]" />
        </component>

        <!-- Item body -->
        <div v-if="openTool === tool.key" class="space-y-4 border-t border-border/60 p-3.5 animate-fade-in">
          <!-- Merge -->
          <template v-if="tool.key === 'merge'">
            <p
              v-if="files.length < 2"
              class="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              Add at least 2 files to merge
            </p>
            <Button
              type="button"
              aria-label="merge all files"
              @click="handleMerge"
              :disabled="files.length < 2 || isProcessing"
              class="w-full">
              <Icon icon="lucide:download" class="h-4 w-4" />
              Merge {{ files.length }} {{ files.length === 1 ? 'File' : 'Files' }}
            </Button>
          </template>

          <!-- Split -->
          <template v-else-if="tool.key === 'split'">
            <div v-if="selectedPages.size > 0" class="space-y-4">
              <!-- Split Options (when multiple pages selected) -->
              <div v-if="selectedPages.size > 1" class="space-y-2">
                <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</div>
                <div class="grid gap-1.5">
                  <label
                    v-for="opt in [
                      { value: 'merged', label: 'One merged PDF', icon: 'lucide:file-check' },
                      { value: 'separate', label: 'Separate PDF per page', icon: 'lucide:files' },
                    ]"
                    :key="opt.value"
                    :class="[
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150',
                      splitMergeOption === opt.value
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                    ]">
                    <input v-model="splitMergeOption" type="radio" :value="opt.value" class="sr-only" />
                    <Icon
                      :icon="opt.icon"
                      class="h-4 w-4"
                      :class="splitMergeOption === opt.value ? 'text-primary' : ''" />
                    <span>{{ opt.label }}</span>
                  </label>
                </div>
              </div>

              <Button
                type="button"
                aria-label="Split selected pages"
                @click="handleSplitSelected"
                :disabled="selectedPages.size === 0 || isProcessing"
                class="w-full">
                <Icon icon="lucide:scissors" class="h-4 w-4" />
                <span v-if="selectedPages.size === 1">Extract Selected Page</span>
                <span v-else-if="splitMergeOption === 'merged'">Extract &amp; Merge Pages</span>
                <span v-else>Extract Pages Separately</span>
              </Button>
            </div>
            <p
              v-else
              class="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              Click pages in the preview to select them
            </p>
          </template>

          <!-- Remove -->
          <template v-else-if="tool.key === 'remove'">
            <div v-if="selectedPages.size > 0" class="space-y-4">
              <div class="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium">
                <Icon icon="lucide:alert-circle" class="h-3.5 w-3.5 shrink-0 text-destructive" />
                {{ selectedPages.size }} {{ selectedPages.size === 1 ? 'page' : 'pages' }} will be removed
              </div>
              <Button
                @click="handleRemoveSelected"
                :disabled="selectedPages.size === 0 || isProcessing"
                class="w-full"
                type="button"
                aria-label="Remove selected pages"
                variant="destructive">
                <Icon icon="lucide:trash-2" class="h-4 w-4" />
                Remove Selected Pages
              </Button>
            </div>
            <p
              v-else
              class="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              Click pages in the preview to select them
            </p>
          </template>

          <!-- Convert -->
          <template v-else-if="tool.key === 'convert'">
            <div v-if="selectedPages.size > 0" class="space-y-4">
              <!-- Format Selection -->
              <div class="space-y-2">
                <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Format</div>
                <div class="grid grid-cols-2 gap-1.5">
                  <label
                    v-for="fmt in [
                      { value: 'png', label: 'PNG', hint: 'Lossless' },
                      { value: 'jpeg', label: 'JPEG', hint: 'Smaller size' },
                    ]"
                    :key="fmt.value"
                    :class="[
                      'flex cursor-pointer flex-col items-center gap-0.5 rounded-lg border px-3 py-2 transition-all duration-150',
                      imageFormat === fmt.value
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border hover:border-primary/30',
                    ]">
                    <input v-model="imageFormat" type="radio" :value="fmt.value" class="sr-only" />
                    <span class="text-xs font-semibold">{{ fmt.label }}</span>
                    <span class="text-[10px] text-muted-foreground">{{ fmt.hint }}</span>
                  </label>
                </div>
              </div>

              <!-- Quality Slider (for JPEG) -->
              <div v-if="imageFormat === 'jpeg'" class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-semibold uppercase tracking-wide text-muted-foreground">Quality</span>
                  <span class="font-semibold tabular-nums text-primary">{{ imageQuality }}%</span>
                </div>
                <Slider v-model="imageQuality" :min="70" :max="100" :step="5" :show-value="false" />
              </div>

              <Button
                @click="handleConvertToImages"
                :disabled="selectedPages.size === 0 || isProcessing"
                class="w-full"
                type="button"
                aria-label="Convert to Images">
                <Icon icon="lucide:download" class="h-4 w-4" />
                Download as {{ imageFormat.toUpperCase() }} ZIP
              </Button>
            </div>
            <p
              v-else
              class="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              Click pages in the preview to select them
            </p>
          </template>

          <!-- Insert -->
          <template v-else-if="tool.key === 'insert'">
            <div v-if="files.length >= 2" class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original PDF</label>
                <select v-model="insertOriginalFileId" :class="fieldClass">
                  <option value="">Select original PDF</option>
                  <option v-for="file in files" :key="file.id" :value="file.id">
                    {{ file.name }} ({{ file.pages }} pages)
                  </option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PDF to Insert</label>
                <select v-model="insertFileId" :class="fieldClass">
                  <option value="">Select PDF to insert</option>
                  <option
                    v-for="file in files"
                    :key="file.id"
                    :value="file.id"
                    :disabled="file.id === insertOriginalFileId">
                    {{ file.name }} ({{ file.pages }} pages)
                  </option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >Insert at page</label
                >
                <input
                  v-model.number="insertAtPage"
                  type="number"
                  min="1"
                  :max="(originalFile?.pages ?? 0) + 1"
                  :class="fieldClass"
                  placeholder="e.g., 5" />
                <p class="text-xs text-muted-foreground">
                  Inserted before this page (1 to {{ (originalFile?.pages ?? 0) + 1 }})
                </p>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pages to insert
                  <span class="font-normal normal-case">(optional)</span>
                </label>
                <input v-model="insertRanges" type="text" :class="fieldClass" placeholder="e.g., 1-3,5,7-9" />
                <p class="text-xs text-muted-foreground">Leave empty to insert all pages</p>
              </div>

              <Button
                type="button"
                aria-label="Insert PDF & download"
                @click="handleInsertPDF"
                :disabled="!insertOriginalFileId || !insertFileId || !insertAtPage || isProcessing"
                class="w-full">
                <Icon icon="lucide:plus" class="h-4 w-4" />
                Insert PDF &amp; Download
              </Button>
            </div>
            <p
              v-else
              class="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              Upload at least 2 PDFs to use this tool
            </p>
          </template>
        </div>
      </div>
    </div>

    <!-- Processing Indicator -->
    <div v-if="isProcessing" class="border-t border-border/60 p-4">
      <div class="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
        <div class="h-4.5 w-4.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span class="text-sm font-medium">Processing…</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import Button from '@/components/ui/Button.vue';
import Slider from '@/components/ui/Slider.vue';
import type { PDFFile } from '@/composables/usePDFTools';
import * as JSZip from 'jszip';

const tools = [
  { key: 'merge', title: 'Merge PDFs', description: 'Combine files into one', icon: 'lucide:file-plus' },
  {
    key: 'split',
    title: 'Split PDF',
    description: 'Extract pages into new files',
    icon: 'lucide:scissors',
    needsSelection: true,
  },
  {
    key: 'remove',
    title: 'Remove Pages',
    description: 'Delete selected pages',
    icon: 'lucide:trash-2',
    needsSelection: true,
  },
  {
    key: 'convert',
    title: 'Convert to Images',
    description: 'Export pages as PNG or JPEG',
    icon: 'lucide:image',
    needsSelection: true,
  },
  { key: 'insert', title: 'Insert PDF', description: 'Place one PDF inside another', icon: 'lucide:plus' },
  {
    key: 'compress',
    title: 'Compress PDF',
    description: 'Reduce PDF file size',
    icon: 'lucide:zap',
    route: '/compress',
  },
] as { key: string; title: string; description: string; icon: string; needsSelection?: boolean; route?: string }[];

const fieldClass =
  'w-full h-9 rounded-lg border border-input bg-card px-3 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 placeholder:text-muted-foreground/60';

interface Props {
  files: PDFFile[];
  isProcessing: boolean;
  selectedPages: Set<string>;
  mergePDFs: (fileIds: string[]) => Promise<Blob>;
  extractPages: (
    pagesByFile: Map<string, number[]>,
    mode: 'merged' | 'separate',
  ) => Promise<{ blob: Blob; filename: string }[]>;
  removePages: (fileId: string, pages: number[]) => Promise<Blob>;
  insertPDF: (
    originalFileId: string,
    insertFileId: string,
    insertAtPage: number,
    ranges?: { start: number; end: number }[],
  ) => Promise<Blob>;
  convertToImages: (
    format?: 'png' | 'jpeg',
    quality?: number,
    onProgress?: (progress: number, step: string) => void,
  ) => Promise<void>;
  downloadBlob: (blob: Blob, filename: string) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  progress: [progress: number, step: string];
}>();

const splitMergeOption = ref<'merged' | 'separate'>('merged');
const imageFormat = ref<'png' | 'jpeg'>('png');
const imageQuality = ref(90);
const openTool = ref<string | null>('merge');

const insertOriginalFileId = ref<string>('');
const insertFileId = ref<string>('');
const insertAtPage = ref<number>(1);
const insertRanges = ref<string>('');

const originalFile = computed(() => props.files.find((f) => f.id === insertOriginalFileId.value) || null);

const toggleTool = (key: string) => {
  openTool.value = openTool.value === key ? null : key;
};

const parsePageRange = (range: string): { start: number; end: number }[] => {
  const ranges: { start: number; end: number }[] = [];
  const parts = range.split(',').map((p) => p.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        ranges.push({ start, end });
      }
    } else {
      const page = parseInt(part);
      if (!isNaN(page)) {
        ranges.push({ start: page, end: page });
      }
    }
  }
  return ranges;
};

const handleMerge = async () => {
  try {
    const mergedBlob = await props.mergePDFs(props.files.map((f) => f.id));
    props.downloadBlob(mergedBlob, 'merged.pdf');
  } catch (error) {
    console.error('Failed to merge PDFs:', error);
  }
};

const getSelectedPagesByFile = (): Map<string, number[]> => {
  const pagesByFile = new Map<string, number[]>();

  for (const file of props.files) {
    const filePages: number[] = [];
    for (const key of props.selectedPages) {
      const separatorIndex = key.lastIndexOf(':');
      if (key.slice(0, separatorIndex) === file.id) {
        filePages.push(Number(key.slice(separatorIndex + 1)));
      }
    }
    if (filePages.length > 0) {
      pagesByFile.set(
        file.id,
        filePages.sort((a, b) => a - b),
      );
    }
  }

  return pagesByFile;
};

const handleSplitSelected = async () => {
  if (props.selectedPages.size === 0) return;

  try {
    const pagesByFile = getSelectedPagesByFile();
    const mode = props.selectedPages.size > 1 && splitMergeOption.value === 'separate' ? 'separate' : 'merged';
    const results = await props.extractPages(pagesByFile, mode);

    if (results.length === 1) {
      props.downloadBlob(results[0].blob, results[0].filename);
    } else if (results.length > 1) {
      const zip = new JSZip.default();
      for (const { blob, filename } of results) {
        zip.file(filename, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      props.downloadBlob(zipBlob, 'extracted_pages.zip');
    }
  } catch (error) {
    console.error('Failed to extract pages:', error);
  }
};

const handleRemoveSelected = async () => {
  if (props.selectedPages.size === 0) return;

  try {
    const pagesByFile = getSelectedPagesByFile();

    for (const [fileId, pagesToRemove] of pagesByFile) {
      const file = props.files.find((f) => f.id === fileId);
      if (file) {
        const resultBlob = await props.removePages(fileId, pagesToRemove);
        const filename = `${file.name.replace(/\.pdf$/i, '')}_removed_pages.pdf`;
        props.downloadBlob(resultBlob, filename);
      }
    }
  } catch (error) {
    console.error('Failed to remove pages:', error);
  }
};

const handleConvertToImages = async () => {
  if (props.selectedPages.size === 0) return;

  try {
    const quality = imageFormat.value === 'jpeg' ? imageQuality.value / 100 : 1.0;
    await props.convertToImages(imageFormat.value, quality, (progress, step) => {
      emit('progress', progress, step);
    });
  } catch (error) {
    // console.error('Error converting to images:', error);
  }
};

const handleInsertPDF = async () => {
  if (!insertOriginalFileId.value || !insertFileId.value || !insertAtPage.value) return;

  try {
    let ranges: { start: number; end: number }[] | undefined;
    if (insertRanges.value.trim()) {
      ranges = parsePageRange(insertRanges.value);
    }

    const resultBlob = await props.insertPDF(
      insertOriginalFileId.value,
      insertFileId.value,
      insertAtPage.value,
      ranges,
    );

    const originalFile = props.files.find((f) => f.id === insertOriginalFileId.value);
    const insertFile = props.files.find((f) => f.id === insertFileId.value);
    const filename = `${originalFile?.name.replace('.pdf', '')}_inserted_${insertFile?.name.replace('.pdf', '')}.pdf`;

    props.downloadBlob(resultBlob, filename);
  } catch (error) {
    // console.error('Error inserting PDF:', error);
  }
};
</script>
