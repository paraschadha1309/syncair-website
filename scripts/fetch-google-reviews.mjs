/*
 * SyncAir — fetch Google reviews and write them to a static JSON file
 * at the site root (reviews.json), which js/google-reviews.js reads.
 *
 * Run with: node scripts/fetch-google-reviews.mjs
 * Requires Node 18+ (built-in fetch).
 *
 * Env vars required:
 *   GOOGLE_PLACES_API_KEY
 *   GOOGLE_PLACE_ID
 */

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
const placeId = process.env.GOOGLE_PLACE_ID;

if (!apiKey || !placeId) {
  console.error('Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID env vars.');
  process.exit(1);
}

const OUTPUT_PATH = new URL('../reviews.json', import.meta.url);

async function main() {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews,googleMapsUri'
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Google Places API error ${response.status}: ${body}`);
  }

  const data = await response.json();

  const out = {
    rating: data.rating ?? null,
    userRatingCount: data.userRatingCount ?? 0,
    googleMapsUri: data.googleMapsUri ?? null,
    reviews: (data.reviews ?? []).map((review) => ({
      rating: review.rating ?? 0,
      text: review.text?.text ?? '',
      authorName: review.authorAttribution?.displayName ?? 'Google reviewer',
      authorUri: review.authorAttribution?.uri ?? null,
      publishTime: review.publishTime ?? null,
      googleMapsUri: review.googleMapsUri ?? data.googleMapsUri ?? null
    }))
  };

  const fs = await import('node:fs/promises');
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${out.reviews.length} reviews to ${OUTPUT_PATH.pathname}`);
}

main().catch((err) => {
  console.error('Failed to fetch Google reviews:', err.message);
  process.exit(1);
});
