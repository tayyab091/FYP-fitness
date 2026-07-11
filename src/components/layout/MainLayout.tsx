import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface MainLayoutProps {
    children: ReactNode;
    title?: string;
    showBack?: boolean;
}

export function MainLayout({ children, title, showBack }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="lg:pl-60">
                <Header title={title} showBack={showBack} />
                <main className="pb-20 lg:pb-6">{children}</main>
                <BottomNav />
            </div>
        </div>
    );
}
