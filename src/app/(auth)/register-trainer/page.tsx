'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, CheckCircle, User, Briefcase, Building2, FileText, Loader2 } from 'lucide-react'


const STEPS = [
  { id: 1, label: 'Account', icon: User },
  { id: 2, label: 'Profile', icon: Briefcase },
  { id: 3, label: 'Gym', icon: Building2 },
  { id: 4, label: 'Documents', icon: FileText },
]

const SPECIALTIES = [
  'Weight Loss', 'Muscle Gain', 'Strength Training', 'Cardio',
  'Yoga', 'CrossFit', 'HIIT', 'Rehabilitation', 'Nutrition Coaching',
  'Sports Performance', 'Flexibility', 'Bodybuilding', 'Powerlifting'
]

const LANGUAGES = [
  'English', 'Arabic', 'French', 'Spanish', 'German',
  'Urdu', 'Hindi', 'Portuguese', 'Turkish', 'Chinese'
]

export default function RegisterTrainerPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    // Step 1 — Account
    email: '',
    password: '',
    confirm: '',
    fullName: '',
    phoneNumber: '',
    country: '',

    // Step 2 — Profile
    bio: '',
    specialty: [] as string[],
    yearsOfExperience: '',
    languages: ['English'] as string[],

    // Step 3 — Gym (optional)
    isIndependent: true,
    gymId: '',

    // Step 4 — Documents
    certificationUrls: [''],
    governmentIdUrl: ''
  })

  const set = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }))

  // Fetch verified gyms for the dropdown
  const { data: gymsData } = useQuery({
    queryKey: ['gyms-verified'],
    queryFn: () => fetch(`/api/gyms/verified`, { credentials: 'include' }).then(r => r.json())
  })
  const gyms = gymsData?.data || []

  const toggleSpecialty = (s: string) => {
    set('specialty', form.specialty.includes(s)
      ? form.specialty.filter(x => x !== s)
      : [...form.specialty, s]
    )
  }

  const toggleLanguage = (l: string) => {
    set('languages', form.languages.includes(l)
      ? form.languages.filter(x => x !== l)
      : [...form.languages, l]
    )
  }

  const canProceed = () => {
    if (step === 1) return form.email && form.password && form.password === form.confirm && form.fullName && form.country
    if (step === 2) return form.bio && form.specialty.length > 0
    if (step === 3) return form.isIndependent || form.gymId
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/auth/register-trainer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          phoneNumber: form.phoneNumber,
          country: form.country,
          bio: form.bio,
          specialty: form.specialty,
          yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
          languages: form.languages,
          gymId: form.isIndependent ? null : (form.gymId || null),
          isIndependent: form.isIndependent,
          certifications: form.certificationUrls.filter(u => u.trim()),
          governmentId: form.governmentIdUrl || null
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      setSuccess(true)
      setTimeout(() => router.push('/trainer'), 2000)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
        <p className="text-muted-foreground mb-4">
          Your trainer profile has been created. {form.isIndependent ? 'An admin will review your profile and approve it within 24 hours.' : 'The gym owner and admin will review your profile.'}
        </p>
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Become a Trainer</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Join T.E.S.T. as a certified trainer and start coaching clients worldwide
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isDone = step > s.id
            const isCurrent = step === s.id
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`flex flex-col items-center flex-shrink-0`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                    ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] mt-1 ${isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${step > s.id ? 'bg-green-500' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Form Card */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >

              {/* STEP 1 — Account */}
              {step === 1 && (
                <>
                  <h3 className="font-semibold">Create Your Account</h3>
                  {[
                    { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'John Smith' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com' },
                    { label: 'Password', key: 'password', type: 'password', placeholder: 'Minimum 8 characters' },
                    { label: 'Confirm Password', key: 'confirm', type: 'password', placeholder: 'Repeat password' },
                    { label: 'Phone Number', key: 'phoneNumber', type: 'tel', placeholder: '+92 300 0000000' },
                    { label: 'Country', key: 'country', type: 'text', placeholder: 'Pakistan' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        value={(form as any)[f.key] ?? ''}
                        onChange={e => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  ))}
                  {form.password && form.confirm && form.password !== form.confirm && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </>
              )}

              {/* STEP 2 — Profile */}
              {step === 2 && (
                <>
                  <h3 className="font-semibold">Your Trainer Profile</h3>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Bio / About You</label>
                    <textarea rows={3}
                      value={form.bio}
                      onChange={e => set('bio', e.target.value)}
                      placeholder="Tell clients about your training philosophy and experience..."
                      className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">Specialties (select all that apply)</label>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALTIES.map(s => (
                        <button key={s} type="button"
                          onClick={() => toggleSpecialty(s)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all
                            ${form.specialty.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Years of Experience</label>
                    <input type="number" min="0" max="50"
                      value={form.yearsOfExperience}
                      onChange={e => set('yearsOfExperience', e.target.value)}
                      placeholder="5"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">Languages Spoken</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map(l => (
                        <button key={l} type="button"
                          onClick={() => toggleLanguage(l)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all
                            ${form.languages.includes(l) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3 — Gym Affiliation */}
              {step === 3 && (
                <>
                  <h3 className="font-semibold">Gym Affiliation</h3>
                  <p className="text-sm text-muted-foreground">
                    Are you affiliated with a gym on our platform, or are you an independent trainer?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button"
                      onClick={() => { set('isIndependent', false); set('gymId', '') }}
                      className={`p-4 rounded-xl border-2 text-left transition-all
                        ${!form.isIndependent ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <Building2 className="w-5 h-5 mb-2 text-primary" />
                      <p className="font-medium text-sm">Gym Trainer</p>
                      <p className="text-xs text-muted-foreground mt-0.5">I work at a gym</p>
                    </button>
                    <button type="button"
                      onClick={() => { set('isIndependent', true); set('gymId', '') }}
                      className={`p-4 rounded-xl border-2 text-left transition-all
                        ${form.isIndependent ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <User className="w-5 h-5 mb-2 text-primary" />
                      <p className="font-medium text-sm">Independent</p>
                      <p className="text-xs text-muted-foreground mt-0.5">I train independently</p>
                    </button>
                  </div>

                  {!form.isIndependent && (
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Select Your Gym</label>
                      <select value={form.gymId ?? ''}
                        onChange={e => set('gymId', e.target.value)}
                        className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">Select a gym...</option>
                        {gyms.map((gym: any) => (
                          <option key={gym._id} value={gym._id}>
                            {gym.name} {gym.address?.city ? `— ${gym.address.city}, ${gym.address.country}` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only verified gyms are shown. The gym owner will also need to confirm you.
                      </p>
                    </div>
                  )}

                  {form.isIndependent && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                      <p className="text-xs text-blue-600">
                        As an independent trainer, only admin approval is required.
                        Your profile will go live faster (usually within 24 hours).
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* STEP 4 — Documents */}
              {step === 4 && (
                <>
                  <h3 className="font-semibold">Upload Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste the URL of your certification images or documents.
                    You can upload to Google Drive, Dropbox, or any image host and paste the link here.
                  </p>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">
                      Certification Document URLs
                    </label>
                    {form.certificationUrls.map((url, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input
                          value={url}
                          onChange={e => {
                            const updated = [...form.certificationUrls]
                            updated[idx] = e.target.value
                            set('certificationUrls', updated)
                          }}
                          placeholder="https://drive.google.com/your-certificate"
                          className="flex-1 border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {form.certificationUrls.length > 1 && (
                          <button type="button"
                            onClick={() => set('certificationUrls', form.certificationUrls.filter((_, i) => i !== idx))}
                            className="px-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => set('certificationUrls', [...form.certificationUrls, ''])}
                      className="text-xs text-primary hover:underline">
                      + Add another certification
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Government ID URL (optional but speeds up verification)
                    </label>
                    <input
                      value={form.governmentIdUrl}
                      onChange={e => set('governmentIdUrl', e.target.value)}
                      placeholder="https://drive.google.com/your-id"
                      className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
                    Your documents are reviewed only by admins for verification purposes.
                    After verification your profile will be visible to users.
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive mt-3 bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm hover:bg-secondary transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => canProceed() && setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground
                  py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground
                  py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Log in</Link>
          {' · '}
          <Link href="/signup" className="text-primary hover:underline">Join as User</Link>
        </p>
      </div>
    </div>
  )
}
