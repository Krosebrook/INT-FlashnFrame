
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface NoiseOverlayProps {
  opacity?: number;
  blendMode?: 'soft-light' | 'overlay' | 'multiply' | 'screen';
  baseFrequency?: string;
}

/**
 * NoiseOverlay adds a grain texture to the UI.
 * This is particularly effective for reducing banding in gradients and adding 
 * a "premium" tactile feel to digital surfaces.
 */
const NoiseOverlay: React.FC<NoiseOverlayProps> = ({
  opacity = 0.05,
  blendMode = 'soft-light',
  baseFrequency = '0.65',
}) => {
  return (
    <div 
      className="noise-overlay-container" 
      style={{ 
        opacity, 
        mixBlendMode: blendMode 
      }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="100%" 
        height="100%" 
        className="noise-svg"
      >
        <filter id="noiseFilterMain">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency={baseFrequency} 
            numOctaves="3" 
            stitchTiles="stitch" 
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilterMain)" />
      </svg>
    </div>
  );
};

export default NoiseOverlay;
