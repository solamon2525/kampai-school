# AR Games

Read `AR-GAME.md` completely before editing.

- Use KampaiAR for zone/body movement and KampaiHands for finger poke, collision, cursor, or basket control.
- Keep the camera container absolute with `inset: 0`.
- Request camera only after a user gesture and show permission, loading, and error states.
- Always provide a complete tap fallback that can finish the same learning objective.
- On restart call `stop()`, discard the instance, rebuild, then start.
- Pause or stop camera processing when hidden and clean up tracks and listeners on exit.
- CI may use a fake media stream, but real-device verification must cover permission granted, denied, restart, camera unavailable, and tap fallback.
