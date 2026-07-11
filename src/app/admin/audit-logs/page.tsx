'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Search, Filter } from 'lucide-react';

async function fetchAuditLogs(filters: any) {
  const params = new URLSearchParams();
  if (filters.action && filters.action !== '__all__') params.append('action', filters.action);
  if (filters.adminId) params.append('adminId', filters.adminId);
  if (filters.targetType && filters.targetType !== '__all__') params.append('targetType', filters.targetType);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

const ACTION_TYPES = [
  'verified_gym',
  'rejected_gym',
  'suspended_gym',
  'verified_trainer',
  'rejected_trainer',
  'suspended_trainer',
  'suspended_user',
  'unsuspended_user',
];

const TARGET_TYPES = ['gym', 'trainer', 'user'];

export default function AuditLogsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [filters, setFilters] = useState({
    action: '__all__',
    adminId: '',
    targetType: '__all__',
    startDate: '',
    endDate: '',
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is super_admin and redirect if not
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'super_admin')) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => fetchAuditLogs(filters),
    enabled: !!user,
  });

  const logs = data?.data?.logs || [];

  const getActionBadgeColor = (action: string) => {
    if (action.includes('verified')) return 'default';
    if (action.includes('rejected')) return 'destructive';
    if (action.includes('suspended')) return 'secondary';
    return 'outline';
  };

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (authLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">Track all admin actions and system events</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-2" />
                  Search
                </label>
                <Input
                  placeholder="Search target ID or admin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Action Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <Select
                  value={filters.action}
                  onValueChange={(value: any) =>
                    setFilters((prev) => ({ ...prev, action: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Actions</SelectItem>
                    {ACTION_TYPES.map((action) => (
                      <SelectItem key={action} value={action}>
                        {getActionLabel(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <Select
                  value={filters.targetType}
                  onValueChange={(value: any) =>
                    setFilters((prev) => ({ ...prev, targetType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Types</SelectItem>
                    {TARGET_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      action: '__all__',
                      adminId: '',
                      targetType: '__all__',
                      startDate: '',
                      endDate: '',
                    });
                    setSearchTerm('');
                  }}
                  className="w-full"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-red-800 text-sm">{(error as any).message}</p>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Showing {logs.length} log{logs.length !== 1 ? 's' : ''} from the past 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : logs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs
                      .filter(
                        (log: any) =>
                          !searchTerm ||
                          log.targetId?.includes(searchTerm) ||
                          log.performedBy?.email?.includes(searchTerm)
                      )
                      .map((log: any) => (
                        <TableRow key={log._id}>
                          <TableCell className="text-sm">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeColor(log.action)}>
                              {getActionLabel(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <p className="font-medium">{log.targetModel}</p>
                              <p className="text-gray-500 text-xs">{log.targetId}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <p className="font-medium">
                                {log.performedBy?.fullName || 'Unknown'}
                              </p>
                              <p className="text-gray-500 text-xs">{log.performedBy?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-xs">
                            {log.details?.reason && (
                              <div className="text-gray-600">
                                <p className="font-medium">Reason:</p>
                                <p className="line-clamp-2">{log.details.reason}</p>
                              </div>
                            )}
                            {log.details?.note && (
                              <div className="text-gray-600">
                                <p className="font-medium">Note:</p>
                                <p className="line-clamp-2">{log.details.note}</p>
                              </div>
                            )}
                            {!log.details?.reason && !log.details?.note && (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 font-mono">
                            {log.ipAddress || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No audit logs found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
