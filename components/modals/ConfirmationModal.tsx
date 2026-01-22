
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirmation-modal-overlay">
            <div className="confirmation-modal">
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="confirmation-actions">
                    <button className="confirm-cancel" onClick={onCancel}>{cancelText}</button>
                    <button className="confirm-destructive" onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
