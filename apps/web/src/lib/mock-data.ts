import type { DashboardProject, TranscriptWord } from "@video-editor/shared";

/* ── Mock Projects ──────────────────────────────────── */

export const MOCK_PROJECTS: DashboardProject[] = [
    {
        id: "proj-1",
        title: "Why AI Will Change Everything",
        status: "done",
        video_url: "/sample.mp4",
        template_id: "clean-creator",
        video_template_id: null,
        hook_text: "This will blow your mind 🤯",
        cta_text: "Follow for more AI tips!",
        accent_color: "#6366F1",
        duration_sec: 15,
        metadata: {},
        created_at: "2026-03-08T10:00:00Z",
        updated_at: "2026-03-08T10:05:00Z",
    },
    {
        id: "proj-2",
        title: "5 Productivity Hacks",
        status: "processing",
        video_url: "/sample.mp4",
        template_id: "viral-punch",
        video_template_id: null,
        hook_text: "Stop wasting time ⏰",
        cta_text: "Subscribe for more!",
        accent_color: "#F43F5E",
        duration_sec: 18,
        metadata: {},
        created_at: "2026-03-07T14:30:00Z",
        updated_at: "2026-03-07T14:35:00Z",
    },
    {
        id: "proj-3",
        title: "How to Build a SaaS",
        status: "draft",
        video_url: null,
        template_id: null,
        video_template_id: null,
        hook_text: "",
        cta_text: "",
        accent_color: "#0EA5E9",
        duration_sec: null,
        metadata: {},
        created_at: "2026-03-06T09:00:00Z",
        updated_at: "2026-03-06T09:00:00Z",
    },
];

/* ── Mock Transcript ────────────────────────────────── */

export const MOCK_TRANSCRIPT: TranscriptWord[] = [
    { word: "Hey", start: 2.0, end: 2.3 },
    { word: "everyone,", start: 2.3, end: 2.6 },
    { word: "today", start: 2.6, end: 2.9 },
    { word: "I", start: 2.9, end: 3.0 },
    { word: "want", start: 3.0, end: 3.2 },
    { word: "to", start: 3.2, end: 3.3 },
    { word: "talk", start: 3.3, end: 3.5 },
    { word: "about", start: 3.5, end: 3.8 },
    { word: "something", start: 3.8, end: 4.2 },
    { word: "that", start: 4.2, end: 4.4 },
    { word: "will", start: 4.4, end: 4.6 },
    { word: "completely", start: 4.6, end: 5.1 },
    { word: "change", start: 5.1, end: 5.4 },
    { word: "how", start: 5.4, end: 5.6 },
    { word: "you", start: 5.6, end: 5.7 },
    { word: "create", start: 5.7, end: 6.0 },
    { word: "content.", start: 6.0, end: 6.4 },
    { word: "Artificial", start: 6.8, end: 7.3 },
    { word: "intelligence", start: 7.3, end: 7.9 },
    { word: "is", start: 7.9, end: 8.0 },
    { word: "not", start: 8.0, end: 8.2 },
    { word: "just", start: 8.2, end: 8.4 },
    { word: "a", start: 8.4, end: 8.5 },
    { word: "buzzword", start: 8.5, end: 9.0 },
    { word: "anymore.", start: 9.0, end: 9.4 },
    { word: "It's", start: 9.6, end: 9.8 },
    { word: "actually", start: 9.8, end: 10.2 },
    { word: "transforming", start: 10.2, end: 10.8 },
    { word: "every", start: 10.8, end: 11.1 },
    { word: "single", start: 11.1, end: 11.4 },
    { word: "industry", start: 11.4, end: 11.9 },
    { word: "out", start: 11.9, end: 12.1 },
    { word: "there.", start: 12.1, end: 12.4 },
];

/* ── Mock Zoom Timestamps ───────────────────────────── */

export const MOCK_ZOOM_TIMESTAMPS: number[] = [5.0, 9.0];
