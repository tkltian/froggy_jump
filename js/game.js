// Game Module - Main game logic (jump mechanics, charging, etc.)

// Power charging
let chargeInterval;

function startCharging() {
    if (gameState.isJumping || isSleeping || isPreviewPlaying) return;
    gameState.isCharging = true;
    gameState.power = 0;

    // Hide Labubu hint when user starts playing
    hideLabubuHint();

    chargeInterval = setInterval(() => {
        gameState.power = Math.min(100, gameState.power + 2);
        powerBar.style.width = gameState.power + '%';
        powerPercent.textContent = gameState.power;
    }, 30);
}

function stopCharging() {
    if (!gameState.isCharging) return;
    gameState.isCharging = false;
    clearInterval(chargeInterval);

    if (gameState.power > 0) {
        performJump();
    }
}

// Random distance multiplier using Box-Muller for normal distribution
// Mean = 1.0, small standard deviation for mostly consistent jumps
function getRandomJumpMultiplier() {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const normalRandom = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Mean 1.0, standard deviation 0.08 (so ~95% of jumps are within ±16%)
    const multiplier = 1.0 + normalRandom * 0.08;

    // Clamp to reasonable range (0.7 to 1.3)
    return Math.max(0.7, Math.min(1.3, multiplier));
}

// Perform jump
function performJump() {
    gameState.isJumping = true;
    jumpBtn.disabled = true;

    const skinBonus = getSkinBonus();
    const randomMultiplier = getRandomJumpMultiplier();
    const baseDistance = (gameState.power / 100) * 15; // Max 15m base
    const totalDistance = baseDistance * skinBonus * randomMultiplier;
    const pixelDistance = totalDistance * 30; // 30 pixels per meter

    // Set CSS variables for animation
    frog.style.setProperty('--jump-distance', `${pixelDistance}px`);
    frog.style.setProperty('--jump-distance-30', `${pixelDistance * 0.3}px`);
    frog.style.setProperty('--jump-distance-60', `${pixelDistance * 0.6}px`);

    frog.classList.add('jumping');

    // Animate camera to follow frog during jump
    const jumpDuration = 1000;
    const startTime = Date.now();
    const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / jumpDuration, 1);
        const currentDistance = pixelDistance * progress;
        updateCamera(currentDistance);

        if (progress < 1) {
            requestAnimationFrame(animateCamera);
        }
    };
    animateCamera();

    setTimeout(() => {
        frog.classList.remove('jumping');
        let frogPosition = 50 + pixelDistance;
        frog.style.left = `${frogPosition}px`;
        updateCamera(pixelDistance);

        // Check terrain at landing position
        const landingTerrain = getTerrainAt(frogPosition);
        let finalPosition = frogPosition;
        let allCollectedLabubus = [];
        let hitLava = false;
        let slideDistance = 0;

        // Handle terrain effects
        if (landingTerrain) {
            if (landingTerrain.type === 'snow') {
                // Snow: create splash effect
                createSnowSplash(frogPosition);
            } else if (landingTerrain.type === 'ice') {
                // Ice: slide forward
                slideDistance = pixelDistance * ICE_SLIDE_FACTOR;
                const slideEnd = calculateIceSlideEnd(frogPosition, slideDistance);

                // Check if slide ends on lava
                const slideEndTerrain = getTerrainAt(slideEnd);
                if (slideEndTerrain && slideEndTerrain.type === 'lava') {
                    hitLava = true;
                    finalPosition = slideEnd;
                } else {
                    finalPosition = slideEnd;
                }

                // Collect Labubus during slide
                const slideCollected = checkLabubusDuringSlide(frogPosition, finalPosition);
                allCollectedLabubus = allCollectedLabubus.concat(slideCollected);

                // Animate the slide
                frog.classList.add('sliding');
                createIceTrail(frogPosition, finalPosition);

                const slideDuration = 500;
                const slideStartTime = Date.now();
                const animateSlide = () => {
                    const elapsed = Date.now() - slideStartTime;
                    const progress = Math.min(elapsed / slideDuration, 1);
                    const currentPos = frogPosition + (finalPosition - frogPosition) * progress;
                    frog.style.left = `${currentPos}px`;
                    updateCamera(currentPos - 50);

                    if (progress < 1) {
                        requestAnimationFrame(animateSlide);
                    } else {
                        frog.classList.remove('sliding');
                    }
                };
                animateSlide();

            } else if (landingTerrain.type === 'lava') {
                hitLava = true;
            }
        }

        // Also check initial landing for Labubu
        const initialLabubu = checkLabubuCollision(frogPosition);
        if (initialLabubu) {
            allCollectedLabubus.push(initialLabubu);
        }

        // Delay for terrain effects
        const effectDelay = landingTerrain?.type === 'ice' ? 600 : 100;

        setTimeout(() => {
            // Calculate base XP
            let xpGained = Math.floor(totalDistance * 5);
            let xpPenalty = 0;

            // Handle lava death
            if (hitLava) {
                frog.classList.add('burning');
                lavaDeathOverlay.classList.add('active');
                xpPenalty = LAVA_XP_PENALTY;

                setTimeout(() => {
                    frog.classList.remove('burning');
                    frog.style.filter = '';
                    frog.style.transform = '';
                    frog.style.opacity = '';
                    lavaDeathOverlay.classList.remove('active');
                }, 600);
            }

            // Check for new best (use total distance including slide)
            const actualDistance = (finalPosition - 50) / 30;
            const isNewBest = actualDistance > gameState.bestJump && !hitLava;
            if (isNewBest) {
                gameState.bestJump = actualDistance;
            }

            // Calculate total Labubu bonus
            let totalLabubuBonus = 0;
            for (const labubu of allCollectedLabubus) {
                totalLabubuBonus += calculateLabubuBonus(labubu);
            }

            // Function to finish the jump
            const finishJump = () => {
                let finalXp = xpGained + totalLabubuBonus - xpPenalty;
                finalXp = Math.max(0, finalXp); // Don't go negative

                // Add XP and check level up
                const oldLevel = gameState.level;
                gameState.xp += finalXp;

                while (gameState.xp >= getXpNeeded(gameState.level)) {
                    gameState.xp -= getXpNeeded(gameState.level);
                    gameState.level++;
                }

                const levelsGained = gameState.level - oldLevel;

                // Check for skin unlocks
                const newUnlocks = [];
                skins.forEach(skin => {
                    if (gameState.level >= skin.unlockLevel && !gameState.unlockedSkins.includes(skin.id)) {
                        gameState.unlockedSkins.push(skin.id);
                        newUnlocks.push(skin.name);
                    }
                });

                // Show result popup with terrain info
                showResultWithTerrain(actualDistance, finalXp, levelsGained, newUnlocks, isNewBest, totalLabubuBonus, hitLava, xpPenalty, slideDistance > 0, allCollectedLabubus.length);

                saveGame();
                updateUI();
            };

            // Show Labubu reveals if collected
            if (allCollectedLabubus.length > 0) {
                // Show reveal for first collected (most valuable)
                const mostValuable = allCollectedLabubus.reduce((best, current) =>
                    calculateLabubuBonus(current) > calculateLabubuBonus(best) ? current : best
                );
                showLabubuReveal(mostValuable, () => finishJump());
            } else {
                finishJump();
            }
        }, effectDelay);
    }, 1000);
}

// Continue after result
function continueGame() {
    overlay.style.display = 'none';
    resultPopup.style.display = 'none';

    // Reset frog position and camera
    frog.style.left = '50px';
    resetCamera();
    powerBar.style.width = '0%';
    powerPercent.textContent = '0';
    gameState.power = 0;
    gameState.isJumping = false;

    // Initialize new jump session (terrains, labubus, preview)
    initializeJumpSession();
}

// Initialize a new jump session (spawn terrains, labubus, play preview)
function initializeJumpSession() {
    // Hide any existing hints/summary
    hideLabubuHint();
    hideDistanceSummary();

    // Generate terrain first
    generateTerrains();

    // Then spawn Labubus (they should avoid lava)
    spawnLabubusWithTerrainAwareness();

    // Play preview (createDistanceLabels is called at end of preview)
    playPreview();
}
