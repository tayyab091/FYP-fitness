'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'

const COUNTRIES = [
  'Pakistan', 'UAE', 'United Kingdom', 'United States', 'Canada', 'Australia',
  'Saudi Arabia', 'India', 'Bangladesh', 'Germany', 'France', 'Other'
]

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [country, setCountry] = useState('Pakistan')
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setFormError('')

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match')
      return
    }
    if (!terms) {
      setFormError('You must accept the terms and conditions')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, country }),
      })
      const data = await res.json()

      if (res.status === 409) {
        setEmailError('Email already registered')
        return
      }
      if (!res.ok) {
        setFormError(data.message || 'Registration failed')
        return
      }

      router.push('/my-fitness')
    } catch {
      setFormError('Cannot connect. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black gradient-text">T.E.S.T.</Link>
          <h1 className="text-2xl font-bold text-white mt-6">Create your account</h1>
          <p className="text-[#a0a0a0] text-sm mt-2">Start your fitness journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-4">
          <div>
            <label className="text-sm text-[#a0a0a0] mb-1.5 block">Full Name</label>
            <input name="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
              placeholder="Your full name"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none focus:border-[#00ff87]" />
          </div>

          <div>
            <label className="text-sm text-[#a0a0a0] mb-1.5 block">Email</label>
            <input name="email" type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailError('') }} required
              placeholder="you@example.com"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none focus:border-[#00ff87]" />
            {emailError && <p className="text-[#ef4444] text-sm mt-1">{emailError}</p>}
          </div>

          <div>
            <label className="text-sm text-[#a0a0a0] mb-1.5 block">Password</label>
            <div className="relative">
              <input name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                placeholder="Min 8 characters"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 pr-12 text-white placeholder-[#555] outline-none focus:border-[#00ff87]" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#a0a0a0] mb-1.5 block">Confirm Password</label>
            <input name="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              placeholder="Confirm password"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] outline-none focus:border-[#00ff87]" />
          </div>

          <div>
            <label className="text-sm text-[#a0a0a0] mb-1.5 block">Country</label>
            <select value={country} onChange={e => setCountry(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white outline-none focus:border-[#00ff87]">
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
              className="mt-1 accent-[#00ff87]" />
            <span className="text-sm text-[#a0a0a0]">I agree to the Terms of Service and Privacy Policy</span>
          </label>

          {formError && <p className="text-[#ef4444] text-sm">{formError}</p>}

          <button type="submit" disabled={loading}
            className="btn-accent w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#a0a0a0] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#00ff87] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
