# Archived image-sampled particle art

This is the previous photographic design study. The active renderer now uses lightweight procedural scientific illustrations in `scripts/particle-art.mjs`, following the user's request to prioritize lively abstract motion over matching the reference. The samples and preparation utility remain available for provenance; normal profile rendering does not load them.

`cosmic-particles.json` contains compact colour samples taken from the user-approved 1024 × 1536 reference composition. The original source's SHA-256 is recorded in the file. The four sampled regions are the full hero, the multimodal fusion scene and two decorative cosmic landscape panels.

The former SVG reconstructed the reference's light, colour and silhouette with grouped, round-capped vector point strokes. That study established the palette but proved too expensive to animate smoothly. It has been replaced by the native procedural renderer.

Scheduled refreshes now use deterministic procedural geometry. Repository data, text, counters and project layout are regenerated separately, so no API key or image generation request is needed for a new project.

To reproduce the archived sample data, use the preparation script with the original reference and Sharp available locally. This does not change the deployed design:

```sh
node scripts/prepare-particle-art.mjs REFERENCE.png
```

The optional `PROFILE_SHARP_ROOT` environment variable can point at a local Node package directory containing Sharp. Sharp is needed only for this preparation step; the normal renderer and GitHub Actions refresh have no runtime package dependencies. The input crop geometry is intentionally tied to the approved reference composition and must be adapted for a different design.

The two cosmic panels are illustrative artwork, not screenshots or evidence of project results. Repository-provided project covers remain distinct and retain their source links in the text version.
