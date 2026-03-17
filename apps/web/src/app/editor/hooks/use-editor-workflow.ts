"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "@video-editor/editor-core";
import { ensureDefaultTracks } from "@video-editor/timeline-schema";
import type { Asset, MediaClip, Project } from "@video-editor/timeline-schema";
import type { TranscriptWord } from "@video-editor/shared";
import {
    appendClipsToTrack,
    buildCaptionGroups,
    captionGroupsToClips,
    clearTrack,
    createIdleRenderSummary,
    createAssetFromUpload,
    createBlankEditorProject,
    getCaptionTrack,
    getMainVideoTrack,
    getPreferredRenderJob,
    insertResourceClip,
    mergeRecentRenderJobs,
    normalizeRecentRenderJobs,
    projectHasTrackClips,
    replaceMainSourceClip,
    renderJobToSummary,
    summarizeProject,
    type EditorWorkflowStep,
    type MediaMetadata,
    type RecentRenderJob,
    type RenderSummary,
    type SourceSummary,
} from "../lib/editor-workflow";

const LOCAL_STORAGE_PREFIX = "video-editor-project";

type UploadResult = {
    url: string;
    mimeType?: string;
    size: number;
};

async function uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok || !data?.url) {
        throw new Error(data?.error || "Upload failed");
    }

    return {
        url: data.url as string,
        mimeType: data.mimeType as string | undefined,
        size: data.size as number,
    };
}

function storageKey(projectId: string) {
    return `${LOCAL_STORAGE_PREFIX}:${projectId}`;
}

async function probeMediaUrl(url: string): Promise<MediaMetadata> {
    return await new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.src = url;

        const finish = (meta: MediaMetadata) => {
            cleanup();
            resolve(meta);
        };

        const cleanup = () => {
            video.removeAttribute("src");
            video.load();
        };

        video.addEventListener("loadedmetadata", () => {
            finish({
                durationMs: Number.isFinite(video.duration)
                    ? Math.round(video.duration * 1000)
                    : 0,
                width: video.videoWidth || null,
                height: video.videoHeight || null,
                hasAudio: "unknown",
            });
        });

        video.addEventListener("error", () => {
            finish({
                durationMs: 0,
                width: null,
                height: null,
                hasAudio: "unknown",
            });
        });
    });
}

async function probeImageUrl(url: string): Promise<MediaMetadata> {
    return await new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";

        image.onload = () => {
            resolve({
                durationMs: 5000,
                width: image.naturalWidth || null,
                height: image.naturalHeight || null,
                hasAudio: false,
            });
        };

        image.onerror = () => {
            resolve({
                durationMs: 5000,
                width: null,
                height: null,
                hasAudio: false,
            });
        };

        image.src = url;
    });
}

function buildSourceSummary(name: string, url: string, metadata: MediaMetadata, mimeType?: string): SourceSummary {
    return {
        name,
        url,
        mimeType,
        ...metadata,
    };
}

function chooseFirstIncompleteStep(project: Project | null, transcriptWords: TranscriptWord[], render: RenderSummary): EditorWorkflowStep {
    if (!project) return "source";
    const summary = summarizeProject(project);
    if (!summary.hasSourceClip) return "source";
    if (!transcriptWords.length && summary.captions === 0) return "captions";
    if (summary.resources === 0) return "resources";
    if (render.status === "queued" || render.status === "rendering" || render.status === "done" || render.status === "failed") {
        return "render";
    }
    return "timeline";
}

