'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users, Dumbbell, MessageSquare, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

async function fetchPlatformStats() {
  const res = await fetch('/api/admin/platform-stats', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export default function PlatformStatsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || !['admin', 'super_admin'].includes(user.role))) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchPlatformStats,
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const stats = data?.data?.totals || {};
  const subs = data?.data?.subscriptions || {};
  const registrationsByDay = data?.data?.registrationsByDay || [];
  const usersByCountry = data?.data?.usersByCountry || [];

  // Process subscription data for pie chart
  const subscriptionData = [
    { name: 'Basic', value: subs.basicCount || 0 },
    { name: 'Pro', value: subs.proCount || 0 },
    { name: 'Elite', value: subs.eliteCount || 0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (authLoading || isLoading || !user) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-2">Real-time insights into platform performance</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-red-800 text-sm">{(error as any).message}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Active Subs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeSubscriptions || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Paid subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Verified Trainers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTrainers || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Trainers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Verified Gyms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalGyms || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Gyms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Est. Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.revenueEstimate || '0'}</div>
              <p className="text-xs text-gray-500 mt-1">Monthly</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Registrations Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Registrations (Last 30 Days)</CardTitle>
              <CardDescription>Daily sign-ups trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={registrationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="New Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subscription Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Breakdown</CardTitle>
              <CardDescription>Active plans by tier</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No subscription data</p>
              )}
            </CardContent>
          </Card>

          {/* Top Countries */}
          <Card>
            <CardHeader>
              <CardTitle>Top Countries by Users</CardTitle>
              <CardDescription>User distribution by location</CardDescription>
            </CardHeader>
            <CardContent>
              {usersByCountry.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usersByCountry}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No country data</p>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Summary</CardTitle>
              <CardDescription>Key statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Recipes</span>
                <span className="font-semibold">{stats.totalRecipes || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Exercises</span>
                <span className="font-semibold">{stats.totalExercises || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Users Today</span>
                <span className="font-semibold">{stats.newUsersToday || 0}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-gray-600 font-semibold">Subscription Breakdown</span>
              </div>
              <div className="flex justify-between items-center pl-2">
                <span className="text-gray-600">Basic Plan</span>
                <span className="font-semibold">{subs.basicCount || 0}</span>
              </div>
              <div className="flex justify-between items-center pl-2">
                <span className="text-gray-600">Pro Plan</span>
                <span className="font-semibold">{subs.proCount || 0}</span>
              </div>
              <div className="flex justify-between items-center pl-2">
                <span className="text-gray-600">Elite Plan</span>
                <span className="font-semibold">{subs.eliteCount || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
