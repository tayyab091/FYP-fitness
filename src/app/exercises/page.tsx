'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, X, ChevronDown, ChevronUp, Dumbbell, Plus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'

const ACCENT = '#00ff87'
const BG = '#0a0a0a'

const MUSCLE_TABS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'] as const
type MuscleTab = (typeof MUSCLE_TABS)[number]

const FALLBACK_EXERCISES = [
  {
    id: 1,
    name: 'Push-Up',
    muscle: 'Chest',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    gifUrl: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
    instructions: 'Start in plank position. Lower chest to ground. Push back up. Keep core tight.',
    sets: '3',
    reps: '15',
  },
  {
    id: 2,
    name: 'Squat',
    muscle: 'Legs',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    gifUrl: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif',
    instructions: 'Stand feet shoulder-width. Lower until thighs parallel to floor. Drive through heels to stand.',
    sets: '3',
    reps: '20',
  },
  {
    id: 3,
    name: 'Deadlift',
    muscle: 'Back',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    gifUrl: 'https://media.giphy.com/media/U1aN4HTfJ2SmgB2BBB/giphy.gif',
    instructions: 'Hinge at hips, grip bar. Drive through floor keeping back straight. Lock out at top.',
    sets: '4',
    reps: '8',
  },
  {
    id: 4,
    name: 'Pull-Up',
    muscle: 'Back',
    equipment: 'Bar',
    difficulty: 'Intermediate',
    gifUrl: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
    instructions: 'Hang from bar with overhand grip. Pull chest to bar. Lower with control.',
    sets: '3',
    reps: '8',
  },
  {
    id: 5,
    name: 'Plank',
    muscle: 'Core',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    gifUrl: 'https://media.giphy.com/media/h4OGa0npayrpAzabhs/giphy.gif',
    instructions: 'Forearms on ground, body straight. Hold position. Breathe steadily.',
    sets: '3',
    reps: '45 seconds',
  },
  {
    id: 6,
    name: 'Bench Press',
    muscle: 'Chest',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    gifUrl: 'https://media.giphy.com/media/l4FGvN3BNJO2Odxeg/giphy.gif',
    instructions: 'Lie on bench. Lower bar to chest. Press up to full extension.',
    sets: '4',
    reps: '10',
  },
  {
    id: 7,
    name: 'Shoulder Press',
    muscle: 'Shoulders',
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    gifUrl: 'https://media.giphy.com/media/3oFzlXvco5fY2aMBdm/giphy.gif',
    instructions: 'Sit upright. Press dumbbells from shoulder height to overhead. Control the descent.',
    sets: '3',
    reps: '12',
  },
  {
    id: 8,
    name: 'Bicep Curl',
    muscle: 'Arms',
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    gifUrl: 'https://media.giphy.com/media/l4FGvN3BNJO2Odxeg/giphy.gif',
    instructions: 'Stand with dumbbells. Curl to shoulder height keeping elbows tucked. Lower slowly.',
    sets: '3',
    reps: '12',
  },
  {
    id: 9,
    name: 'Lunge',
    muscle: 'Legs',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    gifUrl: 'https://media.giphy.com/media/3oFzmkqwnv3vT5gGqA/giphy.gif',
    instructions: 'Step forward into lunge. Lower back knee toward floor. Drive front heel to stand.',
    sets: '3',
    reps: '12 each leg',
  },
  {
    id: 10,
    name: 'Mountain Climbers',
    muscle: 'Cardio',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    gifUrl: 'https://media.giphy.com/media/7YCC7acVeOvIk/giphy.gif',
    instructions: 'Start in push-up position. Alternate bringing knees to chest rapidly.',
    sets: '3',
    reps: '30 seconds',
  },
  {
    id: 11,
    name: 'Lat Pulldown',
    muscle: 'Back',
    equipment: 'Cable Machine',
    difficulty: 'Beginner',
    gifUrl: 'https://media.giphy.com/media/26ufp2LYURTvL3Htu/giphy.gif',
    instructions: 'Grip bar wide. Pull to upper chest. Squeeze lats at bottom. Control release.',
    sets: '3',
    reps: '12',
  },
  {
    id: 12,
    name: 'Russian Twist',
    muscle: 'Core',
    equipment: 'Bodyweight',
    difficulty: 'Intermediate',
    gifUrl: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
    instructions: 'Sit at 45 degrees, feet off floor. Rotate torso side to side. Keep core braced.',
    sets: '3',
    reps: '20 total',
  },
]

