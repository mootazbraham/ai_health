import crypto from "crypto"

// Security: Fail fast if encryption key is missing or weak
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error(
    "[SECURITY] ENCRYPTION_KEY environment variable is required and must be at least 32 characters. " +
    "Generate with: openssl rand -base64 32 or " +
    "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
  )
}

// Security: Use separate JWT secret (not encryption key)
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "[SECURITY] JWT_SECRET environment variable is required and must be at least 32 characters. " +
    "Generate with: openssl rand -base64 32"
  )
}

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
 * Security: Increased iterations for production (should be 10000+ in production)
 * Format: salt:iterations:hash (for new hashes) or salt:hash (for backwards compatibility)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  // Security: Use higher iteration count in production (10000 recommended by OWASP)
  const iterations = process.env.NODE_ENV === 'production' ? 10000 : 1000
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex")

  // Store iterations in hash format for proper verification
  return `${salt}:${iterations}:${hash}`
}

/**
 * Verify password
 * Security: Extracts iteration count from hash format (salt:iterations:hash) or defaults to 1000
 */
export function verifyPassword(password: string, hash: string): boolean {
  const parts = hash.split(":")
  let salt: string
  let storedHash: string
  let iterations: number

  // Support both old format (salt:hash) and new format (salt:iterations:hash)
  if (parts.length === 3) {
    salt = parts[0]
    iterations = parseInt(parts[1], 10) || 1000
    storedHash = parts[2]
  } else {
    salt = parts[0]
    storedHash = parts[1]
    iterations = 1000 // Default for backwards compatibility
  }

  const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex")

  return computedHash === storedHash
}

/**
 * Generate JWT token
 * Security: Uses separate JWT_SECRET, shorter expiration (30 min default)
 */
export function generateToken(userId: string, expiresIn = 1800): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64")
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    }),
  ).toString("base64")

  // Security: Use separate JWT_SECRET instead of ENCRYPTION_KEY
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64")

  return `${header}.${payload}.${signature}`
}

/**
 * Verify JWT token
 * Security: Uses separate JWT_SECRET for verification
 */
export function verifyToken(token: string): { userId: string; exp?: number } | null {
  try {
    const [header, payload, signature] = token.split(".")
    
    if (!header || !payload || !signature) {
      return null
    }
    
    // Security: Use separate JWT_SECRET instead of ENCRYPTION_KEY
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
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
