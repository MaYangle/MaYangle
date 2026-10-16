# Maintaining this profile

The public profile is one responsive SVG canvas. Its cinematic artwork is reconstructed from the user's approved reference using sampled vector particles. The planet, luminous disk, cloud sea, mountains, explorer, fusion light streams and decorative landscape panels retain the source's composition and colour. Text, counters, project metadata and contribution records are generated independently from current public GitHub data.

## Artwork and motion

- `assets/art/cosmic-particles.json`: compact sampled colour palettes and point positions for four regions, with the source image's SHA-256 and crop metadata.
- `scripts/particle-art.mjs`: reconstructs the scenes from self-contained vector point strokes. No reference bitmap, external texture server, script or filter is embedded in these scenes.
- `scripts/prepare-particle-art.mjs`: a one-time preparation tool that uses Sharp to sample an approved reference. Regular profile rendering does not need Sharp or any other runtime package.
- `scripts/canvas.mjs`: composes the sampled scenes, live text and automatic project rows into desktop and mobile canvases. The canvas grows with the number of projects.

The sampled scenes use roughly 113,000 vector points for the current complete profile. Points are grouped by colour and motion phase to keep the SVG DOM manageable. Small asynchronous shifts preserve the source's shape. An additional 219 moving particles follow the gravitational rim, disk, clouds, multimodal streams and landscape panels, using SVG animateMotion with staggered phases and opacity envelopes. The fusion core emits an expanding light pulse. This motion runs inside an embedded SVG image without JavaScript. Visitors who prefer reduced motion receive an identical static composition through the README picture sources. Motion is decorative, not a live activity signal.

The cosmic landscape panels are illustrations rather than repository screenshots. A project may instead provide its own cover; source links remain in the text version.

## Data and automatic project discovery

`profile.config.json` holds the identity, selected research project, research directions and dated experiment record. With `discovery.enabled`, original public repositories owned by MaYangle are discovered and added automatically, newest first after curated projects. The profile repository, forks, empty, archived, disabled and private repositories are excluded. `discovery.exclude` can hide a short repository name or an owner/repository pair. Entries in `projects` stay first and can include curated descriptions and documentation links.

The renderer prefers a repository-provided PNG/JPEG cover from `.github/profile-cover.png`, `.github/profile-cover.jpg`, `assets/profile-cover.png` or `assets/profile-cover.jpg`. Covers are checked before embedding and bounded in size. Missing or ineligible covers use the same sampled particle artwork. New projects therefore require no manual changes to the main README and no new AI image-generation call.

`scripts/data.mjs` refreshes public upstream PRs, verifies their current merged/open/closed-without-merge states, and records selected projects' metadata and latest commits. Upstream PRs exclude MaYangle-owned repositories. Incomplete search pagination, private PRs, inconsistent status counts and non-404 API failures stop the refresh before replacing the published profile. Each search category has a complete-pagination limit of 1,000 records.

Research metrics are a separately dated, curated snapshot. Automatic GitHub refreshes do not change scientific claims. The CH-SIMS results are development VALID, mean ± sample SD over three seeds. The registered study includes 21 fusion fits plus six branch selection/refit runs; final TEST remains independent. Matched controls, negative results and pending research gates remain visible in the complete text version.

## Updates and verification

Node.js 22 or newer is sufficient for the normal renderer:

```sh
node --test
node scripts/update-profile.mjs --offline
node scripts/update-profile.mjs
```

`--offline` rebuilds from the saved public snapshot, the committed particle art samples, and previously embedded project covers. Changed or new repository covers require an online refresh. The **Refresh and validate profile** workflow validates pull requests and relevant pushes, then refreshes every six hours or on manual dispatch. GitHub schedules are best effort. Only the refresh job has write access, using its repository-scoped `GITHUB_TOKEN`.

Identical public data retains its timestamp and asset URLs. SVG filenames include content hashes, and the previous published generation remains available for cached README copies. Collection and rendering complete before any published file is replaced. The bot commits only README, the normalized snapshot and generated SVG assets.

Check the complete desktop and mobile compositions, the reduction in motion, typography bounds, source-colour fidelity and animation performance after visual changes. Artwork tests guard the approved source's light sky and dark cool planet, pure-vector output and static alternatives.

## Links and sources

GitHub embeds the canvas as an image, so internal SVG subregions do not act as independently clickable links. Project, architecture, experiment, reproduction and contact links are available directly below it. **Text version, sources & contribution links** expands into all discovered projects, all upstream PR records and their current states, and the full experiment context and source URLs.

Research evidence comes from the public [architecture](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/ARCHITECTURE.md), [experiment record](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/EXPERIMENTS.md) and [reproduction protocol](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/REPRODUCING.md). The current experiment snapshot is dated 2026-10-14.
