"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Star, Crown, Building2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { billingApi } from "@/lib/api/billing";
import { toast, Toaster } from "sonner";
import Image from "next/image";
import { authApi } from "@/lib/api/auth";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Plan {
    id: string;
    name: string;
    price: number | string;
    period: string;
    description: string;
    icon: any;
    features: string[];
    color: string;
}

// ── Data ───────────────────────────────────────────────────────────────────────

const plans: Plan[] = [
    {
        id: "professional",
        name: "Professional",
        price: 99000,
        period: "Year",
        description: "For tutorial centers, coaching institutes, and small schools.",
        icon: Star,
        features: [
            "Up to 100 students",
            "Up to 15 teachers",
            "Up to 20 active exams",
            "Hybrid online/offline workflow",
            "AI-assisted exam generation",
            "100 AI credits/month",
            "1 local deployment environment",
        ],
        color: "#3b82f6",
    },
    {
        id: "school_standard",
        name: "School Standard",
        price: 350000,
        period: "Year",
        description: "For established schools and institutional management.",
        icon: Crown,
        features: [
            "Up to 500 students",
            "Up to 50 teachers",
            "Up to 50 active exams",
            "Advanced permissions & roles",
            "School branding",
            "1000 AI credits/month",
            "Local infrastructure sync",
        ],
        color: "#8b5cf6",
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Custom",
        period: "Year",
        description: "For universities and multi-campus institutions.",
        icon: Building2,
        features: [
            "Unlimited students & teachers",
            "Dedicated deployment support",
            "White-label infrastructure",
            "Advanced analytics",
            "Custom plugins",
            "Priority infrastructure support",
            "SLA agreements",
        ],
        color: "#f59e0b",
    },
];

const fmt = (n: number): string => "₦" + n.toLocaleString("en-NG");

const formatPrice = (plan: Plan): string => {
    if (typeof plan.price === "string") return plan.price;
    return fmt(plan.price);
};

export default function SetupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await authApi.verifyToken();
                if (res.success && res.data?.user) {
                    const user = res.data.user;
                    if (user.role !== 'ADMIN') {
                        router.push('/dashboard');
                        return;
                    }
                    if (user.hasSubscription) {
                        router.push('/dashboard');
                        return;
                    }
                    setUser(user);
                    // Update localStorage to keep it in sync
                    localStorage.setItem('user', JSON.stringify(user));
                } else {
                    router.push('/login');
                }
            } catch (err) {
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    const handleSelectPlan = async (plan: Plan) => {
        if (!user) return;

        if (plan.id === "enterprise") {
            window.location.href = "mailto:support@learningdeck.online";
            return;
        }

        setSelectedPlan(plan.id);
        setIsLoading(true);

        try {
            const amount = typeof plan.price === 'number' ? plan.price : 0;
            console.log("Initializing billing with data:", {
                workspaceId: user.workspaceId,
                plan: plan.id.toUpperCase(),
                amount: amount,
                email: user.user_email
            });

            const res = await billingApi.initialize({
                workspaceId: user.workspaceId,
                plan: plan.id.toUpperCase(),
                amount: amount,
                email: user.user_email
            });

            if (res.success && res.data?.authorization_url) {
                window.location.href = res.data.authorization_url;
            } else {
                toast.error(res.message);
                setIsLoading(false);
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    if (!user) return null;

    const handleLogout = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).api?.clearAuthToken) {
                await (window as any).api.clearAuthToken();
            }
        } catch (error) {
            console.warn('Header: clearAuthToken failed', error);
        }

        await authApi.logout();
    };

    return (
        <div className="min-h-screen bg-white font-sans text-[#6b6b6b]">
            <Toaster />

            {/* Nav */}
            <nav className="h-14 border-b border-[#ededed] flex items-center justify-between px-6 sticky top-0 bg-white z-50">
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
                <button
                    onClick={handleLogout}
                    className="text-xs border border-[#ededed] rounded px-3 py-1.5 hover:bg-[#f0f0f0] transition-colors text-[#6b6b6b]"
                >
                    Logout
                </button>
            </nav>

            <main className="max-w-5xl mx-auto px-4 py-10 md:py-16 space-y-8">

                {/* Header */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-3">
                        <Sparkles size={13} />
                        <span>Final Step: Choose Your Plan</span>
                    </div>
                    <h1 className="text-xl font-medium text-[#1a1a1a]">
                        Power up your workspace
                    </h1>
                    <p className="text-sm mt-1">
                        Welcome, <span className="text-[#1a1a1a] font-medium">{user.user_name}</span>.
                        Select a plan to activate your workspace and start managing examinations.
                    </p>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((plan) => {
                        const PlanIcon = plan.icon;
                        const isSelected = selectedPlan === plan.id;
                        const isFeatured = plan.id === "school_standard";

                        return (
                            <div
                                key={plan.id}
                                className={`bg-[#f9f9f9] rounded p-5 flex flex-col gap-4 border transition-colors ${isFeatured
                                        ? "border-blue-400"
                                        : "border-[#ededed] hover:border-blue-200"
                                    }`}
                            >
                                {/* Top */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="p-2 bg-[#f0f0f0] rounded w-fit mb-3">
                                            <PlanIcon size={16} className="text-blue-500" />
                                        </div>
                                        <p className="font-medium text-[#1a1a1a]">{plan.name}</p>
                                    </div>
                                    {isFeatured && (
                                        <span className="text-xs bg-blue-400/10 text-blue-600 px-2 py-0.5 rounded">
                                            Most Popular
                                        </span>
                                    )}
                                </div>

                                {/* Price */}
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl text-[#1a1a1a]">
                                            {formatPrice(plan)}
                                        </span>
                                        {typeof plan.price === "number" && (
                                            <span className="text-xs">/ {plan.period}</span>
                                        )}
                                    </div>
                                    <p className="text-xs mt-1 leading-relaxed">{plan.description}</p>
                                </div>

                                {/* Features */}
                                <div className="flex flex-col gap-2 flex-1">
                                    {plan.features.map((f) => (
                                        <div key={f} className="flex items-start gap-2 text-xs">
                                            <Check size={12} className="mt-0.5 shrink-0 text-blue-500" />
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                {plan.id === "enterprise" ? (
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isLoading}
                                        className="w-full text-sm border border-[#ededed] rounded py-2 px-4 text-[#6b6b6b] hover:bg-[#f0f0f0] transition-colors disabled:opacity-50"
                                    >
                                        Contact Support
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={isLoading}
                                        className="w-full text-sm bg-blue-400/10 text-blue-600 rounded py-2 px-4 hover:bg-blue-700/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading && isSelected ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Select Plan <ArrowRight size={13} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <p className="text-xs text-center text-[#6b6b6b] pb-8">
                    Secure payments processed via Paystack. Your data is encrypted and managed according to NITDA guidelines.
                </p>
            </main>
        </div>
    );
}