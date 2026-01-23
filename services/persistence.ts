
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { RepoHistoryItem, ArticleHistoryItem, Task, DevStudioState } from '../types';

const DB_NAME = 'flash_n_frame_db';
const DB_VERSION = 2;

const STORES = {
  PROJECT: 'project',
  TASKS: 'tasks',
  REPO_HISTORY: 'repo_history',
  ARTICLE_HISTORY: 'article_history',
  USER_PREFERENCES: 'user_preferences',
  OFFLINE_QUEUE: 'offline_queue'
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORES.PROJECT)) {
        db.createObjectStore(STORES.PROJECT);
      }
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.REPO_HISTORY)) {
        db.createObjectStore(STORES.REPO_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.ARTICLE_HISTORY)) {
        db.createObjectStore(STORES.ARTICLE_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
        db.createObjectStore(STORES.USER_PREFERENCES);
      }
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const PersistenceService = {
  // Project State
  async saveCurrentProject(state: DevStudioState) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.PROJECT, 'readwrite');
      tx.objectStore(STORES.PROJECT).put(state, 'current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getCurrentProject(): Promise<DevStudioState | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PROJECT, 'readonly');
      const req = tx.objectStore(STORES.PROJECT).get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  // Tasks
  async saveTask(task: Task) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readwrite');
      tx.objectStore(STORES.TASKS).put(task);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async updateTask(task: Task) {
    return this.saveTask(task); // Same logic for put
  },

  async deleteTask(id: string) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readwrite');
      tx.objectStore(STORES.TASKS).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllTasks(): Promise<Task[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readonly');
      const req = tx.objectStore(STORES.TASKS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  // History
  async addRepoHistory(item: RepoHistoryItem) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.REPO_HISTORY, 'readwrite');
      tx.objectStore(STORES.REPO_HISTORY).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllRepoHistory(): Promise<RepoHistoryItem[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.REPO_HISTORY, 'readonly');
      // Limit to 20 most recent to avoid huge memory usage, handled in memory for now
      const req = tx.objectStore(STORES.REPO_HISTORY).getAll();
      req.onsuccess = () => {
         const res = req.result || [];
         // sort descending by date
         resolve(res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      };
      req.onerror = () => reject(req.error);
    });
  },

  async addArticleHistory(item: ArticleHistoryItem) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.ARTICLE_HISTORY, 'readwrite');
      tx.objectStore(STORES.ARTICLE_HISTORY).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllArticleHistory(): Promise<ArticleHistoryItem[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.ARTICLE_HISTORY, 'readonly');
      const req = tx.objectStore(STORES.ARTICLE_HISTORY).getAll();
      req.onsuccess = () => {
         const res = req.result || [];
         resolve(res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      };
      req.onerror = () => reject(req.error);
    });
  },

  async saveUserPreference(key: string, value: unknown) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.USER_PREFERENCES, 'readwrite');
      tx.objectStore(STORES.USER_PREFERENCES).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getUserPreference<T>(key: string): Promise<T | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USER_PREFERENCES, 'readonly');
      const req = tx.objectStore(STORES.USER_PREFERENCES).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async getAllUserPreferences(): Promise<Record<string, unknown>> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USER_PREFERENCES, 'readonly');
      const store = tx.objectStore(STORES.USER_PREFERENCES);
      const result: Record<string, unknown> = {};
      
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          result[cursor.key as string] = cursor.value;
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  },

  async addToOfflineQueue(action: { type: string; payload: unknown; timestamp: number }) {
    const db = await openDB();
    return new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const req = tx.objectStore(STORES.OFFLINE_QUEUE).add(action);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  },

  async getOfflineQueue(): Promise<Array<{ id: number; type: string; payload: unknown; timestamp: number }>> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readonly');
      const req = tx.objectStore(STORES.OFFLINE_QUEUE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async clearOfflineQueue() {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      tx.objectStore(STORES.OFFLINE_QUEUE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async removeFromOfflineQueue(id: number) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      tx.objectStore(STORES.OFFLINE_QUEUE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};
