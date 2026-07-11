'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Lock, User } from 'lucide-react';

export default function TrainerSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences</p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-gray-600">trainer@email.com</p>
            </div>
            <Button variant="outline">Change</Button>
          </div>
          <hr />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-gray-600">Last changed 2 months ago</p>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Control how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span>Email notifications for new clients</span>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span>Email notifications for new messages</span>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span>Email notifications for earnings</span>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="w-4 h-4" />
              <span>Marketing emails and promotions</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">Active Sessions</p>
            <p className="text-sm text-gray-600 mb-4">You are signed in on 2 devices</p>
            <Button variant="outline">Sign Out All Devices</Button>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
          <CardDescription>Set your working hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">Days of Week</p>
            <div className="grid grid-cols-2 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                (day) => (
                  <label key={day} className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm">{day}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <Button className="w-full">Save Availability</Button>
        </CardContent>
      </Card>
    </div>
  );
}
