// config.js – Game configuration
window.GAME_CONFIG = {
  // Goal: collect 10 stars to win
  starGoal: 10,
  // Points awarded for each Number Point collected
  pointsPerNumber: 10,
  // UI colors (can be tweaked later)
  hudColor: "rgba(255,255,255,0.12)",
  // Duration of a game round (seconds). 0 = unlimited.
  roundDuration: 0,
  // Asset paths (placeholders for now)
  assets: {
    numberPoint: "/games/math/math-quest-3d/assets/number-point.png",
    mathBug: "/games/math/math-quest-3d/assets/math-bug.png",
    missionBox: "/games/math/math-quest-3d/assets/mission-box.png",
    cover: "/games/math/math-quest-3d/cover.png"
  }
};
