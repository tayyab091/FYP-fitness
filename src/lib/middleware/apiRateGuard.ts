/**
 * API Rate Guard
 *
 * Tracks external API calls to prevent hitting rate limits.
 * Stores call logs in MongoDB with 1-hour TTL for automatic cleanup.
 */

import mongoose, { Schema, Document } from 'mongoose'

export interface IApiCallLog extends Document {
  apiName: string
  endpoint?: string
  wasSuccessful?: boolean
  calledAt: Date
  createdAt?: Date
}

const ApiCallLogSchema = new Schema<IApiCallLog>(
  {
    apiName: {
      type: String,
      required: true,
      enum: ['api_ninjas', 'rapidapi', 'spoonacular'],
      index: true,
    },
    endpoint: {
      type: String,
      default: '',
    },
    wasSuccessful: {
      type: Boolean,
      default: true,
      index: true,
    },
    calledAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
)

ApiCallLogSchema.index({ calledAt: 1 }, { expireAfterSeconds: 3600, background: true })
ApiCallLogSchema.index({ apiName: 1, calledAt: -1 })

export const ApiCallLog = mongoose.models.ApiCallLog as mongoose.Model<IApiCallLog> ||
  mongoose.model<IApiCallLog>('ApiCallLog', ApiCallLogSchema)

export async function checkApiRateLimit(
  apiName: string,
  hourlyLimit: number
): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const successfulCallsThisHour = await ApiCallLog.countDocuments({
      apiName,
      wasSuccessful: true,
      calledAt: { $gte: oneHourAgo },
    })

    if (successfulCallsThisHour >= hourlyLimit) {
      console.warn(
        `⛔ Rate limit BLOCKING ${apiName}: ${successfulCallsThisHour}/${hourlyLimit} successful calls this hour`
      )
      return { allowed: false, currentCount: successfulCallsThisHour, limit: hourlyLimit }
    }

    console.log(
      `✅ Rate limit OK for ${apiName}: ${successfulCallsThisHour}/${hourlyLimit} successful calls this hour`
    )
    return { allowed: true, currentCount: successfulCallsThisHour, limit: hourlyLimit }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ checkApiRateLimit error:', message)
    return { allowed: true, currentCount: 0, limit: hourlyLimit }
  }
}

export async function logSuccessfulCall(apiName: string, endpoint?: string): Promise<void> {
  try {
    await ApiCallLog.create({
      apiName,
      endpoint,
      wasSuccessful: true,
      calledAt: new Date(),
    })
    console.log(`📊 Logged successful call to ${apiName} ${endpoint || ''}`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`⚠️  Failed to log successful call: ${message}`)
  }
}

export async function logFailedCall(
  apiName: string,
  endpoint?: string,
  statusCode?: number
): Promise<void> {
  try {
    await ApiCallLog.create({
      apiName,
      endpoint,
      wasSuccessful: false,
      calledAt: new Date(),
    })
    console.log(`📊 Logged FAILED call to ${apiName} ${endpoint || ''} (${statusCode || 'unknown'})`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`⚠️  Failed to log call: ${message}`)
  }
}

export async function getApiCallStats(apiName: string, hourlyLimit: number = 100) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const successfulCalls = await ApiCallLog.countDocuments({
      apiName,
      wasSuccessful: true,
      calledAt: { $gte: oneHourAgo },
    })

    const failedCalls = await ApiCallLog.countDocuments({
      apiName,
      wasSuccessful: false,
      calledAt: { $gte: oneHourAgo },
    })

    return {
      apiName,
      successful: successfulCalls,
      failed: failedCalls,
      total: successfulCalls + failedCalls,
      limit: hourlyLimit,
      remaining: Math.max(0, hourlyLimit - successfulCalls),
      timestamp: new Date(),
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ getApiCallStats error:', message)
    throw error
  }
}

export async function resetApiCallLogs() {
  try {
    const result = await ApiCallLog.deleteMany({})
    console.log(`🗑️  Cleared ${result.deletedCount} API call logs`)
    return { deletedCount: result.deletedCount }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ resetApiCallLogs error:', message)
    throw error
  }
}
