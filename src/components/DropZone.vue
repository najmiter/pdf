<template>
  <div
    :class="cn('p-8 transition-colors duration-200', props.class)"
    @dragover.prevent="handleDragOver"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop">
    <div class="animate-fade-up mx-auto flex w-full max-w-xl flex-col items-center text-center">
      <!-- Drop card -->
      <div
        :class="
          cn(
            'group relative w-full cursor-pointer rounded-3xl border-2 border-dashed bg-card/60 px-8 py-14 shadow-sm backdrop-blur-sm transition-all duration-300',
            isDragOver
              ? 'scale-[1.01] border-primary bg-primary/5 shadow-[0_8px_40px_color-mix(in_oklch,var(--primary)_25%,transparent)]'
              : 'border-border hover:border-primary/50 hover:shadow-md'
          )
        "
        @click="triggerFileInput">
        <div class="flex flex-col items-center space-y-6 select-none">
          <!-- Icon -->
          <div class="relative">
            <div
              :class="
                cn(
                  'relative grid h-20 w-20 place-content-center rounded-2xl bg-primary/15 ring-1 ring-primary/30 transition-transform duration-300',
                  isDragOver ? 'scale-110 -rotate-3' : 'group-hover:scale-105 group-hover:-rotate-2'
                )
              ">
              <Icon
                :icon="isDragOver ? 'lucide:download' : 'lucide:file-text'"
                class="h-9 w-9 text-primary transition-transform duration-300" />
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="text-xl font-semibold tracking-tight">
              {{ isDragOver ? 'Drop your PDFs here' : 'Drop PDFs here' }}
            </div>
            <p class="text-sm text-muted-foreground">
              {{ isDragOver ? 'Release to add your files' : 'or click anywhere in this area to browse' }}
            </p>
          </div>

          <Button
            type="button"
            aria-label="Upload PDF Files"
            size="lg"
            :disabled="isProcessing"
            class="pointer-events-none font-semibold">
            <Icon icon="lucide:folder-open" class="h-4 w-4" />
            Browse Files
          </Button>
        </div>
      </div>

      <!-- Trust hints -->
      <div
        v-if="showHints"
        class="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-1.5">
          <Icon icon="lucide:shield-check" class="h-3.5 w-3.5 text-primary" />
          Processed locally — files never leave your device
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Icon icon="lucide:zap" class="h-3.5 w-3.5 text-primary" />
          Free &amp; unlimited
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Icon icon="lucide:files" class="h-3.5 w-3.5 text-primary" />
          Multiple files supported
        </span>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept=".pdf,application/pdf"
        class="hidden"
        @change="handleFileSelect" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/vue';
import Button from '@/components/ui/Button.vue';

interface Props {
  isProcessing?: boolean;
  showHints?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false,
  showHints: true,
});

const emit = defineEmits<{
  filesSelected: [files: FileList];
}>();

const isDragOver = ref(false);
const fileInputRef = ref<HTMLInputElement>();

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = true;
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = false;

  if (e.dataTransfer?.files) {
    emit('filesSelected', e.dataTransfer.files);
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    emit('filesSelected', target.files);
  }
};
</script>
