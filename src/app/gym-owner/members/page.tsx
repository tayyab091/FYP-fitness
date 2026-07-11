'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

async function fetchMembers() {
  const res = await fetch('/api/gym-owner/members', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

export default function MembersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gym-members'],
    queryFn: fetchMembers,
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const { members } = data?.data || {};

  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription || subscription.status !== 'active') {
      return <Badge variant="outline">No Active Plan</Badge>;
    }

    const colors = {
      basic: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      elite: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={colors[subscription.plan as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {subscription.plan.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Members</h1>
        <p className="text-gray-600 mt-2">
          Users subscribed to trainers in your gym ({members?.length || 0} total)
        </p>
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
          <CardTitle>All Members</CardTitle>
          <CardDescription>Users subscribed to your gym's trainers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members && members.length > 0 ? (
                  members.map((member: any) => (
                    <TableRow key={member._id}>
                      <TableCell className="font-medium">{member.fullName}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{getSubscriptionBadge(member.subscription)}</TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? 'default' : 'secondary'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No members yet. As your gym and trainers grow, members will appear here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
