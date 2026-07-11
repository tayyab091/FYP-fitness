"use client";

import { Bell, Search, Menu, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { MobileNav } from "./MobileNav";

interface HeaderProps {
    title?: string;
    showBack?: boolean;
}

export function Header({ title = "Home", showBack = false }: HeaderProps) {
    const router = useRouter();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0" aria-describedby={undefined}>
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <MobileNav />
                </SheetContent>
            </Sheet>

            <div className="lg:hidden">
                <Logo collapsed />
            </div>

            <div className="hidden lg:flex items-center gap-2">
                {showBack && (
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <h1 className="text-xl font-semibold">{title}</h1>
            </div>

            <div className="ml-auto flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search" className="w-64 pl-9 bg-muted border-0" />
                </div>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}
