'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle } from 'lucide-react';

const gymSchema = z.object({
  name: z.string().min(3, 'Gym name required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  phone: z.string().min(10, 'Phone number required'),
  email: z.string().email('Valid email required'),
  website: z.string().url('Valid URL required').optional().or(z.literal('')),
  street: z.string().min(5, 'Street address required'),
  city: z.string().min(2, 'City required'),
  country: z.string().min(2, 'Country required'),
  postalCode: z.string().optional(),
});

type GymFormData = z.infer<typeof gymSchema>;


async function fetchGym() {
  const res = await fetch(`/api/gym-owner/gym`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch gym');
  return res.json();
}

async function updateGym(data: GymFormData) {
  const res = await fetch(`/api/gym-owner/gym`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      phone: data.phone,
      email: data.email,
      website: data.website || '',
      address: {
        street: data.street,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode || '',
      },
    }),
  });
  if (!res.ok) throw new Error('Failed to update gym');
  return res.json();
}

export default function GymProfilePage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['gym-profile'],
    queryFn: fetchGym,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<GymFormData>({
    resolver: zodResolver(gymSchema),
  });

  // Populate form when data loads
  useEffect(() => {
    if (data?.data) {
      const gymData = data.data;
      reset({
        name: gymData.name || '',
        description: gymData.description || '',
        phone: gymData.phone || '',
        email: gymData.email || '',
        website: gymData.website || '',
        street: gymData.address?.street || '',
        city: gymData.address?.city || '',
        country: gymData.address?.country || '',
        postalCode: gymData.address?.postalCode || '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: updateGym,
    onSuccess: () => {
      setSuccessMsg('Gym profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['gym-profile'] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const onSubmit = async (formData: GymFormData) => {
    mutation.mutate(formData);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Gym</h1>
        <p className="text-gray-600 mt-2">Manage your gym profile and submit for verification</p>
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

      {mutation.isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-800 text-sm">{(mutation.error as any).message}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Success</h3>
            <p className="text-green-800 text-sm">{successMsg}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gym Information</CardTitle>
          <CardDescription>Update your gym's information to get verified by admin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gym Name *
                </label>
                <Input {...register('name')} placeholder="Your Gym Name" />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <Input {...register('phone')} placeholder="+1234567890" />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                placeholder="Tell us about your gym..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input {...register('email')} placeholder="gym@example.com" type="email" />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <Input {...register('website')} placeholder="https://example.com" type="url" />
                {errors.website && (
                  <p className="text-red-600 text-sm mt-1">{errors.website?.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <Input {...register('street')} placeholder="Street Address" />
              {errors.street && (
                <p className="text-red-600 text-sm mt-1">{errors.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <Input {...register('city')} placeholder="City" />
                {errors.city && (
                  <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <Input {...register('country')} placeholder="Country" />
                {errors.country && (
                  <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <Input {...register('postalCode')} placeholder="Postal Code" />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save & Submit for Verification'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (data?.data) {
                    reset({
                      name: data.data.name || '',
                      description: data.data.description || '',
                      phone: data.data.phone || '',
                      email: data.data.email || '',
                      website: data.data.website || '',
                      street: data.data.address?.street || '',
                      city: data.data.address?.city || '',
                      country: data.data.address?.country || '',
                      postalCode: data.data.address?.postalCode || '',
                    });
                  }
                }}
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
