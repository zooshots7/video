import { create } from 'zustand';
import { Project, Clip } from '@video-editor/timeline-schema';

interface EditorState {
  project: Project | null;
  playheadMs: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  
  // Actions
  setProject: (project: Project) => void;
  setPlayhead: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  selectClip: (id: string | null) => void;
  
  // Mutations
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  project: null,
  playheadMs: 0,
  isPlaying: false,
  selectedClipId: null,

  setProject: (project) => set({ project }),
  setPlayhead: (ms) => set({ playheadMs: ms }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  selectClip: (id) => set({ selectedClipId: id }),

  updateClip: (trackId, clipId, updates) => set((state) => {
    if (!state.project) return state;
    
    const trackIndex = state.project.tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return state;

    const clipIndex = state.project.tracks[trackIndex].clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return state;

    const newProject = { ...state.project };
    newProject.tracks[trackIndex].clips[clipIndex] = {
      ...newProject.tracks[trackIndex].clips[clipIndex],
      ...updates
    } as Clip;

    return { project: newProject };
  }),
}));
