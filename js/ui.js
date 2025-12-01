// UI Module - UI updates, rendering, sleep/energy system

// Calculate XP needed for level
function getXpNeeded(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Get current skin bonus
function getSkinBonus() {
    const skin = skins.find(s => s.id === gameState.currentSkin);
    return skin ? skin.bonus : 1.0;
}

// Get current skin cooldown reduction
function getSkinCooldownReduction() {
    const skin = skins.find(s => s.id === gameState.currentSkin);
    return skin ? skin.cooldownReduction : 1.0;
}

// Format time as M:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Start awake timer
function startAwakeTimer() {
    if (awakeInterval) clearInterval(awakeInterval);

    awakeInterval = setInterval(() => {
        if (isSleeping || gameState.isJumping) return;

        awakeTimeRemaining--;
        updateAwakeDisplay();

        if (awakeTimeRemaining <= 0) {
            startSleep();
        }
    }, 1000);
}

// Update awake timer display
function updateAwakeDisplay() {
    awakeTimerDisplay.textContent = `Energy: ${formatTime(awakeTimeRemaining)}`;

    if (awakeTimeRemaining <= 30) {
        awakeTimerDisplay.classList.add('warning');
    } else {
        awakeTimerDisplay.classList.remove('warning');
    }
}

// Start sleep mode
function startSleep() {
    isSleeping = true;
    clearInterval(awakeInterval);

    // Calculate sleep duration based on skin
    const sleepDuration = Math.floor(BASE_SLEEP_DURATION * getSkinCooldownReduction());
    sleepTimeRemaining = sleepDuration;

    // Update UI
    frog.classList.add('sleeping');
    sleepOverlay.classList.add('active');
    jumpBtn.disabled = true;
    sleepProgress.style.width = '0%';

    // Start sleep countdown
    sleepInterval = setInterval(() => {
        sleepTimeRemaining--;
        sleepCountdown.textContent = sleepTimeRemaining;

        const progress = ((Math.floor(BASE_SLEEP_DURATION * getSkinCooldownReduction()) - sleepTimeRemaining) /
                          Math.floor(BASE_SLEEP_DURATION * getSkinCooldownReduction())) * 100;
        sleepProgress.style.width = `${progress}%`;

        if (sleepTimeRemaining <= 0) {
            wakeUp();
        }
    }, 1000);
}

// Wake up from sleep
function wakeUp() {
    isSleeping = false;
    clearInterval(sleepInterval);

    // Reset awake timer
    awakeTimeRemaining = AWAKE_DURATION;
    updateAwakeDisplay();

    // Update UI
    frog.classList.remove('sleeping');
    sleepOverlay.classList.remove('active');
    jumpBtn.disabled = false;

    // Restart awake timer
    startAwakeTimer();
}

// Update UI
function updateUI() {
    levelDisplay.textContent = gameState.level;
    xpDisplay.textContent = gameState.xp;
    xpNeededDisplay.textContent = getXpNeeded(gameState.level);
    bestJumpDisplay.textContent = gameState.bestJump.toFixed(1);
    bestDisplay.textContent = gameState.bestJump.toFixed(1);
    renderSkins();
}

// Render skins
function renderSkins() {
    skinsGrid.innerHTML = '';
    skins.forEach(skin => {
        const isUnlocked = gameState.unlockedSkins.includes(skin.id);
        const isSelected = gameState.currentSkin === skin.id;

        const card = document.createElement('div');
        card.className = `skin-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

        let bgStyle = '';
        if (skin.color === 'rainbow') {
            bgStyle = 'background: linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3);';
        } else {
            bgStyle = `background: ${skin.color};`;
        }

        const cooldownReductionPercent = Math.round((1 - skin.cooldownReduction) * 100);

        card.innerHTML = `
            <div class="skin-preview">
                <div class="skin-preview-circle" style="${bgStyle}"></div>
            </div>
            <div class="skin-name">${skin.name}</div>
            <div class="skin-bonus">+${Math.round((skin.bonus - 1) * 100)}% Jump</div>
            <div class="skin-cooldown">-${cooldownReductionPercent}% Sleep Time</div>
            ${!isUnlocked ? `<div class="skin-unlock">🔒 Unlock at Level ${skin.unlockLevel}</div>` : ''}
        `;

        if (isUnlocked) {
            card.onclick = () => selectSkin(skin.id);
        }

        skinsGrid.appendChild(card);
    });
}

// Select skin
function selectSkin(skinId) {
    if (gameState.unlockedSkins.includes(skinId)) {
        gameState.currentSkin = skinId;
        frog.className = `frog skin-${skinId}`;
        updateUI();
        saveGame();
    }
}

// Show result with terrain information
function showResultWithTerrain(distance, xp, levelsGained, newUnlocks, isNewBest, labubuBonus, hitLava, lavaPenalty, didSlide, labubuCount) {
    resultDistance.textContent = distance.toFixed(1);

    // Build XP display
    let xpHtml = '';
    const baseXp = xp - labubuBonus + lavaPenalty;

    if (labubuBonus > 0 || lavaPenalty > 0 || didSlide) {
        xpHtml = `${baseXp}`;
        if (labubuBonus > 0) {
            xpHtml += ` <span style="color: #FFD700;">+${labubuBonus} 🎁${labubuCount > 1 ? ` (x${labubuCount})` : ''}</span>`;
        }
        if (lavaPenalty > 0) {
            xpHtml += ` <span style="color: #FF4500;">-${lavaPenalty} 🔥</span>`;
        }
        if (didSlide) {
            xpHtml += ` <span style="color: #87CEEB;">🧊</span>`;
        }
    } else {
        xpHtml = `${xp}`;
    }
    resultXp.innerHTML = xpHtml;

    if (levelsGained > 0) {
        levelUpMsg.style.display = 'block';
        levelUpMsg.textContent = `🎉 LEVEL UP! Now Level ${gameState.level}!`;
    } else {
        levelUpMsg.style.display = 'none';
    }

    if (newUnlocks.length > 0) {
        unlockMsg.style.display = 'block';
        unlockMsg.textContent = `🎨 Unlocked: ${newUnlocks.join(', ')}!`;
    } else {
        unlockMsg.style.display = 'none';
    }

    // Set title based on outcome
    if (hitLava) {
        resultPopup.querySelector('h2').textContent = '🔥 Burned!';
    } else if (isNewBest) {
        resultPopup.querySelector('h2').textContent = '🏆 New Record!';
    } else if (labubuBonus >= 300) {
        resultPopup.querySelector('h2').textContent = '🌟 RARE FIND!';
    } else if (labubuCount > 1) {
        resultPopup.querySelector('h2').textContent = '🎁 Multi-Catch!';
    } else if (labubuBonus > 0) {
        resultPopup.querySelector('h2').textContent = '🎁 Labubu Bonus!';
    } else if (didSlide) {
        resultPopup.querySelector('h2').textContent = '🧊 Ice Slide!';
    } else {
        resultPopup.querySelector('h2').textContent = 'Great Jump!';
    }

    overlay.style.display = 'block';
    resultPopup.style.display = 'block';
}

// Show result popup (legacy function)
function showResult(distance, xp, levelsGained, newUnlocks, isNewBest, labubuBonus = 0) {
    resultDistance.textContent = distance.toFixed(1);

    // Show XP with Labubu bonus breakdown if applicable
    if (labubuBonus > 0) {
        const baseXp = xp - labubuBonus;
        resultXp.innerHTML = `${baseXp} <span style="color: #FFD700;">+ ${labubuBonus} 🎁</span>`;
    } else {
        resultXp.textContent = xp;
    }

    if (levelsGained > 0) {
        levelUpMsg.style.display = 'block';
        levelUpMsg.textContent = `🎉 LEVEL UP! Now Level ${gameState.level}!`;
    } else {
        levelUpMsg.style.display = 'none';
    }

    if (newUnlocks.length > 0) {
        unlockMsg.style.display = 'block';
        unlockMsg.textContent = `🎨 Unlocked: ${newUnlocks.join(', ')}!`;
    } else {
        unlockMsg.style.display = 'none';
    }

    if (isNewBest) {
        resultPopup.querySelector('h2').textContent = '🏆 New Record!';
    } else if (labubuBonus >= 300) {
        resultPopup.querySelector('h2').textContent = '🌟 RARE FIND!';
    } else if (labubuBonus > 0) {
        resultPopup.querySelector('h2').textContent = '🎁 Labubu Bonus!';
    } else {
        resultPopup.querySelector('h2').textContent = 'Great Jump!';
    }

    overlay.style.display = 'block';
    resultPopup.style.display = 'block';
}
