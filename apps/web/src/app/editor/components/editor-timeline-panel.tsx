"use client";

import { SlidersHorizontal, Scissors, MoveHorizontal } from "lucide-react";
import { Timeline } from "@/components/editor/Timeline";

interface EditorTimelinePanelProps {
    projectClipCount: number;
}

export function EditorTimelinePanel({ projectClipCount }: EditorTimelinePanelProps) {
    return (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Step 4</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Timeline polish</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Trim, split, drag, and refine the flow. The preview above stays locked to the same project state.
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-slate-300">
                    <MoveHorizontal className="h-5 w-5" />
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Clips on timeline" value={`${projectClipCount}`} />
                <Metric label="Editing tools" value="Select, blade, snap" />
                <Metric label="Tip" value="Use the inspector to fine-tune the selected clip" />
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/30 p-3">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                    <Scissors className="h-4 w-4" />
                    Timeline
                    <SlidersHorizontal className="ml-2 h-4 w-4" />
                </div>
                <div className="overflow-hidden rounded-[20px] border border-white/10">
                    <Timeline />
                </div>
            </div>
        </section>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-white">{value}</p>
        </div>
    );
}

