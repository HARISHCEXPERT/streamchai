# 🍵 StreamChai

**Live UPI Alerts for Indian Streamers**

Turn UPI payments into live stream interactions. Viewers donate ₹1 to ₹500+, their message pops up live on stream.

---

## Setup — Step by Step

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase setup

1. Go to [supabase.com](https://supabase.com) → New project
2. Go to SQL Editor → paste contents of `supabase-schema.sql` → Run
3. Go to Project Settings → API → copy:
   - Project URL
   - anon public key
   - service_role key

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Enable Supabase Realtime

In Supabase dashboard:
- Go to Database → Replication
- Enable `donations` table for realtime

### 5. Run locally

```bash
npm run dev
```

App runs at `http://localhost:3000`

### 6. Expose webhook with Ngrok

```bash
# Install ngrok from ngrok.com
ngrok http 3000
```

Copy the `https://xxxx.ngrok.io` URL.

### 7. Razorpay webhook setup

1. Razorpay Dashboard → Settings → Webhooks → Add New
2. Webhook URL: `https://xxxx.ngrok.io/api/webhook/razorpay`
3. Enable event: `payment.captured`
4. Copy the Webhook Secret → paste in `.env.local` as `RAZORPAY_WEBHOOK_SECRET`

### 8. Creator setup

1. Open `http://localhost:3000/dashboard`
2. Enter your channel name → Get Started
3. Copy the **OBS Overlay URL**
4. Copy the **Webhook URL** → paste in Razorpay (done above)
5. Add your **Razorpay Payment Link** in dashboard (create at Razorpay → Payment Links → Create)

### 9. OBS setup

1. OBS → Sources → Add → Browser Source
2. URL: paste your Overlay URL
3. Width: `1920`, Height: `1080`
4. Custom CSS: `body { background: transparent !important; }`
5. ✅ Shutdown source when not visible
6. ✅ Refresh browser when scene becomes active

### 10. Test it!

Click **"Send Test Alert"** in dashboard. You should see a popup in OBS within 2 seconds.

---

## Donation Flow

```
Viewer scans QR / opens donation link
↓
Fills name + message + amount
↓
Razorpay payment page
↓
Payment captured webhook fires
↓
Supabase insert → Realtime trigger
↓
OBS overlay popup (under 2 seconds)
↓
Auto dismiss → next in queue
```

---

## Donation Tiers (Default)

| Amount | Chars | Display Time | TTS |
|--------|-------|--------------|-----|
| ₹1–50 | 30 | 5 sec | ❌ |
| ₹51–200 | 120 | 15 sec | ❌ |
| ₹201–500 | 200 | 20 sec | ✅ |
| ₹500+ | 300 | 30 sec | ✅ |

---

## Tech Stack

- **Frontend + API**: Next.js 14
- **Database + Realtime**: Supabase
- **Payments**: Razorpay
- **Hosting**: Vercel
- **OBS**: Browser Source URL
