'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Star, Building2, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { TrainerCardSkeleton } from '@/components/shared/Skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ACCENT = '#00ff87'
const BG = '#0a0a0a'

const COUNTRIES = [
  'Pakistan', 'UAE', 'United Kingdom', 'United States', 'Canada', 'Australia',
  'Saudi Arabia', 'India', 'Bangladesh', 'Germany', 'France', 'Other',
]

const SPECIALTIES = [
  'Weight Loss', 'Muscle Gain', 'Strength Training', 'Cardio',
  'Yoga', 'CrossFit', 'HIIT', 'Rehabilitation', 'Nutrition Coaching',
  'Sports Performance', 'Flexibility', 'Bodybuilding', 'Powerlifting',
]

const COUNTRY_FLAGS: Record<string, string> = {
  Pakistan: '🇵🇰',
  UAE: '🇦🇪',
  'United Kingdom': '🇬🇧',
  'United States': '🇺🇸',
  Canada: '🇨🇦',
  Australia: '🇦🇺',
  'Saudi Arabia': '🇸🇦',
  India: '🇮🇳',
  Bangladesh: '🇧🇩',
  Germany: '🇩🇪',
  France: '🇫🇷',
  Other: '🌍',
}

interface Trainer {
  _id: string
  name: string
  bio?: string
  country: string
  specialty: string[]
  avatarUrl?: string
  rating?: number
  chatRating?: number
  gymName?: string
}

type ConnectStatus = 'none' | 'loading' | 'sent' | 'pending'

interface TrainerFilters {
  specialty: string
  country: string
  search: string
}

