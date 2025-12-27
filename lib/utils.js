// lib/utils.js
export const isValidWord = (word) => {
  if (word === word.toUpperCase() && word.length > 3) return false;
  if (/\d/.test(word)) return false;
  if (!/^[a-z]+$/i.test(word)) return false;
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(word)) return false;
  if (word.length < 4 || word.length > 20) return false;
  const pdfTerms = ['tounicode', 'descendantfonts', 'cmap', 'basefont', 'subtype', 'encoding'];
  if (pdfTerms.includes(word.toLowerCase())) return false;
  return true;
};

export const getSettings = () => {
  if (typeof window === 'undefined') {
    return {
      apiSource: 'free-dictionary',
      accent: 'us',
      autoSave: false,
      highlightNewWords: true,
      mwApiKey: ''
    };
  }
  const settings = localStorage.getItem('appSettings');
  return settings ? JSON.parse(settings) : {
    apiSource: 'free-dictionary',
    accent: 'us',
    autoSave: false,
    highlightNewWords: true,
    mwApiKey: ''
  };
};

export const saveSettings = (settings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('appSettings', JSON.stringify(settings));
};
