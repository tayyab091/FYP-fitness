'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Download } from 'lucide-react';

export default function TrainerEarningsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-600 mt-2">Track your income and payouts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$2,450</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$450</div>
            <p className="text-xs text-green-600 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$250</div>
            <p className="text-xs text-gray-500 mt-1">Next payout: 5 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
          <CardDescription>Your latest transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { date: 'Dec 15, 2024', client: 'John Doe', amount: '$50', status: 'Completed' },
              { date: 'Dec 14, 2024', client: 'Jane Smith', amount: '$50', status: 'Completed' },
              { date: 'Dec 13, 2024', client: 'Mike Johnson', amount: '$75', status: 'Completed' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{item.client}</p>
                  <p className="text-sm text-gray-600">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{item.amount}</p>
                  <p className="text-xs text-green-600">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
          <CardDescription>Manage how you receive payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">Bank Account</p>
            <p className="text-sm text-gray-600 mb-4">••••  ••••  ••••  1234</p>
            <Button variant="outline">Update Bank Account</Button>
          </div>

          <hr />

          <div>
            <p className="font-medium mb-2">Payout Frequency</p>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option>Weekly</option>
              <option>Bi-weekly</option>
              <option>Monthly</option>
            </select>
          </div>

          <Button className="w-full">Save Settings</Button>
        </CardContent>
      </Card>

      {/* Download Statements */}
      <Card>
        <CardHeader>
          <CardTitle>Statements</CardTitle>
          <CardDescription>Download your earnings statements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['December 2024', 'November 2024', 'October 2024'].map((month) => (
              <button
                key={month}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
              >
                <span>{month}</span>
                <Download className="w-4 h-4 text-gray-600" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
