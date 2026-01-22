
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';

/**
 * Supported enhancement types for the AI modification workflow.
 * - 'enhance-code': General structural optimization.
 * - 'dummy': Inject realistic placeholder data.
 * - 'file-populate': Inject data from an uploaded file (CSV, JSON, PDF, etc.).
 * - 'persona': Inject brand identity and user personas.
 * - 'a11y': Fix accessibility issues (WCAG).
 * - 'responsive': Fix mobile/tablet layout issues.
 * - 'tailwind': Convert custom CSS to Tailwind utility classes.
 * - 'format': Prettify code.
 * - 'charts': Inject Chart.js visualizations.
 * - 'content': (Deprecated/Legacy) Update content images.
 */
export type EnhanceType = 'a11y' | 'format' | 'dummy' | 'responsive' | 'tailwind' | 'charts' | 'content' | 'file-populate' | 'persona' | 'enhance-code';

interface EnhancePanelProps {
    /** Callback triggered when a user selects an enhancement option. */
    onEnhance: (type: EnhanceType, file?: File) => void;
}

const ENHANCE_SECTIONS = [
    {
        title: "AI Engineering Core",
        items: [
            { id: 'enhance-code', label: 'Deep Enhance Code', desc: 'Full architectural audit to optimize structure and interactivity.', icon: '✨', variant: 'purple' }
        ]
    },
    {
        title: "Data & Content",
        items: [
            { id: 'dummy', label: 'Smart Dummy Data', desc: 'Inject realistic business data, metrics, and placeholder images.', icon: '🔢', variant: 'green' },
            { id: 'file-populate', label: 'File Populate', desc: 'Upload a document (txt, pdf, csv, json, md) to inject real data.', icon: '📄', variant: 'blue' },
            { id: 'persona', label: 'Persona & Identity', desc: 'Generate and inject realistic user personas and brand identity.', icon: '👤' }
        ]
    },
    {
        title: "Technical Refinement",
        items: [
            { id: 'a11y', label: 'Fix Accessibility', desc: 'Optimize ARIA labels, contrast, and semantic tags for WCAG 2.1.', icon: '♿' },
            { id: 'responsive', label: 'Mobile Optimization', desc: 'Refine CSS for perfect responsiveness across all devices.', icon: '📱' },
            { id: 'tailwind', label: 'Utility Refactor', desc: 'Rewrite all custom CSS using Tailwind CSS utility classes.', icon: '🌊', variant: 'cyan' },
            { id: 'format', label: 'Prettify', desc: 'Format and clean the code for maximum readability.', icon: '📝' }
        ]
    },
    {
        title: "Visual Intelligence",
        items: [
            { id: 'charts', label: 'Interactive Charts', desc: 'Inject Chart.js canvas elements with live rendering scripts.', icon: '📈' }
        ]
    }
] as const;

/**
 * EnhancePanel provides a list of AI-powered actions to modify the currently focused artifact.
 * It uses a data-driven approach to render options in categorized sections.
 */
const EnhancePanel: React.FC<EnhancePanelProps> = ({ onEnhance }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onEnhance('file-populate', file);
            // Reset input value to allow the same file to be selected again if needed
            e.target.value = '';
        }
    };

    const handleOptionClick = (id: string) => {
        if (id === 'file-populate') {
            fileInputRef.current?.click();
        } else {
            onEnhance(id as EnhanceType);
        }
    };

    return (
        <div className="enhance-panel">
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".txt,.pdf,.csv,.json,.md"
                onChange={handleFileChange}
            />
            
            {ENHANCE_SECTIONS.map((section, idx) => (
                <div key={idx}>
                    <div className="enhance-section-label" style={idx > 0 ? { marginTop: '24px' } : {}}>
                        {section.title}
                    </div>
                    {section.items.map((item) => (
                        <button 
                            key={item.id} 
                            className={`enhance-option ${item.variant || ''}`} 
                            onClick={() => handleOptionClick(item.id)}
                            style={idx > 0 || section.items.indexOf(item) > 0 ? { marginTop: '12px' } : {}}
                        >
                            <span className="icon">{item.icon}</span>
                            <div className="text">
                                <strong>{item.label}</strong>
                                <span>{item.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default EnhancePanel;
