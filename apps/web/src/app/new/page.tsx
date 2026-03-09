"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const canContinue = title.trim().length > 0 && file !== null && !uploading;

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped?.type === "video/mp4") {
            setFile(dropped);
            setError(null);
        } else {
            setError("Please upload an MP4 file.");
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const picked = e.target.files?.[0];
        if (picked) {
            setFile(picked);
            setError(null);
        }
    }

    async function handleContinue() {
        if (!file || !title.trim()) return;
        setUploading(true);
        setError(null);
        setProgress(10);

        try {
            // Step 1: Upload video
            setProgress(20);
            const formData = new FormData();
            formData.append("video", file);

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok || !uploadData.ok) {
                throw new Error(uploadData.error || "Upload failed");
            }

            setProgress(60);

            // Step 2: Create project in DB
            const projectRes = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    videoUrl: uploadData.url,
                }),
            });
            const projectData = await projectRes.json();

            if (!projectRes.ok || !projectData.ok) {
                throw new Error(projectData.error || "Failed to create project");
            }

            setProgress(100);

            // Step 3: Navigate to template selection with the project ID
            router.push(`/templates?project=${projectData.project.id}`);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            setUploading(false);
            setProgress(0);
        }
    }

    return (
        <div className="mx-auto max-w-xl space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    New Project
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                    Upload your vertical talking-head video to get started.
                </p>
            </div>

            <div className="glass-card space-y-6 p-6">
                {/* Title */}
                <div className="space-y-2">
                    <label
                        htmlFor="project-title"
                        className="text-sm font-medium text-slate-300"
                    >
                        Project Title
                    </label>
                    <input
                        id="project-title"
                        type="text"
                        placeholder="e.g. Why AI Will Change Everything"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={uploading}
                        className="w-full rounded-lg border border-surface-border bg-surface px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/40 disabled:opacity-50"
                    />
                </div>

                {/* Upload Area */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                        Upload Video
                    </label>
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${uploading
                                ? "border-accent/40 bg-accent/5 pointer-events-none"
                                : dragOver
                                    ? "border-accent bg-accent/5"
                                    : file
                                        ? "border-emerald-500/40 bg-emerald-500/5"
                                        : "border-surface-border hover:border-accent/40 hover:bg-surface-hover/30"
                            }`}
                    >
                        {file ? (
                            <>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                                    <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-emerald-400">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                {!uploading && (
                                    <button type="button" onClick={() => setFile(null)} className="text-xs text-slate-500 underline hover:text-slate-300">
                                        Remove
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                                    <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-400">
                                    <span className="font-medium text-accent">Click to upload</span>{" "}or drag and drop
                                </p>
                                <p className="text-xs text-slate-500">MP4 · Vertical (9:16) · Max 90 seconds</p>
                            </>
                        )}
                        {!file && !uploading && (
                            <input type="file" accept="video/mp4" onChange={handleFileChange} className="absolute inset-0 cursor-pointer opacity-0" />
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                {uploading && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                                {progress < 50 ? "Uploading video…" : progress < 90 ? "Creating project…" : "Almost done…"}
                            </span>
                            <span className="font-medium text-accent">{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-pink transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Continue */}
                <button
                    type="button"
                    disabled={!canContinue}
                    onClick={handleContinue}
                    className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                    {uploading ? "Processing…" : "Continue →"}
                </button>
            </div>
        </div>
    );
}
