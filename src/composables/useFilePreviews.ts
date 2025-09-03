import { reactive } from 'vue';

export interface FilePreviewState {
  id: string;
  showPreview: boolean;
  order: number;
}

export function useFilePreviews() {
  const filePreviewStates = reactive<Record<string, FilePreviewState>>({});

  const initializeFilePreview = (fileId: string, isFirstFile: boolean = false) => {
    filePreviewStates[fileId] = {
      id: fileId,
      showPreview: isFirstFile,
      order: Object.keys(filePreviewStates).length,
    };
  };

  const togglePreview = (fileId: string) => {
    const state = filePreviewStates[fileId];
    console.log('togglePreview', state);
    if (state) {
      state.showPreview = !state.showPreview;
    }
  };

  const getPreviewState = (fileId: string): FilePreviewState | undefined => {
    return filePreviewStates[fileId];
  };

  const reorderFiles = (draggedFileId: string, newPosition: number) => {
    const draggedState = filePreviewStates[draggedFileId];
    if (!draggedState) return;

    const currentOrder = draggedState.order;

    for (const id in filePreviewStates) {
      if (id === draggedFileId) continue;

      const fileState = filePreviewStates[id];
      if (currentOrder < newPosition) {
        if (fileState.order > currentOrder && fileState.order <= newPosition) {
          fileState.order--;
        }
      } else {
        if (fileState.order >= newPosition && fileState.order < currentOrder) {
          fileState.order++;
        }
      }
    }

    draggedState.order = newPosition;
  };

  const removeFile = (fileId: string) => {
    delete filePreviewStates[fileId];

    const remainingStates = Object.values(filePreviewStates).sort((a, b) => a.order - b.order);
    remainingStates.forEach((state, index) => {
      state.order = index;
    });
  };

  const getOrderedFileIds = (): string[] => {
    return Object.values(filePreviewStates)
      .sort((a, b) => a.order - b.order)
      .map((state) => state.id);
  };

  return {
    filePreviewStates,
    initializeFilePreview,
    togglePreview,
    getPreviewState,
    reorderFiles,
    removeFile,
    getOrderedFileIds,
  };
}
