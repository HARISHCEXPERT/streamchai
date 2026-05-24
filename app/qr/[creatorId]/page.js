'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

export default function QRPage({ params }) {
  const { creatorId } = params
  const [creator, setCreator] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    supabase
      .from('creators')
      .select('name, alert_settings')
      .eq('id', creatorId)
      .maybeSingle()
      .then(async ({ data }) => {
        setCreator(data)
        const donateUrl = `${window.location.origin}/donate/${creatorId}`
        const accent = data?.alert_settings?.accentColor || '#f97316'
        const dataUrl = await QRCode.toDataURL(donateUrl, {
          width: 300,
          margin: 2,
          color: { dark: accent, light: '#0a0a14' },
          errorCorrectionLevel: 'H',
        })
        setQrDataUrl(dataUrl)
      })
  }, [creatorId])

  const accent = creator?.alert_settings?.accentColor || '#f97316'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {qrDataUrl && (
        <div style={{
          background: '#0a0a14',
          border: `3px solid ${accent}`,
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'center',
          animation: 'pulse 3s ease infinite',
        }}>
          <img src={qrDataUrl} alt="Donation QR" style={{ width: '200px', height: '200px', borderRadius: '10px', display: 'block' }} />
          <div style={{ color: accent, fontWeight: '800', fontSize: '18px', marginTop: '14px' }}>
            🍵 Chai Pilao
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
            {creator?.name || 'Streamer'}
          </div>
        </div>
      )}
      <style>{`
        body { background: transparent !important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 30px ${accent}44; }
          50%       { box-shadow: 0 0 60px ${accent}88; }
        }
      `}</style>
    </div>
  )
}
