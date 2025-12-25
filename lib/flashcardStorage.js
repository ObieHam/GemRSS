// Flashcard data with SM-2 spaced repetition algorithm
// Based on Anki's implementation

export const flashcardDb = {
  // Get all flashcard review data
  getAll: async () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('flashcardReviews');
    return data ? JSON.parse(data) : [];
  },

  // Get review data for a specific word
  get: async (wordId) => {
    if (typeof window === 'undefined') return null;
    const all = await flashcardDb.getAll();
    return all.find(r => r.wordId === wordId);
  },

  // Save or update review data
  save: async (reviewData) => {
    if (typeof window === 'undefined') return;
    const all = await flashcardDb.getAll();
    const index = all.findIndex(r => r.wordId === reviewData.wordId);
    
    if (index >= 0) {
      all[index] = reviewData;
    } else {
      all.push(reviewData);
    }
    
    localStorage.setItem('flashcardReviews', JSON.stringify(all));
  },

  // Delete review data
  delete: async (wordId) => {
    if (typeof window === 'undefined') return;
    const all = await flashcardDb.getAll();
    const filtered = all.filter(r => r.wordId !== wordId);
    localStorage.setItem('flashcardReviews', JSON.stringify(filtered));
  },

  // Initialize review data for a new word
  initialize: async (wordId) => {
    const existing = await flashcardDb.get(wordId);
    if (existing) return existing;

    const newReview = {
      wordId,
      easeFactor: 2.5,        // Starting ease factor (Anki default)
      interval: 0,            // Days until next review
      repetitions: 0,         // Number of successful reviews
      nextReview: Date.now(), // Due now
      lastReviewed: null,
      lapses: 0              // Number of times forgotten
    };

    await flashcardDb.save(newReview);
    return newReview;
  },

  // Calculate next review using SM-2 algorithm
  calculateNextReview: (reviewData, quality) => {
    // quality: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
    let { easeFactor, interval, repetitions, lapses } = reviewData;

    // If quality < 2, card is failed
    if (quality < 2) {
      repetitions = 0;
      interval = 0;
      lapses += 1;
    } else {
      // Successful review
      if (repetitions === 0) {
        interval = 1; // 1 day
      } else if (repetitions === 1) {
        interval = 6; // 6 days
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }

    // Update ease factor based on quality (SM-2 formula)
    easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    
    // Ease factor should be at least 1.3
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    // Calculate next review date
    const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

    return {
      ...reviewData,
      easeFactor,
      interval,
      repetitions,
      nextReview,
      lastReviewed: Date.now(),
      lapses
    };
  },

  // Get cards due for review
  getDueCards: async (allWords) => {
    const reviews = await flashcardDb.getAll();
    const now = Date.now();
    
    const dueCards = [];
    
    for (const word of allWords) {
      let review = reviews.find(r => r.wordId === word.id);
      
      // If no review data exists, initialize it
      if (!review) {
        review = await flashcardDb.initialize(word.id);
      }
      
      // Check if card is due
      if (review.nextReview <= now) {
        dueCards.push({
          word,
          review
        });
      }
    }
    
    return dueCards;
  },

  // Get statistics
  getStats: async (allWords) => {
    const reviews = await flashcardDb.getAll();
    const now = Date.now();
    
    let newCards = 0;
    let learning = 0;
    let review = 0;
    
    for (const word of allWords) {
      const reviewData = reviews.find(r => r.wordId === word.id);
      
      if (!reviewData || reviewData.repetitions === 0) {
        newCards++;
      } else if (reviewData.interval < 21) { // Less than 3 weeks
        learning++;
      } else {
        review++;
      }
    }
    
    const dueToday = (await flashcardDb.getDueCards(allWords)).length;
    
    return {
      newCards,
      learning,
      review,
      dueToday,
      total: allWords.length
    };
  }
};
