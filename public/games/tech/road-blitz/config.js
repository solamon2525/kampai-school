// Road Blitz - Game Configuration
window.GAME_CONFIG = {
  canvasWidth: 800,
  canvasHeight: 600,
  
  // Highway Geometry
  roadWidth: 420,
  laneCount: 3,
  shoulderWidth: 50,
  stripeLength: 30,
  stripeGap: 25,

  // Speed & Physics
  minSpeed: 4.0,
  baseSpeed: 7.0,
  maxSpeed: 16.0,
  acceleration: 0.12,
  deceleration: 0.10,
  steerSpeed: 7.5,
  boostBonusSpeed: 4.5,

  // Fuel System
  maxFuel: 100,
  initialFuel: 100,
  normalFuelDrainRate: 0.05,
  boostFuelDrainRate: 0.22,
  fuelCanBonus: 35,

  // Stage & Distance
  stageDistanceTarget: 10000, // 10,000 meters = 10km stage clear
  metersPerPixel: 0.25,

  // Entity Dimensions
  carWidth: 36,
  carHeight: 64,
  truckWidth: 46,
  truckHeight: 104,
  pickupSize: 32,
  slickWidth: 44,
  slickHeight: 32,

  // Spawning
  trafficSpawnIntervalBase: 110, // frames
  trafficSpawnIntervalMin: 35,
  fuelSpawnInterval: 240,
  hazardSpawnInterval: 180,

  // Scoring
  distanceScoreRate: 1.5,
  fuelPickupScore: 250,
  nearMissScore: 150,

  // Audio Settings
  defaultBgmPreset: 'retro'
};
