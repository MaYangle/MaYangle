# Maintaining this profile

The public profile is one responsive SVG canvas. The current art direction combines abstract scientific particles with a cinematic cosmic atmosphere: a dark blue celestial body, ice-white gravitational arcs, restrained gold accretion currents, a layered mist field and three modalities flowing into a shaded fusion core. The page stays white and open while the celestial silhouettes establish depth. Text, counters, project metadata and contribution records are generated independently from current public GitHub data.

## Artwork and motion

- `scripts/particle-art.mjs`: deterministic native SVG geometry. Fibonacci sphere points establish depth; particles follow curved paths with varied speeds and phases, and the wave layers sway independently. No image, script or filter is embedded in the scenes.
- `scripts/canvas.mjs`: composes the illustrations, live text and automatic project rows into desktop and mobile canvases. The canvas grows with the number of projects.
- `assets/art/cosmic-particles.json` and `scripts/prepare-particle-art.mjs`: archived photographic reference samples and their preparation tool. These are no longer read by the active renderer.

The four scenes together stay below 1,800 circle/ellipse elements; each scene stays below 110 KB of SVG source. This replaces the former 113,000-point reconstruction, which caused severe frame stalls in image-embedding tests. Background geometry and moving particles are all vectors. SVG animateMotion provides continuous trajectory interpolation; CSS rotates the sphere and sways the wave layers. This runs inside GitHub's embedded image without JavaScript. Visitors who prefer reduced motion receive a static composition through the README picture sources. Motion is decorative, not a live activity signal.

The wave and orbit panels are illustrations rather than repository screenshots. A project may instead provide its own cover; source links remain in the text version.

## Data and automatic project discovery

`profile.config.json` holds the identity, selected research project, research directions and dated experiment record. With `discovery.enabled`, original public repositories owned by MaYangle are discovered and added automatically, newest first after curated projects. The profile repository, forks, empty, archived, disabled and private repositories are excluded. `discovery.exclude` can hide a short repository name or an owner/repository pair. Entries in `projects` stay first and can include curated descriptions and documentation links.

The renderer prefers a repository-provided PNG/JPEG cover from `.github/profile-cover.png`, `.github/profile-cover.jpg`, `assets/profile-cover.png` or `assets/profile-cover.jpg`. Covers are checked before embedding and bounded in size. Missing or ineligible covers use procedural particle illustrations. New projects therefore require no manual changes to the main README and no new AI image-generation call.

`scripts/data.mjs` refreshes public upstream PRs, verifies their current merged/open/closed-without-merge states, and records selected projects' metadata and latest commits. Upstream PRs exclude MaYangle-owned repositories. Incomplete search pagination, private PRs, inconsistent status counts and non-404 API failures stop the refresh before replacing the published profile. Each search category has a complete-pagination limit of 1,000 records.

Research metrics are a separately dated, curated snapshot. Automatic GitHub refreshes do not change scientific claims. The CH-SIMS results are development VALID, mean ± sample SD over three seeds. The registered study includes 21 fusion fits plus six branch selection/refit runs; final TEST remains independent. Matched controls, negative results and pending research gates remain visible in the complete text version.

## Updates and verification

Node.js 22 or newer is sufficient for the normal renderer:

```sh
node --test
node scripts/update-profile.mjs --offline
node scripts/update-profile.mjs
```

`--offline` rebuilds from the saved public snapshot, procedural geometry, and previously embedded project covers. Changed or new repository covers require an online refresh. The **Refresh and validate profile** workflow validates pull requests and relevant pushes, then refreshes every six hours or on manual dispatch. GitHub schedules are best effort. Only the refresh job has write access, using its repository-scoped `GITHUB_TOKEN`.

Identical public data retains its timestamp and asset URLs. SVG filenames include content hashes, and the previous published generation remains available for cached README copies. Collection and rendering complete before any published file is replaced. The bot commits only README, the normalized snapshot and generated SVG assets.

Check the complete desktop and mobile compositions, the reduction in motion, typography bounds and animation performance after visual changes. Artwork tests guard deterministic geometry, scene complexity budgets, self-contained vectors and static alternatives. Compare browser paint traces in actual image-embedding mode; requestAnimationFrame cadence alone does not prove the image paints smoothly. Preview GIFs should use 20 ms frame delays rather than the former 300 ms slideshow.

## Links and sources

GitHub embeds the canvas as an image, so internal SVG subregions do not act as independently clickable links. Project, architecture, experiment, reproduction and contact links are available directly below it. **Text version, sources & contribution links** expands into all discovered projects, all upstream PR records and their current states, and the full experiment context and source URLs.

Research evidence comes from the public [architecture](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/ARCHITECTURE.md), [experiment record](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/EXPERIMENTS.md) and [reproduction protocol](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/REPRODUCING.md). The current experiment snapshot is dated 2026-10-14.
