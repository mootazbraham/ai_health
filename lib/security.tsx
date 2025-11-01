import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production"

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)), iv)

  let encrypted = cipher.update(data, "utf8", "hex")
  encrypted += cipher.final("hex")

  return iv.toString("hex") + ":" + encrypted
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(":")
  const iv = Buffer.from(ivHex, "hex")

  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)), iv)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Hash password with salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")

  return salt + ":" + hash
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":")
  const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")

  return computedHash === storedHash
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, expiresIn = 86400): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    }),
  ).toString("base64")

  const signature = crypto.createHmac("sha256", ENCRYPTION_KEY).update(`${header}.${payload}`).digest("base64")

  return `${header}.${payload}.${signature}`
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const [header, payload, signature] = token.split(".")
    const expectedSignature = crypto
      .createHmac("sha256", ENCRYPTION_KEY)
      .update(`${header}.${payload}`)
      .digest("base64")

    if (signature !== expectedSignature) {
      return null
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64").toString())

    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return { userId: decoded.userId }
  } catch {
    return null
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Rate limiting helper
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>()

  return function isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const userRequests = requests.get(identifier) || []

    // Remove old requests outside the window
    const recentRequests = userRequests.filter((time) => now - time < windowMs)

    if (recentRequests.length >= maxRequests) {
      return true
    }

    recentRequests.push(now)
    requests.set(identifier, recentRequests)

    return false
  }
}
