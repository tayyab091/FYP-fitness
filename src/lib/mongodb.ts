import mongoose from 'mongoose'

declare global {
  var mongoose: {
    conn: mongoose.Connection | null
    promise: Promise<mongoose.Connection> | null
    memoryUri?: string
  }
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

function envMongoUri(): string | null {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (uri && uri.startsWith('mongodb') && !uri.includes('your_mongodb')) {
    return uri
  }
  return null
}

async function resolveMongoUri(): Promise<string> {
  if (cached.memoryUri) return cached.memoryUri

  const envUri = envMongoUri()
  if (envUri) {
    try {
      await mongoose.connect(envUri, { serverSelectionTimeoutMS: 5000 })
      await mongoose.disconnect()
      return envUri
    } catch (err) {
      console.warn(
        '⚠️ MongoDB env URI unreachable, falling back to in-memory database:',
        err instanceof Error ? err.message : err
      )
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Please define a working MONGODB_URI or MONGO_URI in production')
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const memoryServer = await MongoMemoryServer.create()
  cached.memoryUri = memoryServer.getUri()
  console.log('🧪 Using in-memory MongoDB for development')
  return cached.memoryUri
}

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = resolveMongoUri().then((mongoUri) =>
      mongoose.connect(mongoUri).then((m) => m.connection)
    )
  }

  cached.conn = await cached.promise
  return cached.conn
}
