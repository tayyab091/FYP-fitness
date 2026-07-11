"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function NutritionPage() {
  const queryClient = useQueryClient();
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [currentFood, setCurrentFood] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [mealType, setMealType] = useState("breakfast");
  const [foods, setFoods] = useState<any[]>([]);

  // Fetch today's meals
  const { data: mealsData } = useQuery({
    queryKey: ["today-meals"],
    queryFn: async () => {
      const res = await fetch("/api/tracking/meals/today", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
  });

  // Add meal mutation
  const addMealMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tracking/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mealType,
          foods,
          notes: "",
        }),
      });
      if (!res.ok) throw new Error("Failed to add meal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-meals"] });
      setIsAddingMeal(false);
      setFoods([]);
      setCurrentFood({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    },
  });

  const addFood = () => {
    if (currentFood.name && currentFood.calories) {
      setFoods([
        ...foods,
        {
          name: currentFood.name,
          calories: parseFloat(currentFood.calories),
          protein: parseFloat(currentFood.protein) || 0,
          carbs: parseFloat(currentFood.carbs) || 0,
          fat: parseFloat(currentFood.fat) || 0,
        },
      ]);
      setCurrentFood({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    }
  };

  const calculateTotals = (foodList: any[]) => {
    return foodList.reduce(
      (acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const meals = mealsData?.data?.meals || [];
  const dailyTotals = mealsData?.data?.dailyTotals || {};

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Nutrition Tracking</h1>
            <p className="text-slate-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Daily Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <p className="text-slate-400 text-sm">Total Calories</p>
              <p className="text-3xl font-bold text-emerald-400">
                {Math.round(dailyTotals.calories || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">Goal: 2000 cal</p>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <p className="text-slate-400 text-sm">Protein</p>
              <p className="text-3xl font-bold text-blue-400">
                {Math.round(dailyTotals.protein || 0)}g
              </p>
              <p className="text-xs text-slate-500 mt-2">Goal: 150g</p>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <p className="text-slate-400 text-sm">Carbs</p>
              <p className="text-3xl font-bold text-purple-400">
                {Math.round(dailyTotals.carbs || 0)}g
              </p>
              <p className="text-xs text-slate-500 mt-2">Goal: 250g</p>
            </Card>

            <Card className="bg-slate-800 border-slate-700 p-6">
              <p className="text-slate-400 text-sm">Fat</p>
              <p className="text-3xl font-bold text-orange-400">
                {Math.round(dailyTotals.fat || 0)}g
              </p>
              <p className="text-xs text-slate-500 mt-2">Goal: 65g</p>
            </Card>
          </div>

          {/* Add Meal Form */}
          {isAddingMeal && (
            <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6">Add Meal</h2>

              {/* Meal Type Selector */}
              <div className="mb-6">
                <label className="text-slate-300 text-sm block mb-2">Meal Type</label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="morning_snack">Morning Snack</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="afternoon_snack">Afternoon Snack</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="late_snack">Late Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Food Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-slate-300 text-sm">Food Name</label>
                  <Input
                    placeholder="e.g., Grilled Chicken Breast"
                    value={currentFood.name}
                    onChange={(e) => setCurrentFood({ ...currentFood, name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Calories</label>
                  <Input
                    type="number"
                    placeholder="300"
                    value={currentFood.calories}
                    onChange={(e) => setCurrentFood({ ...currentFood, calories: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Protein (g)</label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={currentFood.protein}
                    onChange={(e) => setCurrentFood({ ...currentFood, protein: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Carbs (g)</label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={currentFood.carbs}
                    onChange={(e) => setCurrentFood({ ...currentFood, carbs: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Fat (g)</label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={currentFood.fat}
                    onChange={(e) => setCurrentFood({ ...currentFood, fat: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>

              <Button onClick={addFood} className="w-full bg-blue-600 hover:bg-blue-700 mb-6">
                Add Food Item
              </Button>

              {/* Foods List */}
              {foods.length > 0 && (
                <div className="mb-6">
                  <p className="text-slate-300 text-sm mb-3">Foods to Log:</p>
                  <div className="space-y-2">
                    {foods.map((food, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-700 p-3 rounded flex justify-between items-center"
                      >
                        <div>
                          <p className="text-white font-semibold">{food.name}</p>
                          <p className="text-slate-400 text-xs">
                            {food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F:
                            {food.fat}g
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setFoods(foods.filter((_, i) => i !== idx))}
                          className="text-red-400 border-red-400"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Meal Totals */}
                  <div className="bg-slate-700 p-3 rounded mt-4">
                    {(() => {
                      const totals = calculateTotals(foods);
                      return (
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <p className="text-slate-400 text-xs">Calories</p>
                            <p className="text-white font-bold">{Math.round(totals.calories)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Protein</p>
                            <p className="text-white font-bold">{Math.round(totals.protein)}g</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Carbs</p>
                            <p className="text-white font-bold">{Math.round(totals.carbs)}g</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Fat</p>
                            <p className="text-white font-bold">{Math.round(totals.fat)}g</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => addMealMutation.mutate()}
                  disabled={foods.length === 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {addMealMutation.isPending ? "Logging..." : "Log Meal"}
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingMeal(false);
                    setFoods([]);
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {!isAddingMeal && (
            <div className="mb-6">
              <Button
                onClick={() => setIsAddingMeal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Log a Meal
              </Button>
            </div>
          )}

          {/* Meals List */}
          <div className="space-y-4">
            {meals.length > 0 ? (
              meals.map((meal: any) => (
                <Card key={meal._id} className="bg-slate-800 border-slate-700 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-white font-semibold capitalize text-lg">{meal.mealType}</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(meal.loggedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-emerald-400 font-bold text-lg">{meal.totals?.calories} cal</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    {meal.foods?.map((food: any, idx: number) => (
                      <div key={idx} className="text-slate-300 text-sm">
                        • {food.name}: {food.calories} cal (P: {food.protein}g, C: {food.carbs}g,
                        F: {food.fat}g)
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center bg-slate-700 p-3 rounded">
                    <div>
                      <p className="text-slate-400 text-xs">Protein</p>
                      <p className="text-white text-sm font-semibold">{meal.totals?.protein}g</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Carbs</p>
                      <p className="text-white text-sm font-semibold">{meal.totals?.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Fat</p>
                      <p className="text-white text-sm font-semibold">{meal.totals?.fat}g</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Fiber</p>
                      <p className="text-white text-sm font-semibold">{meal.totals?.fiber || 0}g</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="bg-slate-800 border-slate-700 p-6">
                <p className="text-slate-400">No meals logged yet. Start tracking your nutrition!</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
