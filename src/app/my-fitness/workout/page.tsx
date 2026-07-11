"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function WorkoutLogPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<any[]>([]);
  const [currentExercise, setCurrentExercise] = useState({
    name: "",
    sets: 3,
    reps: 10,
    weight: 0,
  });

  // Fetch active workout plan
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

  const plan = planData?.data?.plan;
  const todaySession = planData?.data?.todaySession;

  // Start workout mutation
  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tracking/logs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: plan._id,
          dayOfWeek: new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase(),
          sessionName: todaySession?.sessionName || "Workout Session",
        }),
      });
      if (!res.ok) throw new Error("Failed to start workout");
      return res.json();
    },
    onSuccess: (data) => {
      sessionStorage.setItem("activeLogId", data.data._id);
    },
  });

  // Complete workout mutation
  const completeWorkoutMutation = useMutation({
    mutationFn: async (logId: string) => {
      const res = await fetch(`/api/tracking/logs/${logId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userFeedback: {
            energyLevel: 4,
            difficultyLevel: 3,
            moodAfter: 5,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to complete workout");
      return res.json();
    },
    onSuccess: () => {
      sessionStorage.removeItem("activeLogId");
      router.push("/my-fitness");
    },
  });

  const addExercise = () => {
    if (currentExercise.name) {
      setExercises([...exercises, currentExercise]);
      setCurrentExercise({ name: "", sets: 3, reps: 10, weight: 0 });
    }
  };

  if (!plan) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <p className="text-slate-300">No active workout plan. Request a trainer first!</p>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {todaySession?.sessionName || "Workout Session"}
            </h1>
            <p className="text-slate-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Exercise Input */}
          <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Add Exercise</h2>
            <div className="space-y-4">
              <Input
                placeholder="Exercise name"
                value={currentExercise.name}
                onChange={(e) =>
                  setCurrentExercise({ ...currentExercise, name: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 text-sm">Sets</label>
                  <Input
                    type="number"
                    value={currentExercise.sets}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, sets: parseInt(e.target.value) })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Reps</label>
                  <Input
                    type="number"
                    value={currentExercise.reps}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, reps: parseInt(e.target.value) })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Weight (kg)</label>
                  <Input
                    type="number"
                    value={currentExercise.weight}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, weight: parseFloat(e.target.value) })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <Button onClick={addExercise} className="w-full bg-blue-600 hover:bg-blue-700">
                Add Exercise
              </Button>
            </div>
          </Card>

          {/* Exercises List */}
          {exercises.length > 0 && (
            <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Today's Exercises</h2>
              <div className="space-y-3">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="bg-slate-700 p-4 rounded flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">{ex.name}</p>
                      <p className="text-slate-400 text-sm">
                        {ex.sets} × {ex.reps} @ {ex.weight}kg
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setExercises(exercises.filter((_, i) => i !== idx))}
                      className="text-red-400 border-red-400 hover:bg-red-900"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => startWorkoutMutation.mutate()}
              disabled={exercises.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {startWorkoutMutation.isPending ? "Starting..." : "Start Workout"}
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
