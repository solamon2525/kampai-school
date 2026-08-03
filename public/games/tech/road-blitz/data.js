// Road Blitz - Game Data & Pixel Art Color Palettes
window.GAME_DATA = {
  stages: [
    {
      id: 1,
      name: 'DAY STAGE - SUNSET FREEWAY',
      targetDistance: 10000,
      bgColor: '#1d2b53',
      asphaltColor: '#3c3c3c',
      shoulderColor: '#008751',
      shoulderPatternColor: '#5f574f',
      stripeColor: '#fff1e8',
      guardrailColor: '#c2c3c7',
      skyGradient: ['#ffa300', '#ff004d'],
      darknessOverlay: 0.0,
      headlights: false,
      spawnMultiplier: 1.0,
      bgmPreset: 'retro'
    },
    {
      id: 2,
      name: 'NIGHT STAGE - CYBER HIGHWAY',
      targetDistance: 25000,
      bgColor: '#050510',
      asphaltColor: '#1a1a24',
      shoulderColor: '#0a3d24',
      shoulderPatternColor: '#1d2b53',
      stripeColor: '#ffec27',
      guardrailColor: '#83769c',
      skyGradient: ['#0f051d', '#020005'],
      darknessOverlay: 0.55,
      headlights: true,
      spawnMultiplier: 1.45,
      bgmPreset: 'action'
    }
  ],

  rivalTypes: [
    {
      id: 'blue_sedan',
      name: 'Blue Sedan',
      width: 36,
      height: 64,
      speedRatio: 0.70, // 70% of road speed (moving away from player slower)
      colorMain: '#29adff',
      colorRoof: '#00e756',
      colorGlass: '#fff1e8',
      colorLight: '#ffec27',
      scoreBonus: 100
    },
    {
      id: 'yellow_taxi',
      name: 'Yellow Taxi',
      width: 36,
      height: 64,
      speedRatio: 0.85,
      colorMain: '#ffec27',
      colorRoof: '#ff004d',
      colorGlass: '#000000',
      colorLight: '#ffa300',
      scoreBonus: 120
    },
    {
      id: 'cargo_truck',
      name: 'Cargo Truck',
      width: 46,
      height: 104,
      speedRatio: 0.50, // slow heavy truck
      colorMain: '#ab5236',
      colorRoof: '#7e2553',
      colorGlass: '#29adff',
      colorLight: '#ffec27',
      scoreBonus: 200
    },
    {
      id: 'purple_speeder',
      name: 'Purple Speeder',
      width: 36,
      height: 64,
      speedRatio: 1.10, // fast car weaving
      colorMain: '#83769c',
      colorRoof: '#ff77a8',
      colorGlass: '#fff1e8',
      colorLight: '#00e756',
      scoreBonus: 180
    }
  ],

  playerColors: {
    main: '#ff004d',      // Classic Road Fighter bright red
    roof: '#ffa300',      // Yellow-orange racing stripes / roof
    glass: '#29adff',     // Blue tint windshield
    wheels: '#1d2b53',    // Dark wheels
    headlights: '#fff1e8',// White headlights
    taillights: '#ff004d' // Red taillights
  },

  pickups: {
    fuelCan: {
      width: 32,
      height: 32,
      colorMain: '#ff004d',
      colorCap: '#ffec27',
      label: 'F'
    }
  },

  hazards: {
    oilSlick: {
      width: 44,
      height: 32,
      colorMain: '#1d2b53',
      colorShine: '#29adff'
    },
    cone: {
      width: 24,
      height: 24,
      colorMain: '#ff6c24',
      colorStripe: '#fff1e8'
    }
  }
};
