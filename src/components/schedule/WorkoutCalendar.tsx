'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Flame, CheckCircle2,
         XCircle, Clock, Moon, Calendar } from 'lucide-react'


// Status colors and icons
const STATUS_CONFIG = {
  completed: { bg: 'bg-green-500',   light: 'bg-green-500/15',  text: 'text-green-500',   icon: CheckCircle2, label: 'Done'    },
  skipped:   { bg: 'bg-orange-500',  light: 'bg-orange-500/15', text: 'text-orange-500',  icon: XCircle,      label: 'Skipped' },
  missed:    { bg: 'bg-red-500',     light: 'bg-red-500/15',    text: 'text-red-500',     icon: XCircle,      label: 'Missed'  },
  rest:      { bg: 'bg-blue-400',    light: 'bg-blue-400/15',   text: 'text-blue-400',    icon: Moon,         label: 'Rest'    },
  pending:   { bg: 'bg-yellow-500',  light: 'bg-yellow-500/15', text: 'text-yellow-500',  icon: Clock,        label: 'Today'   },
  scheduled: { bg: 'bg-zinc-600',    light: 'bg-zinc-600/15',   text: 'text-zinc-400',    icon: Calendar,     label: 'Planned' },
}

export function WorkoutCalendar() {
  const [viewMode,    setViewMode]    = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<any | null>(null)

  // ── WEEK VIEW DATA ──
  const weekDateStr = currentDate.toISOString().split('T')[0]
  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['schedule-week', weekDateStr],
    queryFn:  async () => {
      const res = await fetch(`/api/tracking/schedule/week?date=${weekDateStr}`, { credentials: 'include' })
      return res.json()
    },
    enabled: viewMode === 'week'
  })

  // ── MONTH VIEW DATA ──
  const { data: monthData, isLoading: monthLoading } = useQuery({
    queryKey: ['schedule-month', currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn:  async () => {
      const res = await fetch(
        `/api/tracking/schedule/month?year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}`,
        { credentials: 'include' }
      )
      return res.json()
    },
    enabled: viewMode === 'month'
  })

  const goBack    = () => { const d = new Date(currentDate); viewMode === 'week' ? d.setDate(d.getDate() - 7) : d.setMonth(d.getMonth() - 1); setCurrentDate(d) }
  const goForward = () => { const d = new Date(currentDate); viewMode === 'week' ? d.setDate(d.getDate() + 7) : d.setMonth(d.getMonth() + 1); setCurrentDate(d) }
  const goToToday = () => setCurrentDate(new Date())

  const week    = weekData?.data
  const month   = monthData?.data
  const isLoading = viewMode === 'week' ? weekLoading : monthLoading

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <button onClick={goBack}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center min-w-40">
            <p className="font-semibold text-sm">
              {viewMode === 'week'
                ? `${week?.weekStart} — ${week?.weekEnd}`
                : currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={goForward}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goToToday}
            className="text-xs px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
            Today
          </button>
          <div className="flex bg-secondary rounded-lg p-0.5">
            {(['week', 'month'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs rounded-md transition-colors font-medium capitalize
                  ${viewMode === mode ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVE PLAN BANNER */}
      {week?.activePlan && (
        <div className="px-5 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">{week.activePlan.title}</span>
          <span className="text-xs text-muted-foreground">· {week.activePlan.goal?.replace('_', ' ')}</span>
          {week.activePlan.trainer && (
            <span className="text-xs text-muted-foreground ml-auto">
              Coach: {week.activePlan.trainer.name}
            </span>
          )}
        </div>
      )}

      {/* LOADING */}
      {isLoading && (
        <div className="p-6 grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {!isLoading && viewMode === 'week' && week && (
        <div className="p-4">
          {/* Week summary pills */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {Object.entries(week.weekSummary || {}).map(([key, val]: any) => (
              key !== 'totalWorkouts' && (
                <span key={key} className="text-xs bg-secondary px-2 py-1 rounded-full">
                  <span className="font-semibold">{val}</span> {key}
                </span>
              )
            ))}
          </div>

          {/* 7-day grid */}
          <div className="grid grid-cols-7 gap-2">
            {week.days?.map((day: any) => {
              const config = STATUS_CONFIG[day.status as keyof typeof STATUS_CONFIG]
                || STATUS_CONFIG.scheduled
              const Icon = config.icon

              return (
                <motion.button
                  key={day.date}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
                  className={`relative flex flex-col items-center justify-center aspect-square rounded-xl border-2 transition-all
                    ${day.isToday
                      ? 'border-primary ring-2 ring-primary/20'
                      : selectedDay?.date === day.date
                        ? 'border-primary/60'
                        : 'border-border'}
                    ${config.light}`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wider
                    ${day.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {day.dayLabel}
                  </span>
                  <span className={`text-lg font-bold mt-0.5 ${day.isToday ? 'text-primary' : ''}`}>
                    {new Date(day.date + 'T12:00:00').getDate()}
                  </span>
                  <Icon className={`w-3.5 h-3.5 mt-1 ${config.text}`} />
                </motion.button>
              )
            })}
          </div>

          {/* Day detail panel */}
          <AnimatePresence>
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">
                      {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('en', {
                        weekday: 'long', month: 'long', day: 'numeric'
                      })}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                      ${(STATUS_CONFIG[selectedDay.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled).light}
                      ${(STATUS_CONFIG[selectedDay.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled).text}`}>
                      {selectedDay.status}
                    </span>
                  </div>

                  {selectedDay.scheduledSession && !selectedDay.scheduledSession.isRestDay ? (
                    <div>
                      <p className="text-sm font-medium mb-2">{selectedDay.scheduledSession.sessionName}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                        <span>🎯 {selectedDay.scheduledSession.targetMuscles?.join(', ')}</span>
                        <span>⏱ ~{selectedDay.scheduledSession.estimatedDuration} min</span>
                        <span>💪 {selectedDay.scheduledSession.exercises?.length || 0} exercises</span>
                      </div>
                      {selectedDay.log?.status === 'completed' && (
                        <div className="flex gap-4 text-xs">
                          <span>✅ Done in {selectedDay.log.durationMinutes}min</span>
                          <span>🔥 {selectedDay.log.metrics?.totalVolume?.toFixed(0)}kg volume</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedDay.status === 'rest' ? '🌙 Rest Day — Recovery is part of training' : 'No workout scheduled'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── MONTH VIEW ── */}
      {!isLoading && viewMode === 'month' && month && (
        <div className="p-4">
          {/* Day name headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <p key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</p>
            ))}
          </div>

          {/* Calendar grid */}
          {(() => {
            const year  = currentDate.getFullYear()
            const mo    = currentDate.getMonth()
            const first = new Date(year, mo, 1)
            const last  = new Date(year, mo + 1, 0)
            // Offset to Monday
            const startOffset = (first.getDay() + 6) % 7
            const cells: React.JSX.Element[] = []

            // Empty cells before month start
            for (let i = 0; i < startOffset; i++) {
              cells.push(<div key={`e${i}`} />)
            }

            // Day cells
            for (let d = 1; d <= last.getDate(); d++) {
              const dateKey  = `${year}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
              const dayData  = month.days?.[dateKey]
              const isToday  = new Date().toDateString() === new Date(year, mo, d).toDateString()
              const config   = dayData
                ? STATUS_CONFIG[dayData.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.scheduled
                : null

              cells.push(
                <button key={d}
                  onClick={() => dayData && setSelectedDay({ ...dayData, date: dateKey })}
                  className={`relative aspect-square flex items-center justify-center rounded-lg text-sm
                    transition-all hover:bg-secondary font-medium
                    ${isToday ? 'ring-2 ring-primary font-bold text-primary' : ''}
                    ${config ? config.light : ''}`}
                >
                  {d}
                  {config && (
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2
                      w-1.5 h-1.5 rounded-full ${config.bg}`} />
                  )}
                </button>
              )
            }
            return <div className="grid grid-cols-7 gap-1">{cells}</div>
          })()}

          {/* Month summary */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {Object.entries(month.summary || {}).map(([k, v]: any) => (
              <span key={k} className={`text-xs px-2.5 py-1 rounded-full
                ${STATUS_CONFIG[k as keyof typeof STATUS_CONFIG]?.light || 'bg-secondary'}
                ${STATUS_CONFIG[k as keyof typeof STATUS_CONFIG]?.text || ''}`}>
                {v} {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* LEGEND */}
      <div className="px-5 py-3 border-t border-border bg-muted/30 flex flex-wrap gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const Icon = config.icon
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${config.bg}`} />
              {config.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
