# Maintaining this profile

The visible profile is one continuous white SVG canvas, following the first white layout in commit `321c283`. Identity, the contribution ring, research directions, live activity, experiment evidence and the curved baseline share one page. It is not a collection of image cards interleaved with Markdown.

The visual system uses white, ice blue, silver grey and faint lavender. Low-contrast lens arcs, particles and slow orbital motion create depth without dark panels. Desktop uses the original two-column composition; mobile reflows into one column. Both have static reduced-motion alternatives.

## Content, data and source links

- `profile.config.json`: identity, research directions, selected project, dated experiment snapshot, contacts and curated contribution descriptions.
- `data/activity.json`: normalized public GitHub snapshot with verified PR states, upstream repository totals, project counts and latest project commit.
- `scripts/data.mjs`: collects and verifies public GitHub activity. Merged, open and closed-without-merge are separate buckets. Private, own-repository and inconsistent results are rejected. Complete pagination is required, with a 1,000-result safety limit per search bucket.
- `scripts/canvas.mjs`: lays out the full profile in desktop/mobile and animated/static variants. Its height follows its content; it never renders a dashboard as independent cards.
- `scripts/readme.mjs`: embeds one responsive picture, a slim row of native navigation/contact links and a collapsible complete text version.
- `scripts/update-profile.mjs`: completes collection and validation before publishing generated output. API or rendering failures preserve the previous profile. Asset filenames contain content hashes, with one previous generation retained for cached readers.

GitHub embeds SVGs as images: their internal links are not clickable regions in the README. All usable project, architecture, experiment, reproduction, PR, search and contact links are ordinary Markdown below the canvas and in **Text version, sources & contribution links**. The text version preserves the full experimental context, limitations, PR states and source URLs for accessibility and inspection.

Public projects exclude this profile, private repositories, ordinary forks, empty repositories and archived/disabled repositories. Upstream PRs exclude repositories owned by the profile owner. Repository stars and diff size are not presented as personal impact. Motion is illustrative, not a live activity feed.

Research metrics are a separately dated, manually curated snapshot. Automatic GitHub refreshes do not update experimental claims. The displayed CH-SIMS results are development VALID, mean ± sample SD over three seeds; final TEST remains independent. Preserve matched controls, negative results and open research gates alongside the numbers.

## Updating

Node.js 22 or newer is sufficient; there are no runtime dependencies.

```sh
node --test
node scripts/update-profile.mjs --offline
node scripts/update-profile.mjs
```

`--offline` deterministically rebuilds the README and four SVG variants from saved public data. An online run fetches the current activity; `GITHUB_TOKEN` is optional locally, otherwise GitHub's anonymous API limit applies. Never place credentials in configuration or generated assets.

The **Refresh and validate profile** workflow validates pull requests and relevant pushes. It refreshes every six hours, on manual dispatch, and after configuration/generator changes. Only the refresh job has write permission. Schedules are best effort and may be disabled by GitHub after prolonged inactivity. Unchanged public data keeps its previous timestamp and asset URLs. The maintenance job commits only README, the public snapshot and generated assets.

After a design/content change, run tests and an offline rebuild, inspect the complete desktop and mobile canvases, then commit configuration, source, README and generated output together. Check text bounds, numeric legibility and line overlap rather than checking only the header. A change to collected fields may require an online refresh.

## Sources and layout history

The original white profile in `321c283` was inspected as both source and a rendered full-page image for this revision. Its large identity, circular readout, particle wave, shared whitespace and two-column structure inform the current canvas. The dark summary/research image modules from `0ed1450` have been retired. The earliest illustration can be recovered from Git history.

Research claims come from the public [architecture](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/ARCHITECTURE.md), [experiment record](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/EXPERIMENTS.md) and [reproduction protocol](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/REPRODUCING.md). The completed registered study contains 21 fusion fits plus six branch selection/refit runs.

The content structure was informed by [Andrej Karpathy](https://github.com/karpathy), [Hamel Husain](https://github.com/hamelsmu) and [Simon Willison](https://github.com/simonw), reviewed on 2026-10-15. Their biographies, achievements and assets are not reused. The visual direction follows the user's request for the white, open spatial atmosphere of *Interstellar*, using original vector artwork.
