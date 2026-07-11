"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Trainer {
    id: string;
    name: string;
    avatarUrl?: string | null;
    specialty: string[];
}

interface TrainerAvatarProps {
    trainer: Trainer;
    isSelected?: boolean;
    onClick?: () => void;
}

export function TrainerAvatar({ trainer, isSelected, onClick }: TrainerAvatarProps) {
    const firstName = trainer.name.split(" ")[0];
    const lastInitial = trainer.name.split(" ")[1]?.charAt(0) || "";
    const displayName = `${firstName} ${lastInitial}.`;
    const specialty = trainer.specialty[0] || "";

    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 transition-transform hover:scale-105 min-w-[70px]">
            <Avatar className={`h-14 w-14 ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                <AvatarImage src={trainer.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${trainer.name}`} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">{trainer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className={`text-xs font-medium text-center ${isSelected ? "text-primary" : "text-foreground"}`}>{displayName}</span>
            <span className="text-[10px] text-muted-foreground">{specialty}</span>
        </button>
    );
}
