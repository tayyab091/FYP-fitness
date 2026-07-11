"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Soup, Settings, HelpCircle, Crown, LogOut, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

// FYP - Plans Navigation Added
const mainNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Dumbbell, label: "Coaching", path: "/coaching" },
    { icon: Soup, label: "Nutrition", path: "/nutrition" },
    { icon: Zap, label: "Plans", path: "/subscription" },
];

const settingsNavItems = [
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: HelpCircle, label: "FAQ's", path: "/help" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const userRole = user?.role;

    return (
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 flex-col border-r bg-background lg:flex">
            <div className="flex h-28 items-center justify-center">
                <Logo />
            </div>

            <nav className="flex flex-1 flex-col px-4 py-6">
                <div className="mb-4 px-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Main Menu
                </div>
                <div className="space-y-1">
                    {mainNavItems.map((item) => {
                        const isActive =
                            pathname === item.path ||
                            (item.path !== "/" && pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                            >
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-muted text-foreground"
                                            : "text-foreground hover:bg-muted"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>

                {(userRole === "admin" || userRole === "trainer") && (
                    <Link
                        href={userRole === "admin" ? "/admin" : "/trainer-dashboard"}
                    >
                        <motion.div
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mt-2",
                                pathname.startsWith("/admin") || pathname.startsWith("/trainer-dashboard")
                                    ? "bg-muted text-foreground"
                                    : "text-foreground hover:bg-muted"
                            )}
                        >
                            <Crown className="h-5 w-5" />
                            {userRole === "admin" ? "Admin" : "Dashboard"}
                        </motion.div>
                    </Link>
                )}

                <div className="mt-auto">
                    <div className="mb-4 px-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                        Settings
                    </div>
                    <div className="space-y-1">
                        {settingsNavItems.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                >
                                    <motion.div
                                        whileHover={{ x: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-muted text-foreground"
                                                : "text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <div className="px-4 py-4 space-y-2">
                <motion.button
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </motion.button>
                <div className="pt-2">
                    <p className="text-[10px] text-muted-foreground">© T.E.S.T., 2026.</p>
                    <p className="text-[10px] text-muted-foreground">Terms & Conditions. Privacy Policy.</p>
                </div>
            </div>
        </aside>
    );
}
