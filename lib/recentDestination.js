import { cookies } from 'next/headers';

/** Returns the most recently visited destination slug, or null if not set. Server-side only. */
export async function getRecentDestinationSlug() {
  const cookieStore = await cookies();
  return cookieStore.get('recentDestination')?.value ?? null;
}
