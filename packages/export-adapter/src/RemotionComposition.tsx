import React from 'react';
import { AbsoluteFill, Sequence, Video, Audio, Img } from 'remotion';
import { Project, Clip } from '@video-editor/timeline-schema';

export const RemotionComposition: React.FC<{ project: Project }> = ({ project }) => {
  const { width, height, backgroundColor, fps } = project.settings;

  return (
    <AbsoluteFill style={{ backgroundColor, width, height }}>
      {project.tracks
        .filter(track => !track.hidden)
        .map((track) => {
          return (
            <AbsoluteFill key={track.id}>
              {track.clips.map((clip) => {
                // Convert ms to frames
                const startFrame = Math.round((clip.startAtMs / 1000) * fps);
                const durationInFrames = Math.round((clip.durationMs / 1000) * fps);

                return (
                  <Sequence key={clip.id} from={startFrame} durationInFrames={durationInFrames}>
                    {clip.type === 'video' && (() => {
                      const mediaClip = clip as any;
                      return <Video 
                        src={mediaClip.src || ''} 
                        style={{ 
                          position: 'absolute',
                          left: mediaClip.transform?.x || 0,
                          top: mediaClip.transform?.y || 0,
                          transform: `scale(${mediaClip.transform?.scaleX || 1}, ${mediaClip.transform?.scaleY || 1}) rotate(${mediaClip.transform?.rotation || 0}deg)`,
                          transformOrigin: `${(mediaClip.transform?.anchorX || 0.5) * 100}% ${(mediaClip.transform?.anchorY || 0.5) * 100}%`,
                          width: '100%', 
                          height: '100%' 
                        }} 
                        volume={mediaClip.volume ?? 1}
                      />;
                    })()}
                    {clip.type === 'audio' && (
                      <Audio src={(clip as any).src || ''} volume={(clip as any).volume ?? 1} />
                    )}
                    {clip.type === 'image' && (() => {
                      const mediaClip = clip as any;
                      return <Img 
                        src={mediaClip.src || ''} 
                        style={{ 
                          position: 'absolute',
                          left: mediaClip.transform?.x || 0,
                          top: mediaClip.transform?.y || 0,
                          transform: `scale(${mediaClip.transform?.scaleX || 1}, ${mediaClip.transform?.scaleY || 1}) rotate(${mediaClip.transform?.rotation || 0}deg)`,
                          transformOrigin: `${(mediaClip.transform?.anchorX || 0.5) * 100}% ${(mediaClip.transform?.anchorY || 0.5) * 100}%`,
                          width: '100%', 
                          height: '100%' 
                        }} 
                      />;
                    })()}
                    {clip.type === 'text' && (() => {
                       const textClip = clip as any;
                       return (
                         <div
                           style={{
                             position: 'absolute',
                             left: textClip.transform?.x || width / 2,
                             top: textClip.transform?.y || height / 2,
                             transform: 'translate(-50%, -50%)',
                             fontFamily: textClip.style?.fontFamily || 'Arial',
                             fontSize: `${textClip.style?.fontSize || 48}px`,
                             color: textClip.style?.color || '#ffffff',
                             fontWeight: textClip.style?.fontWeight || 'bold',
                             textAlign: 'center',
                             ...textClip.style,
                           }}
                         >
                           {textClip.content}
                         </div>
                       );
                    })()}
                  </Sequence>
                );
              })}
            </AbsoluteFill>
          );
      })}
    </AbsoluteFill>
  );
};
