"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Star, Crown, Building2, ArrowRight, RotateCcw, CreditCard, LucideIcon, Loader2 } from "lucide-react";
import { billingApi } from "@/lib/api/billing";
import { toast } from "sonner";
import { ScaleLoader } from "react-spinners";
import { userApi } from "@/lib/api/users";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Plan {
    id: string;
    name: string;
    price: number | string;
    period: string;
    description: string;
    badge: string | null;
    icon: LucideIcon;
    featured?: boolean;
    features: string[];
    color: string;
}

interface BillingRow {
    date: string;
    amount: string;
    status: string;
    plan: string;
}

type ConfirmAction = "upgrade" | "downgrade";

interface ConfirmState {
    plan: Plan;
    action: ConfirmAction;
}

// ── Data ───────────────────────────────────────────────────────────────────────

const plans: Plan[] = [
    {
        id: "professional",
        name: "Professional",
        price: 99000,
        period: "Year",
        description: "For tutorial centers, coaching institutes, and small schools.",
        badge: "Current plan",
        icon: Star,
        featured: true,
        features: [
            "Up to 100 students",
            "Up to 15 teachers",
            "Up to 20 active exams",
            "Unlimited subjects & classes",
            "Hybrid online/offline workflow",
            // "Unlimited offline exam sessions",
            "AI-assisted exam generation",
            "100 AI credits/month",
            "Local infrastructure synchronization",
            //  "1 workspace",
            "Email & WhatsApp support",
            // "1 local deployment environment",
            "Result export system",
            "1-year result history",
        ],
        color: "#3b82f6",
    },
    {
        id: "school_standard",
        name: "School Standard",
        price: 350000,
        period: "Year",
        description: "For established schools and institutional examination management.",
        badge: null,
        icon: Crown,
        features: [
            "Up to 500 students",
            "Up to 50 teachers",
            "Up to 50 active exams",
            "Unlimited subjects & classes",
            // "Unlimited offline exam sessions",
            // "Advanced permissions & roles",
            "Templates customization",
            //   "Custom school domain",
            "1000 AI credits/month",
            //"Deployment analytics",
            "Local infrastructure synchronization",
            //"Audit logs",
            "Priority support",
            // "Multi-user collaboration",
            "Result analytics dashboard",
            "3-year result history",
            "Early access to beta features",
        ],
        color: "#8b5cf6",
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Custom",
        period: "Year",
        description: "For universities, enterprise deployments, and multi-campus institutions.",
        badge: null,
        icon: Building2,
        features: [
            //   "Multi-campus deployments",
            "Unlimited students",
            "Unlimited teachers",
            "Dedicated deployment support",
            "White-label infrastructure",
            "Advanced analytics",
            "Audit logs",
            "Custom plugins & integrations",
            "Multiple CBT environments",
            "Priority infrastructure support",
            "SLA agreements",
            "Dedicated onboarding",
            "Custom deployment architecture",
        ],
        color: "#f59e0b",
    },
];

const billingHistory: BillingRow[] = [];

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number): string => "₦" + n.toLocaleString("en-NG");