export function useEditorWorkflow() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const routeProjectId = searchParams.get("project");

    const {
        project,
        setProject,
        playheadMs,
        selectedClipId,
        selectClip,
        isPlaying,
        setIsPlaying,
        setPlayhead,
        updateClip,
        addClip,
        deleteClip,
        trimClip,
        setActiveTool,
        setSnappingEnabled,
        activeTool,
        snappingEnabled,
    } = useEditorStore();

    const [projectId, setProjectId] = useState<string | null>(routeProjectId);
    const [isBootstrapping, setIsBootstrapping] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [sourceSummary, setSourceSummary] = useState<SourceSummary | null>(null);
    const [transcriptWords, setTranscriptWords] = useState<TranscriptWord[]>([]);
    const [renderSummary, setRenderSummary] = useState<RenderSummary>(createIdleRenderSummary());
    const [recentRenderJobs, setRecentRenderJobs] = useState<RecentRenderJob[]>([]);
    const [activeStep, setActiveStep] = useState<EditorWorkflowStep>("source");

    const createdDraftRef = useRef(false);
    const lastSavedSerializedRef = useRef<string>("");
    const hasInitialisedStepRef = useRef(false);
    const renderPollRef = useRef<number | null>(null);
    const recentRenderJobsRef = useRef<RecentRenderJob[]>([]);

    useEffect(() => {
        return () => {
            if (renderPollRef.current) {
                window.clearInterval(renderPollRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setProjectId(routeProjectId);
    }, [routeProjectId]);

    useEffect(() => {
        recentRenderJobsRef.current = recentRenderJobs;
    }, [recentRenderJobs]);

    useEffect(() => {
        if (renderPollRef.current) {
            window.clearInterval(renderPollRef.current);
            renderPollRef.current = null;
        }
    }, [projectId]);

    useEffect(() => {
        if (routeProjectId || createdDraftRef.current) return;

        createdDraftRef.current = true;
        (async () => {
            try {
                const res = await fetch("/api/projects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: "Untitled edit" }),
                });
                const data = await res.json().catch(() => null);
                if (!res.ok || !data?.ok || !data?.project?.id) {
                    throw new Error(data?.error || "Failed to create a draft project");
                }

                const nextProjectId = data.project.id as string;
                setProjectId(nextProjectId);
                router.replace(`/editor?project=${nextProjectId}`);
            } catch (error: any) {
                setLoadError(error?.message ?? "Failed to create an editor project");
            }
        })();
    }, [routeProjectId, router]);

    useEffect(() => {
        if (!projectId) return;
        const activeProjectId = projectId;

        let cancelled = false;

        function commitRenderJobs(
            jobs: RecentRenderJob[],
            preferredJobId?: string | null
        ) {
            const normalized = normalizeRecentRenderJobs(jobs);
            recentRenderJobsRef.current = normalized;
            setRecentRenderJobs(normalized);

            const preferredJob =
                (preferredJobId
                    ? normalized.find((job) => job.id === preferredJobId) ?? null
                    : null) ?? getPreferredRenderJob(normalized);
            const nextSummary = renderJobToSummary(preferredJob);
            setRenderSummary(nextSummary);
            return { jobs: normalized, summary: nextSummary, preferredJob };
        }

        async function bootstrap() {
            setIsBootstrapping(true);
            setLoadError(null);

            try {
                const [projectRes, timelineRes, renderJobsRes, localDraft] = await Promise.all([
                    fetch(`/api/projects/${activeProjectId}`),
                    fetch(`/api/project-timeline?projectId=${activeProjectId}`),
                    fetch(`/api/render-jobs?projectId=${activeProjectId}&limit=5`),
                    Promise.resolve(typeof window !== "undefined" ? localStorage.getItem(storageKey(activeProjectId)) : null),
                ]);

                const projectData = await projectRes.json().catch(() => null);
                const timelineData = await timelineRes.json().catch(() => null);
                const renderJobsData = await renderJobsRes.json().catch(() => null);

                const dbProject = projectRes.ok && projectData?.project ? projectData.project : null;
                const transcript = projectRes.ok && projectData?.transcript ? projectData.transcript : null;
                const transcriptFromProject = transcript?.transcript_words?.length
                    ? (transcript.transcript_words as Array<
                          | { word: string; start_sec: number; end_sec: number; sort_order: number }
                          | { word: string; start: number; end: number }
                      >)
                          .map((word) => ({
                              word: word.word,
                              start: "start" in word ? word.start : word.start_sec,
                              end: "end" in word ? word.end : word.end_sec,
                              sortOrder: "sort_order" in word ? word.sort_order : 0,
                          }))
                          .sort((a, b) => a.sortOrder - b.sortOrder || a.start - b.start)
                          .map(({ word, start, end }) => ({ word, start, end }))
                    : [];

                let nextProject: Project | null = null;

                if (timelineRes.ok && timelineData?.timeline) {
                    nextProject = ensureDefaultTracks(timelineData.timeline as Project);
                } else if (localDraft) {
                    try {
                        nextProject = ensureDefaultTracks(JSON.parse(localDraft) as Project);
                    } catch {
                        nextProject = null;
                    }
                }

                if (!nextProject) {
                    nextProject = createBlankEditorProject(activeProjectId, dbProject?.title ?? "Untitled edit");
                }

                if (nextProject.id !== activeProjectId) {
                    nextProject = {
                        ...nextProject,
                        id: activeProjectId,
                    };
                }

                if (dbProject?.video_url && !projectHasTrackClips(nextProject, "video_main", "Main Video")) {
                    const videoUrl = dbProject.video_url as string;
                    const metadata =
                        videoUrl.endsWith(".png") ||
                        videoUrl.endsWith(".jpg") ||
                        videoUrl.endsWith(".jpeg") ||
                        videoUrl.endsWith(".webp")
                            ? await probeImageUrl(videoUrl)
                            : await probeMediaUrl(videoUrl);
                    const asset = createAssetFromUpload({
                        name: dbProject.title ? `${dbProject.title} source` : "Source video",
                        type: "video",
                        url: videoUrl,
                        durationMs: metadata.durationMs || nextProject.settings.durationMs,
                        metadata: {
                            width: metadata.width ?? undefined,
                            height: metadata.height ?? undefined,
                        },
                    });
                    const mainClip = {
                        id: uuidv4(),
                        type: "video",
                        assetId: asset.id,
                        startAtMs: 0,
                        durationMs: asset.durationMs || nextProject.settings.durationMs,
                        sourceStartMs: 0,
                        volume: 1,
                        transform: {
                            x: nextProject.settings.width / 2,
                            y: nextProject.settings.height / 2,
                            scaleX: 1,
                            scaleY: 1,
                            rotation: 0,
                            anchorX: 0.5,
                            anchorY: 0.5,
                        },
                    } as MediaClip;
                    nextProject = replaceMainSourceClip(nextProject, mainClip, asset);
                    setSourceSummary(buildSourceSummary(asset.name, asset.url, metadata, "video/mp4"));
                } else if (dbProject?.video_url) {
                    const maybeExistingAsset =
                        Object.values(nextProject.assets).find((asset) => asset.type === "video") ?? null;
                    if (maybeExistingAsset) {
                        const videoAsset = maybeExistingAsset as Asset & { type: "video"; url: string };
                        setSourceSummary(
                            buildSourceSummary(
                                videoAsset.name,
                                videoAsset.url ?? "",
                                {
                                    durationMs: videoAsset.durationMs,
                                    width: videoAsset.metadata?.width ?? null,
                                    height: videoAsset.metadata?.height ?? null,
                                    hasAudio: "unknown",
                                },
                                "video/mp4"
                            )
                        );
                    }
                }

                if (transcriptFromProject.length) {
                    setTranscriptWords(transcriptFromProject);
                    const captionTrack = getCaptionTrack(nextProject);
                    if (!captionTrack.clips.length) {
                        nextProject = appendClipsToTrack(
                            nextProject,
                            captionTrack.id,
                            captionGroupsToClips(buildCaptionGroups(transcriptFromProject), nextProject)
                        );
                    }
                }

                if (!sourceSummary) {
                    const mainClip = getMainVideoTrack(nextProject).clips[0] as MediaClip | undefined;
                    if (mainClip?.assetId) {
                        const asset = nextProject.assets[mainClip.assetId];
                        if (asset) {
                            setSourceSummary({
                                name: asset.name,
                                url: asset.url ?? "",
                                mimeType: "video/mp4",
                                durationMs: asset.durationMs,
                                width: asset.metadata?.width ?? null,
                                height: asset.metadata?.height ?? null,
                                hasAudio: asset.type === "audio" ? true : "unknown",
                            });
                        }
                    }
                }

                nextProject = ensureDefaultTracks(nextProject);
                const renderJobs =
                    renderJobsRes.ok && Array.isArray(renderJobsData?.jobs)
                        ? (renderJobsData.jobs as RecentRenderJob[])
                        : [];
                const activeRenderJob =
                    renderJobsRes.ok && renderJobsData?.activeJob
                        ? (renderJobsData.activeJob as RecentRenderJob)
                        : null;
                const initialRenderJobs = activeRenderJob
                    ? mergeRecentRenderJobs(renderJobs, [activeRenderJob])
                    : renderJobs;
                const preferredJob =
                    (activeRenderJob
                        ? initialRenderJobs.find((job) => job.id === activeRenderJob.id) ?? null
                        : null) ?? getPreferredRenderJob(initialRenderJobs);
                const initialRenderSummary = renderJobToSummary(preferredJob);

                if (!cancelled) {
                    setProject(nextProject);
                    lastSavedSerializedRef.current = JSON.stringify(nextProject);
                    commitRenderJobs(initialRenderJobs, preferredJob?.id ?? null);
                    setActiveStep(chooseFirstIncompleteStep(nextProject, transcriptFromProject, initialRenderSummary));

                    if (preferredJob && (preferredJob.status === "queued" || preferredJob.status === "rendering")) {
                        startRenderPolling(preferredJob.id);
                    }
                }
            } catch (error: any) {
                if (!cancelled) {
                    setLoadError(error?.message ?? "Failed to bootstrap the editor");
                    commitRenderJobs([]);
                }
            } finally {
                if (!cancelled) {
                    setIsBootstrapping(false);
                }
            }
        }

        bootstrap();

        return () => {
            cancelled = true;
        };
        // renderSummary intentionally excluded so the bootstrap flow doesn't fight render state updates.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, setProject]);

    useEffect(() => {
        if (!projectId || !project) return;

        const serialized = JSON.stringify(project);
        if (serialized === lastSavedSerializedRef.current || isBootstrapping) return;

        const timeout = window.setTimeout(() => {
            void saveProject();
        }, 1000);

        return () => window.clearTimeout(timeout);
        // saveProject is intentionally omitted because it is re-created below with stable deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, project, isBootstrapping]);

    useEffect(() => {
        if (!project) return;
        if (hasInitialisedStepRef.current) return;

        hasInitialisedStepRef.current = true;
        setActiveStep(chooseFirstIncompleteStep(project, transcriptWords, renderSummary));
    }, [project, transcriptWords, renderSummary]);

    useEffect(() => {
        if (!project) return;
        if (!transcriptWords.length) return;

        const nextStep = chooseFirstIncompleteStep(project, transcriptWords, renderSummary);
        if (activeStep === "source" && nextStep !== "source") {
            setActiveStep(nextStep);
        }
    }, [activeStep, project, transcriptWords, renderSummary]);

    async function saveProject() {
        if (!projectId || !project) return;

        setSaveStatus("saving");
        try {
            const nextProject = {
                ...project,
                updatedAt: new Date().toISOString(),
            };
            setProject(nextProject);
            lastSavedSerializedRef.current = JSON.stringify(nextProject);

            if (typeof window !== "undefined") {
                localStorage.setItem(storageKey(projectId), JSON.stringify(nextProject));
            }

            const response = await fetch("/api/project-timeline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, timeline: nextProject }),
            });

            setSaveStatus(response.ok ? "saved" : "error");
        } catch {
            setSaveStatus("error");
        } finally {
            window.setTimeout(() => setSaveStatus("idle"), 1800);
        }
    }

    async function patchProjectSourceUrl(videoUrl: string) {
        if (!projectId) return;
        await fetch(`/api/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoUrl }),
        });
    }

    async function importSourceFile(file: File) {
        if (!project) return;
        const upload = await uploadFile(file);
        const metadata = file.type.startsWith("image/")
            ? await probeImageUrl(upload.url)
            : await probeMediaUrl(upload.url);
        const asset = createAssetFromUpload({
            name: file.name,
            type: file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "video",
            url: upload.url,
            durationMs: metadata.durationMs || project.settings.durationMs,
            metadata: {
                width: metadata.width ?? undefined,
                height: metadata.height ?? undefined,
            },
        });

        const mainClip = {
            id: uuidv4(),
            type: asset.type,
            assetId: asset.id,
            startAtMs: 0,
            durationMs: asset.durationMs || project.settings.durationMs,
            sourceStartMs: 0,
            volume: 1,
            transform: asset.type === "audio"
                ? undefined
                : {
                      x: project.settings.width / 2,
                      y: project.settings.height / 2,
                      scaleX: 1,
                      scaleY: 1,
                      rotation: 0,
                      anchorX: 0.5,
                      anchorY: 0.5,
                  },
        } as MediaClip;

        if (projectId && asset.type === "video") {
            await patchProjectSourceUrl(asset.url);
        }

        const nextProject =
            asset.type === "video"
                ? replaceMainSourceClip(project, mainClip, asset)
                : asset.type === "image"
                    ? insertResourceClip(project, asset, "broll", playheadMs)
                    : insertResourceClip(project, asset, "music", playheadMs);

        setProject(nextProject);
        setSourceSummary(buildSourceSummary(file.name, asset.url, metadata, upload.mimeType));

        if (!transcriptWords.length && asset.type === "video") {
            setActiveStep("captions");
        }
    }

    async function importResourceFile(file: File, resourceType: "vfx" | "sfx" | "broll" | "music") {
        if (!project) return;
        const upload = await uploadFile(file);
        const metadata = file.type.startsWith("image/") ? await probeImageUrl(upload.url) : await probeMediaUrl(upload.url);
        const asset = createAssetFromUpload({
            name: file.name,
            type: file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "video",
            url: upload.url,
            durationMs: metadata.durationMs || 3000,
            metadata: {
                width: metadata.width ?? undefined,
                height: metadata.height ?? undefined,
            },
        });

        const nextProject = insertResourceClip(project, asset, resourceType, playheadMs);
        setProject(nextProject);

        if (projectId) {
            await fetch("/api/project-timeline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    timeline: nextProject,
                }),
            });
        }
    }

    async function addLibraryAssetToTimeline(
        resourceType: "vfx" | "sfx" | "broll" | "music",
        asset: Asset,
        config?: Record<string, unknown>
    ) {
        if (!project) return;

        const nextProject = insertResourceClip(project, asset, resourceType, playheadMs, {
            durationMs:
                resourceType === "vfx"
                    ? Math.max(800, Number(asset.durationMs || 1000))
                    : asset.durationMs,
            config,
        });

        setProject(nextProject);

        if (projectId) {
            await fetch("/api/project-timeline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    timeline: nextProject,
                }),
            });
        }
    }

    async function transcribeProject() {
        if (!projectId) return;

        const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok) {
            throw new Error(data?.error || "Transcription failed");
        }

        const projectRes = await fetch(`/api/projects/${projectId}`);
        const projectData = await projectRes.json().catch(() => null);
        const transcript = projectData?.transcript?.transcript_words?.length
            ? (projectData.transcript.transcript_words as Array<
                  | { word: string; start_sec: number; end_sec: number; sort_order: number }
                  | { word: string; start: number; end: number }
              >)
                  .map((word) => ({
                      word: word.word,
                      start: "start" in word ? word.start : word.start_sec,
                      end: "end" in word ? word.end : word.end_sec,
                      sortOrder: "sort_order" in word ? word.sort_order : 0,
                  }))
                  .sort((a, b) => a.sortOrder - b.sortOrder || a.start - b.start)
                  .map(({ word, start, end }) => ({ word, start, end }))
            : [];

        setTranscriptWords(transcript);

        if (project) {
            const captionTrack = getCaptionTrack(project);
            const nextProject = clearTrack(project, captionTrack.id);
            const seeded = appendClipsToTrack(nextProject, captionTrack.id, captionGroupsToClips(buildCaptionGroups(transcript), nextProject));
            setProject(seeded);
            setActiveStep("captions");
        }

        return transcript;
    }

    function startRenderPolling(jobId: string) {
        if (renderPollRef.current) {
            window.clearInterval(renderPollRef.current);
        }

        renderPollRef.current = window.setInterval(async () => {
            try {
                const response = await fetch(`/api/render-jobs?jobId=${jobId}`);
                const data = await response.json().catch(() => null);

                if (!response.ok || !data?.ok || !data?.job) {
                    return;
                }

                const nextJob = data.job as RecentRenderJob;
                const nextJobs = mergeRecentRenderJobs(recentRenderJobsRef.current, [nextJob]);
                recentRenderJobsRef.current = nextJobs;
                setRecentRenderJobs(nextJobs);
                setRenderSummary(renderJobToSummary(nextJob));

                if (nextJob.status === "done" || nextJob.status === "failed") {
                    if (renderPollRef.current) {
                        window.clearInterval(renderPollRef.current);
                        renderPollRef.current = null;
                    }
                }
            } catch {
                // Poll failures are non-fatal while a long-running render is in flight.
            }
        }, 2000);
    }

    async function queueRender() {
        if (!project) return;

        await saveProject();
        const activeRenderJob = recentRenderJobsRef.current.find(
            (job) => job.status === "queued" || job.status === "rendering"
        );

        const response = await fetch("/api/export", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                project,
                renderJobId: activeRenderJob?.id,
            }),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
            throw new Error(data?.error || "Render queue failed");
        }

        const nextJob = data.job as RecentRenderJob | undefined;
        if (nextJob) {
            const nextJobs = mergeRecentRenderJobs(recentRenderJobsRef.current, [nextJob]);
            recentRenderJobsRef.current = nextJobs;
            setRecentRenderJobs(nextJobs);
            setRenderSummary(renderJobToSummary(nextJob));
            if (nextJob.status === "queued" || nextJob.status === "rendering") {
                startRenderPolling(nextJob.id);
            }
        }
        setActiveStep("render");
    }

    return {
        projectId,
        project,
        isBootstrapping,
        loadError,
        saveStatus,
        sourceSummary,
        transcriptWords,
        renderSummary,
        recentRenderJobs,
        activeStep,
        setActiveStep,
        setProject,
        activeTool,
        snappingEnabled,
        selectedClipId,
        playheadMs,
        isPlaying,
        setPlayhead,
        setIsPlaying,
        selectClip,
        addClip,
        updateClip,
        deleteClip,
        trimClip,
        setActiveTool,
        setSnappingEnabled,
        saveProject,
        importSourceFile,
        importResourceFile,
        transcribeProject,
        addLibraryAssetToTimeline,
        queueRender,
    };
}
