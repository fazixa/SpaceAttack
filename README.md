# Space Attack — Orbital Defense
A modern interpretation of the 1982 Emerson Arcadia 2001 shooter, built with React and Three.js. All ships, projectiles, stars, and debris are procedural; ships use beveled geometry and PBR metallic materials.

## Run locally

```sh
npm install
npm run dev
```

Open the printed localhost URL. `npm run build` creates a production bundle; `npm test` checks the game simulation.

## Controls and rules
- Left/Right or A/D: move horizontally.
- Hold Space: fire (one shot every 0.19 seconds).
- Play / Enter: start or restart. The live scene animates to fill the page without browser fullscreen. Escape or the menu button: pause.
- How to Play and sound settings are inside the start/pause/game-over menu. Personal best appears only on those screens.
- Menu screens keep the capped, proportional layout. During play, the sky fills the page while ships retain their proportions and combat stays centered. Touch controls appear on touch devices.
- Three starting lives. Hits grant two seconds of respawn invulnerability.
- Fuel starts at 100 seconds per wave, tightening by 5 seconds each wave to a 45-second minimum. Clearing a wave refills the tank. Empty fuel ends the run.
- Drone / fighter / commander: 30 / 60 / 100 points, doubled during dives. One bonus life at 5,000 points.
- Local personal best persists in browser storage. Sound can be muted. Losing focus pauses the game.

The fuel refill rule, points, and pacing are adaptation choices, not claims of exact original rules. Difficulty parameters live in `src/game.js`. Rendering is separate in `src/scene.js`.
