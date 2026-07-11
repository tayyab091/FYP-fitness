'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';

async function fetchPlatformSettings() {
  const res = await fetch('/api/admin/platform-settings', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

async function updatePlatformSettings(settings: any) {
  const res = await fetch('/api/admin/platform-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export default function PlatformSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState('');

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace('/');
    }
  }, [authLoading, user, isAdmin, router]);

  const [settings, setSettings] = useState({
    freeChatLimit: 5,
    basicPlanPrice: 9.99,
    proPlanPrice: 19.99,
    elitePlanPrice: 49.99,
    enableTrainerVerification: true,
    enableGymVerification: true,
    maintenanceMode: false,
    maintenanceMessage: 'Platform is under maintenance. Please try again later.',
    supportEmail: 'support@test.fitness',
    platformName: 'T.E.S.T. Fitness',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: fetchPlatformSettings,
    enabled: !!user && isAdmin,
  });

  // Update settings when data is fetched
  useEffect(() => {
    if (data?.data) {
      setSettings(data.data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updatePlatformSettings,
    onSuccess: () => {
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  if (authLoading || isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
            <p className="text-gray-600 mt-2">
              Configure global platform parameters
              {!isSuperAdmin && (
                <span className="ml-2 inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                  View Only - Contact super admin to edit
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Chat Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Chat & Messaging</CardTitle>
            <CardDescription>Free tier message limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Free Chat Message Limit (per conversation)
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={settings.freeChatLimit ?? ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    freeChatLimit: parseInt(e.target.value) || 5,
                  }))
                }
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-2">
                Unpaid users can send this many messages per conversation before being prompted to upgrade
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Pricing</CardTitle>
            <CardDescription>Monthly plan prices in USD</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Basic Plan
                </label>
                <div className="flex items-center">
                  <span className="text-xl font-semibold">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.basicPlanPrice ?? ''}
                    onChange={(e) =>
                      isSuperAdmin && setSettings((prev) => ({
                        ...prev,
                        basicPlanPrice: parseFloat(e.target.value) || 9.99,
                      }))
                    }
                    disabled={!isSuperAdmin}
                    className="ml-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pro Plan
                </label>
                <div className="flex items-center">
                  <span className="text-xl font-semibold">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.proPlanPrice ?? ''}
                    onChange={(e) =>
                      isSuperAdmin && setSettings((prev) => ({
                        ...prev,
                        proPlanPrice: parseFloat(e.target.value) || 19.99,
                      }))
                    }
                    disabled={!isSuperAdmin}
                    className="ml-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Elite Plan
                </label>
                <div className="flex items-center">
                  <span className="text-xl font-semibold">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.elitePlanPrice ?? ''}
                    onChange={(e) =>
                      isSuperAdmin && setSettings((prev) => ({
                        ...prev,
                        elitePlanPrice: parseFloat(e.target.value) || 49.99,
                      }))
                    }
                    disabled={!isSuperAdmin}
                    className="ml-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
            <CardDescription>Enable/disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Trainer Verification</p>
                <p className="text-sm text-gray-600">Require admin approval for trainers</p>
              </div>
              <Badge variant={settings.enableTrainerVerification ? 'default' : 'secondary'}>
                {settings.enableTrainerVerification ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Gym Verification</p>
                <p className="text-sm text-gray-600">Require admin approval for gyms</p>
              </div>
              <Badge variant={settings.enableGymVerification ? 'default' : 'secondary'}>
                {settings.enableGymVerification ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Global platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Name
              </label>
              <Input
                value={settings.platformName ?? ''}
                onChange={(e) =>
                  isSuperAdmin && setSettings((prev) => ({
                    ...prev,
                    platformName: e.target.value,
                  }))
                }
                disabled={!isSuperAdmin}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <Input
                type="email"
                value={settings.supportEmail ?? ''}
                onChange={(e) =>
                  isSuperAdmin && setSettings((prev) => ({
                    ...prev,
                    supportEmail: e.target.value,
                  }))
                }
                disabled={!isSuperAdmin}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        {isSuperAdmin && (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
