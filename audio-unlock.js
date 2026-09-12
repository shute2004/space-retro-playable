// Mobile WebAudio recovery helper.
// Keeps YouTube Playables mute/pause state authoritative while making
// browser-hosted builds recover from suspended/interrupted AudioContexts.
(function () {
    function unlockAudio() {
        try {
            if (!audioEnabled || pausedByPlatform) return;

            if (!audioCtx) {
                const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextCtor) return;
                audioCtx = new AudioContextCtor();
            }

            if (audioCtx.state !== 'running' && audioCtx.state !== 'closed') {
                audioCtx.resume().catch(() => {});
            }
        } catch (_) {}
    }

    window.addEventListener('pointerdown', unlockAudio, { capture: true });
    window.addEventListener('touchstart', unlockAudio, { capture: true, passive: true });
    window.addEventListener('click', unlockAudio, { capture: true });
    window.addEventListener('keydown', unlockAudio, { capture: true });

    window.addEventListener('pageshow', unlockAudio);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) unlockAudio();
    });
})();
