'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'


interface FilterSidebarProps {
  selectedMuscleId:  number | null
  selectedEquipment: number[]
  onMuscleChange:    (id: number | null) => void
  onEquipmentChange: (id: number) => void
}

export function MuscleFilterSidebar({
  selectedMuscleId, selectedEquipment, onMuscleChange, onEquipmentChange
}: FilterSidebarProps) {

  const { data: meta, isLoading } = useQuery({
    queryKey: ['wger-meta'],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/wger/meta`, { credentials: 'include' })
      return res.json()
    },
    staleTime: Infinity   // muscles and equipment never change
  })

  if (isLoading) return (
    <div className="space-y-2">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  )

  const muscles   = meta?.data?.muscles   || []
  const equipment = meta?.data?.equipment || []

  return (
    <div className="space-y-6">
      {/* Muscle Groups */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Muscle Group
        </h4>
        <div className="space-y-1">
          {/* All option */}
          <button
            onClick={() => onMuscleChange(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
              ${!selectedMuscleId ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
          >
            <span className="w-8 h-8 bg-linear-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center text-xs">
              All
            </span>
            <span>All Muscles</span>
          </button>

          {/* Individual muscles with SVG diagram */}
          {muscles.map((m: any) => (
            <motion.button
              key={m.id}
              whileHover={{ x: 2 }}
              onClick={() => onMuscleChange(selectedMuscleId === m.id ? null : m.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${selectedMuscleId === m.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
            >
              {/* Muscle SVG diagram */}
              {m.image_url_main ? (
                <img
                  src={m.image_url_main}
                  alt={m.displayName}
                  className="w-8 h-8 object-contain shrink-0"
                  style={{ filter: selectedMuscleId === m.id ? 'invert(1)' : 'none' }}
                />
              ) : (
                <span className="w-8 h-8 bg-muted rounded-md flex items-center justify-center text-xs font-bold">
                  {m.displayName.charAt(0)}
                </span>
              )}
              <span>{m.displayName}</span>
              {/* Front/Back indicator */}
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded
                ${selectedMuscleId === m.id ? 'bg-white/20' : 'bg-muted'}`}>
                {m.is_front ? 'Front' : 'Back'}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Equipment
        </h4>
        <div className="space-y-1">
          {equipment.map((eq: any) => (
            <label key={eq.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selectedEquipment.includes(eq.id)}
                onChange={() => onEquipmentChange(eq.id)}
                className="rounded"
              />
              <span className="text-sm">{eq.displayName}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
