"use client";

import { Star } from "lucide-react";

interface Workout {
    id: string;
    title: string;
    bodyFocus: string;
    difficulty: string;
    durationMinutes: number;
    imageUrl?: string | null;
    rating: number;
}

interface WorkoutCardProps {
    workout: Workout;
    onClick?: () => void;
}

export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
    return (
        <div className="relative overflow-hidden rounded-xl cursor-pointer group" onClick={onClick}>
            <div
                className="h-48 bg-cover bg-center transition-transform group-hover:scale-105"
                style={{ backgroundImage: `url(${workout.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 right-3 flex items-center gap-1 text-white">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{workout.rating}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-semibold text-base mb-1">{workout.title}</h3>
                <p className="text-xs text-white/80">{workout.bodyFocus} • {workout.difficulty} • {workout.durationMinutes} min</p>
            </div>
        </div>
    );
}
