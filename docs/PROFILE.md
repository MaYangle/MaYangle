# Maintaining this profile

The profile is a small data-driven project. Public GitHub data is fetched, normalized, and rendered into the README and animated SVG assets. The browser plays the animation inside the SVG image; GitHub Actions refreshes the underlying data.

## Updates

The **Refresh profile** workflow runs every six hours, on changes to the configuration or generator, and through its **Run workflow** button. GitHub schedules are best effort and can be delayed. GitHub may disable scheduled workflows after 60 days without repository activity; the workflow can be re-enabled from the Actions page. No personal token or external image server is required: the workflow uses its repository-scoped `GITHUB_TOKEN`.

The generator updates each dashboard module independently:

- The total number of merged public PRs to repositories outside this account.
- The spotlight PR, its current status, and the upstream repository's stars and forks.
- Public projects, their descriptions, and the project count.
- The project, merged-contribution, showcase, impact, and activity modules.
- Native README links for the profile, each PR spotlight, project, contribution group, showcase area, impact panel, and recent-work card.

The primary spotlight prefers merged upstream PRs, ordered by merge date; stars only break date ties. A separate **Recently resolved PR** panel selects a closed PR, or another merged PR when no closed PR exists. Open PRs awaiting a response are not used in that panel. Current PR status is checked against the pull-request endpoint before publication. The candidate pool is the latest 100 open, merged, and closed-unmerged public PRs. Repository stars always describe the upstream repository, not personal ownership.

Contribution records include up to three upstream codebases, show up to six merged PRs and four closed-unmerged PRs per codebase, and label each record's outcome. Exact merged and closed counts are fetched separately for each codebase. PRs merged into repositories owned by MaYangle are excluded from the **upstream merged** total.

## Adding projects

New, non-empty public repositories owned by MaYangle are discovered automatically. The profile repository, archived/disabled repositories, and ordinary forks are excluded. Projects listed in `projects.include` can include a working fork of a team project. Included entries appear first; other projects are ordered by recent pushes.

Edit `profile.config.json` to:

- Change the introduction, name, contact links, or tagline.
- Give a project a curated name or description through `projects.include`.
- Hide a repository with `projects.exclude`.
- Change the number of visible projects with `projects.maxVisible` (default: three). Additional projects remain included in the gauge count.
- Give a specific PR a shorter display title through `pullRequestLabels`.
- Add published research, models/data, writing/talks, or demos to `showcase.sections[].items`. Empty areas are deliberately marked **No public entry yet**.

Do not edit generated assets or README content directly. They will be regenerated. The only public data saved to `data/profile.json` is the normalized data used by the profile. Generated asset filenames contain a hash of their contents, so a data or design change gives GitHub a new image URL. The previous generation is retained for readers with cached README markup; older generated files are removed.

## Local development

Node.js 22 or newer is sufficient; there are no runtime packages to install.

```sh
node --test
node scripts/update-profile.mjs
```

An authenticated local GitHub CLI can be used instead of anonymous API requests:

```sh
node scripts/update-profile.mjs --gh
```

Otherwise the generator uses `GITHUB_TOKEN` when it is set, or GitHub's anonymous public API rate limit. API failures or incomplete search results stop generation before replacing any published output. Identical public data preserves its previous timestamp and creates no data-only commit.

## Motion and layout

The white dashboard is assembled from individually linked SVG modules in the README. The contribution instrument uses a twelve-second loop of a light particle wave; project pipelines animate their moving signal. Instrument values come from GitHub data and do not animate into invented values. Each image's `<picture>` element selects a static version for readers who request reduced motion. Image filenames include content hashes, so updates replace cached assets reliably.

The dashboard keeps its white background, dark typography, restrained blue accents, circular contribution readout, and curved baseline. Native anchors make each module a direct route to its related public page. The recently resolved PR panel gives upstream repository stars and forks a stronger readout and labels them as repository metrics. Project, contribution, showcase, and recent-work modules grow or change as the public GitHub data changes. Contact links remain below the dashboard. The introduction is intentionally limited to “AI engineer”.

## Research and design references

