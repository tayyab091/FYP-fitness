"use client";

import { RefreshCw } from "lucide-react";

interface Recipe {
    id: string;
    title: string;
    imageUrl?: string | null;
}

interface MealCardProps {
    mealType: "Breakfast" | "Lunch" | "Snack" | "Dinner";
    recipe: Recipe | null;
    onClick?: () => void;
    onRefresh?: () => void;
    onDismiss?: () => void;
}

const mealTypeColors: Record<string, string> = {
    Breakfast: "text-orange-600",
    Lunch: "text-green-600",
    Snack: "text-purple-600",
    Dinner: "text-blue-600",
};

export function MealCard({ mealType, recipe, onClick, onRefresh, onDismiss }: MealCardProps) {
    if (!recipe) {
        return (
            <div className="flex items-center gap-4 p-4 border-b">
                <div className="h-24 w-32 bg-muted rounded-lg" />
                <div className="flex-1">
                    <span className={`text-sm font-medium ${mealTypeColors[mealType]}`}>| {mealType}</span>
                    <p className="text-muted-foreground">No meal planned</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-4 p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={onClick}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={recipe.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"}
                alt={recipe.title}
                className="h-24 w-32 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground mb-1">{recipe.title}</h3>
                <span className={`text-sm font-medium ${mealTypeColors[mealType]}`}>| {mealType}</span>
                <p
                    className="text-xs text-primary mt-2 cursor-pointer hover:underline"
                    onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
                >
                    Don&apos;t show me this again
                </p>
            </div>
            <button
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); onRefresh?.(); }}
            >
                <RefreshCw className="h-5 w-5" />
            </button>
        </div>
    );
}
