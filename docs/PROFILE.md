# Maintaining this profile

The public README is rendered as one animated SVG canvas. It brings together a luminous planet, cloud layers, moving orbit particles, a multimodal research flow, live GitHub contribution data and automatically discovered projects. Desktop and mobile compositions share the same vector scene. A static version is selected for visitors who prefer reduced motion. The planet, clouds and particles move as vector layers; all counts and project entries come from GitHub data.

## Updating and automatic project discovery

`profile.config.json` holds the introduction, selected research project, three research directions and the dated experiment record. The `discovery` setting collects eligible original public repositories owned by `MaYangle`; newly found projects are sorted by most recent update and are added to the complete canvas. The profile repository, private repositories, forks, empty, archived or disabled repositories are excluded. Add a short name to `discovery.exclude` to hide an automatic entry, or add a project under `projects` to keep it first and give it curated text and documentation links.

Repositories can provide a project cover at one of these exact paths: `.github/profile-cover.png`, `.github/profile-cover.jpg`, `assets/profile-cover.png` or `assets/profile-cover.jpg`. Covers are verified as PNG/JPEG images before they are embedded. Small covers appear in a project's visual area. If a repository has no eligible image, animated orbit particles fill that area in the profile's house style. No image-generation key or manual edit to the main README is required.

The collector also refreshes current public upstream pull requests and their merged, open and closed-without-merge states. It checks the selected repositories' latest commits. Each PR state is verified against GitHub's current PR record. Public projects exclude this profile repository. Upstream contributions exclude repositories owned by MaYangle. Incomplete pagination, private PRs, inconsistent status counts, invalid cover data or non-404 API failures stop the refresh and preserve the previous profile. Search categories have a complete-pagination limit of 1,000 results.

Research metrics remain a separately dated, curated snapshot. Automatic repository and PR refreshes do not change research numbers. The displayed CH-SIMS v2.0 results are development VALID, mean ± sample SD over three seeds; final TEST remains independent. Matched controls, negative results and open research gates stay alongside the metrics.

## Local commands

Node.js 22 or newer is sufficient; the renderer has no runtime packages.

```sh
node --test
node scripts/update-profile.mjs --offline
node scripts/update-profile.mjs
```

`--offline` rebuilds from `data/activity.json` and images already embedded in the generated SVG. New or changed repository covers require an online refresh. GitHub Actions runs the collector every six hours, on manual dispatch and when relevant source or configuration files change. GitHub schedules are best effort. The refresh job uses the repository-scoped `GITHUB_TOKEN`; no personal token or external image service is required.

The animation uses low-frequency CSS motion on SVG paths, particles, cloud layers and the planetary orbit. The static variant keeps the same layout and artwork. Prefer functional geometry and restrained particle motion over glow filters and flashing highlights; GitHub may sanitize unsupported SVG features.

## Source links and complete text

SVG subregions are not independently clickable when the canvas is embedded as an image. The README therefore places project, architecture, experiment, reproduction, merged-contribution and contact links below the canvas. **Text version, sources & contribution links** expands to show all discovered project metadata and documentation, all PR records and their current states, experiment context, API refresh time and direct links.

See the live public [architecture](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/ARCHITECTURE.md), [experiment record](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/EXPERIMENTS.md) and [reproduction protocol](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/REPRODUCING.md) for research details. The experiment snapshot is as of 2026-10-14; it includes 21 fusion fits plus six branch-selection/refit runs.

The earlier profile used a complete white canvas with a contribution ring, particle wave and two-column content. This version uses that continuous composition, with vector orbit and cloud motion built into the whole page. The white cosmic art direction was chosen by the user; data labels and links remain generated from verifiable content rather than baked into an illustration.
