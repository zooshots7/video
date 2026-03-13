import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { RemotionComposition } from './RemotionComposition';
import { Project } from '@video-editor/timeline-schema';

// This Root file serves as the entrypoint for Remotion's renderer.
// When we spawn npx remotion render, we'll pass the JSON project via getInputProps.

export const RemotionRoot: React.FC = () => {
  // Try to parse the injected project JSON 
  const inputProps = getInputProps() as any;
  const project: Project = inputProps.project;

  if (!project) {
    throw new Error('No project JSON supplied via inputProps');
  }

  const { width, height, fps, durationMs } = project.settings;
  const durationInFrames = Math.round((durationMs / 1000) * fps);

  return (
    <>
      <Composition
        id="Main"
        component={RemotionComposition}
        defaultProps={{ project }}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
    </>
  );
};
