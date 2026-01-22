
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Session } from '../../types';
import { TrashIcon } from '../Icons';

interface HistoryPanelProps {
    sessions: Session[];
    currentSessionIndex: number;
    onJumpToSession: (index: number) => void;
    onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ sessions, currentSessionIndex, onJumpToSession, onDeleteSession }) => {
    return (
        <div className="history-panel">
            {sessions.length === 0 ? (
                <div className="empty-history">No history yet. Start creating!</div>
            ) : (
                <div className="history-list">
                    {sessions.slice().reverse().map((sess, i) => {
                        const originalIndex = sessions.length - 1 - i;
                        return (
                            <div 
                                key={sess.id} 
                                className={`history-item ${originalIndex === currentSessionIndex ? 'active' : ''}`}
                                onClick={() => onJumpToSession(originalIndex)}
                            >
                                <div className="history-item-content">
                                    <div className="history-prompt">{sess.prompt}</div>
                                    <div className="history-meta">{new Date(sess.timestamp).toLocaleTimeString()}</div>
                                </div>
                                <button className="delete-session-btn" onClick={(e) => onDeleteSession(sess.id, e)}>
                                    <TrashIcon />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;
