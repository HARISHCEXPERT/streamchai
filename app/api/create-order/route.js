import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function POST(request) {
  try {
    const { amount, creatorId, donorName, message } = await request.json()

    if (!amount || !creatorId) {
      return Response.json({ error: 'Missing amount or creatorId' }, { status: 400 })
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise mein
      currency: 'INR',
      notes: {
        creator_id: creatorId,
        donor_name: donorName || 'Anonymous',
        message: message || '',
      },
    })

    return Response.json({ orderId: order.id, amount: order.amount })

  } catch (err) {
    console.error('Create order error:', err)
    return Response.json({ error: 'Order creation failed' }, { status: 500 })
  }
}