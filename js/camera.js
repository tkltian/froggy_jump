// Camera Module - Camera follow and preview animations

// Camera follow - keeps frog always visible on screen
function updateCamera(frogX) {
    const areaWidth = gameArea.offsetWidth;
    const frogScreenPos = frogX + 50; // frog position from left edge

    // Aggressive camera: keep frog in the left-center area of screen
    // Start panning early and follow closely
    const isMobile = areaWidth < 600;
    const followThreshold = isMobile ? areaWidth * 0.3 : areaWidth * 0.35;

    if (frogScreenPos > followThreshold) {
        // Pan aggressively - follow frog closely to keep it in view
        const offset = frogScreenPos - followThreshold;
        gameWorld.style.transform = `translateX(-${offset}px)`;
    } else {
        gameWorld.style.transform = 'translateX(0)';
    }
}

function resetCamera() {
    gameWorld.style.transform = 'translateX(0)';
}

// Play preview animation
function playPreview(callback) {
    isPreviewPlaying = true;
    jumpBtn.disabled = true;
    previewOverlay.classList.add('active');
    highlightsContainer.innerHTML = '';
    distanceLabelsContainer.innerHTML = '';
    distanceSummary.classList.remove('show');
    labubuHint.classList.remove('show');

    const areaWidth = gameArea.offsetWidth;
    let maxPosition = 0;

    // Find the furthest item to preview
    for (const labubu of activeLabubus) {
        maxPosition = Math.max(maxPosition, labubu.position);
    }
    for (const terrain of activeTerrains) {
        maxPosition = Math.max(maxPosition, terrain.end);
    }

    // Calculate preview path
    const previewStops = [];

    // Add terrain highlights
    for (const terrain of activeTerrains) {
        let label = '';
        let className = terrain.type;
        const distanceM = pixelsToMeters(terrain.start);
        if (terrain.type === 'snow') label = `❄️ Snow @ ${distanceM}m`;
        else if (terrain.type === 'ice') label = `🧊 Ice @ ${distanceM}m`;
        else if (terrain.type === 'lava') label = `🔥 Lava @ ${distanceM}m`;

        previewStops.push({
            position: terrain.start + terrain.width / 2,
            label: label,
            className: className,
            priority: terrain.type === 'lava' ? 2 : 1
        });
    }

    // Add Labubu highlights
    for (const labubu of activeLabubus) {
        const distanceM = pixelsToMeters(labubu.position);
        const label = labubu.isLimited ? `⭐ SECRET @ ${distanceM}m!` : `🎁 Labubu @ ${distanceM}m`;
        previewStops.push({
            position: labubu.position,
            label: label,
            className: labubu.isLimited ? 'secret' : 'labubu',
            priority: labubu.isLimited ? 3 : 1
        });
    }

    // Sort by position
    previewStops.sort((a, b) => a.position - b.position);

    // Animate through preview
    let currentStop = 0;

    const animatePreview = () => {
        if (currentStop >= previewStops.length) {
            // End preview - create persistent labels
            setTimeout(() => {
                previewOverlay.classList.remove('active');
                highlightsContainer.innerHTML = '';
                gameWorld.style.transform = 'translateX(0)';
                isPreviewPlaying = false;
                jumpBtn.disabled = isSleeping;

                // Create persistent distance labels
                createDistanceLabels();

                if (callback) callback();
            }, 500);
            return;
        }

        const stop = previewStops[currentStop];
        const targetOffset = Math.max(0, stop.position - areaWidth * 0.5);

        // Pan camera
        gameWorld.style.transform = `translateX(-${targetOffset}px)`;

        // Show highlight
        const highlight = document.createElement('div');
        highlight.className = `terrain-highlight ${stop.className}`;
        highlight.textContent = stop.label;
        highlight.style.left = `${stop.position}px`;
        highlight.style.transform = 'translateX(-50%)';
        highlightsContainer.appendChild(highlight);

        // Update badge
        if (stop.className === 'secret') {
            previewBadge.textContent = '⭐ SECRET EDITION!';
            previewBadge.style.background = 'linear-gradient(135deg, #2a2a2a, #1a1a1a)';
            previewBadge.style.color = 'gold';
        } else if (stop.className === 'lava') {
            previewBadge.textContent = '⚠️ DANGER AHEAD!';
            previewBadge.style.background = 'linear-gradient(135deg, #FF4500, #CC0000)';
            previewBadge.style.color = 'white';
        } else {
            previewBadge.textContent = '🔍 PREVIEW';
            previewBadge.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            previewBadge.style.color = 'white';
        }

        currentStop++;

        // Time per stop - slower for better viewing
        const stopTime = stop.priority === 3 ? 1500 : (stop.priority === 2 ? 1200 : 1000);
        setTimeout(animatePreview, stopTime);
    };

    // Start with a longer pause
    previewBadge.textContent = '🔍 PREVIEW';
    previewBadge.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    previewBadge.style.color = 'white';

    setTimeout(animatePreview, 800);
}
