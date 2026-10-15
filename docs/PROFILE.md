# Maintaining this profile

The profile combines a restrained deep-space visual system with inspectable research and open-source evidence. The two SVG modules use warm white type, amber light, a procedural gravitational-lens motif and slow signal motion. Text, tables and links remain native Markdown. Desktop and mobile layouts have static reduced-motion alternatives.

## Content and data

- `profile.config.json`: identity, research directions, selected projects, dated experiment snapshot, contact links and curated contribution descriptions.
- `data/activity.json`: normalized public GitHub snapshot, verified PR states, upstream repository totals, public original project count and latest selected-project commit.
- `scripts/data.mjs`: fetches public GitHub data. Upstream means public PRs authored by this account outside its own repositories. Merged, open and closed-without-merge are separate buckets; every PR is verified against its current detail endpoint. Private, own-repository and inconsistent results are rejected. Complete pagination is required, with a 1,000-result safety limit per search bucket.
- `scripts/readme.mjs`: renders research records and activity as readable Markdown with direct source links.
- `scripts/summary.mjs`: renders the compact activity header and research model overview. Signal motion illustrates a workflow; it does not imply new work or a live feed.
- `scripts/update-profile.mjs`: collects, renders and publishes the local output bundle after the data and content validate. An API or rendering failure preserves the previously generated profile. Image names contain content hashes; one previous generation remains available for cached README copies.

The project count excludes this profile, ordinary forks, private/archived/disabled repositories and empty repositories. It is not a count of papers, deployed products or model releases. Repository totals and each table cell link back to scoped GitHub searches. Diff line totals are deliberately omitted because they do not measure engineering impact or authorship.

Research metrics are a separately dated, manually curated snapshot. Automatic GitHub refreshes do not update or reinterpret experimental results. Keep split, seed count, matched controls, limitations and source links alongside numbers. Do not describe an open/closed PR as merged, a fork as original research, or an inconclusive experiment as a performance gain.

## Updating

Node.js 22 or newer is sufficient; no runtime packages are required.

```sh
node --test
node scripts/update-profile.mjs --offline  # Rebuild from the saved public snapshot
node scripts/update-profile.mjs            # Fetch current public GitHub data
```

For an online local run, `GITHUB_TOKEN` is optional; otherwise the public anonymous API limit applies. Never place a token in the configuration. The workflow uses the repository-scoped GitHub token.

The **Refresh and validate profile** workflow validates on pull requests and relevant pushes to main. It refreshes every six hours, on manual dispatch, and after configuration/generator changes. Its write permission is restricted to the refresh job; pull-request validation stays read-only. Scheduled runs are best effort, and GitHub can disable a schedule after prolonged repository inactivity. API failures stop generation rather than publishing fabricated zero counts. When public data has not changed, the previous snapshot timestamp and image paths remain stable.

After editing content, run tests and an offline rebuild, then commit configuration, README and generated assets together. Changes to the collector may require a fresh online snapshot. The maintenance job commits only README, the normalized snapshot and generated assets. Generated commits do not recursively trigger the workflow.

## Sources and references

Research claims and the dated experiment table come from the public [architecture](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/ARCHITECTURE.md), [experiment record](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/EXPERIMENTS.md) and [reproduction protocol](https://github.com/MaYangle/Multimodal-Sentiment-Fusion/blob/main/docs/REPRODUCING.md). The registered study includes 21 fusion fits plus six branch selection/refit runs; all displayed MAEs are development VALID, not final TEST.

The structure was informed by public profiles reviewed on 2026-10-15: [Andrej Karpathy](https://github.com/karpathy), [Hamel Husain](https://github.com/hamelsmu) and [Simon Willison](https://github.com/simonw). Their biographies, achievements and assets are not reused. The visual direction follows the user's request for the spatial atmosphere of *Interstellar*, using original vector artwork rather than film stills or copied assets.

The earlier dashboard's useful ideas are retained: public-data provenance, explicit PR outcomes, periodic refresh, linked evidence, content-hashed images and reduced-motion support. Its empty showcase cards and diff-size impact panels remain in Git history.
