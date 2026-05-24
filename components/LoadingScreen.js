export default function LoadingScreen({ text = "Setting up your stream" }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>{`
              .sc-steam {
                fill: none;
                stroke: #f97316;
                stroke-width: 3;
                stroke-linecap: round;
                opacity: 0;
              }
              .sc-s1 { animation: scSteam 2.4s ease-in-out infinite; }
              .sc-s2 { animation: scSteam 2.4s ease-in-out 0.4s infinite; }
              .sc-s3 { animation: scSteam 2.4s ease-in-out 0.8s infinite; }
              @keyframes scSteam {
                0%   { opacity: 0; transform: translateY(0px); }
                20%  { opacity: 0.9; }
                80%  { opacity: 0.3; transform: translateY(-28px); }
                100% { opacity: 0; transform: translateY(-38px); }
              }
              .sc-hb {
                fill: none;
                stroke: #f97316;
                stroke-width: 2.5;
                stroke-linecap: round;
                stroke-linejoin: round;
                stroke-dasharray: 120;
                stroke-dashoffset: 120;
                animation: scDraw 1.8s ease-in-out infinite;
              }
              @keyframes scDraw {
                0%   { stroke-dashoffset: 120; opacity: 1; }
                70%  { stroke-dashoffset: 0; opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: 0; }
              }
              .sc-dot {
                fill: #f97316;
                animation: scBounce 1.2s ease-in-out infinite;
              }
              .sc-d2 { animation-delay: 0.2s; }
              .sc-d3 { animation-delay: 0.4s; }
              @keyframes scBounce {
                0%, 100% { transform: translateY(0); opacity: 0.3; }
                50%       { transform: translateY(-5px); opacity: 1; }
              }
            `}</style>
          </defs>

          {/* Steam */}
          <g transform="translate(52, 58)">
            <path className="sc-steam sc-s1" d="M8 0 C6 -8 12 -14 8 -22" transform-origin="8 0"/>
            <path className="sc-steam sc-s2" d="M20 0 C18 -10 24 -16 20 -26" transform-origin="20 0"/>
            <path className="sc-steam sc-s3" d="M32 0 C34 -8 28 -14 32 -22" transform-origin="32 0"/>
          </g>

          {/* Cup */}
          <g transform="translate(50, 72)">
            <rect fill="#f97316" x="0" y="0" width="44" height="7" rx="2"/>
            <path fill="#f97316" d="M2 7 L7 44 L37 44 L42 7 Z"/>
            <rect fill="#c2500a" x="7" y="16" width="26" height="3" rx="1.5" opacity="0.4"/>
            <rect fill="#c2500a" x="-3" y="44" width="50" height="6" rx="3"/>
          </g>

          {/* Heartbeat */}
          <g transform="translate(74, 100)">
            <polyline className="sc-hb" points="0,0 10,0 14,-14 18,14 22,-8 26,8 30,0 50,0"/>
          </g>
        </svg>

        {/* Brand */}
        <div style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          fontWeight: '800',
          color: '#f1f5f9',
          marginTop: '-8px',
        }}>
          Stream<span style={{ color: '#f97316' }}>Chai</span>
        </div>

        {/* Text */}
        <div style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          color: '#475569',
          marginTop: '10px',
        }}>
          {text}
        </div>

        {/* Dots */}
        <svg width="48" height="16" viewBox="0 0 48 16" style={{ marginTop: '8px' }}>
          <circle className="sc-dot" cx="8" cy="8" r="3"/>
          <circle className="sc-dot sc-d2" cx="24" cy="8" r="3"/>
          <circle className="sc-dot sc-d3" cx="40" cy="8" r="3"/>
        </svg>
      </div>
    </div>
  )
}
