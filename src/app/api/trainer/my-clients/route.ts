import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { isNextResponse, requireTrainer } from '@/lib/middleware/permissions'
import { Trainer, Conversation } from '@/models'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const authResult = await requireTrainer(req)
    if (isNextResponse(authResult)) return authResult

    const trainer = await Trainer.findOne({ userId: authResult.userId })
    if (!trainer) {
      return NextResponse.json({ success: false, error: 'Trainer profile not found' }, { status: 404 })
    }

    const conversations = await Conversation.find({ trainerId: trainer._id }).populate(
      'participants.userId',
      'fullName email profileImage'
    )

    const clientsSet = new Set<string>()
    conversations.forEach((conv) => {
      conv.participants.forEach((p: { role: string; userId?: unknown }) => {
        if (p.role === 'user' && p.userId) {
          clientsSet.add(JSON.stringify(p.userId))
        }
      })
    })

    const clients = Array.from(clientsSet).map((client) => JSON.parse(client))

    return NextResponse.json({ success: true, data: clients, total: clients.length })
  } catch (err: unknown) {
    console.error('Get trainer clients error:', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
