"use client";

import type { EditorWorkflowStep } from "../lib/editor-workflow";
import { WORKFLOW_STEPS } from "../lib/editor-workflow";

interface EditorStepperProps {
    activeStep: EditorWorkflowStep;
    onStepChange: (step: EditorWorkflowStep) => void;
    completed: Record<EditorWorkflowStep, boolean>;
}

export function EditorStepper({ activeStep, onStepChange, completed }: EditorStepperProps) {
    return (
        <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-3 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl md:grid-cols-5">
            {WORKFLOW_STEPS.map((step, index) => {
                const isActive = step.id === activeStep;
                const isComplete = completed[step.id];

                return (
                    <button
                        key={step.id}
                        type="button"
                        onClick={() => onStepChange(step.id)}
                        className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all ${
                            isActive
                                ? "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
                                : isComplete
                                    ? "border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-400/40"
                                    : "border-white/10 bg-black/20 hover:border-white/20"
                        }`}
                    >
                        <div
                            className={`absolute inset-y-0 left-0 w-1 ${
                                isActive
                                    ? "bg-gradient-to-b from-cyan-300 to-emerald-300"
                                    : isComplete
                                        ? "bg-emerald-400/70"
                                        : "bg-white/5"
                            }`}
                        />
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                                    isActive
                                        ? "bg-cyan-400 text-slate-950"
                                        : isComplete
                                            ? "bg-emerald-500 text-white"
                                            : "bg-white/10 text-slate-300"
                                }`}
                            >
                                {index + 1}
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-200"}`}>
                                    {step.title}
                                </p>
                                <p className="text-xs leading-5 text-slate-500 group-hover:text-slate-400">
                                    {step.blurb}
                                </p>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    {isActive ? "Current step" : isComplete ? "Completed" : "Upcoming"}
                                </p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
