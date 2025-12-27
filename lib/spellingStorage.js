// lib/spellingStorage.js
import { FSRS } from './fsrs';

export const spellingDb = {
  getStorageKey: (mode) => mode === 'ielts' ? 'ieltsSpellingReviews' : 'spellingReviews',

  getStats: async (allWords, mode = 'general') => {
    if (typeof window === 'undefined') return { newWords: 0, learning: 0, review: 0, dueToday: 0 };
    const key = spellingDb.getStorageKey(mode);
    const data = localStorage.getItem(key);
    const reviews = data ? JSON.parse(data) : {};
    
    let newWords = 0, learning = 0, reviewCount = 0, dueToday = 0;
    const now = Date.now();

    allWords.forEach(word => {
      const card = reviews[word.id];
      if (!card || card.repetitions === 0) {
        newWords++;
      } else if (card.stability < 21) {
        learning++;
      } else {
        reviewCount++;
      }

      // Words are due if they have no card yet (New) or if their nextReview has passed
      if (!card || card.nextReview <= now) {
        dueToday++;
      }
    });

    return { newWords, learning, review: reviewCount, dueToday, total: allWords.length };
  },

  getDueCards: async (allWords, mode = 'general') => {
    if (typeof window === 'undefined') return [];
    const key = spellingDb.getStorageKey(mode);
    const data = localStorage.getItem(key);
    const reviews = data ? JSON.parse(data) : {};
    const now = Date.now();
    
    return allWords
      .map(word => ({ word, card: reviews[word.id] || FSRS.initCard() }))
      .filter(item => !item.card.lastReview || item.card.nextReview <= now)
      .sort((a, b) => (a.card.nextReview || 0) - (b.card.nextReview || 0));
  },

  recordResult: async (wordId, quality, mode = 'general') => {
    if (typeof window === 'undefined') return;
    const key = spellingDb.getStorageKey(mode);
    const data = localStorage.getItem(key);
    const reviews = data ? JSON.parse(data) : {};
    const card = reviews[wordId] || FSRS.initCard();
    
    const updated = FSRS.step(card, quality);
    reviews[wordId] = updated;
    localStorage.setItem(key, JSON.stringify(reviews));
  }
};
