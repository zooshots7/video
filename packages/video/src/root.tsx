import React from "react";
import { Composition, registerRoot } from "remotion";
import { VideoComposition } from "./VideoComposition";
import {
    REMOTION_COMPOSITION_ID,
    calculateRenderMetadata,
    createDefaultEditorProject,
    DEFAULT_RENDER_SETTINGS,
} from "./render-config";
import type { EditorProjectCompositionProps } from "./types";

export const RemotionRoot: React.FC = () => {
    return (
        <Composition
            id={REMOTION_COMPOSITION_ID}
            component={VideoComposition}
            defaultProps={
                {
                    project: createDefaultEditorProject(),
                } satisfies EditorProjectCompositionProps
            }
            durationInFrames={1}
            fps={DEFAULT_RENDER_SETTINGS.fps}
            width={DEFAULT_RENDER_SETTINGS.width}
            height={DEFAULT_RENDER_SETTINGS.height}
            calculateMetadata={calculateRenderMetadata}
        />
    );
};

registerRoot(RemotionRoot);
