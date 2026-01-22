
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CloseIcon } from './Icons';

interface PreviewModalProps {
    item: { html: string; name: string } | null;
    onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <div className="preview-overlay">
            <div className="preview-modal">
                <div className="preview-header">
                    <h3>{item.name}</h3>
                    <button onClick={onClose} className="close-preview-button">
                        <CloseIcon />
                    </button>
                </div>
                <div className="preview-content">
                    <iframe srcDoc={item.html} title="Preview" />
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;
