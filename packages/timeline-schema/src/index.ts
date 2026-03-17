import { z } from "zod";

export const IdSchema = z.string().min(1);

// --- Project ---
export const ProjectSettingsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().int().positive(),
  durationMs: z.number().nonnegative(),
  backgroundColor: z.string(),
});
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

export const AssetTypeSchema = z.enum(["video", "audio", "image", "effect"]);
export type AssetType = z.infer<typeof AssetTypeSchema>;

const AssetMetadataSchema = z
  .object({
    width: z.number().optional(),
    height: z.number().optional(),
    waveform: z.array(z.number()).optional(),
    libraryType: z.enum(["vfx", "sfx", "broll", "music"]).optional(),
    sourceUrl: z.string().min(1).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .optional();

const BaseAssetSchema = z.object({
  id: IdSchema,
  name: z.string(),
  durationMs: z.number().nonnegative(),
  metadata: AssetMetadataSchema,
});

export const MediaAssetSchema = BaseAssetSchema.extend({
  type: z.enum(["video", "audio", "image"]),
  url: z.string().min(1),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export const EffectAssetSchema = BaseAssetSchema.extend({
  type: z.literal("effect"),
  url: z.string().min(1).optional(),
});
export type EffectAsset = z.infer<typeof EffectAssetSchema>;

export const AssetSchema = z.discriminatedUnion("type", [
  MediaAssetSchema,
  EffectAssetSchema,
]);
export type Asset = z.infer<typeof AssetSchema>;

export const TransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  scaleX: z.number(),
  scaleY: z.number(),
  rotation: z.number(),
  anchorX: z.number().min(0).max(1),
  anchorY: z.number().min(0).max(1),
});
export type Transform = z.infer<typeof TransformSchema>;

export const TransitionTypeSchema = z.enum(["fade", "crossfade"]);
export const TransitionSchema = z.object({
  type: TransitionTypeSchema,
  durationMs: z.number().positive(),
});
export type Transition = z.infer<typeof TransitionSchema>;

export const BaseClipSchema = z.object({
  id: IdSchema,
  startAtMs: z.number().nonnegative(),
  durationMs: z.number().positive(),
  transitions: z.object({
    in: TransitionSchema.optional(),
    out: TransitionSchema.optional(),
  }).optional(),
});

export const MediaClipSchema = BaseClipSchema.extend({
  type: z.enum(["video", "audio", "image"]),
  assetId: IdSchema,
  sourceStartMs: z.number().nonnegative(),
  volume: z.number().min(0).max(1),
  transform: TransformSchema.optional(),
});
export type MediaClip = z.infer<typeof MediaClipSchema>;

export const EffectClipSchema = BaseClipSchema.extend({
  type: z.literal("effect"),
  assetId: IdSchema,
  config: z.record(z.string(), z.unknown()).optional(),
});
export type EffectClip = z.infer<typeof EffectClipSchema>;

export const TextClipSchema = BaseClipSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  style: z.object({
    fontFamily: z.string(),
    fontSize: z.number().positive(),
    color: z.string(),
    backgroundColor: z.string().optional(),
    textAlign: z.enum(["left", "center", "right"]),
    fontWeight: z.union([z.string(), z.number()]),
    stroke: z.object({ color: z.string(), width: z.number() }).optional(),
    shadow: z.object({ color: z.string(), blur: z.number(), x: z.number(), y: z.number() }).optional(),
  }),
  transform: TransformSchema,
});
export type TextClip = z.infer<typeof TextClipSchema>;

export const ClipSchema = z.discriminatedUnion("type", [
  MediaClipSchema,
  EffectClipSchema,
  TextClipSchema,
]);
export type Clip = z.infer<typeof ClipSchema>;

export const TrackTypeSchema = z.enum(["video_main", "video_overlay", "audio", "text", "effect"]);
export type TrackType = z.infer<typeof TrackTypeSchema>;

export const TrackSchema = z.object({
  id: IdSchema,
  type: TrackTypeSchema,
  name: z.string(),
  hidden: z.boolean(),
  muted: z.boolean(),
  clips: z.array(ClipSchema),
});
export type Track = z.infer<typeof TrackSchema>;

export const ProjectSchema = z.object({
  id: IdSchema,
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  settings: ProjectSettingsSchema,
  assets: z.record(IdSchema, AssetSchema),
  tracks: z.array(TrackSchema),
});
export type Project = z.infer<typeof ProjectSchema>;
export type EditorProject = Project;

export const ProjectTimelineDbRowSchema = z.object({
  project_id: IdSchema,
  timeline_json: z.unknown(),
  updated_at: z.string().datetime(),
});

