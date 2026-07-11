import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const testDir = path.resolve(__dirname, '..')
const outPath = path.join(testDir, '.env.local')

function parseEnv(content) {
  const vars = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

function readEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return parseEnv(fs.readFileSync(filePath, 'utf8'))
    }
  } catch {
    /* ignore */
  }
  return {}
}

const sources = [
  path.join(root, 'server', '.env'),
  path.join(root, 'server', '.env.local'),
  path.join(root, 'client', '.env.local'),
  path.join(root, 'client', '.env'),
  path.join(testDir, '.env.local.example'),
]

const merged = {}
for (const src of sources) {
  Object.assign(merged, readEnvFile(src))
}

function isValidMongoUri(uri) {
  return Boolean(uri && uri.startsWith('mongodb') && !uri.includes('your_mongodb'))
}

const mongoUri =
  [merged.MONGODB_URI, merged.MONGO_URI].find(isValidMongoUri) ||
  extractFromProjectFiles(root, /mongodb\+srv:\/\/[^\s"'`]+/g)

function extractFromProjectFiles(baseDir, pattern) {
  const candidates = [
    path.join(baseDir, 'find-chat-user.js'),
    path.join(baseDir, 'server', 'debug-conversation.js'),
  ]
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue
      const content = fs.readFileSync(file, 'utf8')
      const match = content.match(pattern)
      if (match?.[0] && !match[0].includes('your_mongodb')) {
        return match[0]
      }
    } catch {
      /* ignore */
    }
  }
  return ''
}

const jwtSecret =
  merged.JWT_SECRET ||
  merged.JWT_SECRET_KEY ||
  'your_super_secret_jwt_key_change_in_production'

const output = {
  MONGODB_URI: mongoUri,
  MONGO_URI: mongoUri,
  JWT_SECRET: jwtSecret,
  NODE_ENV: 'development',
  PORT: merged.PORT || '3000',
  NEXT_PUBLIC_SITE_URL: merged.NEXT_PUBLIC_SITE_URL || merged.CLIENT_URL || 'http://localhost:3000',
  CLIENT_URL: merged.CLIENT_URL || 'http://localhost:3000',
  STRIPE_SECRET_KEY: merged.STRIPE_SECRET_KEY || '',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    merged.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || merged.STRIPE_PUBLISHABLE_KEY || '',
  GEMINI_API_KEY: merged.GEMINI_API_KEY || '',
  SPOONACULAR_API_KEY: merged.SPOONACULAR_API_KEY || '',
  API_NINJAS_KEY: merged.API_NINJAS_KEY || '',
  OPENROUTER_API_KEY: merged.OPENROUTER_API_KEY || '',
  HUGGINGFACE_TOKEN: merged.HUGGINGFACE_TOKEN || '',
  ADMIN_SETUP_KEY: merged.ADMIN_SETUP_KEY || 'test_admin_setup_key_2025',
  ADMIN_EMAIL: merged.ADMIN_EMAIL || '',
  ADMIN_PASSWORD: merged.ADMIN_PASSWORD || '',
  ADMIN_SECRET_KEY: merged.ADMIN_SECRET_KEY || '',
  RESEND_API_KEY: merged.RESEND_API_KEY || '',
  NEXTAUTH_SECRET: merged.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: merged.NEXTAUTH_URL || 'http://localhost:3000',
  EMAIL_HOST: merged.EMAIL_HOST || '',
  EMAIL_PORT: merged.EMAIL_PORT || '587',
  EMAIL_USER: merged.EMAIL_USER || '',
  EMAIL_PASS: merged.EMAIL_PASS || '',
  EMAIL_FROM: merged.EMAIL_FROM || '',
}

const lines = Object.entries(output)
  .filter(([, v]) => v !== '')
  .map(([k, v]) => `${k}=${v}`)

// Always include required keys even if empty (for visibility)
const required = ['MONGODB_URI', 'MONGO_URI', 'JWT_SECRET', 'NODE_ENV', 'ADMIN_SETUP_KEY']
for (const key of required) {
  if (!lines.some((l) => l.startsWith(`${key}=`))) {
    lines.unshift(`${key}=${output[key] || ''}`)
  }
}

fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8')

const foundSources = sources.filter((s) => fs.existsSync(s)).map((s) => path.basename(path.dirname(s)) + '/' + path.basename(s))
console.log('Merged env from:', foundSources.length ? foundSources.join(', ') : 'none (using defaults)')
console.log('MONGODB_URI set:', Boolean(mongoUri))
console.log('JWT_SECRET set:', Boolean(jwtSecret && jwtSecret !== 'test_jwt_secret_change_in_production'))
console.log('Wrote:', outPath)
