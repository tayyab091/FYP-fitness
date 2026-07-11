"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video, Star, Calendar } from "lucide-react";

export default function TrainerDashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return null;
    }
    return (
        <MainLayout title="Trainer Dashboard">
            <div className="p-4 lg:p-6 space-y-6">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-6">
                    <h1 className="text-2xl font-bold">Welcome, {user?.fullName?.split(" ")[0] ?? "Trainer"}!</h1>
                    <p className="mt-1 opacity-90">Here&apos;s your coaching overview.</p>
                    <Badge variant="secondary" className="mt-3">Trainer</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: "Active Clients", value: "24", icon: Users },
                        { label: "Training Videos", value: "18", icon: Video },
                        { label: "Avg Rating", value: "4.8", icon: Star },
                        { label: "Sessions This Week", value: "12", icon: Calendar },
                    ].map((s) => (
                        <div key={s.label} className="bg-card border rounded-xl p-4">
                            <s.icon className="h-8 w-8 text-primary mb-2" />
                            <p className="text-2xl font-bold">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-card border rounded-xl p-6 space-y-3">
                    <h2 className="font-semibold">Upcoming Sessions</h2>
                    <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
                    <Button variant="outline" className="w-full">Schedule New Session</Button>
                </div>
            </div>
        </MainLayout>
    );
}
