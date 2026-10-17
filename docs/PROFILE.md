# Maintaining this profile

The layout adapts the anime-profile Markdown sections in the MIT-licensed [beautify-gh template collection](https://github.com/arsyadal/beautify-gh/tree/main/templates) to this profile's research, project, and contribution data. The particle/meteor hero is exported from MIT-licensed [readme-animated-sweetbanner](https://github.com/sh4den/readme-animated-sweetbanner); its license notice is included under `licenses/`.

`scripts/readme.mjs` renders a native Markdown profile with featured research, validated experiment results, merged upstream work, recent PR states, latest owned-project commits, contact links, and automatically discovered public projects. `scripts/data.mjs` refreshes public GitHub data every six hours. Forks, private repositories, archived/empty projects, and this profile repository are excluded from project discovery.

`assets/profile-particles.svg` is the MIT banner-generator export, adapted to a midnight-blue, ice-and-gold palette. It combines floating particles, an orbit, and a moving star trail. Images are embedded in the SVG so GitHub does not need an external icon or avatar request. The separate **Update contribution graph** workflow regenerates the light/dark contribution snake daily with SHA-pinned actions and publishes its files on the `output` branch.

The featured CH-SIMS v2.0 snapshot is an offline record from `profile.config.json`, dated 2026-10-14. It must be manually refreshed only after the corresponding experiment record is verified. Dynamic public GitHub activity and research results therefore have independent sources and update schedules.

Normal rendering needs Node.js 22+. `node scripts/update-profile.mjs` collects current public API data; `node scripts/update-profile.mjs --offline` regenerates the README from the saved snapshot. The **Refresh and validate profile** workflow runs every six hours and on manual dispatch. GitHub schedules are best effort.