export type ProjectTimelineDbRow = z.infer<typeof ProjectTimelineDbRowSchema>;

export const ProjectTimelineDocumentSchema = z.object({
  projectId: IdSchema,
  timeline: ProjectSchema,
  updatedAt: z.string().datetime(),
});

export type ProjectTimelineDocument = z.infer<typeof ProjectTimelineDocumentSchema>;

export function projectTimelineDbRowToDocument(
  row: ProjectTimelineDbRow,
): ProjectTimelineDocument {
  return {
    projectId: row.project_id,
    timeline: ProjectSchema.parse(row.timeline_json),
    updatedAt: row.updated_at,
  };
}

export function projectTimelineDbRowToProject(row: ProjectTimelineDbRow): Project {
  return ProjectSchema.parse(row.timeline_json);
}

export function projectToProjectTimelineDbRow(
  projectId: string,
  timeline: Project,
  updatedAt: string = new Date().toISOString(),
): ProjectTimelineDbRow {
  return {
    project_id: projectId,
    timeline_json: timeline,
    updated_at: updatedAt,
  };
}

export * from "./timing";

const DEFAULT_TRACK_BLUEPRINTS: Array<{
  type: TrackType;
  name: string;
}> = [
  { type: "video_main", name: "Main Video" },
  { type: "video_overlay", name: "B-roll" },
  { type: "audio", name: "Music" },
  { type: "audio", name: "SFX" },
  { type: "text", name: "Captions" },
  { type: "effect", name: "Effects" },
];

function createTrackId() {
  const cryptoImpl = globalThis.crypto as { randomUUID?: () => string } | undefined;
  return cryptoImpl?.randomUUID?.() ?? `track-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isDefaultTrack(track: Track) {
  return DEFAULT_TRACK_BLUEPRINTS.some(
    (blueprint) =>
      blueprint.type === track.type &&
      blueprint.name.toLowerCase() === track.name.toLowerCase(),
  );
}

export function createDefaultTracks(): Track[] {
  return DEFAULT_TRACK_BLUEPRINTS.map((blueprint) => ({
    id: createTrackId(),
    type: blueprint.type,
    name: blueprint.name,
    hidden: false,
    muted: false,
    clips: [],
  }));
}

export function createBlankProject(input: {
  id: string;
  name: string;
  settings: ProjectSettings;
  assets?: Record<string, Asset>;
  tracks?: Track[];
  createdAt?: string;
  updatedAt?: string;
}): Project {
  const now = new Date().toISOString();

  return {
    id: input.id,
    name: input.name,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    settings: input.settings,
    assets: input.assets ?? {},
    tracks: input.tracks ?? createDefaultTracks(),
  };
}

export function ensureDefaultTracks(project: Project): Project {
  const existing = [...project.tracks];
  const resolvedTracks: Track[] = [];

  for (const blueprint of DEFAULT_TRACK_BLUEPRINTS) {
    const matched = existing.find(
      (track) =>
        track.type === blueprint.type &&
        track.name.toLowerCase() === blueprint.name.toLowerCase(),
    );

    if (matched) {
      resolvedTracks.push(matched);
    } else {
      resolvedTracks.push({
        id: createTrackId(),
        type: blueprint.type,
        name: blueprint.name,
        hidden: false,
        muted: false,
        clips: [],
      });
    }
  }

  const extras = existing.filter((track) => !isDefaultTrack(track));

  return {
    ...project,
    tracks: [...resolvedTracks, ...extras],
  };
}

export function resolveClipAsset(project: Pick<Project, "assets">, clip: Clip) {
  if (!("assetId" in clip)) return null;
  return project.assets[clip.assetId] ?? null;
}

export function resolveClipAssetUrl(
  project: Pick<Project, "assets">,
  clip: Clip,
) {
  const asset = resolveClipAsset(project, clip);
  if (!asset) return null;
  return asset.url ?? null;
}

export const getClipAssetUrl = resolveClipAssetUrl;
export const getAssetUrl = resolveClipAssetUrl;

const TRACK_TYPE_ORDER: Record<TrackType, number> = {
  video_main: 0,
  video_overlay: 1,
  audio: 2,
  text: 3,
  effect: 4,
};

export function sortTracksForRender(tracks: Track[]) {
  return [...tracks].sort((left, right) => {
    const typeDelta = TRACK_TYPE_ORDER[left.type] - TRACK_TYPE_ORDER[right.type];
    if (typeDelta !== 0) return typeDelta;
    return left.name.localeCompare(right.name);
  });
}
