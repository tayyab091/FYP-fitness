"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Apple, Users, Settings, LogOut, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// FYP - Plans Navigation Added
const mainNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Dumbbell, label: "Coaching", path: "/coaching" },
    { icon: Apple, label: "Nutrition", path: "/nutrition" },
    { icon: Users, label: "Community", path: "/community" },
    { icon: Zap, label: "Plans", path: "/subscription" },
    { icon: Settings, label: "Settings", path: "/settings" },
];

export function MobileNav() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const userRole = user?.role;

    return (
        <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
                <Logo />
            </div>

            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
                {mainNavItems.map((item) => {
                    const isActive =
                        pathname === item.path ||
                        (item.path !== "/" && pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}

                {(userRole === "admin" || userRole === "trainer") && (
                    <Link
                        href={userRole === "admin" ? "/admin" : "/trainer-dashboard"}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mt-4",
                            pathname.startsWith("/admin") || pathname.startsWith("/trainer-dashboard")
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                    >
                        <Crown className="h-5 w-5" />
                        {userRole === "admin" ? "Admin Dashboard" : "Trainer Dashboard"}
                    </Link>
                )}
            </nav>

            <div className="border-t border-sidebar-border p-4">
                {user ? (
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        onClick={() => signOut()}
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </Button>
                ) : (
                    <Link href="/login">
                        <Button className="w-full">Sign In</Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
