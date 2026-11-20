# Operator screenshot plan

Serve the `app/` directory at `http://localhost:8080/` and capture each URL at **1280 × 900**. The app sets `window.__shotReady = true` after its data and requested view are rendered. Each capture should be saved at the matching name, JPEG, 1280 × 900 or smaller (within the gate’s size limit).

1. `1-checklist.jpg` — `http://localhost:8080/`
2. `2-detail.jpg` — `http://localhost:8080/?trophy=30`
3. `3-roadmap.jpg` — `http://localhost:8080/?view=roadmap`
4. `4-filters.jpg` — `http://localhost:8080/?kind=activities&spoilers=on`

The current repo intentionally contains no screenshots because the recorded builder session is not permitted to launch a browser or capture images. The operator should place the four real app renders in `screenshots/` before the final bundle.

Gate limits: each screenshot is at most 256 KiB, its long side is at most 1280 px, and its short side is at least 480 px.
