
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Session } from '../types';

const STORAGE_KEY = 'flash_ui_sessions_v1';

/**
 * Loads sessions from localStorage.
 * Returns an empty array if parsing fails or no data exists.
 */
export const loadSessions = (): Session[] => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return [];
    return JSON.parse(serialized);
  } catch (e) {
    console.error('Failed to load sessions from local storage:', e);
    return [];
  }
};

/**
 * Saves sessions to localStorage.
 * Uses a simple debounce mechanism handled by the caller or raw save here.
 */
export const saveSessions = (sessions: Session[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions to local storage:', e);
  }
};

/**
 * Clears all saved sessions.
 */
export const clearSessions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear sessions:', e);
  }
};
