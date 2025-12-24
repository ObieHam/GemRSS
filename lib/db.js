import Dexie from 'dexie';

export const db = new Dexie('VocabDatabase');
db.version(1).stores({
  vocabulary: '++id, &word, definition, pronunciation, context, dateAdded'
});
