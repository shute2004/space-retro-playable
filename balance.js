// Enemy balance override for SPACE RETRO.
// Keeps the existing score-based scaling while making the baseline game harder.
getDifficulty = function() {
    const tier = Math.floor(score / SCORE_PER_DIFFICULTY_TIER);
    return {
        tier,
        moveIntervalPenalty: 4 + tier * 0.9,
        moveStep: 12 + Math.min(11, tier * 0.35),
        dropStep: 18 + Math.min(22, tier * 0.55),
        fireChance: Math.min(0.7, 0.05 + (wave * 0.007) + (tier * 0.005)),
        bulletSpeed: Math.min(13, 5.5 + (tier * 0.14)),
        volleyCount: 1 + Math.min(2, Math.floor(tier / 30))
    };
};
