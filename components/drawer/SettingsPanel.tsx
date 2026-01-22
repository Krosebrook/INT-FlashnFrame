
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GenerationSettings } from '../../types';

interface SettingsPanelProps {
    settings: GenerationSettings;
    onSettingsChange: (newSettings: GenerationSettings) => void;
    onClearHistoryRequest: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, onClearHistoryRequest }) => {
    const handleToggle = (key: keyof GenerationSettings) => {
        onSettingsChange({
            ...settings,
            [key]: !settings[key]
        });
    };

    return (
        <div className="settings-panel">
            <div className="enhance-section-label">Framework & Data</div>
            <div className="setting-group">
                <label>CSS Framework</label>
                <select 
                    value={settings.framework} 
                    onChange={(e) => onSettingsChange({ ...settings, framework: e.target.value as any })}
                >
                    <option value="vanilla">Vanilla CSS</option>
                    <option value="tailwind">Tailwind CSS (CDN)</option>
                    <option value="react-mui">React + Material UI (CDN)</option>
                    <option value="bootstrap">Bootstrap 5 (CDN)</option>
                    <option value="foundation">Foundation 6 (CDN)</option>
                </select>
            </div>
            <div className="setting-group">
                <label>Data Context</label>
                <textarea 
                    value={settings.dataContext} 
                    onChange={(e) => onSettingsChange({ ...settings, dataContext: e.target.value })} 
                    placeholder='e.g. Describe your business metrics or JSON structure' 
                    rows={3} 
                />
            </div>

            <div className="enhance-section-label" style={{ marginTop: '24px' }}>Automatic Enhancements</div>
            <div className="settings-toggles-grid">
                <label className="settings-toggle-item">
                    <input 
                        type="checkbox" 
                        checked={settings.autoA11y} 
                        onChange={() => handleToggle('autoA11y')}
                    />
                    <div className="toggle-text">
                        <strong>Auto A11y</strong>
                        <span>Apply WCAG 2.1 accessibility standards.</span>
                    </div>
                </label>
                <label className="settings-toggle-item">
                    <input 
                        type="checkbox" 
                        checked={settings.autoCharts} 
                        onChange={() => handleToggle('autoCharts')}
                    />
                    <div className="toggle-text">
                        <strong>Auto Interactive Charts</strong>
                        <span>Detect data and inject Chart.js.</span>
                    </div>
                </label>
                <label className="settings-toggle-item">
                    <input 
                        type="checkbox" 
                        checked={settings.autoPersonas} 
                        onChange={() => handleToggle('autoPersonas')}
                    />
                    <div className="toggle-text">
                        <strong>Auto Brand Personas</strong>
                        <span>Inject realistic users and company identity.</span>
                    </div>
                </label>
            </div>

            <div className="setting-group danger-zone" style={{ marginTop: '32px' }}>
                <label>Danger Zone</label>
                <button onClick={onClearHistoryRequest} className="clear-history-btn">Clear All History</button>
            </div>
        </div>
    );
};

export default SettingsPanel;
