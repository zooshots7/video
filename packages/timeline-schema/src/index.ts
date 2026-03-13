import { z } from "zod";

// --- Project ---
export const ProjectSettingsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().int().positive(),
  durationMs: z.number().nonnegative(),
  backgroundColor: z.string(),
});
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

export const AssetTypeSchema = z.enum(["video", "audio", "image"]);
export type AssetType = z.infer<typeof AssetTypeSchema>;

export const AssetSchema = z.object({
  id: z.string().uuid(),
  type: AssetTypeSchema,
  url: z.string().url(),
  name: z.string(),
  durationMs: z.number().nonnegative(),
  metadata: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    waveform: z.array(z.number()).optional(),
  }).optional(),
});
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
  id: z.string().uuid(),
  startAtMs: z.number().nonnegative(),
  durationMs: z.number().positive(),
  transitions: z.object({
    in: TransitionSchema.optional(),
    out: TransitionSchema.optional(),
  }).optional(),
});

export const MediaClipSchema = BaseClipSchema.extend({
  type: z.enum(["video", "audio", "image"]),
  assetId: z.string().uuid(),
  sourceStartMs: z.number().nonnegative(),
  volume: z.number().min(0).max(1),
  transform: TransformSchema.optional(),
});
export type MediaClip = z.infer<typeof MediaClipSchema>;

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

export const ClipSchema = z.discriminatedUnion("type", [MediaClipSchema, TextClipSchema]);
export type Clip = z.infer<typeof ClipSchema>;

export const TrackTypeSchema = z.enum(["video_main", "video_overlay", "audio", "text", "effect"]);
export type TrackType = z.infer<typeof TrackTypeSchema>;

export const TrackSchema = z.object({
  id: z.string().uuid(),
  type: TrackTypeSchema,
  name: z.string(),
  hidden: z.boolean(),
  muted: z.boolean(),
  clips: z.array(ClipSchema),
});
export type Track = z.infer<typeof TrackSchema>;

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  settings: ProjectSettingsSchema,
  assets: z.record(z.string().uuid(), AssetSchema),
  tracks: z.array(TrackSchema),
});
export type Project = z.infer<typeof ProjectSchema>;
