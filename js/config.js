// Game State
const gameState = {
    level: 1,
    xp: 0,
    bestJump: 0,
    currentSkin: 'default',
    unlockedSkins: ['default'],
    isCharging: false,
    power: 0,
    isJumping: false
};

// Skins Configuration (cooldownReduction: lower = faster recovery from sleep)
const skins = [
    { id: 'default', name: 'Classic Froggy', bonus: 1.0, unlockLevel: 1, color: '#32CD32', cooldownReduction: 1.0 },
    { id: 'golden', name: 'Golden Frog', bonus: 1.3, unlockLevel: 3, color: '#FFD700', cooldownReduction: 0.8 },
    { id: 'royal', name: 'Royal Frog', bonus: 1.6, unlockLevel: 5, color: '#9932CC', cooldownReduction: 0.6 },
    { id: 'cosmic', name: 'Cosmic Frog', bonus: 2.0, unlockLevel: 8, color: '#191970', cooldownReduction: 0.4 },
    { id: 'rainbow', name: 'Rainbow Frog', bonus: 2.5, unlockLevel: 10, color: 'rainbow', cooldownReduction: 0.25 }
];

// Sleep/Energy Configuration
const AWAKE_DURATION = 120; // 2 minutes of play before sleep
const BASE_SLEEP_DURATION = 60; // Base 60 seconds of sleep

// Terrain constants
const TERRAIN_TYPES = ['snow', 'ice', 'lava'];
const LAVA_XP_PENALTY = 100;
const ICE_SLIDE_FACTOR = 0.9; // Slide 90% of landing speed (very slippery!)

// Labubu constants
const LABUBU_CATCH_DISTANCE = 50; // pixels - how close frog needs to land
const LABUBU_BASE_BONUS = 30; // Base bonus for nearby Labubu
const LABUBU_DISTANCE_MULTIPLIER = 2; // XP per meter of distance
const LABUBU_LIMITED_MULTIPLIER = 10; // Secret edition multiplier
const LABUBU_COLORS = ['pink', 'red', 'blue', 'green', 'yellow', 'purple'];

// Sleep state
let awakeTimeRemaining = AWAKE_DURATION;
let sleepTimeRemaining = 0;
let isSleeping = false;
let awakeInterval = null;
let sleepInterval = null;

// Terrain state
let activeTerrains = [];
let isPreviewPlaying = false;

// Labubu state
let activeLabubus = [];
