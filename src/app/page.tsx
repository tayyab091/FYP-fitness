'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

interface Trainer {
  _id: string
  name: string
  specialty: string[]
  country: string
  rating: number
  bio: string
  profileImage?: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const step = (to / duration) * 16
    const timer = setInterval(() => {
      start += step
      if (start >= to) { setCount(to); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, to])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

function TrainerCard({ trainer }: { trainer: Trainer }) {
  const initials = trainer.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const specialties = Array.isArray(trainer.specialty) ? trainer.specialty : [trainer.specialty]

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="glass-card rounded-2xl p-6 flex flex-col gap-4 group cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          {trainer.profileImage ? (
            <img src={trainer.profileImage} alt={trainer.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-[#00ff87]/30 group-hover:ring-[#00ff87] transition-all duration-300" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00ff87] to-[#00bfff] flex items-center justify-center text-black font-bold text-lg">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00ff87] rounded-full border-2 border-[#0a0a0a]" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-base">{trainer.name}</h3>
          <p className="text-[#a0a0a0] text-sm">{trainer.country}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[#00ff87] text-sm">⭐</span>
          <span className="text-white text-sm font-medium">{trainer.rating?.toFixed(1) || '5.0'}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {specialties.slice(0, 2).map(s => (
          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20">
            {s}
          </span>
        ))}
      </div>

      <p className="text-[#a0a0a0] text-sm line-clamp-2 leading-relaxed">{trainer.bio}</p>

      <Link href="/coaching"
        className="mt-auto w-full text-center py-2.5 rounded-xl border border-[#2a2a2a] text-sm font-medium text-white hover:border-[#00ff87] hover:text-[#00ff87] hover:bg-[#00ff87]/5 transition-all duration-200">
        View Profile
      </Link>
    </motion.div>
  )
}

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [trainersLoading, setTrainersLoading] = useState(true)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, -100])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await fetch(
          `/api/trainers?limit=6`,
          { credentials: 'include' }
        )
        if (res.ok) {
          const data = await res.json()
          setTrainers(Array.isArray(data) ? data.slice(0, 6) : data.trainers?.slice(0, 6) || data.data?.trainers?.slice(0, 6) || [])
        }
      } catch (e) {
        console.error('Failed to fetch trainers:', e)
      } finally {
        setTrainersLoading(false)
      }
    }
    fetchTrainers()
  }, [])

  const [planData, setPlanData] = useState<{ plan?: { name?: string; goal?: string }; todaySession?: { exercises?: unknown[] } } | null>(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/tracking/plans/my-plan', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => setPlanData(d?.data || d))
      .catch(() => {})
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#00ff87] border-t-transparent animate-spin" />
          <p className="text-[#a0a0a0] text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    const firstName = user.fullName?.split(' ')[0] || 'there'
    const todayExercises = planData?.todaySession?.exercises || []

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 px-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-black">Welcome back, {firstName}! 👋</h1>
            <p className="text-[#a0a0a0] mt-2">Here&apos;s your fitness overview for today</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Plan', value: planData?.plan?.name || 'None', icon: '💪' },
              { label: 'Meals Today', value: '—', icon: '🥗' },
              { label: 'Workouts', value: 'This Week', icon: '🏋️' },
              { label: 'Streak', value: '—', icon: '🔥' },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-sm font-bold truncate">{s.value}</div>
                <div className="text-xs text-[#a0a0a0]">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Find Trainer', href: '/coaching', icon: '🔍' },
              { label: 'My Fitness', href: '/my-fitness', icon: '📊' },
              { label: 'Chat', href: '/chat', icon: '💬' },
              { label: 'Nutrition', href: '/nutrition', icon: '🍎' },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="glass rounded-xl p-4 text-center hover:border-[#00ff87]/30 transition-all">
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="text-sm font-medium">{a.label}</div>
              </Link>
            ))}
          </div>

          {planData?.plan ? (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-2">Today&apos;s Workout</h2>
              <p className="text-[#a0a0a0] text-sm mb-4">{planData.plan.name} — {planData.plan.goal}</p>
              {todayExercises.length > 0 ? (
                <ul className="space-y-2">
                  {(todayExercises as { name?: string; sets?: number; reps?: number }[]).slice(0, 5).map((ex, i) => (
                    <li key={i} className="text-sm flex justify-between border-b border-[#1a1a1a] pb-2">
                      <span>{ex.name || `Exercise ${i + 1}`}</span>
                      <span className="text-[#a0a0a0]">{ex.sets}×{ex.reps}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#a0a0a0] text-sm">Rest day or no exercises scheduled</p>
              )}
              <Link href="/my-fitness" className="btn-accent inline-block mt-4 px-6 py-2 text-sm rounded-xl">Start Workout</Link>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-[#a0a0a0]">No active plan — find a trainer and request one</p>
              <Link href="/coaching" className="btn-accent inline-block mt-4 px-6 py-2 text-sm rounded-xl">Find a Trainer</Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden pt-16">

      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-8 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #00ff87 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-5 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #00bfff 0%, transparent 70%)' }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#00ff87]/30 bg-[#00ff87]/5 text-[#00ff87] text-sm font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
            Pakistan's First AI-Powered Fitness Platform
          </motion.div>

          <motion.h1
            variants={stagger}
            initial="hidden"
            animate="show"
            className="text-6xl md:text-8xl font-black leading-none tracking-tight mb-6"
          >
            {['Train.', 'Eat.', 'Sleep.'].map((word, i) => (
              <motion.span key={word} variants={fadeUp} className="block">
                {word}
              </motion.span>
            ))}
            <motion.span variants={fadeUp} className="block gradient-text">
              Thrive.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-xl text-[#a0a0a0] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Connect with verified personal trainers. Get custom workout plans. Track nutrition.
            All powered by AI - built for Pakistan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href={user ? '/coaching' : '/signup'}
              className="btn-accent px-8 py-4 rounded-full text-base font-bold w-full sm:w-auto">
              {user ? 'Find a Trainer' : 'Start Free Today'}
            </Link>
            <Link href="/coaching"
              className="px-8 py-4 rounded-full border border-[#2a2a2a] text-[#a0a0a0] hover:border-[#3a3a3a] hover:text-white transition-all text-base font-medium w-full sm:w-auto">
              Browse Trainers
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-[#555] uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-8 bg-gradient-to-b from-[#00ff87] to-transparent"
          />
        </motion.div>
      </section>

      <section className="py-16 px-6 border-y border-[#1a1a1a]">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { n: 500, suffix: '+', label: 'Verified Trainers' },
            { n: 50, suffix: '+', label: 'Partner Gyms' },
            { n: 10000, suffix: '+', label: 'Active Members' },
            { n: 98, suffix: '%', label: 'Satisfaction Rate' },
          ].map(({ n, suffix, label }) => (
            <motion.div key={label} variants={fadeUp} className="flex flex-col items-center gap-1">
              <span className="text-4xl font-black gradient-text">
                <Counter to={n} suffix={suffix} />
              </span>
              <span className="text-sm text-[#a0a0a0]">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#00ff87] text-sm font-semibold uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4">Get fit in 3 steps</h2>
            <p className="text-[#a0a0a0] text-lg">No complicated setup. Just results.</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 relative"
          >
            <div className="hidden md:block absolute top-12 left-[33%] right-[33%] h-px bg-gradient-to-r from-transparent via-[#00ff87]/30 to-transparent" />

            {[
              {
                step: '01',
                icon: '📝',
                title: 'Create your account',
                desc: 'Sign up free in under 30 seconds. No credit card needed to get started.',
                color: 'from-[#00ff87]/20 to-[#00ff87]/5'
              },
              {
                step: '02',
                icon: '🔍',
                title: 'Find your trainer',
                desc: 'Browse hundreds of verified trainers. Filter by specialty, location, and budget.',
                color: 'from-[#00bfff]/20 to-[#00bfff]/5'
              },
              {
                step: '03',
                icon: '🚀',
                title: 'Start your journey',
                desc: 'Get a custom plan, chat in real-time with your trainer, and track every rep.',
                color: 'from-[#7c3aed]/20 to-[#7c3aed]/5'
              },
            ].map(({ step, icon, title, desc, color }) => (
              <motion.div
                key={step}
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                className="glass-card rounded-2xl p-8 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-50`} />
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{icon}</div>
                  <div className="text-6xl font-black text-white/5 absolute top-4 right-4">{step}</div>
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-[#a0a0a0] text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[#00ff87] text-sm font-semibold uppercase tracking-widest">Features</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4">Everything you need</h2>
            <p className="text-[#a0a0a0] text-lg">One platform. Every tool.</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[
              { icon: '✅', title: 'Verified Trainers', desc: 'Every trainer is credentialed by a real gym. No fakes, no scams.', accent: '#00ff87' },
              { icon: '💬', title: 'Real-Time Chat', desc: 'Message your trainer instantly. Get feedback as you work out.', accent: '#00bfff' },
              { icon: '🤖', title: 'AI Chatbot', desc: 'Ask anything about fitness and nutrition. Get instant smart answers.', accent: '#7c3aed' },
              { icon: '📊', title: 'Progress Tracking', desc: 'Log workouts, track body metrics, and visualize your transformation.', accent: '#f59e0b' },
              { icon: '🍎', title: 'Nutrition Logging', desc: 'Search millions of foods. Log meals and track macros effortlessly.', accent: '#10b981' },
              { icon: '💪', title: 'Custom Plans', desc: 'Your trainer builds a plan around your exact goals and schedule.', accent: '#ef4444' },
            ].map(({ icon, title, desc, accent }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ borderColor: accent, transition: { duration: 0.15 } }}
                className="glass-card rounded-2xl p-6 group"
                style={{ transition: 'border-color 0.2s' }}
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200">{icon}</div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-[#a0a0a0] text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <span className="text-[#00ff87] text-sm font-semibold uppercase tracking-widest">Trainers</span>
              <h2 className="text-4xl font-black mt-2">Meet our coaches</h2>
            </div>
            <Link href="/coaching"
              className="text-sm text-[#a0a0a0] hover:text-[#00ff87] transition-colors font-medium hidden md:block">
              View all
            </Link>
          </motion.div>

          {trainersLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#1a1a1a]" />
                    <div className="flex-1">
                      <div className="h-4 bg-[#1a1a1a] rounded mb-2 w-3/4" />
                      <div className="h-3 bg-[#1a1a1a] rounded w-1/2" />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-[#1a1a1a] rounded-full w-20" />
                    <div className="h-6 bg-[#1a1a1a] rounded-full w-16" />
                  </div>
                  <div className="h-3 bg-[#1a1a1a] rounded mb-2" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : trainers.length > 0 ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {trainers.map((trainer) => (
                <TrainerCard key={trainer._id} trainer={trainer} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-lg font-semibold mb-2">Trainers coming soon</h3>
              <p className="text-[#a0a0a0] text-sm">Our verified trainer network is growing. Check back soon!</p>
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link href="/coaching" className="btn-accent px-6 py-3 rounded-full text-sm font-bold">
              View All Trainers
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[#00ff87] text-sm font-semibold uppercase tracking-widest">Pricing</span>
            <h2 className="text-4xl font-black mt-3 mb-4">Affordable for everyone</h2>
            <p className="text-[#a0a0a0]">Start free. Upgrade when you're ready.</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-4"
          >
            {[
              { name: 'Basic', price: '$0', period: 'forever', features: ['3 workouts/week', 'Basic nutrition guides', 'Community access'], accent: '#555', popular: false },
              { name: 'Pro', price: '$19', period: '/month', features: ['Unlimited workouts', 'Custom meal plans', '1-on-1 trainer chat', 'Advanced analytics'], accent: '#00ff87', popular: true },
              { name: 'Elite', price: '$39', period: '/month', features: ['Everything in Pro', 'Live training sessions', 'Priority support', 'Custom meal plans'], accent: '#00bfff', popular: false },
            ].map(({ name, price, period, features, accent, popular }) => (
              <motion.div
                key={name}
                variants={fadeUp}
                className={`relative rounded-2xl p-6 ${popular ? 'border-2' : 'glass-card'}`}
                style={popular ? { border: `2px solid ${accent}`, background: `linear-gradient(135deg, ${accent}15 0%, transparent 100%)` } : {}}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-black"
                    style={{ background: accent }}>
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-bold text-lg">{name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black" style={{ color: popular ? accent : 'white' }}>{price}</span>
                    <span className="text-[#a0a0a0] text-sm">{period}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {features.map(f => (
                    <li key={f} className="text-sm text-[#a0a0a0] flex items-center gap-2">
                      <span style={{ color: popular ? accent : '#555' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/subscription"
                  className={`block w-full text-center py-2.5 rounded-xl text-sm font-bold transition-all ${popular
                    ? 'text-black btn-accent'
                    : 'border border-[#2a2a2a] text-[#a0a0a0] hover:border-[#3a3a3a] hover:text-white'}`}>
                  {name === 'Basic' ? 'Get Started Free' : `Get ${name}`}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #00ff8715 0%, #00bfff10 100%)', border: '1px solid rgba(0,255,135,0.2)' }}
        >
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #00ff87 0%, transparent 60%), radial-gradient(circle at 70% 50%, #00bfff 0%, transparent 60%)' }} />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Ready to <span className="gradient-text">transform</span>?
            </h2>
            <p className="text-[#a0a0a0] text-lg mb-8 max-w-xl mx-auto">
              Join thousands of Pakistanis who are already training smarter, eating better, and living healthier.
            </p>
            <Link href={user ? '/coaching' : '/signup'}
              className="inline-block btn-accent px-10 py-4 rounded-full font-bold text-lg">
              {user ? 'Find Your Trainer' : 'Start for Free'}
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-[#1a1a1a] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg">T.E.S.T.</span>
            <span className="text-[#555] text-sm">© 2025. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-[#555]">
            {[['Find Trainers', '/coaching'], ['Nutrition', '/nutrition'], ['Pricing', '/subscription'], ['Sign In', '/login']].map(([label, href]: any) => (
              <Link key={href} href={href} className="hover:text-[#00ff87] transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
