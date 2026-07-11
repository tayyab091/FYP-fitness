"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { WorkoutCalendar } from "@/components/schedule/WorkoutCalendar";
import Link from "next/link";
import { useAuth } from '@/hooks/useAuth';

export default function MyFitnessPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Fetch user's workout plan
  const { data: planData } = useQuery({
    queryKey: ["my-workout-plan"],
    queryFn: async () => {
      const res = await fetch("/api/tracking/plans/my-plan", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch plan");
      return res.json();
    },
  });

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

  // Fetch progress history
  const { data: progressData } = useQuery({
    queryKey: ["my-progress"],
    queryFn: async () => {
      const res = await fetch("/api/tracking/progress/my-progress", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  const plan = planData?.data?.plan;
  const todaySession = planData?.data?.todaySession;
  const meals = mealsData?.data?.meals || [];
  const dailyTotals = mealsData?.data?.dailyTotals || {};
  const progressRecords = progressData?.data || [];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-16 w-64 animate-pulse rounded bg-slate-800" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-64 animate-pulse rounded bg-slate-800" />
            <div className="h-64 animate-pulse rounded bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Fitness</h1>
            <p className="text-slate-400">Track your workouts, nutrition, and progress</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="workout">Workout</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Plan */}
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Active Workout Plan</h2>
                  {plan ? (
                    <>
                      <p className="text-lg text-emerald-400 font-semibold mb-2">{plan.title}</p>
                      <p className="text-slate-300 mb-4">Goal: {plan.goal}</p>
                      <p className="text-sm text-slate-400 mb-4">
                        Started: {new Date(plan.startDate).toLocaleDateString()}
                      </p>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        View Full Plan
                      </Button>
                    </>
                  ) : (
                    <p className="text-slate-400">No active workout plan yet</p>
                  )}
                </Card>

                {/* Today's Stats */}
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Today's Stats</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Calories</span>
                      <span className="text-white font-semibold">
                        {dailyTotals.calories || 0} cal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Protein</span>
                      <span className="text-white font-semibold">
                        {Math.round(dailyTotals.protein || 0)} g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Carbs</span>
                      <span className="text-white font-semibold">
                        {Math.round(dailyTotals.carbs || 0)} g
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Fat</span>
                      <span className="text-white font-semibold">
                        {Math.round(dailyTotals.fat || 0)} g
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent Progress */}
              {progressRecords.length > 0 && (
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Latest Progress Record</h2>
                  <p className="text-slate-300">
                    Weight: {progressRecords[0].bodyMetrics?.weight} kg
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Recorded: {new Date(progressRecords[0].recordedAt).toLocaleDateString()}
                  </p>
                </Card>
              )}

              {/* My Schedule */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white">My Schedule</h2>
                  <Link href="/my-fitness/schedule" className="text-xs text-blue-400 hover:underline">
                    Full Schedule →
                  </Link>
                </div>
                <WorkoutCalendar />
              </div>
            </TabsContent>

            {/* WORKOUT TAB */}
            <TabsContent value="workout" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Workout Tracking</h2>

                {todaySession ? (
                  <div>
                    <h3 className="text-xl text-emerald-400 font-semibold mb-4">
                      {todaySession.sessionName}
                    </h3>
                    <div className="space-y-3 mb-6">
                      {todaySession.exercises?.map((ex: any, idx: number) => (
                        <div key={idx} className="bg-slate-700 p-4 rounded">
                          <p className="text-white font-semibold">{ex.exerciseName}</p>
                          <p className="text-slate-400 text-sm">
                            {ex.sets} sets × {ex.reps} reps @ {ex.weight}kg
                          </p>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Start Today's Workout
                    </Button>
                  </div>
                ) : (
                  <p className="text-slate-400">No workout scheduled for today</p>
                )}
              </Card>
            </TabsContent>

            {/* NUTRITION TAB */}
            <TabsContent value="nutrition" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Nutrition Tracking</h2>

                {meals.length > 0 ? (
                  <div className="space-y-4">
                    {meals.map((meal: any) => (
                      <div key={meal._id} className="bg-slate-700 p-4 rounded">
                        <p className="text-white font-semibold capitalize">{meal.mealType}</p>
                        <p className="text-slate-300 text-sm">
                          {meal.foods?.map((f: any) => f.name).join(", ")}
                        </p>
                        <p className="text-emerald-400 text-sm mt-2">{meal.totals?.calories} cal</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 mb-6">No meals logged today</p>
                )}

                <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-6">
                  Log a Meal
                </Button>
              </Card>
            </TabsContent>

            {/* PROGRESS TAB */}
            <TabsContent value="progress" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Progress Tracking</h2>

                {progressRecords.length > 0 ? (
                  <div className="space-y-4">
                    {progressRecords.slice(0, 5).map((record: any) => (
                      <div key={record._id} className="bg-slate-700 p-4 rounded">
                        <p className="text-slate-300 text-sm">
                          {new Date(record.recordedAt).toLocaleDateString()}
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div>
                            <p className="text-slate-400 text-xs">Weight</p>
                            <p className="text-white font-semibold">
                              {record.bodyMetrics?.weight} kg
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Body Fat</p>
                            <p className="text-white font-semibold">
                              {record.bodyMetrics?.bodyFatPercent}%
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Waist</p>
                            <p className="text-white font-semibold">
                              {record.bodyMetrics?.measurements?.waist} cm
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 mb-6">No progress records yet</p>
                )}

                <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-6">
                  Add Progress Record
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
