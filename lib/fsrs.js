// lib/fsrs.js
// Implementation of FSRS-4.5 for optimized spaced repetition
export const FSRS = {
  weights: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.9,

  initCard: () => ({
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    repetitions: 0,
    lapses: 0,
    state: 0, // 0: New, 1: Learning, 2: Review
    lastReview: null,
    nextReview: Date.now()
  }),

  // Quality: 0 (Again), 1 (Hard), 2 (Good), 3 (Easy)
  step: (card, quality) => {
    const s = [...FSRS.weights];
    const g = quality + 1; // 1-4
    let { stability, difficulty, repetitions, lapses, state } = card;

    if (state === 0 || state === 1) { // New or Learning
      if (g === 1) { // Again
        stability = s[0];
        difficulty = s[4];
      } else {
        stability = s[g - 1];
        difficulty = s[4] - s[5] * (g - 3);
      }
      state = g === 4 ? 2 : 1;
    } else { // Review
      const retrievability = Math.pow(1 + card.elapsedDays / (9 * stability), -1);
      if (g === 1) { // Again
        lapses += 1;
        stability = s[11] * Math.pow(difficulty, -s[12]) * (Math.pow(stability + 1, s[13]) - 1) * Math.exp(s[14] * (1 - retrievability));
        difficulty = Math.min(Math.max(difficulty + s[6], 1), 10);
      } else {
        const factor = 1 + Math.exp(s[8]) * (11 - difficulty) * Math.pow(stability, -s[9]) * (Math.exp(s[10] * (1 - retrievability)) - 1);
        stability *= factor;
        difficulty = Math.min(Math.max(difficulty - s[7] * (g - 3), 1), 10);
      }
    }

    repetitions += 1;
    const interval = state === 1 ? 0 : Math.max(1, Math.round(stability));
    const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

    return {
      ...card,
      stability,
      difficulty,
      repetitions,
      lapses,
      state,
      lastReview: Date.now(),
      nextReview,
      scheduledDays: interval
    };
  }
};
