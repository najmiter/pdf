<template>
  <div class="w-80 shrink-0 border-l border-border/60 bg-sidebar/80 backdrop-blur-sm p-5 h-full overflow-y-auto">
    <!-- Tool Cards -->
    <div class="space-y-4">
      <!-- Tool List (when no tool selected) -->
      <div v-if="!selectedTool" class="space-y-4 animate-fade-in">
        <div>
          <h2 class="text-base font-semibold tracking-tight">Tools</h2>
          <p class="text-xs text-muted-foreground mt-0.5">Pick an action to apply to your files</p>
        </div>

        <div class="space-y-1.5">
          <component
            :is="tool.route ? 'router-link' : 'button'"
            v-for="tool in tools"
            :key="tool.key"
            :to="tool.route"
            type="button"
            :aria-label="tool.title"
            class="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition-all duration-200 hover:border-border hover:bg-card hover:shadow-sm"
            @click="tool.route ? undefined : (selectedTool = tool.key)">
            <div
              class="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-primary/12 ring-1 ring-primary/20 transition-colors duration-200 group-hover:bg-primary/20">
              <Icon :icon="tool.icon" class="h-4.5 w-4.5 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium">{{ tool.title }}</div>
              <div class="truncate text-xs text-muted-foreground">{{ tool.description }}</div>
            </div>
            <Icon
              icon="lucide:chevron-right"
              class="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
          </component>
        </div>
      </div>

      <!-- Tool Controls (when tool selected) -->
      <div v-else class="space-y-4 animate-fade-in">
        <button
          type="button"
          aria-label="back to tools"
          @click="selectedTool = null"
          class="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <Icon icon="lucide:arrow-left" class="h-4 w-4" />
          All tools
        </button>

        <!-- Merge Tool -->
        <div v-if="selectedTool === 'merge'" class="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
              <Icon icon="lucide:file-plus" class="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 class="text-sm font-semibold">Merge PDFs</h3>
              <p class="text-xs text-muted-foreground">Combine all files into one document</p>
            </div>
          </div>
          <Button
            type="button"
            aria-label="merge all files"
            @click="handleMerge"
            :disabled="files.length < 2 || isProcessing"
            class="w-full">
            <Icon icon="lucide:download" class="h-4 w-4" />
            Merge {{ files.length }} Files
          </Button>
          <p v-if="files.length < 2" class="text-xs text-muted-foreground text-center">
            Add at least 2 files to merge
          </p>
        </div>

        <!-- Split Tool -->
        <div v-if="selectedTool === 'split'" class="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
              <Icon icon="lucide:scissors" class="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 class="text-sm font-semibold">Split PDF</h3>
              <p class="text-xs text-muted-foreground">Extract pages into new files</p>
            </div>
          </div>

          <div v-if="selectedPages.size > 0" class="space-y-4">
            <div
              class="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-accent-foreground">
              <Icon icon="lucide:check-circle-2" class="h-3.5 w-3.5 text-primary" />
              {{ selectedPages.size }} {{ selectedPages.size === 1 ? 'page' : 'pages' }} selected
            </div>

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
                  <Icon :icon="opt.icon" class="h-4 w-4" :class="splitMergeOption === opt.value ? 'text-primary' : ''" />
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
          <div v-else class="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Click pages in the preview to select them
          </div>
        </div>

        <!-- Remove Pages Tool -->
        <div v-if="selectedTool === 'remove'" class="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-destructive/10 ring-1 ring-destructive/20">
              <Icon icon="lucide:trash-2" class="h-4.5 w-4.5 text-destructive" />
            </div>
            <div>
              <h3 class="text-sm font-semibold">Remove Pages</h3>
              <p class="text-xs text-muted-foreground">Delete selected pages from PDFs</p>
            </div>
          </div>

          <div v-if="selectedPages.size > 0" class="space-y-4">
            <div
              class="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium">
              <Icon icon="lucide:alert-circle" class="h-3.5 w-3.5 text-destructive" />
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
          <div v-else class="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Click pages in the preview to select them
          </div>
        </div>

        <!-- Convert to Images Tool -->
        <div v-if="selectedTool === 'convert'" class="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
              <Icon icon="lucide:image" class="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 class="text-sm font-semibold">Convert to Images</h3>
              <p class="text-xs text-muted-foreground">Export pages as PNG or JPEG</p>
            </div>
          </div>

          <div v-if="selectedPages.size > 0" class="space-y-4">
            <div
              class="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-accent-foreground">
              <Icon icon="lucide:check-circle-2" class="h-3.5 w-3.5 text-primary" />
              {{ selectedPages.size }} {{ selectedPages.size === 1 ? 'page' : 'pages' }} selected
            </div>

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
          <div v-else class="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Click pages in the preview to select them
          </div>
        </div>

        <!-- Insert PDF Tool -->
        <div v-if="selectedTool === 'insert'" class="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-4">
          <div class="flex items-center gap-3">
            <div class="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-primary/12 ring-1 ring-primary/20">
              <Icon icon="lucide:plus" class="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 class="text-sm font-semibold">Insert PDF</h3>
              <p class="text-xs text-muted-foreground">Place one PDF inside another</p>
            </div>
          </div>

          <div v-if="files.length >= 2" class="space-y-4">
            <!-- Select Original PDF -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original PDF</label>
              <select v-model="insertOriginalFileId" :class="fieldClass">
                <option value="">Select original PDF</option>
                <option v-for="file in files" :key="file.id" :value="file.id">
                  {{ file.name }} ({{ file.pages }} pages)
                </option>
              </select>
            </div>

            <!-- Select Insert PDF -->
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

            <!-- Insertion Point -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insert at page</label>
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

            <!-- Page Ranges (optional) -->
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
          <div v-else class="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Upload at least 2 PDFs to use this tool
          </div>
        </div>
      </div>
    </div>

    <!-- Processing Indicator -->
    <div v-if="isProcessing" class="mt-4 flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
      <div class="h-4.5 w-4.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <span class="text-sm font-medium">Processing…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import Button from '@/components/ui/Button.vue';
