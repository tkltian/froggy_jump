// Labubu Module - Monster toys collectibles

// Create Labubu HTML
function createLabubuHTML(isLimited) {
    return `
        <div class="labubu-body">
            <div class="labubu-ear left"></div>
            <div class="labubu-ear right"></div>
            <div class="labubu-head">
                <div class="labubu-eye left"></div>
                <div class="labubu-eye right"></div>
                <div class="labubu-mouth"></div>
            </div>
            <div class="labubu-body-main"></div>
        </div>
    `;
}

// Show Labubu hint pointing to nearest Labubu
function showLabubuHint() {
    if (activeLabubus.length === 0) return;

    // Find the nearest Labubu
    const nearestLabubu = activeLabubus.reduce((nearest, current) => {
        return current.position < nearest.position ? current : nearest;
    });

    // Position hint above the Labubu within the game area
    const areaWidth = gameArea.offsetWidth;
    const hintPosition = Math.min(nearestLabubu.position, areaWidth - 100);

    labubuHint.style.left = `${Math.max(50, hintPosition)}px`;
    labubuHint.style.transform = 'translateX(-50%)';
    labubuHint.classList.add('show');
}

// Hide Labubu hint immediately
function hideLabubuHint() {
    labubuHint.classList.remove('show');
}

// Pan camera to show Labubus before game starts
function panToShowLabubus(callback) {
    if (activeLabubus.length === 0) {
        if (callback) callback();
        return;
    }

    // Find the furthest Labubu
    const furthestLabubu = activeLabubus.reduce((furthest, current) => {
        return current.position > furthest.position ? current : furthest;
    });

    const areaWidth = gameArea.offsetWidth;

    // If furthest Labubu is off-screen, pan to show it
    if (furthestLabubu.position > areaWidth - 100) {
        const targetOffset = furthestLabubu.position - areaWidth * 0.6;
        gameWorld.style.transform = `translateX(-${Math.max(0, targetOffset)}px)`;

        // Pan back after a delay
        setTimeout(() => {
            gameWorld.style.transform = 'translateX(0)';
            if (callback) callback();
        }, 1500);
    } else {
        if (callback) callback();
    }
}

// Get random Labubu color class
function getRandomLabubuColor() {
    // 1/36 chance for black (limited edition)
    if (Math.random() < (1/36)) {
        return { colorClass: 'labubu-limited', isLimited: true };
    }
    // 35/36 chance split among 6 colors (each ~5.83/36 = 35/216)
    const colorIndex = Math.floor(Math.random() * LABUBU_COLORS.length);
    return { colorClass: `labubu-${LABUBU_COLORS[colorIndex]}`, isLimited: false };
}

// Calculate distance-based bonus
function calculateLabubuBonus(labubu) {
    const distanceMeters = (labubu.position - 50) / 30; // Convert pixels to meters
    let bonus = LABUBU_BASE_BONUS + Math.floor(distanceMeters * LABUBU_DISTANCE_MULTIPLIER);

    if (labubu.isLimited) {
        bonus *= LABUBU_LIMITED_MULTIPLIER;
    }

    return bonus;
}

// Check if frog landed near any Labubu
function checkLabubuCollision(frogPosition) {
    let collectedLabubu = null;

    for (const labubu of activeLabubus) {
        if (labubu.collected) continue;

        const distance = Math.abs(frogPosition - labubu.position);
        if (distance <= LABUBU_CATCH_DISTANCE) {
            labubu.collected = true;
            labubu.element.style.opacity = '0.3';
            labubu.element.style.transform = 'scale(0.5)';
            collectedLabubu = labubu;
            break; // Only collect one per jump
        }
    }

    return collectedLabubu;
}

// Check for Labubus during ice slide
function checkLabubusDuringSlide(startPos, endPos) {
    const collected = [];
    for (const labubu of activeLabubus) {
        if (labubu.collected) continue;
        if (labubu.position >= startPos && labubu.position <= endPos) {
            labubu.collected = true;
            labubu.element.style.opacity = '0.3';
            labubu.element.style.transform = 'scale(0.5)';
            collected.push(labubu);
        }
    }
    return collected;
}

// Spawn Labubus with terrain awareness
function spawnLabubusWithTerrainAwareness() {
    labubuContainer.innerHTML = '';
    activeLabubus = [];

    // 1-3 Labubus per session
    const numLabubus = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numLabubus; i++) {
        // Random position between 150px and 1800px
        let position = 150 + Math.random() * 1650;

        // Avoid placing on lava (if generateTerrains was called)
        let attempts = 0;
        while (attempts < 10) {
            const terrain = getTerrainAt(position);
            if (!terrain || terrain.type !== 'lava') {
                break;
            }
            position = 150 + Math.random() * 1650;
            attempts++;
        }

        const { colorClass, isLimited } = getRandomLabubuColor();

        const labubu = document.createElement('div');
        labubu.className = `labubu ${colorClass}`;
        labubu.style.left = `${position}px`;
        labubu.innerHTML = createLabubuHTML(isLimited);

        labubuContainer.appendChild(labubu);
        activeLabubus.push({
            element: labubu,
            position: position,
            collected: false,
            colorClass: colorClass,
            isLimited: isLimited
        });
    }
}

// Show Labubu reveal overlay
function showLabubuReveal(labubu, callback) {
    const bonus = calculateLabubuBonus(labubu);
    const isLimited = labubu.isLimited;

    // Set title based on rarity
    if (isLimited) {
        labubuRevealTitle.textContent = 'SECRET EDITION!';
        labubuRevealTitle.style.color = 'gold';
    } else {
        labubuRevealTitle.textContent = 'You found a Labubu!';
        labubuRevealTitle.style.color = 'white';
    }

    // Create the monster display
    labubuRevealMonster.innerHTML = createLabubuHTML(isLimited);
    labubuRevealMonster.className = `labubu-reveal-monster ${labubu.colorClass}`;

    // Set bonus text
    labubuRevealBonus.textContent = `+${bonus} XP Bonus!`;
    if (isLimited) {
        labubuRevealBonus.style.textShadow = '0 0 20px gold, 0 0 40px gold';
    } else {
        labubuRevealBonus.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    }

    // Show reveal
    labubuReveal.classList.add('active');

    // Close on click or auto-close after 2 seconds
    const closeReveal = () => {
        labubuReveal.classList.remove('active');
        labubuReveal.removeEventListener('click', closeReveal);
        if (callback) callback(bonus);
    };

    labubuReveal.addEventListener('click', closeReveal);
    setTimeout(closeReveal, 2000);
}
