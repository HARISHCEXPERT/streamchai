// Profanity filter - basic banned words list
const BANNED_WORDS = ['mc', 'bc', 'chutiya', 'madarchod', 'bhenchod', 'fuck', 'shit', 'ass', 'bitch', 'nigger', 'faggot']

export function filterMessage(message) {
  if (!message) return ''
  let filtered = message
  BANNED_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi')
    filtered = filtered.replace(regex, '*'.repeat(word.length))
  })
  // Limit consecutive caps
  filtered = filtered.replace(/[A-Z]{5,}/g, (match) => match.charAt(0) + match.slice(1).toLowerCase())
  // Limit emoji spam - max 3 emojis
  const emojiRegex = /(\p{Emoji})/gu
  let emojiCount = 0
  filtered = filtered.replace(emojiRegex, (match) => {
    emojiCount++
    return emojiCount <= 3 ? match : ''
  })
  return filtered.trim()
}

// Default tiers - creator can override these
export const DEFAULT_TIERS = [
  { minAmount: 1,   maxAmount: 50,   maxChars: 30,  displayTime: 5,  ttsEnabled: false },
  { minAmount: 51,  maxAmount: 200,  maxChars: 120, displayTime: 15, ttsEnabled: false },
  { minAmount: 201, maxAmount: 500,  maxChars: 200, displayTime: 20, ttsEnabled: true  },
  { minAmount: 501, maxAmount: null, maxChars: 300, displayTime: 30, ttsEnabled: true  },
]

export function getTierForAmount(amount, customTiers = null) {
  const tiers = customTiers || DEFAULT_TIERS
  const tier = tiers.find(t => amount >= t.minAmount && (t.maxAmount === null || amount <= t.maxAmount))
  return tier || DEFAULT_TIERS[0]
}

export function buildDonationEvent({ creatorId, payment, message, donorName, tiers }) {
  const amount = payment.amount / 100 // Razorpay sends paise
  const tier = getTierForAmount(amount, tiers)
  const cleanMessage = filterMessage(message)
  const truncatedMessage = cleanMessage.slice(0, tier.maxChars)

  return {
    creator_id: creatorId,
    amount,
    currency: payment.currency || 'INR',
    message: truncatedMessage,
    donor_name: donorName || 'Anonymous',
    display_time: tier.displayTime,
    tts_enabled: tier.ttsEnabled,
    status: 'pending',
    razorpay_payment_id: payment.id,
    created_at: new Date().toISOString(),
  }
}
