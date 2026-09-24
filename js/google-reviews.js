/*
 * SyncAir Google Reviews widget (GitHub Pages / static version).
 * Cross-browser compatible continuous smooth ticker for Chrome, Firefox, Safari, & Edge.
 */
(async function () {
  const summary = document.getElementById('reviewSummary');
  const grid = document.getElementById('reviewGrid');
  const link = document.getElementById('googleReviewsLink');
  const prevBtn = document.getElementById('reviewPrev');
  const nextBtn = document.getElementById('reviewNext');
  if (!summary || !grid) return;

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const stars = (rating) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  };

  function setupCarousel() {
    if (!prevBtn || !nextBtn || !grid) return;
    
    void grid.offsetWidth;
    grid.scrollLeft = 0;

    if (grid.scrollWidth <= grid.clientWidth) return;

    const scrollAmount = () => Math.min(320, grid.clientWidth * 0.9);
    let animationId = null;
    let isPaused = false;
    let resumeTimer = null;
    
    const speed = 0.6; // Smooth fractional speed works perfectly now across all browsers
    let direction = 1;   
    let currentScroll = 0; // Independent float tracker to bypass Firefox/Safari sub-pixel rounding bugs

    const stopAuto = () => {
      isPaused = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (resumeTimer) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };

    const startAuto = () => {
      if (animationId) return;
      isPaused = false;
      currentScroll = grid.scrollLeft; // Sync with actual position

      const step = () => {
        if (isPaused) return;

        const maxScroll = grid.scrollWidth - grid.clientWidth;

        // Bounce check using our memory tracker
        if (currentScroll >= maxScroll - 2 && direction === 1) {
          direction = -1;
        } else if (currentScroll <= 2 && direction === -1) {
          direction = 1;
        }

        currentScroll += speed * direction;
        grid.scrollLeft = currentScroll; // Force assignment to browser element

        animationId = requestAnimationFrame(step);
      };

      animationId = requestAnimationFrame(step);
    };

    const delayedResume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        startAuto();
      }, 3000);
    };

    prevBtn.addEventListener('click', () => {
      stopAuto();
      grid.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
      setTimeout(() => { currentScroll = grid.scrollLeft; }, 400); // Sync tracker after manual slide
      delayedResume();
    });

    nextBtn.addEventListener('click', () => {
      stopAuto();
      grid.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
      setTimeout(() => { currentScroll = grid.scrollLeft; }, 400);
      delayedResume();
    });

    // Desktop hover & Mobile touch listeners
    grid.addEventListener('mouseenter', stopAuto);
    grid.addEventListener('mouseleave', delayedResume);
    grid.addEventListener('touchstart', stopAuto, { passive: true });
    grid.addEventListener('touchend', delayedResume, { passive: true });
    grid.addEventListener('touchcancel', delayedResume, { passive: true });

    if (!grid.matches(':hover')) {
      startAuto();
    } else {
      delayedResume();
    }
  }

  try {
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
      return `<article class="review-card"><div class="review-stars" aria-label="${cardRating} out of 5 stars">${stars(cardRating)}</div><h3>${author}</h3><div class="review-date">${date}</div><p class="review-text">${text || 'This customer left a Google rating without written comments.'}</p></article>`;
    }).join('');

    // Buffer to ensure DOM elements are fully painted before initialization
    setTimeout(() => {
      setupCarousel();
    }, 250);

  } catch (err) {
    summary.innerHTML = `<div class="review-summary-inner"><strong>Google Reviews</strong><p>Reviews could not be loaded right now. Please see our Google profile for the latest customer feedback.</p></div>`;
    grid.innerHTML = '';
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
  }
})();