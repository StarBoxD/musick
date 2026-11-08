# VYBE — Find your frequency

Modern, responsive Turkish music discovery UI built with Next.js App Router, React, TypeScript and custom CSS.

## Requirements
- Node.js 20.9+
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Production build
```bash
npm run build
npm start
```

## Features
- Responsive discovery dashboard and mobile navigation
- Search by track, artist, album or genre
- Genre and mood filters
- YouTube privacy-enhanced embeds
- Play/pause state, next/previous and shuffle controls
- Favorites stored in localStorage
- Create playlists and add tracks to them
- Listening history stored locally

## Notes
- The app is frontend-only; favorites, playlists and history are stored in the current browser.
- YouTube embeds require an internet connection. Some videos may disallow embedding or be unavailable in certain regions.
- The progress bar is a visual UI indicator, not a synchronized playback timeline. For accurate playback state, integrate the YouTube IFrame Player API.
- The included video IDs are sample entries carried over from the supplied prototype. Replace or verify them before publishing.
- No copyrighted audio files are bundled with this project.
