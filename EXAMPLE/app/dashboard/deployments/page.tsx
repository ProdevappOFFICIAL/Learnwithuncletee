"use client";

import { useState } from "react";
import { Plus, Server, Zap, X, Globe, Terminal, Hash } from "lucide-react";
import { GrDeploy } from "react-icons/gr";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Deployment {
    id: string;
    name: string;
    environment: string;
    port: number;
    createdAt: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DeploymentPage() {
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [deploying, setDeploying] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        environment: "production",
        port: "8787",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "Deployment name is required.";
        if (!form.port || isNaN(Number(form.port))) e.port = "Port must be a valid number.";
        return e;
    };

    const handleCreate = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }

        const newDeployment: Deployment = {
            id: crypto.randomUUID(),
            name: form.name.trim(),
            environment: form.environment,
            port: Number(form.port),
            createdAt: new Date().toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }),
        };

        setDeployments((prev) => [newDeployment, ...prev]);
        setForm({ name: "", environment: "production", port: "8787" });
        setErrors({});
        setShowDialog(false);
    };

    const handleDeployNow = (id: string) => {
        setDeploying(id);
        setTimeout(() => setDeploying(null), 2000);
    };

    const envColors: Record<string, { bg: string; text: string; border: string }> = {
        production: { bg: "bg-blue-400/10", text: "text-blue-600", border: "border-blue-200" },
        staging: { bg: "bg-yellow-400/10", text: "text-yellow-600", border: "border-yellow-200" },
        development: { bg: "bg-green-400/10", text: "text-green-600", border: "border-green-200" },
    };

    return (
        <div className="h-full text-[#6b6b6b] font-sans ">
            <div className="mx-auto ">

                {/* Header */}
                <div className="flex items-center justify-between">

                    {deployments.length > 0 && (
                        <button
                            onClick={() => setShowDialog(true)}
                            className="flex items-center gap-2  bg-blue-400/10 text-blue-600 rounded px-4 py-2 hover:bg-blue-700/20 transition-colors"
                        >
                            <Plus size={14} /> New Deployment
                        </button>
                    )}
                </div>

                {/* Empty State */}
                {deployments.length === 0 ? (
                    <div className="bg-[#f9f9f9] border border-[#ededed] rounded p-16 flex flex-col items-center gap-5 text-center">
                        <div className="p-3 bg-[#f0f0f0] rounded w-fit">
                            <Server size={20} className="text-blue-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-[#1a1a1a]">No deployments yet</p>
                            <p className="text-xs max-w-xs leading-relaxed">
                                Create your first deployment environment to start running exams locally on your network.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDialog(true)}
                            className="flex items-center gap-2 text-sm bg-blue-400/10 text-blue-600 rounded px-5 py-2.5 hover:bg-blue-700/20 transition-colors mt-1"
                        >
                            <Plus size={14} /> Create Deployment
                        </button>
                    </div>
                ) : (
                    /* Deployments Table */
                    <div className="space-y-3 mt-4">

                        <div className="bg-[#f9f9f9] border border-[#ededed] rounded overflow-hidden">
                            <div className="grid grid-cols-5 px-4 py-3 border-b border-[#ededed] text-xs uppercase tracking-wider text-[#6b6b6b]">
                                <span className="col-span-2">Name</span>
                                <span>Environment</span>
                                <span>Port</span>
                                <span></span>
                            </div>
                            {deployments.map((dep, i) => {
                                const env = envColors[dep.environment] ?? envColors.production;
                                const isDeploying = deploying === dep.id;

                                return (
                                    <div
                                        key={dep.id}
                                        className={`grid grid-cols-5 px-4 py-4 items-center ${i < deployments.length - 1 ? "border-b border-[#ededed]" : ""}`}
                                    >
                                        {/* Name */}
                                        <div className="col-span-2 flex items-center gap-3">
                                            <div className="p-1.5 bg-[#f0f0f0] rounded">
                                                <GrDeploy size={12} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#1a1a1a]">{dep.name}</p>
                                                <p className="text-xs">{dep.createdAt}</p>
                                            </div>
                                        </div>

                                        {/* Environment */}
                                        <span className={`text-xs px-2 py-0.5 rounded w-fit border ${env.bg} ${env.text} ${env.border} capitalize`}>
                                            {dep.environment}
                                        </span>

                                        {/* Port */}
                                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#1a1a1a]">
                                            <Hash size={11} className="text-[#6b6b6b]" />
                                            {dep.port}
                                        </div>

                                        {/* Action */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => handleDeployNow(dep.id)}
                                                disabled={isDeploying}
                                                className="flex items-center gap-1.5 text-xs bg-blue-400/10 text-blue-600 rounded px-3 py-1.5 hover:bg-blue-700/20 transition-colors disabled:opacity-60"
                                            >
                                                <Zap size={11} />
                                                {isDeploying ? "Deploying…" : "Deploy Now"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Deployment Dialog */}
            {showDialog && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setShowDialog(false)}
                >
                    <div
                        className="bg-[#f9f9f9] border border-[#ededed] rounded p-6 max-w-sm w-[90%] shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Dialog Header */}
                        <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#f0f0f0] rounded">
                                    <Server size={16} className="text-blue-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-[#1a1a1a]">New Deployment</h4>
                                    <p className="text-xs mt-0.5">Configure your deployment environment.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDialog(false)}
                                className="p-1.5 hover:bg-[#f0f0f0] rounded transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[#1a1a1a]">Deployment Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Main Campus CBT Lab"
                                    value={form.name}
                                    onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: "" })); }}
                                    className="w-full text-sm bg-white border border-[#ededed] rounded px-3 py-2 text-[#1a1a1a] placeholder:text-[#b0b0b0] focus:outline-none focus:border-blue-300 transition-colors"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            {/* Environment */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[#1a1a1a]">Environment</label>
                                <div className="relative">
                                    <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" />
                                    <select
                                        value={form.environment}
                                        onChange={(e) => setForm(f => ({ ...f, environment: e.target.value }))}
                                        className="w-full text-sm bg-white border border-[#ededed] rounded pl-8 pr-3 py-2 text-[#1a1a1a] focus:outline-none focus:border-blue-300 transition-colors appearance-none"
                                    >
                                        <option value="production">Production</option>
                                        <option value="staging">Staging</option>
                                        <option value="development">Development</option>
                                    </select>
                                </div>
                            </div>

                            {/* Port */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[#1a1a1a]">Deployment Port</label>
                                <div className="relative">
                                    <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" />
                                    <input
                                        type="number"
                                        placeholder="8787"
                                        value={form.port}
                                        onChange={(e) => { setForm(f => ({ ...f, port: e.target.value })); setErrors(er => ({ ...er, port: "" })); }}
                                        className="w-full text-sm bg-white border border-[#ededed] rounded pl-8 pr-3 py-2 text-[#1a1a1a] placeholder:text-[#b0b0b0] focus:outline-none focus:border-blue-300 transition-colors font-mono"
                                    />
                                </div>
                                {errors.port && <p className="text-xs text-red-500">{errors.port}</p>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowDialog(false); setErrors({}); }}
                                className="flex-1 text-sm border border-[#ededed] rounded py-2 px-4 hover:bg-[#f0f0f0] transition-colors text-[#6b6b6b]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex-1 text-sm bg-blue-400/10 text-blue-600 rounded py-2 px-4 hover:bg-blue-700/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={13} /> Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}