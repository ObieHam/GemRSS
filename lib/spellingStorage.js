// lib/spellingStorage.js
import { FSRS } from './fsrs';

export const spellingDb = {
  getStats: async (allWords) => {
    const data = localStorage.getItem('spellingReviews');
    const reviews = data ? JSON.parse(data) : {};
    
    let newWords = 0;
    let learning = 0;
    let review = 0;
    const now = Date.now();
    let dueToday = 0;

    allWords.forEach(word => {
      const card = reviews[word.id];
      if (!card || card.repetitions === 0) {
        newWords++;
      } else if (card.stability < 21) {
        learning++;
      } else {
        review++;
      }

      if (card && card.nextReview <= now) {
        dueToday++;
      } else if (!card) {
        dueToday++; // New words are considered due
      }
    });

    return { newWords, learning, review, dueToday, total: allWords.length };
  },

  getDueCards: async (allWords) => {
    const data = localStorage.getItem('spellingReviews');
    const reviews = data ? JSON.parse(data) : {};
    const now = Date.now();
    
    return allWords
      .map(word => ({ word, card: reviews[word.id] || FSRS.initCard() }))
      .filter(item => item.card.nextReview <= now)
      .sort((a, b) => a.card.nextReview - b.card.nextReview);
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
