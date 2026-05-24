import { headers } from 'next/headers'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { buildDonationEvent } from '@/lib/donations'

export async function POST(request) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('x-razorpay-signature')

    // 1. Verify Razorpay signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return Response.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    // 2. Only handle payment.captured
    if (event.event !== 'payment.captured') {
      return Response.json({ status: 'ignored' })
    }

    const payment = event.payload.payment.entity
    const notes = payment.notes || {}

    // notes.creator_id and notes.message come from Razorpay payment link notes
    const creatorId = notes.creator_id
    const message = notes.message || ''
    const donorName = notes.donor_name || 'Anonymous'

    if (!creatorId) {
      console.error('No creator_id in payment notes')
      return Response.json({ error: 'Missing creator_id' }, { status: 400 })
    }

    // 3. Fetch creator's custom tiers if any
    const db = supabaseAdmin()
    const { data: creator } = await db
      .from('creators')
      .select('tiers')
      .eq('id', creatorId)
      .single()

    // 4. Build donation event
    const donationEvent = buildDonationEvent({
      creatorId,
      payment,
      message,
      donorName,
      tiers: creator?.tiers || null,
    })

    // 5. Insert into donations table — Supabase Realtime will fire automatically
    const { error } = await db.from('donations').insert(donationEvent)

    if (error) {
      console.error('Supabase insert error:', error)
      return Response.json({ error: 'DB error' }, { status: 500 })
    }

    console.log(`✅ Donation received: ₹${donationEvent.amount} for creator ${creatorId}`)
    return Response.json({ status: 'ok' })

  } catch (err) {
    console.error('Webhook error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