import Slider from '@/components/ui/Slider.vue';
import type { PDFFile } from '@/composables/usePDFTools';
import * as JSZip from 'jszip';

const tools = [
  { key: 'merge', title: 'Merge PDFs', description: 'Combine multiple files into one', icon: 'lucide:file-plus' },
  { key: 'split', title: 'Split PDF', description: 'Extract pages into new files', icon: 'lucide:scissors' },
  { key: 'remove', title: 'Remove Pages', description: 'Delete selected pages', icon: 'lucide:trash-2' },
  { key: 'convert', title: 'Convert to Images', description: 'Export pages as PNG or JPEG', icon: 'lucide:image' },
  { key: 'compress', title: 'Compress PDF', description: 'Reduce PDF file size', icon: 'lucide:zap', route: '/compress' },
  { key: 'insert', title: 'Insert PDF', description: 'Place one PDF inside another', icon: 'lucide:plus' },
];

const fieldClass =
  'w-full h-9 rounded-lg border border-input bg-card px-3 text-sm shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-primary/50 placeholder:text-muted-foreground/60';

interface Props {
  files: PDFFile[];
  isProcessing: boolean;
  selectedPages: Set<number>;
  mergePDFs: (fileIds: string[]) => Promise<Blob>;
  splitPDF: (fileId: string, ranges: { start: number; end: number }[]) => Promise<Blob[]>;
  removePages: (fileId: string, pages: number[]) => Promise<Blob>;
  insertPDF: (
    originalFileId: string,
    insertFileId: string,
    insertAtPage: number,
    ranges?: { start: number; end: number }[]
  ) => Promise<Blob>;
  convertToImages: (
    format?: 'png' | 'jpeg',
    quality?: number,
    onProgress?: (progress: number, step: string) => void
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
const selectedTool = ref<string | null>(null);

const insertOriginalFileId = ref<string>('');
const insertFileId = ref<string>('');
const insertAtPage = ref<number>(1);
const insertRanges = ref<string>('');

const originalFile = computed(() => props.files.find((f) => f.id === insertOriginalFileId.value) || null);

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
  } catch (error) {}
};

