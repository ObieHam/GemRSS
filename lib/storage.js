// Database operations using localStorage
export const db = {
  vocabulary: {
    toArray: async () => {
      if (typeof window === 'undefined') return [];
      const words = localStorage.getItem('vocabWords');
      return words ? JSON.parse(words) : [];
    },
    add: async (word) => {
      if (typeof window === 'undefined') return word;
      const words = await db.vocabulary.toArray();
      const newWord = { ...word, id: Date.now() + Math.random() };
      words.push(newWord);
      localStorage.setItem('vocabWords', JSON.stringify(words));
      return newWord;
    },
    delete: async (id) => {
      if (typeof window === 'undefined') return;
      const words = await db.vocabulary.toArray();
      const filtered = words.filter(w => w.id !== id);
      localStorage.setItem('vocabWords', JSON.stringify(filtered));
    },
    clear: async () => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('vocabWords', JSON.stringify([]));
    },
    where: (field) => ({
      equals: (value) => ({
        first: async () => {
          if (typeof window === 'undefined') return null;
          const words = await db.vocabulary.toArray();
          return words.find(w => w[field] === value);
        }
      })
    })
  }
};
