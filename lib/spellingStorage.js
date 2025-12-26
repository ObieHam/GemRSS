// lib/spellingStorage.js
import { FSRS } from './fsrs';

export const spellingDb = {
  getStats: async (allWords) => {
    if (typeof window === 'undefined') return { totalAttempts: 0, accuracy: 0, totalMistakes: 0 };
    const data = localStorage.getItem('spellingReviews');
    const reviews = data ? JSON.parse(data) : {};
    
    let totalAttempts = 0;
    let totalCorrect = 0;
    let totalMistakes = 0;

    allWords.forEach(word => {
      const review = reviews[word.id];
      if (review) {
        totalAttempts += review.repetitions;
        totalMistakes += review.lapses;
        totalCorrect += (review.repetitions - review.lapses);
      }
    });

    return {
      totalAttempts,
      accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
      totalMistakes
    };
  },

  getReview: async (wordId) => {
    const data = localStorage.getItem('spellingReviews');
    const reviews = data ? JSON.parse(data) : {};
    return reviews[wordId] || FSRS.initCard();
  },

  recordResult: async (wordId, quality) => {
    const data = localStorage.getItem('spellingReviews');
    const reviews = data ? JSON.parse(data) : {};
    const card = reviews[wordId] || FSRS.initCard();
    
    const updated = FSRS.step(card, quality);
    reviews[wordId] = updated;
    localStorage.setItem('spellingReviews', JSON.stringify(reviews));
  }
};
