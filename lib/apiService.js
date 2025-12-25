// API call functions with caching
export const fetchFromFreeDictionary = async (word) => {
  const cacheKey = `dict_free_${word}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) throw new Error('Word not found');
    
    const data = await res.json();
    const entry = data[0];
    
    const result = {
      word: entry.word.toLowerCase(),
      definition: entry.meanings[0]?.definitions[0]?.definition || 'No definition found',
      example: entry.meanings[0]?.definitions[0]?.example || null,
      phonetics: entry.phonetics || [],
      dateAdded: Date.now()
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    }
    return result;
  } catch (error) {
    return { error: 'Word not found' };
  }
};

export const fetchFromMerriamWebster = async (word, apiKey) => {
  const cacheKey = `dict_mw_${word}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  if (!apiKey) return { error: 'API key required' };

  try {
    const res = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`);
    const data = await res.json();

    if (data && data[0] && typeof data[0] === 'object') {
      const audioFile = data[0].hwi?.prs?.[0]?.sound?.audio;
      let audioUrl = null;

      if (audioFile) {
        let subdirectory = audioFile.charAt(0);
        if (audioFile.startsWith("bix")) subdirectory = "bix";
        else if (audioFile.startsWith("gg")) subdirectory = "gg";
        else if (/^\d/.test(subdirectory)) subdirectory = "number";
        audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audioFile}.mp3`;
      }

      const result = {
        word: data[0].hwi?.hw?.replace(/\*/g, "").toLowerCase() || word.toLowerCase(),
        definition: data[0].shortdef?.[0] || "No definition found",
        audioUrl: audioUrl,
        example: null,
        dateAdded: Date.now()
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      }
      return result;
    }
    return { error: 'Word not found' };
  } catch (error) {
    return { error: 'API Error' };
  }
};

export const fetchDefinition = async (word, settings) => {
  if (settings.apiSource === 'free-dictionary') {
    return await fetchFromFreeDictionary(word);
  } else {
    return await fetchFromMerriamWebster(word, settings.mwApiKey);
  }
};
