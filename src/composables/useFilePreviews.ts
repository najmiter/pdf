import { ref } from 'vue';

export interface FilePreviewState {
  id: string;
  showPreview: boolean;
  order: number;
}

export function useFilePreviews() {
  const filePreviewStates = ref<Map<string, FilePreviewState>>(new Map());

  const initializeFilePreview = (fileId: string, isFirstFile: boolean = false) => {
    filePreviewStates.value.set(fileId, {
      id: fileId,
      showPreview: isFirstFile, // Only show preview for first file by default
      order: filePreviewStates.value.size,
    });
  };

  const togglePreview = (fileId: string) => {
    const state = filePreviewStates.value.get(fileId);
    if (state) {
      state.showPreview = !state.showPreview;
    }
  };

  const getPreviewState = (fileId: string): FilePreviewState | undefined => {
    return filePreviewStates.value.get(fileId);
  };

  const reorderFiles = (draggedFileId: string, newPosition: number) => {
    const draggedState = filePreviewStates.value.get(draggedFileId);
    if (!draggedState) return;

    const currentOrder = draggedState.order;

    // Update orders of other files
    for (const [id, fileState] of filePreviewStates.value) {
      if (id === draggedFileId) continue;

      if (currentOrder < newPosition) {
        // Moving down: shift items up
        if (fileState.order > currentOrder && fileState.order <= newPosition) {
          fileState.order--;
        }
      } else {
        // Moving up: shift items down
        if (fileState.order >= newPosition && fileState.order < currentOrder) {
          fileState.order++;
        }
      }
    }

    // Set new order for dragged item
    draggedState.order = newPosition;
  };

  const removeFile = (fileId: string) => {
    filePreviewStates.value.delete(fileId);

    // Reorder remaining files
    const remainingStates = Array.from(filePreviewStates.value.values()).sort((a, b) => a.order - b.order);
    remainingStates.forEach((state, index) => {
      state.order = index;
    });
  };

  const getOrderedFileIds = (): string[] => {
    return Array.from(filePreviewStates.value.values())
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
