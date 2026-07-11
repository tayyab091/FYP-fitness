'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExerciseVideoPlayer } from './ExerciseVideoPlayer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Dumbbell, Target } from 'lucide-react'

interface ExerciseCardProps {
  exercise: any
  onAddToPlan?: (exercise: any) => void
  showAddButton?: boolean
}

export function ExerciseCard({ exercise, onAddToPlan, showAddButton }: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false)

  const difficultyColor = ({
    beginner:     'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    expert:       'bg-red-500/20 text-red-400 border-red-500/30',
    advanced:     'bg-red-500/20 text-red-400 border-red-500/30'
  } as Record<string, string>)[exercise.difficulty] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card/40 border border-border/30 backdrop-blur-md rounded-2xl overflow-hidden hover:border-primary/40
        transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group"
    >
      {/* Media section — video player or image */}
      {exercise.wgerVideos?.length > 0 ? (
        <ExerciseVideoPlayer
          videos={exercise.wgerVideos}
          posterUrl={exercise.primaryImageUrl || exercise.imageUrl}
          exerciseName={exercise.name}
        />
      ) : exercise.primaryImageUrl || exercise.imageUrl ? (
        <div className="aspect-video overflow-hidden">
          <img
            src={exercise.primaryImageUrl || exercise.imageUrl}
            alt={exercise.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-video bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
          <Dumbbell className="w-12 h-12 text-zinc-600" />
        </div>
      )}

      <div className="p-4">
        {/* Name + badges row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-sm leading-tight">{exercise.name}</h3>
          <div className="flex gap-1 shrink-0">
            {exercise.isBodyweight && (
              <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/25
                px-2 py-0.5 rounded-full font-medium">
                Bodyweight
              </span>
            )}
            <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${difficultyColor}`}>
              {exercise.difficulty}
            </span>
          </div>
        </div>

        {/* Primary muscles */}
        {exercise.musclesPrimary?.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <Target className="w-3 h-3 text-primary shrink-0" />
            <div className="flex flex-wrap gap-1">
              {exercise.musclesPrimary.map((m: any, i: number) => (
                <span key={i} className="text-[11px] text-muted-foreground">
                  {m.displayName}{i < exercise.musclesPrimary.length - 1 ? ' ·' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Equipment pills */}
        {exercise.wgerEquipment?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {exercise.wgerEquipment.map((eq: any) => (
              <span key={eq.wgerEquipmentId}
                className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {eq.displayName}
              </span>
            ))}
          </div>
        )}

        {/* Secondary muscles (expandable) */}
        {exercise.musclesSecondary?.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Less' : `+${exercise.musclesSecondary.length} secondary muscles`}
          </button>
        )}

        {expanded && exercise.musclesSecondary?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3"
          >
            <p className="text-xs text-muted-foreground">
              Secondary: {exercise.musclesSecondary.map((m: any) => m.displayName).join(', ')}
            </p>
          </motion.div>
        )}

        {/* Instructions preview */}
        {exercise.instructions && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {exercise.instructions}
          </p>
        )}

        {/* Add to Plan button */}
        {showAddButton && onAddToPlan && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-8"
            onClick={() => onAddToPlan(exercise)}
          >
            + Add to Plan
          </Button>
        )}
      </div>
    </motion.div>
  )
}
