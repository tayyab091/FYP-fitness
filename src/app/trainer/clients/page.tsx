'use client';

import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function TrainerClientsPage() {
  const router = useRouter();

  // Fetch trainer's clients
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["my-clients"],
    queryFn: async () => {
      const res = await fetch("/api/relationships/my-clients", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const clients = clientsData?.data || [];

  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Clients</h1>
            <p className="text-slate-400">Manage and track your clients' progress</p>
          </div>

          {isLoading ? (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <p className="text-slate-300">Loading clients...</p>
            </Card>
          ) : clients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client: any) => (
                <Card
                  key={client._id}
                  className="bg-slate-800 border-slate-700 p-6 hover:border-emerald-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{client.userId?.fullName}</h3>
                      <p className="text-slate-400 text-sm">{client.userId?.email}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-900 text-emerald-200 rounded-full text-xs font-semibold">
                      {client.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className="text-white capitalize">{client.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Joined</span>
                      <span className="text-white">
                        {new Date(client.connectedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {client.accessFlags && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Messages Available</span>
                        <span className="text-emerald-400">
                          {client.freeMessagesLimit - client.freeMessagesUsed}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => router.push(`/trainer/clients/${client.userId._id}`)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    View Details
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700 p-6">
              <p className="text-slate-400">No active clients yet.</p>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
