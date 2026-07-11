'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

async function fetchGymDashboard() {
  const res = await fetch('/api/gym-owner/dashboard', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export default function GymOwnerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'gym_owner')) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['gym-owner-dashboard'],
    queryFn: fetchGymDashboard,
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (authLoading || isLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-red-800 text-sm">{(error as any).message}</p>
        </div>
      </div>
    );
  }

  const { gym, stats, verificationProgress } = data?.data || {};

  // Verification status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to your gym management center</p>
      </div>

      {/* Verification Status Banner */}
      {verificationProgress?.status !== 'verified' && (
        <Card className={`border-l-4 ${getStatusColor(verificationProgress?.status)}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {verificationProgress?.status === 'pending' && (
                    <>
                      <Clock className="w-5 h-5" />
                      Verification Pending
                    </>
                  )}
                  {verificationProgress?.status === 'under_review' && (
                    <>
                      <Clock className="w-5 h-5" />
                      Under Review
                    </>
                  )}
                  {verificationProgress?.status === 'rejected' && (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Verification Rejected
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {verificationProgress?.status === 'pending' &&
                    'Your gym is awaiting admin review. This usually takes 1-2 business days.'}
                  {verificationProgress?.status === 'under_review' &&
                    'Your gym is currently being reviewed by our team.'}
                  {verificationProgress?.status === 'rejected' &&
                    `Reason: ${verificationProgress?.verificationNote || 'Please check your documents and try again.'}`}
                </CardDescription>
              </div>
              {verificationProgress?.status === 'rejected' && (
                <Link href="/gym-owner/gym">
                  <Button size="sm">Resubmit</Button>
                </Link>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.trainerCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active trainers in your gym</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats?.pendingTrainers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting your approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.memberCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Subscribed users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="capitalize">{stats?.platformPlan || 'free'}</Badge>
            <p className="text-xs text-gray-500 mt-2">
              <Link href="/gym-owner/settings" className="text-blue-600 hover:underline">
                Upgrade Plan →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/gym-owner/trainers">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Trainers
              </Button>
            </Link>
            <Link href="/gym-owner/members">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                View Members
              </Button>
            </Link>
            <Link href="/gym-owner/gym">
              <Button variant="outline" className="w-full justify-start">
                Update Gym Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Verification Checklist */}
      {verificationProgress?.status !== 'verified' && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Checklist</CardTitle>
            <CardDescription>Complete these steps to get your gym verified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Complete Gym Profile</p>
                <p className="text-sm text-gray-600">Add name, address, contact information</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Upload Verification Documents</p>
                <p className="text-sm text-gray-600">Business registration, gym photos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Admin Review</p>
                <p className="text-sm text-gray-600">Our team will verify your information</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Go Live</p>
                <p className="text-sm text-gray-600">Start managing trainers and members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
