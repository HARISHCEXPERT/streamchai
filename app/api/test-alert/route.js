import { supabaseAdmin } from '@/lib/supabase'
import { buildDonationEvent } from '@/lib/donations'

export async function POST(request) {
  try {
    const { creatorId } = await request.json()

    if (!creatorId) {
      return Response.json({ error: 'Missing creatorId' }, { status: 400 })
    }

    const db = supabaseAdmin()

    const { data: creator } = await db
      .from('creators')
      .select('tiers')
      .eq('id', creatorId)
      .single()

    // Fake payment for testing
    const fakePayment = {
      id: `test_${Date.now()}`,
      amount: 10000, // ₹100 in paise
      currency: 'INR',
    }

    const donationEvent = buildDonationEvent({
      creatorId,
      payment: fakePayment,
      message: 'Bhai ekdum mast stream hai! Keep it up 🔥',
      donorName: 'Test Viewer',
      tiers: creator?.tiers || null,
    })

    const { error } = await db.from('donations').insert({
      ...donationEvent,
      is_test: true,
    })

    if (error) {
      return Response.json({ error: 'DB error' }, { status: 500 })
    }

    return Response.json({ status: 'ok', message: 'Test alert sent!' })
  } catch (err) {
    console.error('Test alert error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
