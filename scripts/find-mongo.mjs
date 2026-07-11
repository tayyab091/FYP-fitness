import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

const files = [
  path.join(root, 'find-chat-user.js'),
  path.join(root, 'server', 'debug-conversation.js'),
]

const uris = []
for (const file of files) {
  if (!fs.existsSync(file)) continue
  const content = fs.readFileSync(file, 'utf8')
  const matches = content.match(/mongodb\+srv:\/\/[^\s"'`]+/g) || []
  uris.push(...matches)
}

let working = ''
for (const uri of [...new Set(uris)]) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
    working = uri
    await mongoose.disconnect()
    break
  } catch {
    /* try next */
  }
}

if (!working) {
  console.error('No working MongoDB URI found among project files')
  process.exit(1)
}

console.log('Working URI found (host only):', working.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))
process.stdout.write(working)