const handleSplitSelected = async () => {
  if (props.selectedPages.size === 0) return;

  try {
    const pagesByFile = new Map<string, number[]>();

    let globalIndex = 1;
    for (const file of props.files) {
      const filePages: number[] = [];
      for (let page = 1; page <= file.pages; page++) {
        if (props.selectedPages.has(globalIndex)) {
          filePages.push(page);
        }
        globalIndex++;
      }
      if (filePages.length > 0) {
        pagesByFile.set(file.id, filePages);
      }
    }

    // each page separately
    if (splitMergeOption.value === 'merged' && props.selectedPages.size > 1) {
      const allPageBlobs: Blob[] = [];
      const selectedPageInfo: string[] = [];

      for (const [fileId, pages] of pagesByFile) {
        const file = props.files.find((f) => f.id === fileId);
        if (file) {
          const ranges = pages.map((p) => ({ start: p, end: p }));
          const splitBlobs = await props.splitPDF(fileId, ranges);

          splitBlobs.forEach((blob, index) => {
            allPageBlobs.push(blob);
            selectedPageInfo.push(`${file.name.replace('.pdf', '')}_page_${pages[index]}`);
          });
        }
      }

      if (allPageBlobs.length > 0) {
        const { PDFDocument } = await import('pdf-lib');
        const mergedPdf = await PDFDocument.create();

        for (const blob of allPageBlobs) {
          const arrayBuffer = await blob.arrayBuffer();
          const sourcePdf = await PDFDocument.load(arrayBuffer);
          const [page] = await mergedPdf.copyPages(sourcePdf, [0]);
          mergedPdf.addPage(page);
        }

        const mergedBytes = await mergedPdf.save();
        const mergedBlob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });

        const filename =
          selectedPageInfo.length > 1
            ? `merged_selected_pages_${selectedPageInfo.length}_pages.pdf`
            : `${selectedPageInfo[0]}.pdf`;

        props.downloadBlob(mergedBlob, filename);
      }
    } else if (splitMergeOption.value === 'separate' && props.selectedPages.size > 1) {
      const zip = new JSZip.default();

      for (const [fileId, pages] of pagesByFile) {
        const file = props.files.find((f) => f.id === fileId);
        if (file) {
          const ranges = pages.map((p) => ({ start: p, end: p }));
          const splitBlobs = await props.splitPDF(fileId, ranges);

          splitBlobs.forEach((blob, index) => {
            const filename = `${file.name.replace('.pdf', '')}_page_${pages[index]}.pdf`;
            zip?.file(filename, blob);
          });
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFilename = `splitted_pdfs.zip`;
      props.downloadBlob(zipBlob, zipFilename);
    } else {
      for (const [fileId, pages] of pagesByFile) {
        const file = props.files.find((f) => f.id === fileId);
        if (file) {
          const ranges = pages.map((p) => ({ start: p, end: p }));
          const splitBlobs = await props.splitPDF(fileId, ranges);

          splitBlobs.forEach((blob, index) => {
            const filename =
              pages.length === 1
                ? `${file.name.replace('.pdf', '')}_page_${pages[index]}.pdf`
                : `${file.name.replace('.pdf', '')}_pages_${pages.join('-')}.pdf`;
            props.downloadBlob(blob, filename);
          });
        }
      }
    }
  } catch (error) {}
};

const handleRemoveSelected = async () => {
  if (props.selectedPages.size === 0) return;

  try {
    const pagesByFile = new Map<string, number[]>();

    let globalIndex = 1;
    for (const file of props.files) {
      const filePages: number[] = [];
      for (let page = 1; page <= file.pages; page++) {
        if (props.selectedPages.has(globalIndex)) {
          filePages.push(page);
        }
        globalIndex++;
      }
      if (filePages.length > 0) {
        pagesByFile.set(file.id, filePages);
      }
    }

    for (const [fileId, pagesToRemove] of pagesByFile) {
      const file = props.files.find((f) => f.id === fileId);
      if (file) {
        const resultBlob = await props.removePages(fileId, pagesToRemove);
        const filename = `${file.name.replace('.pdf', '')}_removed_pages.pdf`;
        props.downloadBlob(resultBlob, filename);
      }
    }
  } catch (error) {}
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
      ranges
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
