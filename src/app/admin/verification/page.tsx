'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, X, MapPin, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

async function fetchPendingGyms() {
  const res = await fetch('/api/admin/gyms/pending', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch gyms');
  return res.json();
}

async function fetchPendingTrainers() {
  const res = await fetch('/api/admin/trainers/pending', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch trainers');
  return res.json();
}

async function verifyGym(gymId: string) {
  const res = await fetch(`/api/admin/gyms/${gymId}/verify`, {
    method: 'PUT',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to verify gym');
  return res.json();
}

async function rejectGym(gymId: string, reason: string) {
  const res = await fetch(`/api/admin/gyms/${gymId}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to reject gym');
  return res.json();
}

async function verifyTrainer(trainerId: string) {
  const res = await fetch(`/api/admin/trainers/${trainerId}/verify`, {
    method: 'PUT',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to verify trainer');
  return res.json();
}

async function rejectTrainer(trainerId: string, reason: string) {
  const res = await fetch(`/api/admin/trainers/${trainerId}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to reject trainer');
  return res.json();
}

export default function AdminVerificationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectingType, setRejectingType] = useState<'gym' | 'trainer' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // All hooks must be called unconditionally - check auth after hooks
  const isAdmin = user && ['admin', 'super_admin'].includes(user.role || '');
  const shouldFetch = !!(user && isAdmin);

  const { data: gymsData, isLoading: gymsLoading, error: gymsError } = useQuery({
    queryKey: ['admin-pending-gyms'],
    queryFn: fetchPendingGyms,
    enabled: shouldFetch as boolean,
  });

  const { data: trainersData, isLoading: trainersLoading, error: trainersError } = useQuery({
    queryKey: ['admin-pending-trainers'],
    queryFn: fetchPendingTrainers,
    enabled: shouldFetch as boolean,
  });

  const verifyGymMutation = useMutation({
    mutationFn: verifyGym,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-gyms'] });
    },
  });

  const rejectGymMutation = useMutation({
    mutationFn: ({ gymId, reason }: { gymId: string; reason: string }) => rejectGym(gymId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-gyms'] });
      setRejectingId(null);
      setRejectReason('');
    },
  });

  const verifyTrainerMutation = useMutation({
    mutationFn: verifyTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-trainers'] });
    },
  });

  const rejectTrainerMutation = useMutation({
    mutationFn: ({ trainerId, reason }: { trainerId: string; reason: string }) =>
      rejectTrainer(trainerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-trainers'] });
      setRejectingId(null);
      setRejectReason('');
    },
  });

  const gyms = Array.isArray(gymsData?.data) ? gymsData.data : [];
  const trainers = Array.isArray(trainersData?.data) ? trainersData.data : [];

  // Redirect non-admin users after all hooks have rendered
  if (!authLoading && !isAdmin) {
    router.replace('/login');
    return null;
  }

  if (authLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Dashboard</h1>
          <p className="text-gray-600 mt-2">Review and approve gyms and trainers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Gyms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{gyms.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Trainers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {trainers.filter((t: any) => t.adminVerificationStatus === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{gyms.length + trainers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="gyms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gyms">
              Gym Verification ({gyms.length})
            </TabsTrigger>
            <TabsTrigger value="trainers">
              Trainer Verification ({trainers.length})
            </TabsTrigger>
          </TabsList>

          {/* Gyms Tab */}
          <TabsContent value="gyms" className="space-y-4">
            {gymsError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-red-800 text-sm">{(gymsError as any).message}</p>
              </div>
            )}

            {gymsLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : gyms.length > 0 ? (
              <div className="space-y-4">
                {gyms.map((gym: any) => (
                  <Card key={gym._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{gym.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <MapPin className="w-4 h-4" />
                            {gym.address?.street ? `${gym.address.street}, ` : ''}{gym.city}, {gym.country}
                          </CardDescription>
                        </div>
                        <Badge className="capitalize">{gym.verificationStatus}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Description</p>
                        <p className="text-sm text-gray-700">{gym.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Owner</p>
                          <p className="font-medium">{gym.ownerId?.fullName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Contact</p>
                          <p className="font-medium">{gym.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-medium">{gym.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Submitted</p>
                          <p className="font-medium">
                            {new Date(gym.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {gym.verificationNote && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                          <p className="font-medium text-yellow-900">Note: {gym.verificationNote}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => verifyGymMutation.mutate(gym._id)}
                          disabled={verifyGymMutation.isPending}
                          className="flex-1 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setRejectingId(gym._id);
                            setRejectingType('gym');
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-8 text-center">
                  <p className="text-gray-600">No pending gym verifications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Trainers Tab */}
          <TabsContent value="trainers" className="space-y-4">
            {trainersError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-red-800 text-sm">{(trainersError as any).message}</p>
              </div>
            )}

            {trainersLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : trainers.length > 0 ? (
              <div className="space-y-4">
                {trainers
                  .filter((t: any) => t.adminVerificationStatus === 'pending')
                  .map((trainer: any) => (
                    <Card key={trainer._id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {trainer.userId?.fullName || 'Unknown'}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {trainer.specialty} • {trainer.yearsOfExperience} years
                            </CardDescription>
                          </div>
                          <div className="space-y-1">
                            <Badge variant={trainer.gymVerificationStatus === 'approved' ? 'default' : 'secondary'}>
                              Gym: {trainer.gymVerificationStatus}
                            </Badge>
                            <Badge className="block text-center">
                              Admin: {trainer.adminVerificationStatus}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-medium mb-2">Bio</p>
                          <p className="text-sm text-gray-700">{trainer.bio}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-medium">{trainer.userId?.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Gym</p>
                            <p className="font-medium">{trainer.gymId?.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Languages</p>
                            <p className="font-medium">{trainer.languages?.join(', ')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Submitted</p>
                            <p className="font-medium">
                              {new Date(trainer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {!trainer.gymVerificationStatus || trainer.gymVerificationStatus !== 'approved' && (
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                            <p className="text-blue-900">
                              ⓘ Gym owner approval status: {trainer.gymVerificationStatus || 'pending'}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => verifyTrainerMutation.mutate(trainer._id)}
                            disabled={
                              verifyTrainerMutation.isPending ||
                              trainer.gymVerificationStatus !== 'approved'
                            }
                            className="flex-1 flex items-center gap-2"
                            title={
                              trainer.gymVerificationStatus !== 'approved'
                                ? 'Gym owner must approve first'
                                : ''
                            }
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setRejectingId(trainer._id);
                              setRejectingType('trainer');
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-8 text-center">
                  <p className="text-gray-600">No pending trainer verifications</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        {rejectingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Reject {rejectingType === 'gym' ? 'Gym' : 'Trainer'}</CardTitle>
                <CardDescription>Provide a reason for rejection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Why are you rejecting this?"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRejectingId(null);
                      setRejectingType(null);
                      setRejectReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (rejectingType === 'gym') {
                        rejectGymMutation.mutate({
                          gymId: rejectingId,
                          reason: rejectReason,
                        });
                      } else {
                        rejectTrainerMutation.mutate({
                          trainerId: rejectingId,
                          reason: rejectReason,
                        });
                      }
                    }}
                    disabled={
                      !rejectReason.trim() ||
                      (rejectingType === 'gym' && rejectGymMutation.isPending) ||
                      (rejectingType === 'trainer' && rejectTrainerMutation.isPending)
                    }
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
