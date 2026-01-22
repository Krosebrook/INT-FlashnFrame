
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { Artifact } from '../types';
import { DesktopIcon, TabletIcon, MobileIcon } from './Icons';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    isDiffMode?: boolean;
    onClick: () => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const ArtifactCard = React.memo(({ 
    artifact, 
    isFocused, 
    isDiffMode = false,
    onClick 
}: ArtifactCardProps) => {
    const codeRef = useRef<HTMLPreElement>(null);
    const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
    const [showBefore, setShowBefore] = useState(false);

    // Auto-scroll logic for this specific card
    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [artifact.html]);

    // Reset to desktop when focus is lost or artifact changes
    useEffect(() => {
        if (!isFocused) {
            setDeviceMode('desktop');
            setShowBefore(false);
        }
    }, [isFocused]);

    const isBlurring = artifact.status === 'streaming';
    const displayHtml = (isDiffMode && showBefore && artifact.originalHtml) 
        ? artifact.originalHtml 
        : artifact.html;

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''} ${isDiffMode ? 'diff-view' : ''}`}
            onClick={onClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">
                    {isDiffMode ? (showBefore ? 'ORIGINAL VERSION' : 'NEW VERSION') : artifact.styleName}
                </span>
                
                {isFocused && (
                    <div className="header-controls" onClick={(e) => e.stopPropagation()}>
                        {isDiffMode && artifact.originalHtml && (
                            <button 
                                className={`diff-toggle-btn ${showBefore ? 'active' : ''}`}
                                onClick={() => setShowBefore(!showBefore)}
                            >
                                {showBefore ? 'Show New' : 'Compare Original'}
                            </button>
                        )}
                        <div className="device-toggles">
                            <button 
                                className={`device-btn ${deviceMode === 'mobile' ? 'active' : ''}`} 
                                onClick={() => setDeviceMode('mobile')}
                                title="Mobile View (375px)"
                            ><MobileIcon /></button>
                            <button 
                                className={`device-btn ${deviceMode === 'tablet' ? 'active' : ''}`} 
                                onClick={() => setDeviceMode('tablet')}
                                title="Tablet View (768px)"
                            ><TabletIcon /></button>
                            <button 
                                className={`device-btn ${deviceMode === 'desktop' ? 'active' : ''}`} 
                                onClick={() => setDeviceMode('desktop')}
                                title="Desktop View (Full)"
                            ><DesktopIcon /></button>
                        </div>
                    </div>
                )}
            </div>
            <div className={`artifact-card-inner mode-${deviceMode}`}>
                {isBlurring && (
                    <div className="generating-overlay">
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html}
                        </pre>
                    </div>
                )}
                <div className="iframe-wrapper">
                    <iframe 
                        key={`${artifact.id}-${showBefore}`}
                        srcDoc={displayHtml} 
                        title={artifact.id} 
                        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                        className="artifact-iframe"
                    />
                </div>
            </div>
        </div>
    );
});

export default ArtifactCard;
