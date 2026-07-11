"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Trainer {
    id: string;
    name: string;
    country: string;
    bio?: string;
    specialty?: string[];
    avatarUrl?: string | null;
    backgroundImageUrl?: string | null;
    peopleTrained: number;
    trainingVideos: number;
    rating: number;
}

interface FeaturedTrainerCardProps {
    trainer: Trainer;
    onClick?: () => void;
}

export function FeaturedTrainerCard({ trainer, onClick }: FeaturedTrainerCardProps) {
    const bgImage =
        trainer.backgroundImageUrl ||
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600";
    const avatarSrc =
        trainer.avatarUrl ||
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200";

    return (
        <div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground cursor-pointer"
            onClick={onClick}
        >
            <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="relative p-6">
                <div className="flex flex-col items-center text-center mb-6">
                    <Avatar className="h-20 w-20 border-4 border-primary-foreground/30 mb-3">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback className="text-2xl">{trainer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold">{trainer.name}</h3>
                    <p className="text-sm opacity-80 mb-2">{trainer.country}</p>
                    {trainer.specialty && trainer.specialty.length > 0 && (
                        <div className="flex gap-2 justify-center mb-3 flex-wrap">
                            {trainer.specialty.map(s => <span key={s} className="text-xs bg-primary-foreground/20 px-2 py-1 rounded-full">{s}</span>)}
                        </div>
                    )}
                    {trainer.bio && <p className="text-sm italic opacity-90 max-w-[280px]">{trainer.bio}</p>}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-primary-foreground/10 rounded-lg p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{trainer.peopleTrained}</p>
                        <p className="text-[10px] opacity-80">People trained</p>
                    </div>
                    <div className="bg-primary-foreground/10 rounded-lg p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{trainer.trainingVideos}</p>
                        <p className="text-[10px] opacity-80">Training Videos</p>
                    </div>
                    <div className="bg-primary-foreground/10 rounded-lg p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{trainer.rating}</p>
                        <p className="text-[10px] opacity-80">Rating</p>
                    </div>
                </div>

                <div
                    className="h-32 rounded-lg bg-cover bg-center mb-4"
                    style={{ backgroundImage: `url(${bgImage})` }}
                />

                <Button className="w-full bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border border-primary-foreground/30 backdrop-blur-sm" size="lg">
                    Train with {trainer.name.split(" ")[0]}
                </Button>
            </div>
        </div>
    );
}
