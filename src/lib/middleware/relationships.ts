/**
 * Relationship Access Control
 *
 * Enforces the strict privacy rule:
 * "A user and trainer can ONLY communicate and see private data
 *  if they have an ACTIVE mutual relationship"
 */

import { NextRequest, NextResponse } from 'next/server'
import { Types } from 'mongoose'
import {
  Conversation,
  Trainer,
  TrainerClientRelationship,
  type ITrainerClientRelationship,
} from '@/models'
import { AuthContext, isNextResponse, requireAuth } from '@/lib/middleware/auth'
import type { PermissionContext } from '@/lib/middleware/permissions'

export interface RelationshipContext extends AuthContext {
  relationship: ITrainerClientRelationship
}

const accessFlagTypes = {
  canChat: 'boolean',
  canViewSchedule: 'boolean',
  canViewProgress: 'boolean',
  canEditSchedule: 'boolean',
  canViewNutrition: 'boolean',
} as const

export type AccessFlagName = keyof typeof accessFlagTypes

interface RelationshipParams {
  trainerId?: string | null
  conversationId?: string | null
}

function getRelationshipParams(req: NextRequest, params?: Record<string, string>): RelationshipParams {
  const url = new URL(req.url)
  const bodyTrainerId = (req as NextRequest & { parsedBody?: Record<string, unknown> }).parsedBody?.trainerId

  return {
    trainerId:
      params?.trainerId ||
      url.searchParams.get('trainerId') ||
      (typeof bodyTrainerId === 'string' ? bodyTrainerId : null),
    conversationId: params?.id || params?.conversationId || null,
  }
}

export async function requireActiveRelationship(
  req: NextRequest,
  params?: Record<string, string>,
  body?: Record<string, unknown>
): Promise<RelationshipContext | NextResponse> {
  const authResult = await requireAuth(req)

  if (isNextResponse(authResult)) {
    return authResult
  }

  try {
    const userId = authResult.userId
    const userRole = authResult.userRole
    const relationshipParams = getRelationshipParams(req, params)

    let trainerId = relationshipParams.trainerId || (typeof body?.trainerId === 'string' ? body.trainerId : null)
    let otherPartyUserId: string | null = null

    if (relationshipParams.conversationId) {
      try {
        const conversation = await Conversation.findById(relationshipParams.conversationId)
        if (conversation) {
          if (!trainerId) {
            trainerId = conversation.trainerId.toString()
          }

          const otherParticipant = conversation.participants.find(
            (participant: { userId: { toString(): string } }) =>
              participant.userId.toString() !== userId
          )

          if (otherParticipant && !otherPartyUserId) {
            otherPartyUserId = otherParticipant.userId.toString()
          }
        }
      } catch (error) {
        console.log('Error extracting from conversation:', error)
      }
    }

    if (!trainerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trainer ID is required',
          code: 'MISSING_TRAINER_ID',
        },
        { status: 400 }
      )
    }

    const trainerIdObj = new Types.ObjectId(trainerId)

    let relationship = await TrainerClientRelationship.findOne({
      trainerId: trainerIdObj,
      userId,
      status: 'active',
      isActive: true,
    })

    if (relationship) {
      return { ...authResult, relationship }
    }

    if (userRole === 'trainer') {
      try {
        const trainerProfile = await Trainer.findOne({ userId })
        if (!trainerProfile) {
          throw new Error('Trainer profile not found')
        }

        const targetUserId = otherPartyUserId || trainerIdObj.toString()

        relationship = await TrainerClientRelationship.findOne({
          trainerId: trainerProfile._id,
          userId: targetUserId,
          status: 'active',
          isActive: true,
        })

        if (relationship) {
          return { ...authResult, relationship }
        }
      } catch (error) {
        console.log('Error in trainer case:', error)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'No active trainer-client relationship found',
        code: 'NO_RELATIONSHIP',
        action: 'REQUEST_TRAINER',
      },
      { status: 403 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Relationship Middleware] Unexpected error:', message)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify relationship',
        message,
      },
      { status: 500 }
    )
  }
}

export async function checkAccessFlag(
  relationship: ITrainerClientRelationship,
  flagName: AccessFlagName
): Promise<NextResponse | null> {
  if (!relationship.accessFlags[flagName]) {
    return NextResponse.json(
      {
        success: false,
        error: `Access denied: ${flagName} not enabled for this relationship`,
        code: 'ACCESS_FLAG_DENIED',
        requiredFlag: flagName,
      },
      { status: 403 }
    )
  }

  return null
}

export async function checkFreeMessageLimit(
  relationship: ITrainerClientRelationship,
  requestUser?: PermissionContext['user']
): Promise<NextResponse | null> {
  const isPaidUser =
    requestUser?.subscription?.status === 'active' &&
    ['pro', 'elite'].includes(requestUser?.subscription?.plan || '')

  if (!isPaidUser) {
    if (relationship.freeMessagesUsed >= relationship.freeMessagesLimit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Free message limit reached',
          code: 'FREE_LIMIT_REACHED',
          used: relationship.freeMessagesUsed,
          limit: relationship.freeMessagesLimit,
          upgradeUrl: '/subscription',
        },
        { status: 403 }
      )
    }
  }

  return null
}