interface ExerciseItem {
  id: string
  name: string
  muscle: string
  equipment: string
  difficulty: string
  gifUrl?: string
  instructions: string
  sets?: string
  reps?: string
}

const MUSCLE_COLORS: Record<string, string> = {
  Chest: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  Back: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Legs: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Shoulders: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Arms: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Core: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Cardio: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function normalizeMuscle(raw?: string): string {
  if (!raw) return 'General'
  const lower = raw.toLowerCase()
  if (['biceps', 'triceps', 'forearms'].includes(lower)) return 'Arms'
  if (['abs', 'core'].includes(lower)) return 'Core'
  return capitalize(raw)
}

function normalizeApiExercise(ex: Record<string, unknown>): ExerciseItem {
  const media = ex.media as { gifUrl?: string } | undefined
  const musclesPrimary = ex.musclesPrimary as Array<{ displayName?: string }> | undefined
  const wgerEquipment = ex.wgerEquipment as Array<{ displayName?: string }> | undefined

  const muscle =
    normalizeMuscle(ex.muscle as string | undefined) ||
    normalizeMuscle(musclesPrimary?.[0]?.displayName)

  const equipment =
    (ex.equipment as string) ||
    wgerEquipment?.map((e) => e.displayName).filter(Boolean).join(', ') ||
    'None'

  const difficulty = capitalize((ex.difficulty as string) || 'intermediate')

  const gifUrl =
    (ex.gifUrl as string) ||
    media?.gifUrl ||
    (ex.primaryImageUrl as string) ||
    (ex.imageUrl as string) ||
    undefined

  return {
    id: String(ex._id ?? ex.id ?? ex.name),
    name: String(ex.name ?? 'Exercise'),
    muscle,
    equipment,
    difficulty,
    gifUrl,
    instructions: String(ex.instructions ?? 'No instructions available.'),
    sets: ex.sets != null ? String(ex.sets) : undefined,
    reps: ex.reps != null ? String(ex.reps) : undefined,
  }
}

function filterFallback(muscle: MuscleTab, search: string): ExerciseItem[] {
  const q = search.trim().toLowerCase()
  return FALLBACK_EXERCISES.filter((ex) => {
    const muscleMatch = muscle === 'All' || ex.muscle === muscle
    const searchMatch =
      !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.muscle.toLowerCase().includes(q) ||
      ex.equipment.toLowerCase().includes(q)
    return muscleMatch && searchMatch
  }).map((ex) => ({ ...ex, id: String(ex.id) }))
}

function difficultyStyle(difficulty: string) {
  const d = difficulty.toLowerCase()
  if (d === 'beginner') return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (d === 'intermediate') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

function GifPlaceholder({ name, muscle }: { name: string; muscle: string }) {
  const hue = muscle === 'Chest' ? '#f43f5e' : muscle === 'Back' ? '#3b82f6' : muscle === 'Legs' ? '#a855f7' : ACCENT
  return (
    <div
      className="aspect-video flex flex-col items-center justify-center gap-2"
      style={{ background: `linear-gradient(135deg, ${BG} 0%, ${hue}22 100%)` }}
    >
      <Dumbbell className="w-10 h-10 opacity-40" style={{ color: hue }} />
      <span className="text-xs font-semibold text-white/60 px-4 text-center line-clamp-2">{name}</span>
    </div>
  )
}

function ExerciseCardItem({
  exercise,
  showAddButton,
  onAddToPlan,
}: {
  exercise: ExerciseItem
  showAddButton: boolean
  onAddToPlan: (exercise: ExerciseItem) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [gifFailed, setGifFailed] = useState(false)

  const muscleClass = MUSCLE_COLORS[exercise.muscle] ?? 'bg-white/10 text-white/70 border-white/20'
  const setsReps =
    exercise.sets && exercise.reps ? `${exercise.sets} × ${exercise.reps}` : null

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md overflow-hidden hover:border-[#00ff87]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#00ff87]/5 flex flex-col">
      {exercise.gifUrl && !gifFailed ? (
        <div className="aspect-video overflow-hidden bg-black/40">
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="w-full h-full object-cover"
            onError={() => setGifFailed(true)}
          />
        </div>
      ) : (
        <GifPlaceholder name={exercise.name} muscle={exercise.muscle} />
      )}

      <div className="p-4 flex flex-col flex-1 gap-3">
        <h3 className="font-bold text-base leading-tight">{exercise.name}</h3>

        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${muscleClass}`}>
            {exercise.muscle}
          </span>
          <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${difficultyStyle(exercise.difficulty)}`}>
            {exercise.difficulty}
          </span>
        </div>

        <p className="text-xs text-white/50">
          <span className="text-white/30">Equipment: </span>
          {exercise.equipment}
        </p>

        {setsReps && (
          <p className="text-sm font-semibold" style={{ color: ACCENT }}>
            {setsReps}
          </p>
        )}

        <div className="mt-auto space-y-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-white/50 hover:text-[#00ff87] flex items-center gap-1 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide Instructions' : 'View Instructions'}
          </button>

          {expanded && (
            <p className="text-xs text-white/60 leading-relaxed border-t border-white/10 pt-2">
              {exercise.instructions}
            </p>
          )}

          {showAddButton && (
            <button
              type="button"
              onClick={() => onAddToPlan(exercise)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border border-[#00ff87]/40 text-[#00ff87] hover:bg-[#00ff87]/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Plan
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ExercisesPage() {
  const { user } = useAuth()
  const isTrainer = user?.role === 'trainer'

  const [searchText, setSearchText] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleTab>('All')
  const [apiExercises, setApiExercises] = useState<ExerciseItem[] | null>(null)
  const [usingFallback, setUsingFallback] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  const debouncedSearch = useDebounce(searchText, 400)

  const fallbackExercises = useMemo(
    () => filterFallback(selectedMuscle, debouncedSearch),
    [selectedMuscle, debouncedSearch]
  )

  useEffect(() => {
    let cancelled = false

    async function loadExercises() {
      setIsFetching(true)
      try {
        const params = new URLSearchParams()
        if (selectedMuscle !== 'All') params.set('muscle', selectedMuscle.toLowerCase())
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

        const res = await fetch(`/api/exercises?${params.toString()}`, { credentials: 'include' })
        if (!res.ok) throw new Error('API request failed')

        const data = await res.json()
        const raw: unknown[] = data?.exercises ?? []

        if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty API response')

        if (!cancelled) {
          setApiExercises(raw.map((ex) => normalizeApiExercise(ex as Record<string, unknown>)))
          setUsingFallback(false)
        }
      } catch {
        if (!cancelled) {
          setApiExercises(null)
          setUsingFallback(true)
        }
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    }

    loadExercises()
    return () => {
      cancelled = true
    }
  }, [selectedMuscle, debouncedSearch])

  const displayExercises = usingFallback ? fallbackExercises : (apiExercises ?? fallbackExercises)

  const handleAddToPlan = useCallback((exercise: ExerciseItem) => {
    try {
      const key = 'trainer-plan-draft'
      const existing: ExerciseItem[] = JSON.parse(localStorage.getItem(key) || '[]')
      existing.push(exercise)
      localStorage.setItem(key, JSON.stringify(existing))
      toast.success(`${exercise.name} added to plan draft`)
    } catch {
      toast.error('Could not save exercise to plan')
    }
  }, [])

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20" style={{ backgroundColor: ACCENT }} />

      <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <header className="space-y-2 text-center">
          <Link
            href="/coaching"
            className="inline-block text-xs text-white/40 hover:text-[#00ff87] transition-colors mb-2"
          >
            ← Back to Coaching
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Exercise <span style={{ color: ACCENT }}>Library</span>
          </h1>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            Browse exercises with animated demos, sets, reps, and step-by-step instructions.
          </p>
        </header>

        {/* Search bar */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search exercises..."
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00ff87]/50 focus:ring-1 focus:ring-[#00ff87]/30 backdrop-blur-md"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Muscle filter tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          {MUSCLE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedMuscle(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                selectedMuscle === tab
                  ? 'border-[#00ff87]/60 text-[#00ff87] bg-[#00ff87]/10'
                  : 'border-white/10 text-white/50 hover:text-white hover:border-white/20 bg-white/[0.03]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-white/30 px-1">
          <span>
            {displayExercises.length} exercise{displayExercises.length !== 1 ? 's' : ''}
            {usingFallback && ' · offline library'}
          </span>
          {isFetching && <span className="text-[#00ff87]/60">Updating…</span>}
        </div>

        {/* Exercise grid */}
        {displayExercises.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p>No exercises match your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchText('')
                setSelectedMuscle('All')
              }}
              className="text-[#00ff87] text-sm mt-2 underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayExercises.map((exercise) => (
              <ExerciseCardItem
                key={exercise.id}
                exercise={exercise}
                showAddButton={isTrainer}
                onAddToPlan={handleAddToPlan}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
