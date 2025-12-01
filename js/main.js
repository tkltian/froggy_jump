// Main Module - Event listeners and initialization

// Event listeners
jumpBtn.addEventListener('mousedown', startCharging);
jumpBtn.addEventListener('mouseup', stopCharging);
jumpBtn.addEventListener('mouseleave', stopCharging);
jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startCharging();
}, { passive: false });
jumpBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopCharging();
}, { passive: false });
jumpBtn.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    stopCharging();
}, { passive: false });

continueBtn.addEventListener('click', continueGame);
overlay.addEventListener('click', continueGame);

// Initialize
loadGame();
updateAwakeDisplay();
startAwakeTimer();
initializeJumpSession();
