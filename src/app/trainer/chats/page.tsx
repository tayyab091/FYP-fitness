'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, MessageSquare } from 'lucide-react';

async function fetchChats() {
  const res = await fetch('/api/trainer/my-chats', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch chats');
  return res.json();
}

export default function TrainerChatsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trainer-chats'],
    queryFn: fetchChats,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const conversations = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Chats</h1>
        <p className="text-gray-600 mt-2">Active conversations with your clients</p>
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

      {conversations && conversations.length > 0 ? (
        <div className="space-y-3">
          {conversations.map((conv: any) => {
            const userParticipant = conv.participants.find((p: any) => p.role === 'user');
            const userName = userParticipant?.userId?.fullName || userParticipant?.userId?.email || 'User';
            
            return (
              <Link key={conv._id} href={`/chat/${conv._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {userName}
                        </h3>
                        {conv.unreadCount?.trainer > 0 && (
                          <Badge variant="destructive">{conv.unreadCount.trainer}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conv.lastMessage?.sentAt || conv.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-2">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-gray-600 mb-4">No active chats</p>
            <p className="text-sm text-gray-500">
              When clients start chatting with you, conversations will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
