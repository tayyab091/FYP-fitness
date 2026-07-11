'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { WorkoutCalendar } from '@/components/schedule/WorkoutCalendar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SchedulePage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Schedule</h1>
              <p className="text-slate-400">View your full workout schedule and track progress</p>
            </div>
            <Link href="/my-fitness">
              <Button variant="outline" className="border-slate-600 hover:bg-slate-700">
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Full Calendar */}
          <WorkoutCalendar />
        </div>
      </div>
    </MainLayout>
  )
}
