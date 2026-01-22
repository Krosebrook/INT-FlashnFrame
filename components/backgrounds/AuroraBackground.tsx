
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AuroraBackgroundProps {
  opacity?: number;
  speed?: 'slow' | 'medium' | 'fast';
  showGrain?: boolean;
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  opacity = 0.5,
  speed = 'medium',
  showGrain = true,
}) => {
  const speedMap = {
    slow: '40s',
    medium: '25s',
    fast: '12s',
  };

  return (
    <div className="aurora-container" style={{ opacity }}>
      {/* Dark Base Layer */}
      <div className="aurora-base" />

      {/* Aurora Layers */}
      <div className="aurora-layers">
        <div className={`aurora-blob aurora-blob-1 aurora-speed-${speed}`} />
        <div className={`aurora-blob aurora-blob-2 aurora-speed-${speed}`} />
        <div className={`aurora-blob aurora-blob-3 aurora-speed-${speed}`} />
        <div className={`aurora-blob aurora-blob-4 aurora-speed-${speed}`} />
      </div>

      {/* Contrast Darkening Overlay */}
      <div className="aurora-overlay" />

      {/* Grain/Noise Overlay */}
      {showGrain && (
        <div className="aurora-grain">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <filter id="noiseFilter">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="0.65" 
                numOctaves="3" 
                stitchTiles="stitch" 
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default AuroraBackground;
