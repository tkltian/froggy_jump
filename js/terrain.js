// Terrain Module - Terrain generation and effects

// Generate terrain patches
function generateTerrains() {
    terrainContainer.innerHTML = '';
    activeTerrains = [];

    // Generate 3-5 large terrain sections
    const numPatches = 3 + Math.floor(Math.random() * 3);

    // Divide the play area into zones to spread terrains
    const zoneSize = 1800 / numPatches;

    for (let i = 0; i < numPatches; i++) {
        const zoneStart = 200 + i * zoneSize;
        const position = zoneStart + Math.random() * (zoneSize * 0.3);
        // Much longer sections: 150-400px wide (5-13 meters)
        const width = 150 + Math.floor(Math.random() * 250);

        // Weighted random terrain selection
        // Ice is most common (55%), snow (33%), lava rare (12%)
        const rand = Math.random();
        let type;
        if (rand < 0.12) {
            type = 'lava';
        } else if (rand < 0.67) {
            type = 'ice';
        } else {
            type = 'snow';
        }

        const terrain = document.createElement('div');
        terrain.className = `terrain-patch terrain-${type}`;
        terrain.style.left = `${position}px`;
        terrain.style.width = `${width}px`;

        terrainContainer.appendChild(terrain);
        activeTerrains.push({
            element: terrain,
            type: type,
            start: position,
            end: position + width,
            width: width
        });
    }

    // Sort terrains by position for easier lookup
    activeTerrains.sort((a, b) => a.start - b.start);
}

// Get terrain at a specific position
function getTerrainAt(position) {
    for (const terrain of activeTerrains) {
        if (position >= terrain.start && position <= terrain.end) {
            return terrain;
        }
    }
    return null; // Grass (default)
}

// Find where ice slide ends
function calculateIceSlideEnd(startPos, slideDistance) {
    let currentPos = startPos;
    let remainingSlide = slideDistance;

    while (remainingSlide > 0) {
        currentPos += 1; // Move pixel by pixel
        remainingSlide -= 1;

        const terrain = getTerrainAt(currentPos);
        // Stop sliding if we hit non-ice terrain (or end of ice)
        if (!terrain || terrain.type !== 'ice') {
            // Check if we landed on lava at the end
            break;
        }
    }

    return currentPos;
}

// Create snow splash effect
function createSnowSplash(position) {
    const splash = document.createElement('div');
    splash.className = 'snow-splash';
    splash.style.left = `${position}px`;

    // Create multiple particles
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'snow-particle';
        const angle = (i / 8) * Math.PI * 2;
        const distance = 20 + Math.random() * 20;
        particle.style.setProperty('--splash-x', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--splash-y', `${Math.sin(angle) * distance - 30}px`);
        particle.style.animationDelay = `${Math.random() * 0.1}s`;
        splash.appendChild(particle);
    }

    gameWorld.appendChild(splash);

    // Remove after animation
    setTimeout(() => splash.remove(), 700);
}

// Create ice trail effect
function createIceTrail(startPos, endPos) {
    const trail = document.createElement('div');
    trail.className = 'ice-trail';
    trail.style.left = `${startPos}px`;
    trail.style.width = `${endPos - startPos}px`;

    gameWorld.appendChild(trail);

    // Fade out and remove
    setTimeout(() => {
        trail.style.opacity = '0';
        trail.style.transition = 'opacity 0.5s';
        setTimeout(() => trail.remove(), 500);
    }, 1000);
}

// Convert pixel position to meters (accounting for frog start at 50px)
function pixelsToMeters(px) {
    return Math.round((px - 50) / 30);
}

// Create summary panel after preview (no in-world labels to avoid overlap)
function createDistanceLabels() {
    distanceLabelsContainer.innerHTML = '';

    // Collect ALL terrains by type
    const iceTerrains = [];
    const lavaTerrains = [];

    for (const terrain of activeTerrains) {
        const distanceM = pixelsToMeters(terrain.start);
        const endM = pixelsToMeters(terrain.end);

        if (terrain.type === 'ice') {
            iceTerrains.push(`${distanceM}-${endM}m`);
        } else if (terrain.type === 'lava') {
            lavaTerrains.push(`${distanceM}-${endM}m`);
        }
    }

    // Collect Labubus - sort by distance
    const labubuDistances = activeLabubus
        .map(l => ({ distance: pixelsToMeters(l.position), isLimited: l.isLimited }))
        .sort((a, b) => a.distance - b.distance);

    // Build summary panel HTML - Title first, then all items INSIDE the box
    let summaryHtml = '<div class="distance-summary-title">📍 Targets:</div>';

    // Labubus as array with limited editions highlighted (INSIDE box, after title)
    if (labubuDistances.length > 0) {
        const labubuParts = labubuDistances.map(l =>
            l.isLimited
                ? `<span class="secret-distance">${l.distance}m⭐</span>`
                : `${l.distance}m`
        );
        summaryHtml += `<div class="distance-summary-item type-labubu">🎁 Labubus: ${labubuParts.join(', ')}</div>`;
    }

    // Ice terrains (all of them)
    if (iceTerrains.length > 0) {
        summaryHtml += `<div class="distance-summary-item type-ice">🧊 Ice: ${iceTerrains.join(', ')}</div>`;
    }

    // Lava terrains (all of them)
    if (lavaTerrains.length > 0) {
        summaryHtml += `<div class="distance-summary-item type-lava">🔥 Lava: ${lavaTerrains.join(', ')}</div>`;
    }

    distanceSummary.innerHTML = summaryHtml;
    distanceSummary.classList.add('show');
}

// Hide summary panel
function hideDistanceSummary() {
    distanceSummary.classList.remove('show');
}
