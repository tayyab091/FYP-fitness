"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, X } from "lucide-react";
import { toast } from "sonner";

type PlanId = "basic" | "pro" | "elite";

interface MeUser {
    id: string;
    fullName: string;
    subscription?: { plan: PlanId; status: string };
}

const PLANS = [
    {
        id: "basic" as const,
        name: "BASIC",
        price: "Free",
        period: "",
        features: ["3 workouts/week", "Basic nutrition guides", "Community access"],
        highlighted: false,
    },
    {
        id: "pro" as const,
        name: "PRO",
        price: "$19",
        period: "/mo",
        features: ["Unlimited workouts", "Personalised meal plans", "1-on-1 trainer chat", "Advanced analytics"],
        highlighted: true,
    },
    {
        id: "elite" as const,
        name: "ELITE",
        price: "$39",
        period: "/mo",
        features: ["Everything in Pro", "Live training sessions", "Priority support", "Custom meal plans"],
        highlighted: false,
    },
];

const PLAN_RANK: Record<PlanId, number> = { basic: 0, pro: 1, elite: 2 };

export default function SubscriptionPage() {
    const router = useRouter();
    const [user, setUser] = useState<MeUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [subscribing, setSubscribing] = useState(false);

    const currentPlan: PlanId = user?.subscription?.plan ?? "basic";

    const fetchMe = useCallback(async () => {
        setAuthLoading(true);
        try {
            const res = await fetch("/api/auth/me", { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    const openSubscribeModal = (planId: PlanId) => {
        if (!user) {
            router.push("/login?redirect=/subscription");
            return;
        }
        if (planId === currentPlan) return;
        setSelectedPlan(planId);
        setModalOpen(true);
    };

    const handleConfirmSubscribe = async () => {
        if (!selectedPlan) return;
        setSubscribing(true);
        try {
            const res = await fetch("/api/payments/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    plan: selectedPlan,
                    cardData: { cardholderName: user?.fullName || "Demo User" },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Subscription failed");

            toast.success("Plan activated!", {
                description: `You are now on the ${selectedPlan.toUpperCase()} plan.`,
            });
            setModalOpen(false);
            setSelectedPlan(null);
            await fetchMe();
        } catch (err) {
            toast.error("Subscription failed", {
                description: err instanceof Error ? err.message : "Please try again.",
            });
        } finally {
            setSubscribing(false);
        }
    };

    const getButtonLabel = (planId: PlanId) => {
        if (planId === currentPlan) return "Current Plan";
        if (!user) return planId === "basic" ? "Get Started" : "Upgrade";
        return PLAN_RANK[planId] > PLAN_RANK[currentPlan] ? "Upgrade" : "Get Started";
    };

    const selectedPlanName = PLANS.find((p) => p.id === selectedPlan)?.name ?? "Pro";

    return (
        <MainLayout title="Plans & Pricing">
            <div className="min-h-full bg-[#0a0a0a] p-4 lg:p-8 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Crown className="h-7 w-7 text-[#00ff87]" />
                        <Badge className="bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20">
                            Premium Plans
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Choose Your Plan</h1>
                    <p className="text-lg text-[#a0a0a0] max-w-2xl mx-auto">
                        Unlock personalized workouts, meal plans, and expert coaching.
                    </p>
                    {user && !authLoading && (
                        <p className="mt-4 text-sm text-[#a0a0a0]">
                            Logged in as <span className="text-white font-medium">{user.fullName}</span>
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => {
                        const isCurrent = !authLoading && user && plan.id === currentPlan;

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 ${
                                    plan.highlighted
                                        ? "border-2 border-[#00ff87] bg-linear-to-br from-[#00ff87]/10 to-transparent shadow-lg shadow-[#00ff87]/10 md:scale-105"
                                        : "glass hover:border-white/15"
                                }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-[#00ff87] text-black font-bold px-3">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                {isCurrent && (
                                    <div className="absolute top-4 right-4">
                                        <Badge className="bg-white/10 text-[#00ff87] border border-[#00ff87]/30">
                                            Current Plan
                                        </Badge>
                                    </div>
                                )}

                                <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                                <div className="mb-6">
                                    <span
                                        className={`text-5xl font-bold ${
                                            plan.highlighted ? "text-[#00ff87]" : "text-white"
                                        }`}
                                    >
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className="text-[#a0a0a0] text-lg">{plan.period}</span>
                                    )}
                                </div>

                                <ul className="space-y-3 flex-1 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-sm text-[#c0c0c0]">
                                            <Check className="h-4 w-4 shrink-0 text-[#00ff87]" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={`w-full h-12 font-semibold ${
                                        plan.highlighted && !isCurrent
                                            ? "bg-[#00ff87] text-black hover:bg-[#00ff87]/90"
                                            : isCurrent
                                              ? "bg-white/5 text-[#a0a0a0] border border-white/10"
                                              : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                                    }`}
                                    disabled={!!isCurrent || authLoading}
                                    onClick={() => openSubscribeModal(plan.id)}
                                >
                                    {authLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        getButtonLabel(plan.id)
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {modalOpen && selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => !subscribing && setModalOpen(false)}
                    />
                    <div className="relative glass rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                        <button
                            type="button"
                            className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white transition-colors"
                            onClick={() => !subscribing && setModalOpen(false)}
                            disabled={subscribing}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-2">Payment Simulation</h3>
                        <p className="text-[#a0a0a0] mb-6">
                            Payment simulation — click confirm to activate {selectedPlanName}
                        </p>

                        <div className="glass rounded-xl p-4 mb-6 border border-white/5">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#a0a0a0]">Plan</span>
                                <span className="text-white font-medium">{selectedPlanName}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-[#a0a0a0]">Amount</span>
                                <span className="text-[#00ff87] font-semibold">
                                    {PLANS.find((p) => p.id === selectedPlan)?.price}
                                    {PLANS.find((p) => p.id === selectedPlan)?.period}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 border-white/10 text-[#a0a0a0] hover:bg-white/5 hover:text-white"
                                onClick={() => setModalOpen(false)}
                                disabled={subscribing}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-[#00ff87] text-black hover:bg-[#00ff87]/90 font-semibold"
                                onClick={handleConfirmSubscribe}
                                disabled={subscribing}
                            >
                                {subscribing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Confirm"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
