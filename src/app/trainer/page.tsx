'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, Clock, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';

async function fetchTrainerDashboard() {
  const res = await fetch('/api/trainer/my-status', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export default function TrainerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'trainer')) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['trainer-dashboard'],
    queryFn: fetchTrainerDashboard,
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (authLoading || isLoading || !user) {
    return <Skeleton className="h-screen w-full" />;
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

  const { trainer, stats, recentMessages, gymVerificationStatus, adminVerificationStatus, isFullyVerified } = data?.data || {};

  const verificationProgress = {
    gym: gymVerificationStatus || trainer?.gymVerificationStatus || 'pending',
    admin: adminVerificationStatus || trainer?.adminVerificationStatus || 'pending',
    isFullyVerified: isFullyVerified || trainer?.isFullyVerified || false,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600 mt-2">Here's an overview of your trainer profile</p>
      </div>

      {/* Verification Status */}
      {!verificationProgress.isFullyVerified && (
        <Card className={`border-l-4 ${getStatusColor('pending')}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Verification in Progress
                </CardTitle>
                <CardDescription>
                  {verificationProgress.gym === 'approved' && verificationProgress.admin === 'pending'
                    ? 'Your gym owner approved you! Waiting for admin final verification.'
                    : 'Your gym owner needs to approve your profile first.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {verificationProgress.gym === 'approved' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
                <span>Gym Owner Approval: {verificationProgress.gym}</span>
              </div>
              <div className="flex items-center gap-2">
                {verificationProgress.admin === 'approved' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-600" />
                )}
                <span>Admin Final Approval: {verificationProgress.admin}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Banner */}
      {verificationProgress.isFullyVerified && (
        <Card className="border-l-4 bg-green-50 border-green-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="w-5 h-5" />
              Profile Verified!
            </CardTitle>
            <CardDescription className="text-green-800">
              You're fully verified and can start accepting clients
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Total Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalChats || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Ongoing conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.rating || '0'}/5</div>
            <p className="text-xs text-gray-500 mt-1">From client reviews</p>
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
            <Link href="/trainer/profile">
              <Button variant="outline" className="w-full justify-start">
                Update Profile
              </Button>
            </Link>
            <Link href="/trainer/chats">
              <Button variant="outline" className="w-full justify-start">
                View Chats
              </Button>
            </Link>
            <Link href="/trainer/clients">
              <Button variant="outline" className="w-full justify-start">
                Manage Clients
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      {recentMessages && recentMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Latest conversations with clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMessages.map((msg: any) => (
                <div key={msg._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{msg.senderName}</p>
                    <p className="text-sm text-gray-600 truncate">{msg.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
