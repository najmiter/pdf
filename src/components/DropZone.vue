<template>
  <div
    :class="
      cn(
        'rounded-lg transition-colors duration-200 p-8',
        { 'border-primary bg-primary/5': isDragOver, 'border-border hover:border-primary/50': !isDragOver },
        props.class
      )
    "
    @dragover.prevent="handleDragOver"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop">
    <div class="flex flex-col items-center justify-center space-y-4 text-center">
      <div :class="cn('rounded-full p-6', { 'bg-primary/10': isDragOver, 'bg-primary/15': !isDragOver })">
        <Icon
          icon="lucide:file-text"
          :class="cn('h-12 w-12', { 'text-primary': isDragOver, 'text-primary/50': !isDragOver })" />
      </div>

      <div class="space-y-2 select-none">
        <h3 :class="cn('text-lg font-semibold', { 'text-primary': isDragOver, 'text-foreground': !isDragOver })">
          {{ isDragOver ? 'Drop your PDF files here' : 'Upload PDF Files' }}
        </h3>
        <p class="text-muted-foreground text-sm max-w-md">
          {{ isDragOver ? 'Release to upload' : 'Drag and drop your PDF files here, or click to browse' }}
        </p>
      </div>

      <Button
        type="button"
        aria-label="Upload PDF Files"
        variant="default"
        @click="triggerFileInput"
        :disabled="isProcessing"
        class="bg-primary text-black transition-colors hover:bg-primary/90">
        <Icon icon="lucide:folder-open" class="mr-1 h-4 w-4" />
        Browse Files
      </Button>

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
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false,
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
