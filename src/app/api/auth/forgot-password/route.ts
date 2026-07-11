import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    const genericResponse = {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    }

    if (!user) {
      return NextResponse.json(genericResponse)
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: tokenExpiry,
    })

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`

    let emailSent = false
    try {
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.default.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587', 10),
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        })

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: user.email,
          subject: 'T.E.S.T. — Reset Your Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset Your Password</h2>
              <p>Hi ${user.fullName},</p>
              <p>You requested a password reset for your T.E.S.T. account.</p>
              <p>Click the button below to reset your password. This link expires in 1 hour.</p>
              <a href="${resetUrl}"
                style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
                Reset Password
              </a>
              <p style="color:#666;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
              <p style="color:#666;font-size:12px;">Link expires: ${tokenExpiry.toLocaleString()}</p>
            </div>
          `,
        })
        emailSent = true
      }
    } catch (emailErr) {
      console.warn('Email sending failed:', emailErr)
    }

    if (!emailSent && process.env.NODE_ENV !== 'production') {
      console.log('\n🔗 Password reset URL (dev mode):')
      console.log(resetUrl)
      console.log('')

      return NextResponse.json({
        ...genericResponse,
        devResetUrl: resetUrl,
        devNote: 'Email not configured. Use this URL to reset password (development only).',
      })
    }

    return NextResponse.json(genericResponse)
  } catch (err: unknown) {
    console.error('Forgot password error:', err)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
