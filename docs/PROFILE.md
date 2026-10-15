# Maintaining this profile

The profile is a short Markdown introduction, one selected project, specific upstream contributions, and contact links. Content is curated in `profile.config.json`; `README.md` is generated from that file. No network requests, activity counters, images, or placeholder sections are needed.

## Update the content

1. Edit `profile.config.json`. Keep descriptions specific and link to code, experiment records, or merged pull requests.
2. Run `node --test` and `node scripts/update-profile.mjs` with Node.js 22 or newer.
3. Commit the configuration and generated README together.

The validation workflow runs on pull requests and pushes to main. It checks the generator and verifies that README matches the configuration. It has read-only permissions and never pushes generated commits. There is no scheduled refresh.

Only list public work that a visitor can inspect. Keep original projects separate from upstream contributions. Do not describe a closed or open PR as merged, claim a fork as original work, or turn an inconclusive experiment into a performance claim. Experimental results belong in the linked project documentation, where the protocol and limitations can be explained.

## Content sources

- [Multimodal Sentiment Fusion](https://github.com/MaYangle/Multimodal-Sentiment-Fusion): current project scope, implementation and evaluation limitations.
- [Reliability fixes, PR #7](https://github.com/19376357/Bilingual-Multimodal-Sentiment-Analysis/pull/7) and [bilingual documentation, PR #5](https://github.com/19376357/Bilingual-Multimodal-Sentiment-Analysis/pull/5): specific upstream work.

## Profile references

Reviewed on 2026-10-15. The structure takes inspiration from these public profiles; their biographies, achievements, and source code are not reused:

- [Andrej Karpathy](https://github.com/karpathy): a focused introduction and concrete repositories.
- [Hamel Husain](https://github.com/hamelsmu): a clear working domain and direct evidence of work.
- [Simon Willison](https://github.com/simonw): useful entry points into maintained projects and technical records.

The previous SVG dashboard and data collector remain available in Git history.
