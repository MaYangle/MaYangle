# Image-sampled particle art

`cosmic-particles.json` contains compact colour samples taken from the user-approved 1024 × 1536 reference composition. The original source's SHA-256 is recorded in the file. The four sampled regions are the full hero, the multimodal fusion scene and two decorative cosmic landscape panels.

The deployed SVG does not embed the reference bitmap. `scripts/particle-art.mjs` reconstructs its light, colour and silhouette with grouped, round-capped vector point strokes. Colour groups share four small motion phases, with separate light currents along the accretion disk, clouds and fusion streams. Near-white samples use the white page as their background. This keeps the reference's detail while allowing a particle treatment and reduced-motion version.

Every scheduled profile refresh reuses these fixed art samples. Repository data, text, counters and project layout are regenerated separately, so no API key or image generation request is needed for a new project.

To replace the approved artistic direction, run the one-time build script with the new reference and Sharp available in the local development environment:

```sh
node scripts/prepare-particle-art.mjs REFERENCE.png
node scripts/update-profile.mjs --offline
```

The optional `PROFILE_SHARP_ROOT` environment variable can point at a local Node package directory containing Sharp. Sharp is needed only for this preparation step; the normal renderer and GitHub Actions refresh have no runtime package dependencies. The input crop geometry is intentionally tied to the approved reference composition and must be adapted for a different design.

The two cosmic panels are illustrative artwork, not screenshots or evidence of project results. Repository-provided project covers remain distinct and retain their source links in the text version.
