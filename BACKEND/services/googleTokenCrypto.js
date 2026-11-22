import crypto from 'crypto'
import { env } from '../config/env.js'

const PREFIX = 'enc:v1:'
const key = crypto.createHash('sha256').update(env.googleTokenEncryptionKey || env.jwtSecret).digest()

export function encryptGoogleToken(value) {
  if (!value || String(value).startsWith(PREFIX)) return value || null
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString('base64url')}`
}

export function decryptGoogleToken(value) {
  if (!value || !String(value).startsWith(PREFIX)) return value || null
  const payload = Buffer.from(String(value).slice(PREFIX.length), 'base64url')
  const iv = payload.subarray(0, 12)
  const tag = payload.subarray(12, 28)
  const encrypted = payload.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
