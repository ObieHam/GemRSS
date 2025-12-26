// lib/spellingStorage.js
export const spellingDb = {
  getStats: async (allWords) => {
    if (typeof window === 'undefined') return { totalAttempts: 0, accuracy: 0, misspelledCount: 0 };
    const data = localStorage.getItem('spellingStats');
    const stats = data ? JSON.parse(data) : {};
    
    let totalAttempts = 0;
    let totalCorrect = 0;
    let misspelledCount = 0;

    for (const word of allWords) {
      const s = stats[word.id] || { correct: 0, incorrect: 0 };
      const wordAttempts = s.correct + s.incorrect;
      totalAttempts += wordAttempts;
      totalCorrect += s.correct;
      if (s.incorrect > 0) misspelledCount++;
    }

    return {
      totalAttempts,
      accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
      misspelledCount
    };
  },
  recordResult: async (wordId, isCorrect) => {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem('spellingStats');
    const stats = data ? JSON.parse(data) : {};
    if (!stats[wordId]) stats[wordId] = { correct: 0, incorrect: 0 };
    
    if (isCorrect) stats[wordId].correct++;
    else stats[wordId].incorrect++;
    
    localStorage.setItem('spellingStats', JSON.stringify(stats));
  }
};