These projects informed the architecture; their source code and visual assets were not copied:

- [rohitg00's current profile](https://github.com/rohitg00/rohitg00), reviewed on 2026-10-09: a configuration file, public-data collector, renderer, and automatic update workflow. Its current display is a generated PNG; this profile adds SVG motion to the same data-driven idea.
- [Profile Control Plane](https://github.com/majiayu000/profile-control-plane), created in July 2026: declarative content, modular templates, responsive animated SVGs, and reduced-motion support.
- [GitHub Profile Console](https://github.com/wildanniam/GitHub-Profile-Console), created in July 2026: responsive animated assets and content-hashed filenames to avoid outdated cached images.
- [gif-terminal](https://github.com/dbuzatto/gif-terminal), created in December 2025 and updated in October 2026: daily regeneration of an animated GIF from current GitHub data.

- [lowlighter/metrics](https://github.com/lowlighter/metrics): GitHub data separated from templates, generated SVG output, and scheduled refreshes.
- [Platane/snk](https://github.com/Platane/snk): playable SVG/GIF assets generated by Actions and embedded in a profile README.
- [Capsule Render](https://github.com/kyechan99/capsule-render): configurable SVG imagery and CSS animation. Generating our own files avoids depending on its shared service.
- [galaxy-profile](https://github.com/vinimlo/galaxy-profile): configurable project lists and a GitHub-data-to-SVG pipeline.
- [Tesla — Introducing New Model Y](https://www.tesla.com/learn/introducing-new-model-y): a calm, clean visual environment and precise detail.
- [Tesla touchscreen overview](https://www.tesla.com/ownersmanual/model3/en_gb/GUID-518C51C1-E9AC-4A68-AE12-07F4FF8C881E.html): persistent status areas and selective display of controls.
- [SpaceX webcast UI by Shane Mielke](https://www.shanemielke.com/work/spacex/webcast/): restrained telemetry overlays. The user's Starship webcast reference guided the circular readouts, whitespace, and bottom arc.

GitHub README images are the presentation surface; this project does not rely on scripts running in the README. The animation is local to the SVG, and data freshness depends on the latest successful workflow run.

## Research and public-output areas

The four showcase areas broaden the profile beyond PR statistics while preserving the white visual system. They begin as empty, explicitly labeled areas, not claims of completed work. Add a real public item using `title`, `url` (HTTPS), and optionally `kind`, `date`, and `summary`. A populated area replaces its empty state automatically and grows to fit its content; up to `showcase.maxVisible` entries are shown per area.

The artwork displays entry titles and metadata. Public URLs remain in `data/profile.json` for provenance; the removed work-navigation row is not reintroduced.

- **Research & experiments:** explicitly tagged project repositories are included when their topics match `autoTopics`, such as `paper-reproduction`, `research`, or `benchmark`. They are labeled as repositories, not as accepted publications.
- **Models & datasets:** explicitly tagged repositories such as `dataset`, `model-release`, or `model-weights` are included. Generic `machine-learning` tags alone do not qualify.
- **Writing & talks:** curated public links are maintained in configuration. No blog feed or publication record is assumed.
- **Demos & releases:** add demo links in configuration; published GitHub releases from the currently displayed public projects are collected automatically. Drafts are excluded and pre-releases are labeled.

The broader information structure was informed by [Sebastian Raschka's research and educational work](https://github.com/rasbt), [Chip Huyen's tools, writing and teaching](https://github.com/chiphuyen), and [Simon Willison's automatically updated releases, blog and TIL sections](https://github.com/simonw). These references inform categories only; their achievements are not attributed to this profile.

## Contribution impact and recent work

The impact module sums additions, deletions, and changed-file counts from the latest 30 merged public upstream PRs (or all of them when fewer are available). The displayed sample size makes that scope explicit. File changes are cumulative diff entries, not a count of unique files or original authorship. Missing API fields fail the refresh rather than being converted to zero.

Recent work shows the latest three resolved upstream PRs, including closed and merged work. Open PRs awaiting a response remain out of the resolved-work cards. Dates use the close or merge timestamp, not the last edit time. The records and their links refresh with the rest of the profile.

