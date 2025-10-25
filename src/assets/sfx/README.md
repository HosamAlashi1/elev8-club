# Audio Sound Effects

This folder contains audio files for the book reader page flip effects.

## Required Files:

1. **page-flip.mp3** - Sound played when page turns
2. **page-drag.mp3** - Sound played when dragging page (optional)

## Recommended Sources:

You can get free sound effects from:
- https://freesound.org/
- https://mixkit.co/free-sound-effects/
- https://soundbible.com/

## Specifications:

- Format: MP3 or OGG
- Duration: 0.5-1 second
- Size: < 50KB each
- Volume: Pre-normalized to comfortable level

## Usage:

These files are referenced in `book-22.json`:
```json
"sounds": {
  "drag": "/assets/sfx/page-drag.mp3",
  "flip": "/assets/sfx/page-flip.mp3",
  "enabled": true,
  "volume": 0.35
}
```

## Note:

The app will work without these files - audio will simply be disabled.
Add your own sound files here to enable the page flip audio effects.
