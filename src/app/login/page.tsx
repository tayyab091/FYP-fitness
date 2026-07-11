'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.status === 401) {
        setError('Invalid email or password')
        return
      }
      if (res.status === 403) {
        setError('Account suspended. Contact support.')
        return
      }
      if (!res.ok) {
        setError(data.message || 'Sign in failed')
        return
      }

      const role = data.user?.role
      if (role === 'admin' || role === 'super_admin') router.push('/admin')
      else if (role === 'trainer') router.push('/trainer-dashboard')
      else if (role === 'gym_owner') router.push('/gym-owner')
      else router.push('/my-fitness')
    } catch {
      setError('Cannot connect. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black gradient-text">T.E.S.T.</Link>
          <h1 className="text-2xl font-bold text-white mt-6">Welcome back</h1>
          <p className="text-[#a0a0a0] text-sm mt-2">Sign in to continue your fitness journey</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
          <div>
            <label htmlFor="email" className="text-sm text-[#a0a0a0] mb-1.5 block">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              required
              placeholder="you@example.com"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none focus:border-[#00ff87]"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-[#a0a0a0] mb-1.5 block">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                required
                placeholder="••••••••"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 pr-12 text-white placeholder-[#555] outline-none focus:border-[#00ff87]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-[#ef4444] text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="btn-accent w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
          </button>

          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-[#a0a0a0] hover:text-[#00ff87]">Forgot password?</Link>
          </div>
        </form>

        <p className="text-center text-sm text-[#a0a0a0] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#00ff87] font-medium hover:underline">Sign up</Link>
        </p>

        <div className="flex flex-col gap-2 mt-4 text-center text-sm">
          <Link href="/register-trainer" className="text-[#a0a0a0] hover:text-white">Register as Trainer</Link>
          <Link href="/register-gym-owner" className="text-[#a0a0a0] hover:text-white">Register your Gym</Link>
        </div>
      </div>
    </div>
  )
}
