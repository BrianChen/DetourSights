import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const EARTH_RADIUS_MILES = 3958.8;
const MAX_DISTANCE_MILES = 400;
const MIN_RESULTS = 5;
const MAX_RESULTS = 10;

// Allowlist — prevents unsupported type values from reaching any DB logic
const ALLOWED_TYPES = new Set(['destination']);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',  // prevent MIME sniffing
  'Cache-Control': 'no-store',           // don't cache potentially stale geo data
};

function haversineDistanceMiles(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Validates the Origin header to restrict API access to this app only.
 * If Origin is present it must match the configured app URL.
 * Same-origin GET requests may omit Origin (browser-dependent), so
 * absent Origin is allowed — but a mismatched Origin is always rejected.
 */
function isAllowedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // same-origin fetch may omit Origin header

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null);

  return appUrl !== null && origin === appUrl;
}

function error(message, status) {
  return NextResponse.json({ error: message }, { status, headers: SECURITY_HEADERS });
}

export async function GET(request) {
  // ── Origin check — reject cross-origin callers ────────────────────────────
  if (!isAllowedOrigin(request)) {
    return error('Forbidden', 403);
  }

  // ── Parse & validate query params ─────────────────────────────────────────
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type');
  if (!type || !ALLOWED_TYPES.has(type)) {
    return error('Invalid or missing param: type', 400);
  }

  const lat = parseFloat(searchParams.get('lat'));
  if (isNaN(lat) || lat < -90 || lat > 90) {
    return error('Invalid param: lat must be a number between -90 and 90', 400);
  }

  const long = parseFloat(searchParams.get('long'));
  if (isNaN(long) || long < -180 || long > 180) {
    return error('Invalid param: long must be a number between -180 and 180', 400);
  }

  // excludeId is optional — must be a positive integer if provided
  const rawExcludeId = searchParams.get('excludeId');
  const excludeId = rawExcludeId !== null ? parseInt(rawExcludeId, 10) : null;
  if (excludeId !== null && (isNaN(excludeId) || excludeId <= 0)) {
    return error('Invalid param: excludeId must be a positive integer', 400);
  }

  // ── Query & compute ───────────────────────────────────────────────────────
  if (type === 'destination') {
    const all = await prisma.destination.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        coverImageUrl: true,
        latitude: true,
        longitude: true,
      },
    });

    const withDistance = all
      .filter((d) => d.id !== excludeId && d.latitude != null && d.longitude != null)
      .map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        country: d.country,
        coverImageUrl: d.coverImageUrl,
        distanceMiles: haversineDistanceMiles(lat, long, d.latitude, d.longitude),
      }))
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    const withinRadius = withDistance.filter((d) => d.distanceMiles <= MAX_DISTANCE_MILES);
    const results =
      withinRadius.length >= MIN_RESULTS ? withinRadius : withDistance.slice(0, MIN_RESULTS);

    return NextResponse.json(results.slice(0, MAX_RESULTS), { headers: SECURITY_HEADERS });
  }
}