async function fetchTrainers(filters: TrainerFilters): Promise<Trainer[]> {
  const params = new URLSearchParams()
  if (filters.specialty && filters.specialty !== '__all__') {
    params.set('specialty', filters.specialty)
  }
  if (filters.country && filters.country !== '__all__') {
    params.set('country', filters.country)
  }
  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }

  const res = await fetch(`/api/trainers?${params.toString()}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch trainers')

  const json = await res.json()
  const list = json.data?.trainers ?? json.trainers ?? json.data ?? []
  return Array.isArray(list) ? list : []
}

function getCountryFlag(country: string) {
  return COUNTRY_FLAGS[country] ?? '🌍'
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
          fill={i <= Math.round(rating) ? ACCENT : 'transparent'}
          stroke={i <= Math.round(rating) ? ACCENT : '#444'}
        />
      ))}
      <span className="text-xs text-[#a0a0a0] ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function CoachingPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '__all__')
  const [country, setCountry] = useState(searchParams.get('country') || '__all__')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(search, 400)

  const [connectStatus, setConnectStatus] = useState<Record<string, ConnectStatus>>({})

  const filters: TrainerFilters = {
    specialty,
    country,
    search: debouncedSearch,
  }

  useEffect(() => {
    const params = new URLSearchParams()
    if (specialty !== '__all__') params.set('specialty', specialty)
    if (country !== '__all__') params.set('country', country)
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [specialty, country, debouncedSearch, pathname, router])

  const { data: trainers = [], isLoading, error } = useQuery({
    queryKey: ['trainers', filters],
    queryFn: () => fetchTrainers(filters),
  })

  useEffect(() => {
    if (!user) return

    fetch('/api/relationships/my-requests', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json?.data) return
        const statusMap: Record<string, ConnectStatus> = {}
        for (const rel of json.data) {
          const trainerId = rel.trainerId?._id ?? rel.trainerId
          if (!trainerId) continue
          if (rel.status === 'pending') {
            statusMap[trainerId] = 'pending'
          } else if (rel.status === 'active') {
            statusMap[trainerId] = 'sent'
          }
        }
        setConnectStatus((prev) => ({ ...statusMap, ...prev }))
      })
      .catch(() => {})
  }, [user])

  const handleConnect = useCallback(
    async (trainerId: string) => {
      if (!user) {
        toast.error('Please sign in to connect with a trainer')
        router.push('/login')
        return
      }

      setConnectStatus((prev) => ({ ...prev, [trainerId]: 'loading' }))

      try {
        const res = await fetch(`/api/relationships/request/${trainerId}`, {
          method: 'POST',
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))

        if (res.status === 201) {
          setConnectStatus((prev) => ({ ...prev, [trainerId]: 'sent' }))
          return
        }

        if (res.status === 400 || res.status === 409) {
          if (data.status === 'pending') {
            setConnectStatus((prev) => ({ ...prev, [trainerId]: 'pending' }))
            return
          }
          if (data.status === 'active' || data.error?.toLowerCase().includes('already exists')) {
            setConnectStatus((prev) => ({ ...prev, [trainerId]: 'sent' }))
            return
          }
        }

        if (res.status === 403) {
          toast.error(data.error || 'Upgrade your plan to connect with trainers', {
            description: 'Subscribe to unlock full coaching access.',
          })
          router.push('/subscription')
          setConnectStatus((prev) => ({ ...prev, [trainerId]: 'none' }))
          return
        }

        toast.error(data.error || data.message || 'Failed to send request')
        setConnectStatus((prev) => ({ ...prev, [trainerId]: 'none' }))
      } catch {
        toast.error('Connection failed. Please try again.')
        setConnectStatus((prev) => ({ ...prev, [trainerId]: 'none' }))
      }
    },
    [user, router]
  )

  const getConnectLabel = (trainerId: string) => {
    const status = connectStatus[trainerId] ?? 'none'
    if (status === 'loading') return null
    if (status === 'sent') return 'Request Sent ✓'
    if (status === 'pending') return 'Pending'
    return 'Connect'
  }

  const isConnectDisabled = (trainerId: string) => {
    const status = connectStatus[trainerId] ?? 'none'
    return status === 'loading' || status === 'sent' || status === 'pending'
  }

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: BG }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Find Your Perfect Trainer
          </h1>
          <p className="text-[#a0a0a0] text-base md:text-lg max-w-2xl">
            Browse verified coaches by specialty, country, and name — then send a connection request in one click.
          </p>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">
                Specialty
              </label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger className="bg-[#111] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="All specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Specialties</SelectItem>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">
                Country
              </label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-[#111] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Countries</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {getCountryFlag(c)} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">
                Search by Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                <Input
                  placeholder="Search trainers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-[#111] border-[#2a2a2a] text-white placeholder:text-[#666]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass rounded-xl p-4 border border-red-500/30 text-red-400 text-sm">
            {(error as Error).message}
          </div>
        )}

        {/* Trainer Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <TrainerCardSkeleton key={i} />
            ))}
          </div>
        ) : trainers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((trainer) => {
              const specialties = Array.isArray(trainer.specialty)
                ? trainer.specialty
                : trainer.specialty
                  ? [trainer.specialty]
                  : []
              const rating = trainer.rating ?? trainer.chatRating ?? 0
              const initials = trainer.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              const status = connectStatus[trainer._id] ?? 'none'

              return (
                <div
                  key={trainer._id}
                  className="glass rounded-2xl p-6 flex flex-col gap-4 hover:border-[#00ff87]/20 transition-colors"
                >
                  {/* Avatar + name row */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      {trainer.avatarUrl ? (
                        <img
                          src={trainer.avatarUrl}
                          alt={trainer.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-[#00ff87]/20"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00ff87] to-[#00bfff] flex items-center justify-center text-black font-bold text-lg">
                          {initials}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00ff87] rounded-full border-2 border-[#0a0a0a]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-base truncate">
                        {trainer.name}
                      </h3>
                      <p className="text-sm text-[#a0a0a0] flex items-center gap-1.5">
                        <span>{getCountryFlag(trainer.country)}</span>
                        {trainer.country}
                      </p>
                    </div>
                  </div>

                  {/* Specialty badges */}
                  {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {specialties.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2.5 py-1 rounded-full bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Star rating */}
                  {rating > 0 && <StarRating rating={rating} />}

                  {/* Bio */}
                  <p className="text-sm text-[#a0a0a0] line-clamp-2 leading-relaxed">
                    {trainer.bio || 'No bio provided.'}
                  </p>

                  {/* Gym name */}
                  {trainer.gymName && (
                    <div className="flex items-center gap-1.5 text-xs text-[#666]">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{trainer.gymName}</span>
                    </div>
                  )}

                  {/* Connect button */}
                  <Button
                    onClick={() => handleConnect(trainer._id)}
                    disabled={isConnectDisabled(trainer._id)}
                    className="mt-auto w-full rounded-xl font-semibold transition-all"
                    style={
                      status === 'sent' || status === 'pending'
                        ? { background: '#1a1a1a', color: ACCENT, border: `1px solid ${ACCENT}40` }
                        : { background: ACCENT, color: '#000' }
                    }
                  >
                    {status === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      getConnectLabel(trainer._id)
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-white font-medium">No trainers found. Adjust your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
