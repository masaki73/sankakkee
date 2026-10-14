# AIショート project instructions

1. Read `HANDOFF_WINDOWS.md`, `asset_manifest.json`, and `short_brief_内製化.json` before changing the pipeline.
2. Never add raw video, generated video/audio, model weights, or local AI installations to Git.
3. Treat `20260730_Acam_Hayasi_1465.MP4` as the primary avatar source and preserve it unchanged.
4. Use `avatar_training_candidate_white_1465_150-190.mp4` as the first avatar/lip-sync test input.
5. Put generated files under `outputs/` and keep source files read-only.
6. The approved performer is the white-shirt presenter. User-confirmed AI-use consent is recorded, but comply with any additional consent flow required by the chosen software or publishing platform.
7. The target short is 30 seconds and must end with a natural CTA to the YouTube related video `lglhHtKFy-I`.
8. On Windows, run `scripts/check_windows.ps1` before installing GPU-dependent tools. Do not guess CUDA compatibility.

