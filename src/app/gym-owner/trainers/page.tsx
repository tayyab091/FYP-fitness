'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, X, Plus } from 'lucide-react';
import { useState } from 'react';


async function fetchTrainers() {
  const res = await fetch('/api/gym-owner/trainers', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch trainers');
  return res.json();
}

async function approveTrainer(trainerId: string) {
  const res = await fetch(`/api/gym-owner/trainers/${trainerId}/approve`, {
    method: 'PUT',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to approve trainer');
  return res.json();
}

async function rejectTrainer(trainerId: string, reason: string) {
  const res = await fetch(`/api/gym-owner/trainers/${trainerId}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to reject trainer');
  return res.json();
}

async function removeTrainer(trainerId: string) {
  const res = await fetch(`/api/gym-owner/trainers/${trainerId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to remove trainer');
  return res.json();
}

async function createTrainer(data: any) {
  const res = await fetch(`/api/gym-owner/trainers/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create trainer');
  }
  return res.json();
}

export default function TrainersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gym-trainers'],
    queryFn: fetchTrainers,
  });

  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    specialty: [] as string[],
    yearsOfExperience: '',
    languages: ['English'] as string[],
  });

  const specialties = ['Weight Loss', 'Muscle Gain', 'Strength Training', 'Cardio', 'Yoga', 'CrossFit'];
  const languages = ['English', 'Arabic', 'French', 'Spanish', 'German', 'Urdu'];

  const approveMutation = useMutation({
    mutationFn: approveTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-trainers'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ trainerId, reason }: { trainerId: string; reason: string }) =>
      rejectTrainer(trainerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-trainers'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-trainers'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: createTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-trainers'] });
      setShowCreateForm(false);
      setCreateForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        bio: '',
        specialty: [],
        yearsOfExperience: '',
        languages: ['English'],
      });
      alert('Trainer created successfully! Admin will review for final approval.');
    },
    onError: (err: any) => {
      alert(`Error: ${err.message}`);
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const trainers = Array.isArray(data?.data) ? data.data : [];
  const pendingCount = trainers.filter((t: any) => t.gymVerificationStatus === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Trainers</h1>
          <p className="text-gray-600 mt-2">
            {pendingCount} trainer{pendingCount !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Trainer
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-800 text-sm">{(error as any).message}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Trainers</CardTitle>
          <CardDescription>
            Total {trainers?.length || 0} trainer{trainers?.length !== 1 ? 's' : ''} in your gym
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers && trainers.length > 0 ? (
                  trainers.map((trainer: any) => (
                    <TableRow key={trainer._id}>
                      <TableCell className="font-medium">{trainer.user?.fullName || trainer.name || 'Unknown'}</TableCell>
                      <TableCell>{trainer.specialty?.join(', ') || 'N/A'}</TableCell>
                      <TableCell>{trainer.yearsOfExperience} years</TableCell>
                      <TableCell>{getStatusBadge(trainer.gymVerificationStatus)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {trainer.gymVerificationStatus === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  approveMutation.mutate(trainer._id)
                                }
                                disabled={approveMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectingId(trainer._id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {trainer.gymVerificationStatus === 'approved' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeMutation.mutate(trainer._id)}
                              disabled={removeMutation.isPending}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No trainers yet. Create your first trainer!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Trainer Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Create Trainer Profile</CardTitle>
                  <CardDescription>Add a new trainer to your gym</CardDescription>
                </div>
                <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={createForm.phoneNumber}
                onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Bio"
                value={createForm.bio}
                onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              />
              <input
                type="number"
                min="0"
                max="50"
                placeholder="Years of Experience"
                value={createForm.yearsOfExperience}
                onChange={(e) => setCreateForm({ ...createForm, yearsOfExperience: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setCreateForm({
                          ...createForm,
                          specialty: createForm.specialty.includes(s)
                            ? createForm.specialty.filter((x) => x !== s)
                            : [...createForm.specialty, s],
                        });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        createForm.specialty.includes(s)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {languages.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setCreateForm({
                          ...createForm,
                          languages: createForm.languages.includes(l)
                            ? createForm.languages.filter((x) => x !== l)
                            : [...createForm.languages, l],
                        });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        createForm.languages.includes(l)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!createForm.fullName || !createForm.email || !createForm.bio) {
                      alert('Please fill all required fields');
                      return;
                    }
                    createMutation.mutate(createForm);
                  }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Trainer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Trainer</CardTitle>
              <CardDescription>Provide a reason for rejection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why are you rejecting this trainer?"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectingId(null);
                    setRejectReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    rejectMutation.mutate(
                      { trainerId: rejectingId, reason: rejectReason },
                      {
                        onSuccess: () => {
                          setRejectingId(null);
                          setRejectReason('');
                        },
                      }
                    );
                  }}
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
