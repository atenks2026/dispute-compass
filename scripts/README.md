# scripts/ — tooling & verification

Utility scripts used to build and verify Team AHVO's submission assets.
None of them are required to run the app itself.

| Script | What it does |
| --- | --- |
| `verify-story.ts` | Runs the real engines (deadline / strength / settlement) and prints every number quoted in the docs — proof that documentation and code agree. Run: `bun scripts/verify-story.ts` |
| `gen-narration.mjs` | Generates the 7 narration WAV clips for the demo video via an OpenAI-compatible TTS endpoint (voice `jam`). Writes to `/tmp/video/narr` and `/tmp/video/scenes.json`. |
| `record-demo.mjs` | **Automated demo walkthrough.** Drives the production build at `localhost:3000` with Playwright through all 7 scenes of `docs/video-script.md` (row clicks, evidence toggle, coach re-brief, appeal draft + Integrity Guard + attestations + send) and records a 1440×900 WebM, synced to the narration durations. |
| `assemble-video.py` | Assembles the final MP4: cuts the recording per scene, muxes narration, renders intro/outro cards, burns sentence-level captions, adds fades. Output goes to `download/Dispute-Compass-Demo-Video.mp4`. |

Why this matters: our demo video is not hand-edited screen capture — it is a
scripted, reproducible walkthrough of the real app, and every number in the
narration/captions is verified against the actual engine output.
