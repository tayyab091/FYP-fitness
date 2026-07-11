import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { loadEnvConfig } from '@next/env'
import { Server as SocketIOServer } from 'socket.io'
import jwt from 'jsonwebtoken'
import { connectDB } from './src/lib/mongodb'
import User from './src/models/User'
import TrainerClientRelationship from './src/models/TrainerClientRelationship'
import Notification from './src/models/Notification'

loadEnvConfig(process.cwd())

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL || 'http://localhost:3000',
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
].filter((url, index, arr) => arr.indexOf(url) === index)

app.prepare().then(async () => {
  try {
    await connectDB()
    console.log('✅ Connected to MongoDB')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ MongoDB connection error:', message)
    console.warn('⚠️ Continuing without MongoDB. Some Socket.IO features may be unavailable.')
  }

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
    allowEIO3: true,
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        console.warn('[Socket Auth] Connection attempt without token')
        return next(new Error('Authentication error: no token provided'))
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'secret'
        ) as { userId: string }

        const user = await User.findById(decoded.userId)
        if (!user) {
          console.warn(`[Socket Auth] User not found: ${decoded.userId}`)
          return next(new Error('User not found'))
        }

        if (user.verificationStatus === 'suspended') {
          console.warn(`[Socket Auth] Account suspended: ${user.email}`)
          return next(new Error('Account suspended'))
        }

        ;(socket as any).userId = decoded.userId
        ;(socket as any).userRole = user.role
        ;(socket as any).userName = user.fullName

        next()
      } catch (tokenErr: unknown) {
        const message = tokenErr instanceof Error ? tokenErr.message : String(tokenErr)
        console.error('[Socket Auth] Token verification failed:', message)
        return next(new Error(`Token verification failed: ${message}`))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[Socket Auth] Unexpected error:', message)
      next(new Error(`Authentication error: ${message}`))
    }
  })

  io.on('connection', (socket: any) => {
    console.log(`✅ User connected: ${socket.userName} (${socket.userId})`)

    socket.join(`user:${socket.userId}`)

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
      console.log(`👤 User ${socket.userId} joined conversation ${conversationId}`)

      socket.to(`conversation:${conversationId}`).emit('user_online', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date(),
      })
    })

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
      console.log(`👤 User ${socket.userId} left conversation ${conversationId}`)

      socket.to(`conversation:${conversationId}`).emit('user_offline', {
        userId: socket.userId,
        timestamp: new Date(),
      })
    })

    socket.on('typing_start', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date(),
      })
    })

    socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        timestamp: new Date(),
      })
    })

    socket.on('new_message', ({ conversationId, message }: { conversationId: string; message: unknown }) => {
      io.to(`conversation:${conversationId}`).emit('receive_message', {
        ...(message as object),
        timestamp: new Date(),
      })
    })

    socket.on('message_read', ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('message_read_status', {
        messageId,
        readBy: socket.userId,
        readAt: new Date(),
      })
    })

    socket.on('workout:start', async ({ planId, dayOfWeek, userId }: { planId: string; dayOfWeek: number; userId: string }) => {
      try {
        const relationship = await TrainerClientRelationship.findOne({ userId, status: 'active' })
        if (relationship) {
          io.to(`user:${relationship.trainerId}`).emit('client:workout_started', {
            userId,
            planId,
            dayOfWeek,
            startedAt: new Date(),
          })
        }
      } catch (err) {
        console.error('Error in workout:start:', err)
      }
    })

    socket.on(
      'workout:set_completed',
      async ({
        logId,
        exerciseName,
        setData,
        userId,
      }: {
        logId: string
        exerciseName: string
        setData: unknown
        userId: string
      }) => {
        try {
          const relationship = await TrainerClientRelationship.findOne({ userId, status: 'active' })
          if (relationship) {
            io.to(`user:${relationship.trainerId}`).emit('client:set_completed', {
              userId,
              logId,
              exerciseName,
              setData,
            })
          }
        } catch (err) {
          console.error('Error in workout:set_completed:', err)
        }
      }
    )

    socket.on(
      'workout:complete',
      async ({ logId, summary, userId }: { logId: string; summary: unknown; userId: string }) => {
        try {
          const relationship = await TrainerClientRelationship.findOne({ userId, status: 'active' })
          if (relationship) {
            io.to(`user:${relationship.trainerId}`).emit('client:workout_done', {
              userId,
              logId,
              summary,
            })
            await Notification.create({
              userId: relationship.trainerId,
              type: 'workout_completed',
              title: 'Client Completed Workout',
              message: "Your client finished today's session!",
              link: `/trainer/clients/${userId}`,
              isRead: false,
            })
          }
        } catch (err) {
          console.error('Error in workout:complete:', err)
        }
      }
    )

    socket.on('join_admin', async () => {
      try {
        const user = await User.findById(socket.userId)
        if (user?.role === 'admin' || user?.role === 'super_admin') {
          socket.join('admin_room')
          console.log(`✅ Admin ${socket.userId} joined admin_room`)
        }
      } catch (err) {
        console.error('Error in join_admin:', err)
      }
    })

    socket.on('leave_admin', () => {
      socket.leave('admin_room')
      console.log(`❌ User ${socket.userId} left admin_room`)
    })

    socket.on('error', (error: unknown) => {
      console.error(`Socket error for user ${socket.userId}:`, error)
    })

    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.userId}`)

      try {
        await User.findByIdAndUpdate(socket.userId, { lastActive: new Date() })

        const relationships = await TrainerClientRelationship.find({
          userId: socket.userId,
          status: 'active',
        })

        relationships.forEach((rel) => {
          io.to(`user:${rel.trainerId}`).emit('client:offline', {
            userId: socket.userId,
            lastActive: new Date(),
          })
        })
      } catch (err) {
        console.error('Error in disconnect:', err)
      }
    })
  })

  ;(global as any).io = io

  server.listen(port, () => {
    console.log(`> T.E.S.T. running on http://${hostname}:${port}`)
    console.log('📡 WebSocket ready for real-time chat')
  })
})

export {}