const formatPrice = (plan: Plan): string => {
    if (typeof plan.price === "string") return plan.price;
    return fmt(plan.price);
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function PlanPage() {
    const [currentPlan, setCurrentPlan] = useState<string>("professional");
    const [showConfirm, setShowConfirm] = useState<ConfirmState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await userApi.me();
                if (res.success && res.data) {
                    setUser(res.data);
                    fetchData(res.data.workspaceId);
                }
            } catch (error) {
                console.error("Failed to fetch user profile", error);
                setLoadingData(false);
            }
        };
        fetchUser();
    }, []);

    const fetchData = async (workspaceId: string) => {
        setLoadingData(true);
        try {
            const [subRes, txRes] = await Promise.all([
                billingApi.getSubscription(workspaceId),
                billingApi.getTransactions(workspaceId)
            ]);

            if (subRes.success && subRes.data) {
                setSubscription(subRes.data);
                setCurrentPlan(subRes.data.plan.toLowerCase());
            }

            if (txRes.success && Array.isArray(txRes.data)) {
                setTransactions(txRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch billing data", error);
        } finally {
            setLoadingData(false);
        }
    };

    const activePlan = plans.find((p) => p.id === currentPlan) ?? plans[0];

    const handleAction = (plan: Plan): void => {
        const planIndex = plans.findIndex((p) => p.id === plan.id);
        const currentIndex = plans.findIndex((p) => p.id === currentPlan);
        if (plan.id === currentPlan) return;
        const action: ConfirmAction = planIndex > currentIndex ? "upgrade" : "downgrade";
        setShowConfirm({ plan, action });
    };

    const confirmChange = async (): Promise<void> => {
        if (!showConfirm || !user) return;

        setIsLoading(true);
        try {
            const amount = typeof showConfirm.plan.price === 'number' ? showConfirm.plan.price : 0;

            if (amount === 0) {
                toast.error("Please contact support for enterprise pricing");
                return;
            }

            const res = await billingApi.initialize({
                workspaceId: user.workspaceId,
                plan: showConfirm.plan.id.toUpperCase(),
                amount: amount,
                email: user.user_email
            });

            if (res.success && res.data?.authorization_url) {
                window.location.href = res.data.authorization_url;
            } else {
                toast.error(res.message || "Failed to initialize payment");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
            setShowConfirm(null);
        }
    };

    const ActiveIcon = activePlan.icon;

    if (loadingData) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
                    <p className="text-[#6b6b6b] text-sm mt-2">Loading billing information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full text-[#6b6b6b] font-sans p-2 md:p-4">
            <div className="mx-auto space-y-6">

                {/* Header */}
                <div>
                    <p className="text-sm mt-1">Manage your plan and payment details.</p>
                </div>

                {/* Current Plan Summary */}
                <div className="bg-[#f9f9f9] border border-[#ededed] rounded p-5 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#f0f0f0] rounded">
                            <ActiveIcon size={18} className="text-blue-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-[#1a1a1a]">{activePlan.name} Plan</span>
                                <span className="text-xs bg-blue-400/10 text-blue-600 px-2 py-0.5 rounded">
                                    {subscription?.status || "Active"}
                                </span>
                            </div>
                            <p className="text-xs">
                                {subscription?.expiresAt
                                    ? `Renews ${new Date(subscription.expiresAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}`
                                    : "No active subscription"} · {formatPrice(activePlan)}{typeof activePlan.price === "number" ? " / year" : " pricing"}
                            </p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 text-sm border border-[#ededed] rounded px-4 py-2 hover:bg-[#f0f0f0] transition-colors text-[#1a1a1a]">
                        <Star size={14} /> Current plan
                    </button>
                </div>

                {/* Plan Cards */}
                <div className="space-y-3">
                    <h3 className="text-[#1a1a1a]">Pricing Plans</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => {
                            const isActive = plan.id === currentPlan;
                            const planIndex = plans.findIndex((p) => p.id === plan.id);
                            const currentIndex = plans.findIndex((p) => p.id === currentPlan);
                            const isUpgrade = planIndex > currentIndex;
                            const PlanIcon = plan.icon;

                            return (
                                <div
                                    key={plan.id}
                                    className={`bg-[#f9f9f9] rounded p-5 flex flex-col gap-4 border transition-colors ${isActive
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
                                        {isActive && (
                                            <span className="text-xs bg-blue-400/10 text-blue-600 px-2 py-0.5 rounded">
                                                Current plan
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
                                    {isActive ? (
                                        <button
                                            className="w-full text-sm border border-[#ededed] rounded py-2 px-4 text-[#6b6b6b] bg-[#f0f0f0] cursor-default"
                                            disabled
                                        >
                                            Current plan
                                        </button>
                                    ) : plan.id === "enterprise" ? (
                                        <a
                                            href="/contact"
                                            className="w-full text-sm border border-[#ededed] rounded py-2 px-4 text-[#6b6b6b] hover:bg-[#f0f0f0] transition-colors text-center"
                                        >
                                            Request Consultation
                                        </a>
                                    ) : isUpgrade ? (
                                        <button
                                            onClick={() => handleAction(plan)}
                                            className="w-full text-sm bg-blue-400/10 text-blue-600 rounded py-2 px-4 hover:bg-blue-700/20 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Upgrade <ArrowRight size={13} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleAction(plan)}
                                            className="w-full text-sm border border-[#ededed] rounded py-2 px-4 text-[#6b6b6b] hover:bg-[#f0f0f0] transition-colors"
                                        >
                                            Downgrade
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Billing History */}
                <div className="space-y-3 pb-10">
                    <h3 className="text-[#1a1a1a]">Billing History</h3>
                    <div className="bg-[#f9f9f9] border border-[#ededed] rounded overflow-hidden">
                        <div className="grid grid-cols-4 px-4 py-3 border-b border-[#ededed] text-xs uppercase tracking-wider text-[#6b6b6b]">
                            <span>Date</span>
                            <span>Plan</span>
                            <span>Amount</span>
                            <span>Status</span>
                        </div>
                        {loadingData ? (
                            <div className="px-4 py-8 text-center text-xs text-[#6b6b6b]">Loading transactions...</div>
                        ) : transactions.length === 0 ? (
                            <div className="px-4 py-8 text-center text-xs text-[#6b6b6b]">No transactions found</div>
                        ) : (
                            transactions.map((tx, i) => {
                                const statusColorMap: Record<string, { bg: string; text: string }> = {
                                    SUCCESS: { bg: "green-50", text: "green-600" },
                                    PENDING: { bg: "yellow-50", text: "yellow-600" },
                                    FAILED: { bg: "red-50", text: "red-600" },
                                    REFUNDED: { bg: "gray-50", text: "gray-600" }
                                };
                                const statusStyle = statusColorMap[tx.status] || statusColorMap.PENDING;
                                const planName = tx.plan.charAt(0) + tx.plan.slice(1).toLowerCase().replace(/_/g, " ");

                                return (
                                    <div
                                        key={tx.id}
                                        className={`grid grid-cols-4 px-4 py-4 items-center ${i < transactions.length - 1 ? "border-b border-[#ededed]" : ""}`}
                                    >
                                        <span>{new Date(tx.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        <span>{planName}</span>
                                        <span className="text-[#1a1a1a] font-mono text-xs">₦{(tx.amount).toLocaleString("en-NG")}</span>
                                        <span className={`text-xs bg-${statusStyle.bg} text-${statusStyle.text} border border-${statusStyle.text} px-2 py-0.5 rounded w-fit capitalize`}>
                                            {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirm !== null && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setShowConfirm(null)}
                >
                    <div
                        className="bg-[#f9f9f9] border border-[#ededed] rounded p-6 max-w-sm w-[90%] shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-5">
                            <div className="p-2 bg-[#f0f0f0] rounded w-fit mb-4">
                                {showConfirm.action === "upgrade" ? (
                                    <ArrowRight size={18} className="text-blue-500" />
                                ) : (
                                    <RotateCcw size={18} className="text-red-400" />
                                )}
                            </div>
                            <h4 className="text-[#1a1a1a] font-medium mb-2">
                                {showConfirm.action === "upgrade" ? "Upgrade" : "Downgrade"} to{" "}
                                {showConfirm.plan.name}?
                            </h4>
                            <p className="text-sm leading-relaxed">
                                {showConfirm.action === "upgrade"
                                    ? `Your plan will change to ${showConfirm.plan.name} at ${formatPrice(showConfirm.plan)}/year. You'll be billed the difference immediately.`
                                    : `Your plan will change to ${showConfirm.plan.name} at ${formatPrice(showConfirm.plan)}/year at your next billing cycle.`}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(null)}
                                className="flex-1 text-sm border border-[#ededed] rounded py-2 px-4 hover:bg-[#f0f0f0] transition-colors text-[#6b6b6b]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmChange}
                                disabled={isLoading}
                                className={`flex-1 text-sm rounded py-2 px-4 transition-colors flex items-center justify-center gap-2 ${showConfirm.action === "upgrade"
                                    ? "bg-blue-400/10 text-blue-600 hover:bg-blue-700/20"
                                    : "bg-red-50 text-red-500 border border-red-100 hover:bg-red-100"
                                    }`}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirm ${showConfirm.action}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}