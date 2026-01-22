
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { LayoutOption, Artifact } from '../../types';
import { ExpandIcon } from '../Icons';

interface LayoutsPanelProps {
    layouts: LayoutOption[];
    focusedArtifact: Artifact | null;
    onApply: (layout: LayoutOption) => void;
    onPreview: (e: React.MouseEvent, layout: LayoutOption, html: string) => void;
}

const LayoutsPanel: React.FC<LayoutsPanelProps> = ({ layouts, focusedArtifact, onApply, onPreview }) => {

    // Memoize the base content extraction to avoid recalculating on every render unless artifact changes
    const baseContent = useMemo(() => {
        const rawHtml = focusedArtifact ? (focusedArtifact.originalHtml || focusedArtifact.html) : '';
        if (!rawHtml) return null;

        // Extract scripts and styles
        const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gim;
        const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gim;
        
        const scripts = (rawHtml.match(scriptRegex) || []).join('\n');
        const styles = (rawHtml.match(styleRegex) || []).join('\n');

        // Clean content for embedding
        const bodyContent = rawHtml
            .replace(/<!DOCTYPE html>/gi, '')
            .replace(/<html\b[^>]*>/gi, '')
            .replace(/<\/html>/gi, '')
            .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
            .replace(/<body\b[^>]*>/gi, '')
            .replace(/<\/body>/gi, '')
            .replace(scriptRegex, '')
            .replace(styleRegex, '');

        return { bodyContent, scripts, styles };
    }, [focusedArtifact]);

    const getPreviewHtml = (layout: LayoutOption) => {
        // If no artifact is focused, use the static preview provided by the layout definition
        if (!baseContent) {
            // Ensure static previews also have basic styles
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
                        .preview-scaler { transform: scale(0.95); transform-origin: top left; width: 105%; height: 105%; }
                    </style>
                </head>
                <body>
                    <div class="preview-scaler">${layout.previewHtml}</div>
                </body>
                </html>
            `;
        }

        const { bodyContent, scripts, styles } = baseContent;
        const isDefault = layout.name === "Standard Sidebar";

        // Construct a safe preview document
        // We use a 400% width container scaled down by 0.25 to simulate a full desktop view in the thumbnail
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                ${styles}
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; background: transparent; font-family: 'Inter', sans-serif; }
                    /* Simulate desktop view scaled down */
                    .preview-scaler { 
                        width: 400%; 
                        height: 400%; 
                        transform: scale(0.25); 
                        transform-origin: top left; 
                        pointer-events: none;
                        overflow: hidden;
                    }
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                    ${!isDefault ? layout.css : ''}
                </style>
            </head>
            <body>
                <div class="preview-scaler">
                    ${!isDefault ? `<div class="layout-container">${bodyContent}</div>` : bodyContent}
                </div>
                ${scripts}
            </body>
            </html>
        `;
    };

    return (
        <div className="sexy-grid">
            {layouts.map((lo, i) => {
                const previewHtml = getPreviewHtml(lo);
                return (
                    <div key={i} className="sexy-card" onClick={() => onApply(lo)}>
                        <button className="expand-btn" onClick={(e) => onPreview(e, lo, previewHtml)} title="Full Preview">
                            <ExpandIcon />
                        </button>
                        <div className="sexy-preview">
                            <iframe 
                                srcDoc={previewHtml} 
                                title={lo.name} 
                                loading="lazy" 
                                sandbox="allow-scripts allow-same-origin"
                            />
                            <div className="preview-overlay-click"></div>
                        </div>
                        <div className="sexy-label">
                            {lo.name}
                            {focusedArtifact && <span className="live-badge">Live View</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default LayoutsPanel;
