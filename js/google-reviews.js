/*
 * SyncAir Google Reviews widget (GitHub Pages / static version).
 * Reads pre-fetched reviews.json committed by the GitHub Actions workflow
 * (see .github/workflows/update-reviews.yml) instead of calling a live
 * backend. No API key is ever exposed to the browser.
 */
(async function () {
  const summary = document.getElementById('reviewSummary');
  const grid = document.getElementById('reviewGrid');
  const link = document.getElementById('googleReviewsLink');
  if (!summary || !grid) return;

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const stars = (rating) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  };

  try {
    // reviews.json lives at the site root, generated daily by GitHub Actions.
    const response = await fetch('reviews.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Reviews file unavailable');
    const data = await response.json();
    if (data.googleMapsUri && link) link.href = data.googleMapsUri;

    const rating = Number(data.rating || 0).toFixed(1);
    const count = Number(data.userRatingCount || 0);
    summary.innerHTML = `<div class="review-summary-inner"><div class="review-rating">${esc(rating)} <span>${stars(rating)}</span></div><div class="review-count">Based on ${esc(count)} Google reviews</div></div>`;

    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    if (!reviews.length) throw new Error('No reviews returned');
    grid.innerHTML = reviews.slice(0, 6).map(r => {
      const author = esc(r.authorName || 'Google reviewer');
      const text = esc(r.text || '');
      const date = esc(r.relativePublishTimeDescription || '');
      const cardRating = Number(r.rating || 0);
      return `<div class="col-md-6 col-lg-4"><article class="review-card"><div class="review-stars" aria-label="${cardRating} out of 5 stars">${stars(cardRating)}</div><h3>${author}</h3><div class="review-date">${date}</div><p class="review-text">${text || 'This customer left a Google rating without written comments.'}</p></article></div>`;
    }).join('');
  } catch (err) {
    summary.innerHTML = `<div class="review-summary-inner"><strong>Google Reviews</strong><p>Reviews could not be loaded right now. Please see our Google profile for the latest customer feedback.</p></div>`;
    grid.innerHTML = '';
  }
})();
