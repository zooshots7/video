import type { CalculateMetadataFunction } from "remotion";
import {
    createBlankProject,
    ensureDefaultTracks,
    getProjectDurationInFrames,
    type EditorProject,
} from "@video-editor/timeline-schema";
import type { EditorProjectCompositionProps } from "./types";

export const REMOTION_COMPOSITION_ID = "EditorTimeline";
export const REMOTION_ENTRY_POINT = require.resolve("./root");

export const DEFAULT_RENDER_SETTINGS = {
    width: 1080,
    height: 1920,
    fps: 30,
    durationMs: 15_000,
    backgroundColor: "#000000",
} as const;

export function createDefaultEditorProject(): EditorProject {
    return ensureDefaultTracks(
        createBlankProject({
            id: "render-default-project",
            name: "Untitled render",
            settings: { ...DEFAULT_RENDER_SETTINGS },
            assets: {},
            tracks: [],
        })
    );
}

export function normalizeRenderProject(project: EditorProject): EditorProject {
    return ensureDefaultTracks({
        ...project,
        assets: project.assets ?? {},
        tracks: project.tracks ?? [],
    });
}

export const calculateRenderMetadata: CalculateMetadataFunction<EditorProjectCompositionProps> = async ({
    props,
}) => {
    const project = normalizeRenderProject(props.project);

    return {
        durationInFrames: getProjectDurationInFrames(project),
        fps: project.settings.fps,
        width: project.settings.width,
        height: project.settings.height,
        defaultOutName: `${project.name.replace(/\s+/g, "-").toLowerCase() || "render"}.mp4`,
        props: {
            project,
        },
    };
};
