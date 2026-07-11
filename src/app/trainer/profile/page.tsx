'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle } from 'lucide-react';

const profileSchema = z.object({
  bio: z.string().min(20, 'Bio must be at least 20 characters'),
  specialty: z.string().min(3, 'Specialty required'),
  yearsOfExperience: z.string().min(1, 'Years required').regex(/^\d+$/, 'Must be a number'),
  languages: z.string(), // comma-separated
  certifications: z.string(), // comma-separated
  hourlyRate: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

async function fetchTrainerProfile() {
  const res = await fetch('/api/trainer/my-profile', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

async function updateProfile(data: ProfileFormData) {
  const res = await fetch('/api/trainer/my-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      languages: data.languages.split(',').map(l => l.trim()),
      certifications: data.certifications.split(',').map(c => c.trim()),
    }),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export default function TrainerProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trainer-profile'],
    queryFn: fetchTrainerProfile,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-profile'] });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: data?.data?.trainer
      ? {
          bio: data.data.trainer.bio || '',
          specialty: data.data.trainer.specialty || '',
          yearsOfExperience: String(data.data.trainer.yearsOfExperience || '0'),
          languages: data.data.trainer.languages?.join(', ') || '',
          certifications: data.data.trainer.certifications?.join(', ') || '',
          hourlyRate: data.data.trainer.hourlyRate ? String(data.data.trainer.hourlyRate) : '',
        }
      : undefined,
  });

  const onSubmit = async (formData: ProfileFormData) => {
    await mutation.mutateAsync(formData);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const { trainer } = data?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Update your professional information</p>
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

      {mutation.isSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Success</h3>
            <p className="text-green-800 text-sm">Your profile has been updated</p>
          </div>
        </div>
      )}

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Gym Owner Approval</p>
              <p className="text-sm text-gray-600">{trainer?.gymVerificationStatus || 'pending'}</p>
            </div>
            <Badge variant={trainer?.gymVerificationStatus === 'approved' ? 'default' : 'secondary'}>
              {trainer?.gymVerificationStatus || 'Pending'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Admin Approval</p>
              <p className="text-sm text-gray-600">{trainer?.adminVerificationStatus || 'pending'}</p>
            </div>
            <Badge variant={trainer?.adminVerificationStatus === 'approved' ? 'default' : 'secondary'}>
              {trainer?.adminVerificationStatus || 'Pending'}
            </Badge>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <p className="font-medium">Fully Verified</p>
              <p className="text-sm text-gray-600">Ready to accept clients</p>
            </div>
            <Badge variant={trainer?.isFullyVerified ? 'default' : 'secondary'}>
              {trainer?.isFullyVerified ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>Help clients understand your expertise</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio *</label>
              <textarea
                {...register('bio')}
                placeholder="Tell clients about your training philosophy and experience..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
              {errors.bio && (
                <p className="text-red-600 text-sm mt-1">{errors.bio.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty *
                </label>
                <Input {...register('specialty')} placeholder="e.g., Weight Loss, Muscle Building" />
                {errors.specialty && (
                  <p className="text-red-600 text-sm mt-1">{errors.specialty.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <Input
                  {...register('yearsOfExperience')}
                  type="number"
                  placeholder="0"
                />
                {errors.yearsOfExperience && (
                  <p className="text-red-600 text-sm mt-1">{errors.yearsOfExperience.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages (comma-separated)
              </label>
              <Input
                {...register('languages')}
                placeholder="English, Spanish, French"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications (comma-separated)
              </label>
              <Input
                {...register('certifications')}
                placeholder="NASM, ISSA, CPT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($) (Optional)
              </label>
              <Input
                {...register('hourlyRate')}
                type="number"
                placeholder="50"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
