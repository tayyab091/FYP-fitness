"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Paleo"];
const allergyOptions = ["Nuts", "Shellfish", "Eggs", "Soy", "Wheat"];

export default function NutritionProfilePage() {
    return (
        <MainLayout title="Nutrition Profile" showBack>
            <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
                <div className="bg-card border rounded-xl p-6 space-y-4">
                    <h2 className="font-semibold">Daily Goals</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><Label>Daily Calories</Label><Input type="number" placeholder="2000" /></div>
                        <div className="space-y-1"><Label>Protein (g)</Label><Input type="number" placeholder="150" /></div>
                        <div className="space-y-1"><Label>Carbs (g)</Label><Input type="number" placeholder="200" /></div>
                        <div className="space-y-1"><Label>Fat (g)</Label><Input type="number" placeholder="65" /></div>
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-6 space-y-3">
                    <h2 className="font-semibold">Dietary Preferences</h2>
                    <div className="flex flex-wrap gap-2">
                        {dietaryOptions.map((opt) => <Badge key={opt} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">{opt}</Badge>)}
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-6 space-y-3">
                    <h2 className="font-semibold">Allergies</h2>
                    <div className="flex flex-wrap gap-2">
                        {allergyOptions.map((opt) => <Badge key={opt} variant="outline" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors">{opt}</Badge>)}
                    </div>
                </div>

                <Button className="w-full">Save Profile</Button>
            </div>
        </MainLayout>
    );
}
