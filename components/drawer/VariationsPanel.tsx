
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComponentVariation } from '../../types';
import { ThinkingIcon, SparklesIcon, ExpandIcon } from '../Icons';

interface VariationsPanelProps {
    variations: ComponentVariation[];
    isLoading: boolean;
    onApply: (html: string) => void;
    onPreview: (variation: ComponentVariation) => void;
    onLoadMore: () => void;
}

const VariationsPanel: React.FC<VariationsPanelProps> = ({ variations, isLoading, onApply, onPreview, onLoadMore }) => {
    return (
        <div className="sexy-grid">
            {isLoading && variations.length === 0 && (
                <div className="loading-state"><ThinkingIcon /> Designing...</div>
            )}
            {variations.map((v, i) => (
                <div key={i} className="sexy-card" onClick={() => onApply(v.html)}>
                    <button className="expand-btn" onClick={(e) => { e.stopPropagation(); onPreview(v); }}><ExpandIcon /></button>
                    <div className="sexy-preview"><iframe srcDoc={v.html} title={v.name} loading="lazy" /></div>
                    <div className="sexy-label">{v.name}</div>
                </div>
            ))}
            {variations.length > 0 && (
                <button className="load-more-btn" onClick={onLoadMore} disabled={isLoading || variations.length >= 6}>
                    {isLoading ? <ThinkingIcon /> : <SparklesIcon />} {isLoading ? "Generating..." : "Generate More"}
                </button>
            )}
        </div>
    );
};

export default VariationsPanel;
