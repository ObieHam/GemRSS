export const getSettings = () => {
  if (typeof window === 'undefined') {
    return {
      apiSource: 'free-dictionary',
      accent: 'us',
      autoSave: false,
      highlightNewWords: true, // New setting
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
export const getSettings = () => {
  if (typeof window === 'undefined') {
    return {
      apiSource: 'free-dictionary',
      accent: 'us',
      autoSave: false,
      highlightNewWords: true, // New setting
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
