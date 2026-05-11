import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1C2B3A 0%, #2a3f56 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#E8602C',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            padding: '0 80px',
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#E8602C',
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            DetourSights
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Discover Things to Do
          </div>
          <div
            style={{
              fontSize: 26,
              color: 'rgba(255,255,255,0.60)',
              letterSpacing: 0.5,
            }}
          >
            1,000+ places · 91 destinations worldwide
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
