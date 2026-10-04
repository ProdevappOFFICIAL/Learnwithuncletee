"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, PartyPopper, Sparkles } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { Toaster } from "sonner";
import Image from "next/image";
import { ScaleLoader } from "react-spinners";
import { billingApi } from "@/lib/api/billing";

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get("reference");
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const verifyAndRefresh = async (retries = 10) => {
            try {
                if (!reference) {
                    setStatus("error");
                    return;
                }

                // Wait a bit for webhook
                await new Promise(resolve => setTimeout(resolve, 3000));

                const verifyRes = await billingApi.verifyTransaction(reference);

                if (verifyRes.success && verifyRes.data) {
                    const { isPaid, subscriptionActive } = verifyRes.data;

                    // If paid but not active yet, retry
                    if (isPaid && !subscriptionActive && retries > 0) {
                        console.log(`Payment confirmed but subscription pending activation... retrying (${retries} left)`);
                        return verifyAndRefresh(retries - 1);
                    }

                    if (isPaid && subscriptionActive) {
                        // Finally refresh the token to get the user object updated
                        const authRes = await authApi.verifyToken();
                        if (authRes.success && authRes.data?.user) {
                            localStorage.setItem('user', JSON.stringify(authRes.data.user));
                            setStatus("success");

                            const timer = setInterval(() => {
                                setCountdown((prev) => {
                                    if (prev <= 1) {
                                        clearInterval(timer);
                                        router.push("/dashboard");
                                        return 0;
                                    }
                                    return prev - 1;
                                });
                            }, 1000);
                            return;
                        }
                    }
                }

                // If no more retries or failed verification
                if (retries === 0) {
                    setStatus("error");
                } else {
                    return verifyAndRefresh(retries - 1);
                }
            } catch (error) {
                console.error("Verification failed", error);
                if (retries > 0) return verifyAndRefresh(retries - 1);
                setStatus("error");
            }
        };

        verifyAndRefresh();
    }, [router, reference]);

    return (
        <div className="min-h-screen bg-white font-sans text-[#6b6b6b] flex flex-col items-center justify-center p-6">
            <Toaster />

            <div className="max-w-sm w-full space-y-6 relative">

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2.5">
                        <Image
                            src="https://avatars.githubusercontent.com/u/225484805?s=200&v=4"
                            alt="LearningDeck Logo"
                            width={24}
                            height={24}
                            className="rounded"
                        />
                        <span className="text-sm font-medium text-[#1a1a1a]">LearningDeck</span>
                    </div>
                </div>

                {/* Verifying */}
                {status === "verifying" && (
                    <div className="bg-[#f9f9f9] border border-[#ededed] rounded p-8 flex flex-col items-center gap-5 text-center">
                        <div className="p-3  rounded w-fit">
                            <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
                        </div>
                        <div className="space-y-1">

                            <p className="text-xs leading-relaxed">
                                We're confirming your payment and setting up your environment. Please don't close this window.
                            </p>
                        </div>
                    </div>
                )}

                {/* Success */}
                {status === "success" && (
                    <div className="space-y-4">
                        <div className="bg-[#f9f9f9] border border-[#ededed] rounded p-8 flex flex-col items-center gap-5 text-center">
                            <div className="p-3 bg-[#f0f0f0] rounded w-fit relative">
                                <PartyPopper size={20} className="text-blue-500" />
                                <div className="absolute -top-1.5 -right-1.5 bg-blue-400/10 text-blue-600 p-1 rounded">
                                    <Sparkles size={10} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h1 className="text-base font-medium text-[#1a1a1a]">Payment Successful!</h1>
                                <p className="text-xs leading-relaxed">
                                    Your subscription is now active. Your workspace has been upgraded and all features are unlocked.
                                </p>
                            </div>

                            <div className="w-full border-t border-[#ededed] pt-4 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span>Status</span>
                                    <span className="text-xs bg-blue-400/10 text-blue-600 px-2 py-0.5 rounded">Active</span>
                                </div>
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="w-full text-sm bg-blue-400/10 text-blue-600 rounded py-2 px-4 hover:bg-blue-700/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    Go to Dashboard <ArrowRight size={13} />
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-center">
                            Redirecting to your dashboard in <span className="text-[#1a1a1a] font-medium">{countdown}s</span>...
                        </p>
                    </div>
                )}

                {/* Error */}
                {status === "error" && (
                    <div className="bg-[#f9f9f9] border border-[#ededed] rounded p-8 flex flex-col items-center gap-5 text-center">
                        <div className="p-3 bg-[#f0f0f0] rounded w-fit">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-base font-medium text-[#1a1a1a]">Verification Pending</h1>
                            <p className="text-xs leading-relaxed">
                                We couldn't verify your subscription immediately. Don't worry, your payment was processed. Please try refreshing or contact support if the issue persists.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full text-sm border border-[#ededed] rounded py-2 px-4 text-[#6b6b6b] hover:bg-[#f0f0f0] transition-colors"
                        >
                            Refresh Status
                        </button>
                    </div>
                )}

                {/* Footer */}
                <p className="text-xs text-center pt-2">
                    Transaction Ref: <span className="font-mono text-[#1a1a1a]">{reference || "N/A"}</span>
                </p>
            </div>
        </div>
    );
}

export default function BillingSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <ScaleLoader color="#3b82f6" height={35} width={4} radius={2} margin={2} />
                    <span className="text-sm text-[#6b6b6b]">Loading payment details...</span>
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}