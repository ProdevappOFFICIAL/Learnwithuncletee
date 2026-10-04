"use client";

import React, { useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { Monitor, Smartphone, Trash2, Clock, MapPin, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScaleLoader } from "react-spinners";

// ── Sessions Page ─────────────────────────────────────────────────────────────
const SessionsPage = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            // First verify token to get current sessionId
            const authRes = await authApi.verifyToken();
            if (authRes.success && authRes.data?.user?.sessionId) {
                setCurrentSessionId(authRes.data.user.sessionId);
            }

            const response = await authApi.getSessions();
            if (response.success) {
                setSessions(response.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch sessions:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevoke = async (id: string) => {
        const isCurrent = id === currentSessionId;
        const confirmMsg = isCurrent 
            ? "Are you sure you want to revoke your CURRENT session? You will be logged out immediately."
            : "Are you sure you want to revoke this session? You will be logged out on that device.";

        if (!confirm(confirmMsg)) return;
        
        setRevokingId(id);
        try {
            const response = await authApi.revokeSession(id);
            if (response.success) {
                if (isCurrent) {
                    await authApi.logout();
                } else {
                    setSessions(sessions.filter((s) => s.id !== id));
                }
            }
        } catch (err) {
            console.error("Failed to revoke session:", err);
        } finally {
            setRevokingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <ScaleLoader barCount={3} color="#a7a7a7" height={18} width={4} />
            </div>
        );
    }

    return (
        <div className="font-sans text-xs">
            {/* Section header */}
            <div className="mb-4">
                <p className="  text-[#0e0f10]">Active Sessions</p>
                <p className="text-[11px] text-[#6b6b6b] mt-0.5">
                    Manage and revoke active sessions across all your devices.
                </p>
            </div>

            {/* Session list */}
            <div className="border border-[#ededed] rounded-md overflow-hidden bg-white">
                {sessions.length === 0 ? (
                    <div className="py-12 text-center text-[#6b6b6b]">
                        No active sessions found.
                    </div>
                ) : (
                    <div className="divide-y divide-[#ededed]">
                        {sessions.map((session) => {
                            const isDesktop = session.deviceType === "desktop";
                            const isRevoking = revokingId === session.id;

                            return (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-[#f9f9f9] transition-colors group"
                                >
                                    {/* Left: icon + info */}
                                    <div className="flex items-center gap-3">
                                        {/* Device icon */}
                                        <div className="w-8 h-8 rounded bg-[#ededed] text-[#0e0f10] flex items-center justify-center flex-shrink-0">
                                            {isDesktop ? <Monitor size={15} /> : <Smartphone size={15} />}
                                        </div>

                                        {/* Text */}
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs  text-[#0e0f10]">
                                                    {session.deviceName ||
                                                        (isDesktop ? "LearningDeck Desktop" : "Web Browser")}
                                                </span>
                                                {session.id === currentSessionId && (
                                                    <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 font-medium">
                                                        Current Session
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-[11px] text-[#6b6b6b]">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} />
                                                    Last active{" "}
                                                    {formatDistanceToNow(new Date(session.lastUsedAt), { addSuffix: true })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Shield size={11} />
                                                    Expires{" "}
                                                    {formatDistanceToNow(new Date(session.expiresAt), { addSuffix: true })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={11} />
                                                    {session.deviceType.charAt(0).toUpperCase() + session.deviceType.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Revoke button */}
                                    <button
                                        onClick={() => handleRevoke(session.id)}
                                        disabled={isRevoking}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[11px]  transition-all ${isRevoking
                                            ? "border-[#ededed] text-[#6b6b6b] cursor-not-allowed bg-white"
                                            : "border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                                            }`}
                                    >
                                        {isRevoking ? (
                                            <ScaleLoader barCount={3} color="#a7a7a7" height={10} width={2} />
                                        ) : (
                                            <>
                                                <Trash2 size={12} />
                                                {session.id === currentSessionId ? "Logout" : "Revoke"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer note */}
            <p className="text-[11px] text-[#6b6b6b] mt-3">
                Revoking a session will immediately log out that device.
            </p>
        </div>
    );
};

export default SessionsPage;