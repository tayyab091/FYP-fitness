'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, AlertTriangle, Plus, X } from 'lucide-react'
import { useState } from 'react'


const SPECIALTIES = ['Weight Loss', 'Muscle Gain', 'Strength Training', 'Cardio', 'Yoga', 'CrossFit', 'HIIT', 'Rehabilitation']
const LANGUAGES = ['English', 'Arabic', 'French', 'Spanish', 'German', 'Urdu', 'Hindi', 'Portuguese']

export default function AdminTrainersPage() {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    country: '',
    bio: '',
    specialty: [] as string[],
    yearsOfExperience: '',
    languages: ['English'] as string[],
    gymId: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-trainers'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/trainers`, { credentials: 'include' })
      return res.json()
    }
  })

  const verifyTrainer = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'verify' | 'reject' }) => {
      await fetch(`/api/admin/trainers/${id}/${action}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-trainers'] })
  })

  const createTrainer = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/trainers/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create trainer')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] })
      setShowCreateForm(false)
      setCreateForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        country: '',
        bio: '',
        specialty: [],
        yearsOfExperience: '',
        languages: ['English'],
        gymId: '',
      })
      alert('Trainer created and verified successfully!')
    },
    onError: (err: any) => {
      alert(`Error: ${err.message}`)
    },
  })

  const trainers = data?.data || data?.trainers || []

  const statusBadge = (trainer: any) => {
    if (trainer.isFullyVerified) return <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle className="w-3 h-3" /> Verified</span>
    if (trainer.adminVerificationStatus === 'rejected') return <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="w-3 h-3" /> Rejected</span>
    if (trainer.gymVerificationStatus === 'approved') return <span className="flex items-center gap-1 text-xs text-yellow-500"><AlertTriangle className="w-3 h-3" /> Awaiting Admin</span>
    return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> Pending Gym</span>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trainer Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Trainer
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Gym Status</th>
                <th className="text-left px-4 py-3 font-medium">Admin Status</th>
                <th className="text-left px-4 py-3 font-medium">Verified</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trainers.map((trainer: any) => (
                <tr key={trainer._id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{trainer.name}</td>
                  <td className="px-4 py-3 text-xs capitalize">{trainer.gymVerificationStatus || 'pending'}</td>
                  <td className="px-4 py-3 text-xs capitalize">{trainer.adminVerificationStatus || 'pending'}</td>
                  <td className="px-4 py-3">{statusBadge(trainer)}</td>
                  <td className="px-4 py-3">
                    {trainer.gymVerificationStatus === 'approved' && !trainer.isFullyVerified && (
                      <div className="flex gap-2">
                        <button onClick={() => verifyTrainer.mutate({ id: trainer._id, action: 'verify' })}
                          className="text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 px-2 py-1 rounded transition-colors">
                          Approve
                        </button>
                        <button onClick={() => verifyTrainer.mutate({ id: trainer._id, action: 'reject' })}
                          className="text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 px-2 py-1 rounded transition-colors">
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Trainer Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Trainer Profile</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email *"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={createForm.phoneNumber}
                onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Country"
                value={createForm.country}
                onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Bio *"
                value={createForm.bio}
                onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              />
              <input
                type="number"
                min="0"
                max="50"
                placeholder="Years of Experience"
                value={createForm.yearsOfExperience}
                onChange={(e) => setCreateForm({ ...createForm, yearsOfExperience: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setCreateForm({
                          ...createForm,
                          specialty: createForm.specialty.includes(s)
                            ? createForm.specialty.filter((x) => x !== s)
                            : [...createForm.specialty, s],
                        });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        createForm.specialty.includes(s)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setCreateForm({
                          ...createForm,
                          languages: createForm.languages.includes(l)
                            ? createForm.languages.filter((x) => x !== l)
                            : [...createForm.languages, l],
                        });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        createForm.languages.includes(l)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!createForm.fullName || !createForm.email || !createForm.bio) {
                      alert('Please fill all required fields (marked with *)');
                      return;
                    }
                    createTrainer.mutate(createForm);
                  }}
                  disabled={createTrainer.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                >
                  {createTrainer.isPending ? 'Creating...' : 'Create & Verify Trainer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
