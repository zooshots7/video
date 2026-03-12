"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { createClientSupabase } from "@/lib/supabase-browser";

interface BRollUploaderProps {
    projectId: string;
    onUploadComplete: (broll: any) => void;
}

export function BRollUploader({ projectId, onUploadComplete }: BRollUploaderProps) {
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { showToast } = useToast();

    async function handleFile(file: File) {
        if (!file || uploading) return;
        
        if (!file.type.startsWith("video/")) {
            showToast("Please upload a video file.", "error");
            return;
        }

        setUploading(true);
        setProgress(10);
        
        try {
            // 1. Upload file
            const formData = new FormData();
            formData.append("video", file);

            setProgress(30);
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok || !uploadData.ok) {
                throw new Error(uploadData.error || "Upload failed");
            }

            setProgress(60);

            // 2. Save to broll_clips
            const supabase = createClientSupabase();
            
            const brollId = crypto.randomUUID();
            
            // Note: duration_ms and resolution ideally would be parsed locally before upload (e.g. using a hidden video element),
            // but for MVP we insert stub values that can be updated later by a worker
            const { data: brollData, error: insertError } = await supabase
                .from("broll_clips")
                .insert({
                    id: brollId,
                    slug: `broll-${Date.now()}`,
                    name: file.name,
                    file_url: uploadData.url,
                    duration_ms: 5000, 
                    resolution: "1920x1080",
                    aspect_ratio: "16:9",
                })
                .select()
                .single();

            if (insertError) {
                throw new Error(`Failed to save broll data: ${insertError.message}`);
            }
            
            setProgress(80);

            // 3. Link to project as a project_asset (default to start of timeline)
            const { data: assetData, error: assetError } = await supabase
                .from("project_assets")
                .insert({
                    project_id: projectId,
                    asset_type: "broll",
                    asset_id: brollId,
                    start_sec: 0,
                    end_sec: 5,
                    config: {}
                })
                .select()
                .single();
                
            if (assetError) {
                throw new Error("Failed to link B-roll to project timeline");
            }

            setProgress(100);
            showToast("B-roll uploaded successfully!", "success");
            onUploadComplete(brollData);

        } catch (err: any) {
            showToast(err.message || "Failed to upload B-Roll", "error");
        } finally {
            setUploading(false);
            setProgress(0);
        }
    }

    return (
        <div className="space-y-2">
            <h3 className="text-sm rounded-t-lg font-semibold text-slate-200">
                Supplementary B-Roll
            </h3>
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const dropped = e.dataTransfer.files[0];
                    if (dropped) handleFile(dropped);
                }}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
                    uploading
                        ? "border-accent/40 bg-accent/5 pointer-events-none"
                        : dragOver
                        ? "border-accent bg-accent/5"
                        : "border-surface-border hover:border-accent/40 hover:bg-surface-hover/30"
                }`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center justify-center w-full">
                        <p className="text-xs text-slate-400 mb-2">Uploading ({progress}%)</p>
                        <div className="w-full h-1.5 overflow-hidden rounded-full bg-surface">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-pink transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                            <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <p className="text-xs text-slate-400 text-center">
                            <span className="font-medium text-accent">Upload B-Roll</span><br />
                            Drag and drop videos here
                        </p>
                        <input 
                            type="file" 
                            accept="video/*" 
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file);
                            }} 
                            className="absolute inset-0 cursor-pointer opacity-0" 
                        />
                    </>
                )}
            </div>
        </div>
    );
}
