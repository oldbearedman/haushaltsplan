// src/db.js
import { openDB } from 'idb';

// Öffnet (oder legt an) die Datenbank „hauspunkte-db“, Version 1
export const dbPromise = openDB('hauspunkte-db', 1, {
  upgrade(db) {
    // Objekt-Store für Tasks, keyed by id
    if (!db.objectStoreNames.contains('tasks')) {
      db.createObjectStore('tasks', { keyPath: 'id' });
    }
    // Hier könnt ihr weitere Stores anlegen (users, stats, …)
  },
});

// Hilfsfunktionen
export const idbGetAll = async (storeName) => {
  const db = await dbPromise;
  return db.getAll(storeName);
};

export const idbPut = async (storeName, item) => {
  const db = await dbPromise;
  return db.put(storeName, item);
};

export const idbDelete = async (storeName, key) => {
  const db = await dbPromise;
  return db.delete(storeName, key);
};
