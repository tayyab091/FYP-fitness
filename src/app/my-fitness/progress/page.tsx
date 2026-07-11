"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProgressPage() {
  const queryClient = useQueryClient();
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    bodyFatPercent: "",
    chestCirc: "",
    waistCirc: "",
    hipsCirc: "",
    armsCirc: "",
    thighsCirc: "",
  });

  // Fetch progress history
  const { data: progressData, isLoading } = useQuery({
    queryKey: ["my-progress"],
    queryFn: async () => {
      const res = await fetch("/api/tracking/progress/my-progress", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  // Add progress record mutation
  const addProgressMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tracking/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bodyMetrics: {
            weight: parseFloat(formData.weight),
            bodyFatPercent: parseFloat(formData.bodyFatPercent),
            measurements: {
              chest: parseFloat(formData.chestCirc),
              waist: parseFloat(formData.waistCirc),
              hips: parseFloat(formData.hipsCirc),
              arms: parseFloat(formData.armsCirc),
              thighs: parseFloat(formData.thighsCirc),
            },
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to add progress record");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-progress"] });
      setIsAddingRecord(false);
      setFormData({
        weight: "",
        bodyFatPercent: "",
        chestCirc: "",
        waistCirc: "",
        hipsCirc: "",
        armsCirc: "",
        thighsCirc: "",
      });
    },
  });

  const records = progressData?.data || [];

  // Calculate progress
  const calculateChange = (field: string) => {
    if (records.length < 2) return null;
    const latest = records[0];
    const previous = records[1];
    const latestVal = field === "weight" ? latest.bodyMetrics?.weight : latest.bodyMetrics?.bodyFatPercent;
    const prevVal = field === "weight" ? previous.bodyMetrics?.weight : previous.bodyMetrics?.bodyFatPercent;
    return latestVal - prevVal;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Progress Tracking</h1>
            <p className="text-slate-400">Monitor your body measurements and fitness improvements</p>
          </div>

          {/* Add Record Form */}
          {isAddingRecord && (
            <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6">Add Progress Record</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-slate-300 text-sm">Weight (kg)</label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Body Fat %</label>
                  <Input
                    type="number"
                    placeholder="15"
                    value={formData.bodyFatPercent}
                    onChange={(e) => setFormData({ ...formData, bodyFatPercent: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Chest (cm)</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={formData.chestCirc}
                    onChange={(e) => setFormData({ ...formData, chestCirc: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Waist (cm)</label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={formData.waistCirc}
                    onChange={(e) => setFormData({ ...formData, waistCirc: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Hips (cm)</label>
                  <Input
                    type="number"
                    placeholder="95"
                    value={formData.hipsCirc}
                    onChange={(e) => setFormData({ ...formData, hipsCirc: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm">Arms (cm)</label>
                  <Input
                    type="number"
                    placeholder="32"
                    value={formData.armsCirc}
                    onChange={(e) => setFormData({ ...formData, armsCirc: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => addProgressMutation.mutate()}
                  disabled={!formData.weight || !formData.bodyFatPercent}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {addProgressMutation.isPending ? "Saving..." : "Save Record"}
                </Button>
                <Button
                  onClick={() => setIsAddingRecord(false)}
                  variant="outline"
                  className="flex-1 border-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Records List */}
          {!isAddingRecord && (
            <div className="mb-6">
              <Button
                onClick={() => setIsAddingRecord(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Add Progress Record
              </Button>
            </div>
          )}

          {isLoading ? (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <p className="text-slate-300">Loading progress records...</p>
            </Card>
          ) : records.length > 0 ? (
            <div className="grid gap-4">
              {records.map((record: any, idx: number) => {
                const weightChange = idx === 0 ? calculateChange("weight") : null;
                const bodyFatChange = idx === 0 ? calculateChange("bodyFat") : null;
                return (
                  <Card key={record._id} className="bg-slate-800 border-slate-700 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-slate-300 text-sm">
                          {new Date(record.recordedAt).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {new Date(record.recordedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {idx === 0 && records.length > 1 && (
                        <div className="text-right">
                          <p className="text-emerald-400 text-sm font-semibold">Latest Record</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-700 p-3 rounded">
                        <p className="text-slate-400 text-xs">Weight</p>
                        <p className="text-white font-semibold text-lg">
                          {record.bodyMetrics?.weight} kg
                        </p>
                        {idx === 0 && weightChange !== null && (
                          <p
                            className={`text-xs mt-1 ${
                              weightChange > 0 ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {weightChange > 0 ? "+" : ""}
                            {weightChange.toFixed(1)} kg
                          </p>
                        )}
                      </div>

                      <div className="bg-slate-700 p-3 rounded">
                        <p className="text-slate-400 text-xs">Body Fat</p>
                        <p className="text-white font-semibold text-lg">
                          {record.bodyMetrics?.bodyFatPercent}%
                        </p>
                        {idx === 0 && bodyFatChange !== null && (
                          <p
                            className={`text-xs mt-1 ${
                              bodyFatChange > 0 ? "text-red-400" : "text-emerald-400"
                            }`}
                          >
                            {bodyFatChange > 0 ? "+" : ""}
                            {bodyFatChange.toFixed(1)}%
                          </p>
                        )}
                      </div>

                      <div className="bg-slate-700 p-3 rounded">
                        <p className="text-slate-400 text-xs">Chest</p>
                        <p className="text-white font-semibold">
                          {record.bodyMetrics?.measurements?.chest} cm
                        </p>
                      </div>

                      <div className="bg-slate-700 p-3 rounded">
                        <p className="text-slate-400 text-xs">Waist</p>
                        <p className="text-white font-semibold">
                          {record.bodyMetrics?.measurements?.waist} cm
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <p className="text-slate-400">No progress records yet. Start tracking your progress!</p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
