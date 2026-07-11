'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCIES, TIMEZONES, LANGUAGES } from '@/lib/worldwide';
import { CheckCircle, Globe } from 'lucide-react';

async function fetchUserPreferences() {
  const res = await fetch('/api/user/preferences', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch preferences');
  return res.json();
}

async function updateUserPreferences(preferences: any) {
  const res = await fetch('/api/user/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return res.json();
}

export default function PreferencesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState('');

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC+00:00',
    currency: 'USD',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: fetchUserPreferences,
    enabled: !!user,
  });

  useEffect(() => {
    if (data?.data?.preferences) {
      setPreferences(data.data.preferences);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: () => {
      setSuccessMessage('Preferences updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (authLoading || isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Worldwide Preferences</h1>
            <p className="text-gray-600 mt-1">Customize your language, timezone, and currency</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>
              Choose your preferred language for the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={preferences.language} onValueChange={(value: any) => setPreferences((prev) => ({ ...prev, language: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
              ℹ️ Language preference will apply to the platform interface and notifications
            </div>
          </CardContent>
        </Card>

        {/* Timezone Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Timezone</CardTitle>
            <CardDescription>
              Set your timezone for correct time display and trainer availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={preferences.timezone} onValueChange={(value: any) => setPreferences((prev) => ({ ...prev, timezone: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
              ℹ️ Your timezone will be used to display trainer availability and schedule appointments
            </div>
          </CardContent>
        </Card>

        {/* Currency Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>
              Choose your preferred currency for pricing and payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={preferences.currency} onValueChange={(value: any) => setPreferences((prev) => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CURRENCIES).map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="mr-2">{currency.symbol}</span>
                    {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
              ℹ️ Prices will be displayed and converted in your selected currency
            </div>
          </CardContent>
        </Card>

        {/* Current Settings Summary */}
        <Card className="bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle>Your Current Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Language</p>
                <Badge variant="default">
                  {LANGUAGES.find((l) => l.code === preferences.language)?.name || 'English'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Timezone</p>
                <Badge variant="default">
                  {TIMEZONES.find((t) => t.value === preferences.timezone)?.label?.split(') ')[1] || 'UTC'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Currency</p>
                <Badge variant="default">
                  {CURRENCIES[preferences.currency]?.symbol} {preferences.currency}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}
