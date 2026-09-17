# 2026-09-17 revision verification

- Source: adsdb-prd/xiiid_test2 main, base commit 2b5bfa4c943bac3aa91d01cd3fd18d70bb536ff7.
- Original G: ZIP was unavailable; this revision uses the repository source.
- Build succeeded using /xiiid_test2/ deployment prefix.
- Desktop 1440px: 3 partner rows; header, content, wall and footer bounded to 1320px; no horizontal page overflow.
- Mobile 390px: single-column Blog, enlarged header logo, no horizontal page overflow on home or Token page.
- Header Token and community Token links navigate to token.html in the same tab.
- Token-to-home News anchor resolves after Nuxt hydration.
- OPicUP and EOSaber anchors match requested URLs.
- Medium RSS fetched successfully; latest 3 posts are 2026-09-01, 2026-08-24, 2026-07-31.
- News/Blog and Partners/Team transition visually inspected in browser.
- Main page browser console had no captured errors during inspection.
- Live deployment requires GitHub authentication and subsequent workflow verification.
