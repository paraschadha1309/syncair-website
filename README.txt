
Before publishing:
- This site is hosted on GitHub Pages (static hosting only — no PHP/server backend).
- Google Reviews are fetched by a scheduled GitHub Actions workflow
  (.github/workflows/update-reviews.yml), which writes reviews.json to the
  site root once a day. js/google-reviews.js reads that file — it does not
  call the Google API directly from the browser.
- In the GitHub repo, add these as repository secrets under
  Settings → Secrets and variables → Actions:
    GOOGLE_PLACES_API_KEY
    GOOGLE_PLACE_ID
- After adding the secrets, run the workflow once manually
  (Actions tab → "Update Google Reviews" → "Run workflow") to generate
  the first reviews.json before publishing.
- Confirm your canonical domain in the page metadata/sitemap.
