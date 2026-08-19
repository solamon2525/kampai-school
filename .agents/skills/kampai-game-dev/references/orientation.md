# Orientation-aware Games

Read `ORIENT-GAME.md` before implementation and start from `_template-orient`.

- Declare one preferred orientation and keep menus/results usable in either orientation.
- Pause active timing while the rotate overlay blocks play.
- Recalculate canvas and layout from container size, not only `window.innerWidth`.
- Preserve score and round state across orientation changes.
- Test portrait and landscape at phone and tablet sizes, including rotation during play and at game over.
