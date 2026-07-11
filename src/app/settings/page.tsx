"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SettingsPage() {
    const { user, signOut, isLoading } = useAuth();
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
        <MainLayout title="Settings">
            <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
                {/* Profile */}
                <div className="bg-card border rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-lg">Profile</h2>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {user?.fullName?.charAt(0) ?? "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{user?.fullName ?? "Guest"}</p>
                            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                            <p className="text-xs text-muted-foreground capitalize mt-1">Role: {user?.role ?? "—"}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" defaultValue={user?.fullName ?? ""} placeholder="Your name" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={user?.email ?? ""} disabled />
                        </div>
                    </div>
                    <Button className="w-full">Save Changes</Button>
                </div>

                {/* Danger Zone */}
                <div className="bg-card border border-destructive/20 rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold text-lg text-destructive">Account</h2>
                    <Button variant="destructive" className="w-full" onClick={() => signOut()}>
                        Sign Out
                    </Button>
                </div>
            </div>
        </MainLayout>
    );
}
