import { create } from 'zustand';
import {
  Asset,
  Clip,
  Project,
  Track,
  ensureDefaultTracks,
} from '@video-editor/timeline-schema';

interface EditorState {
  project: Project | null;
  playheadMs: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  
  activeTool: 'select' | 'blade';
  snappingEnabled: boolean;
  
  // Actions
  setProject: (project: Project) => void;
  setPlayhead: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  selectClip: (id: string | null) => void;
  setActiveTool: (tool: 'select' | 'blade') => void;
  setSnappingEnabled: (enabled: boolean) => void;
  
  // Mutations
  addTrack: (track: Track) => void;
  addClip: (trackId: string, clip: Clip) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  moveClipTime: (trackId: string, clipId: string, newStartMs: number) => void;
  trimClip: (trackId: string, clipId: string, newStartMs: number, newDurationMs: number, sourceStartMs?: number) => void;
  deleteClip: (trackId: string, clipId: string) => void;
  upsertAsset: (asset: Asset) => void;
  deleteAsset: (assetId: string) => void;
}

function sortClips(clips: Clip[]) {
  return [...clips].sort(
    (a, b) => a.startAtMs - b.startAtMs || a.id.localeCompare(b.id),
  );
}

export const useEditorStore = create<EditorState>((set) => ({
  project: null,
  playheadMs: 0,
  isPlaying: false,
  selectedClipId: null,
  activeTool: 'select',
  snappingEnabled: true,

  setProject: (project) => set({ project: ensureDefaultTracks(project) }),
  setPlayhead: (ms) => set({ playheadMs: ms }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  selectClip: (id) => set({ selectedClipId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSnappingEnabled: (enabled) => set({ snappingEnabled: enabled }),

  addTrack: (track) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        tracks: [...state.project.tracks, track],
      },
    };
  }),

  addClip: (trackId, clip) => set((state) => {
    if (!state.project) return state;
    const trackIndex = state.project.tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return state;

    const tracks = state.project.tracks.map((track, index) =>
      index === trackIndex
        ? { ...track, clips: sortClips([...track.clips, clip]) }
        : track,
    );

    return { project: { ...state.project, tracks } };
  }),

  updateClip: (trackId, clipId, updates) => set((state) => {
    if (!state.project) return state;

    const trackIndex = state.project.tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return state;

    const clips = state.project.tracks[trackIndex].clips.map((clip) =>
      clip.id === clipId ? ({ ...clip, ...updates } as Clip) : clip,
    );

    const tracks = state.project.tracks.map((track, index) =>
      index === trackIndex ? { ...track, clips: sortClips(clips) } : track,
    );

    return { project: { ...state.project, tracks } };
  }),

  moveClipTime: (trackId, clipId, newStartMs) => set((state) => {
     if (!state.project) return state;
     const trackIndex = state.project.tracks.findIndex((t) => t.id === trackId);
     if (trackIndex === -1) return state;

     const clips = state.project.tracks[trackIndex].clips.map((clip) =>
       clip.id === clipId ? { ...clip, startAtMs: Math.max(0, newStartMs) } : clip,
     );

     const tracks = state.project.tracks.map((track, index) =>
       index === trackIndex ? { ...track, clips: sortClips(clips) } : track,
     );

     return { project: { ...state.project, tracks } };
  }),

  trimClip: (trackId, clipId, startMs, durationMs, sourceStartMs) => set((state) => {
     if (!state.project) return state;
     const trackIndex = state.project.tracks.findIndex((t) => t.id === trackId);
     if (trackIndex === -1) return state;

     const clips = state.project.tracks[trackIndex].clips.map((clip) => {
       if (clip.id !== clipId) return clip;
       const nextClip = {
         ...clip,
         startAtMs: Math.max(0, startMs),
         durationMs: Math.max(100, durationMs),
       } as Clip;

       if (sourceStartMs !== undefined && nextClip.type !== 'text') {
         (nextClip as any).sourceStartMs = Math.max(0, sourceStartMs);
       }

       return nextClip;
     });

     const tracks = state.project.tracks.map((track, index) =>
       index === trackIndex ? { ...track, clips: sortClips(clips) } : track,
     );

     return { project: { ...state.project, tracks } };
  }),

  deleteClip: (trackId, clipId) => set((state) => {
      if (!state.project) return state;
      const trackIndex = state.project.tracks.findIndex(t => t.id === trackId);
      if (trackIndex === -1) return state;

      const tracks = state.project.tracks.map((track, index) =>
        index === trackIndex
          ? { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) }
          : track,
      );

      return { project: { ...state.project, tracks } };
  }),

  upsertAsset: (asset) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        assets: {
          ...state.project.assets,
          [asset.id]: asset,
        },
      },
    };
  }),

  deleteAsset: (assetId) => set((state) => {
    if (!state.project || !state.project.assets[assetId]) return state;
    const assets = { ...state.project.assets };
    delete assets[assetId];
    return { project: { ...state.project, assets } };
  }),
}));
