# Architecture Audit

## Summary

The repo currently contains two competing product architectures:

1. A timeline-centric editor path built on `@video-editor/timeline-schema`, Zustand, Pixi preview, `/api/export`, and `workers/render`.
2. A template-centric short-form path built on DB project rows, `/api/render`, and the legacy `@video-editor/video` props contract.

Those systems are not interoperable. `/editor` is not the primary user flow, and the runtime code already bypasses the declared schema by mutating clips with ad hoc `src` fields.

## Canonical Decisions

- Canonical editing model: `@video-editor/timeline-schema` `Project`
- Canonical render flow: `/editor` -> save canonical project -> BullMQ -> `workers/render` -> Remotion composition in `@video-editor/video`
- Dashboard/database summary model: separate DB-facing types renamed away from `Project`
- Media resolution contract: timeline clips reference `assetId`; URLs resolve via `project.assets`

## Current Duplicates And Drift

- Two incompatible `Project` types with the same name
- Two render pipelines: queue worker path and in-process `/api/render`
- Two composition contracts: `{project}` vs `{sourceVideoUrl, templateConfig, ...}`
- Two timeline UIs: schema-based editor timeline and display-only review timeline
- Misnamed `/api/project-assets` route that actually stores timeline JSON

## Deprecations

- `apps/web/src/app/api/render/route.ts`
- `apps/web/src/app/review/page.tsx`
- `apps/web/src/components/VideoTimeline.tsx`
- `packages/export-adapter`
- Legacy `packages/video/src/types.ts` render contract
- Shared `Project` name in `packages/shared/src/types.ts`

## Migration Direction

- Move editor ownership into `/editor`
- Convert preview to use the same Remotion composition contract as final render
- Add explicit DB <-> editor project adapters
- Keep queue-based rendering and remove hard-coded duration/fps assumptions
