import { Worker, Job } from 'bullmq';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import fs from 'fs';
import Redis from 'ioredis';

// Reuse a single Redis connection across the app
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

async function processRenderJob(job: Job) {
  console.log(`[Worker] Started processing render job ${job.id}`);
  const project = job.data;

  try {
    // 1. Bundle the Remotion project
    // Note: The entry point points to the Root component we built in export-adapter
    const entryPoint = require.resolve('@video-editor/export-adapter/src/Root.tsx');
    console.log(`[Worker] Bundling entry point: ${entryPoint}`);
    
    // In a real production app, Webpack bundling can be slow. 
    // You'd typically use static bundling or separate AWS Lambdas.
    const serveUrl = await bundle(entryPoint, () => undefined, {
      webpackOverride: (config) => config,
    });

    console.log(`[Worker] Bundle finished. Serve URL: ${serveUrl}`);

    // 2. Extract Composition details
    const compositionId = 'Main';
    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps: { project },
    });

    // 3. Render the media to an mp4 file in the public folder for easy Next.js access
    const outputLocation = path.join(process.cwd(), 'public', 'renders', `project-${project.id}.mp4`);
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(outputLocation), { recursive: true });

    console.log(`[Worker] Starting render to ${outputLocation}...`);

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation,
      inputProps: { project },
      onProgress: (payload) => {
         console.log(`[Worker] Rendering... ${(payload.progress * 100).toFixed(1)}%`);
         // Here, you would emit WebSocket events or save to DB to update the frontend
         job.updateProgress(Math.round(payload.progress * 100));
      }
    });

    console.log(`[Worker] Finished processing job ${job.id}. Output: ${outputLocation}`);
    return { url: `/renders/project-${project.id}.mp4` };
    
  } catch (err: any) {
    console.error(`[Worker] Failed job ${job.id}:`, err);
    throw err;
  }
}

// Scaffold the worker to listen to the queue
const worker = new Worker('video-render-queue', processRenderJob, {
  connection: redisConnection as any,
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully!`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});

console.log('[Worker] Listening for video render jobs...');
