# Video Editor Assets

Local asset library synced from Google Drive.

## Folder Structure

```
assets/
├── folder1-assets/           # Main assets pack
│   ├── Aesthetic pngs/       # Transparent image assets
│   ├── Animated videos/      # MP4 clips
│   ├── Cat stickers/         # Sticker graphics
│   ├── COLOUR PALETTE/       # Design color guides
│   ├── FILM BURN - Transitions/  # Video transition overlays
│   ├── Font/                 # Typography files
│   ├── Green Screen videos/  # Chromakey assets
│   ├── Hand Gestures/        # Hand movement graphics
│   ├── Motion Backgrounds/   # Looping backgrounds
│   ├── Png + Premium Pngs/   # Image assets
│   └── SFX Sound Effects/    # Audio clips
│
└── folder2-visualsbylalit/   # Visualsbylalit Editing Pack
    ├── 3d Hands/             # Hand gesture videos
    ├── Transitions/          # 100+ seamless transitions
    │   ├── 10 Seamless Transitions/
    │   ├── 40 Transitions WGFX/
    │   ├── 50 Transitions/
    │   ├── 60+ Transitions WGFX/
    │   ├── 100 TRANSITIONS - WAHLA GFX/
    │   └── Film Scribble Transitions/
    ├── Presets/              # Premiere Pro presets
    │   ├── Animation Presets/
    │   ├── Glitch Presets/
    │   ├── Handheld Presets/
    │   └── Text Presets/
    ├── Overlays/             # Video overlays
    │   ├── FilmBurn Overlays/
    │   ├── Light Leaks/
    │   └── Screen Tones/
    ├── LUTs/                 # Color grading
    │   ├── Film LUTs/
    │   └── Hollywood Lumetri/
    ├── SFX/                  # Sound effects
    │   ├── Sound Design/
    │   ├── Trailer SFX/
    │   └── Vintage SFX/
    ├── Animated Letters/     # Typography animations
    ├── Fonts/                # Font files
    └── Green Screen/         # Chromakey clips
```

## Usage in Video Editor

Assets are indexed and available through the Supabase database:
- `broll_clips` — B-roll video clips
- `sfx_clips` — Sound effects
- `vfx_presets` — Visual effects and transitions
- `music_tracks` — Background music

## Sync Status

Run `tail -f /tmp/gdown1.log /tmp/gdown2.log` to monitor download progress.
