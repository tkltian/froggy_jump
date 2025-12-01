// Storage Module - Save/Load game state

// Save game
function saveGame() {
    localStorage.setItem('froggyJump', JSON.stringify(gameState));
}

// Load game
function loadGame() {
    const saved = localStorage.getItem('froggyJump');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(gameState, data);
        // Reset runtime state that shouldn't be persisted
        gameState.isJumping = false;
        gameState.isCharging = false;
        gameState.power = 0;
        frog.className = `frog skin-${gameState.currentSkin}`;
    }
    updateUI();
}
