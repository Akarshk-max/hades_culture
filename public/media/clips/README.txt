SECTION 2 — VIDEO MONTAGE CLIPS
================================

Drop your short brand clips RIGHT HERE, in this folder
(public/media/clips/), named exactly like this:

    clip01.mp4
    clip02.mp4
    clip03.mp4
    clip04.mp4
    clip05.mp4
    clip06.mp4
    ...

Rules:
- 2–3 seconds each, MUTED, web-optimized H.264 (.mp4).
- Name them with a zero-padded number: clip01, clip02, … clip10, clip11.
- They play one-by-one on a seamless crossfade loop, in numeric order.

How many clips?
- Open  src/landing/data.ts  and set:  MONTAGE_CLIP_COUNT = <how many you have>
- (Or just tell Claude the number and it'll set it for you.)
- A wrong count won't crash anything — missing files are skipped automatically —
  but extra files beyond the count won't play, and a too-high count just skips gaps.

Optional poster:
- Add  poster.jpg  in this same folder. It shows before clips load and is the
  static frame used when the visitor has "reduce motion" enabled.
- No poster? The section falls back to a product photo automatically, so it's
  never blank.

NOTE: Google Drive links do NOT work as <video> sources (no CORS / no byte-range
support). The files must be served statically from this folder, which they are
once you copy them here and deploy.
