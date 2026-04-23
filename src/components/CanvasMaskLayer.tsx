import React from 'react';

interface CanvasMaskLayerProps {
  maskData: { x: number; y: number; width: number; height: number }[];
  color?: string;
}

export const CanvasMaskLayer: React.FC<CanvasMaskLayerProps> = ({ maskData, color = '#A855F7' }) => {
  return (
    <>
      {maskData.map((mask, index) => (
        <div
          key={index}
          className="absolute transition-all duration-300 pointer-events-none"
          style={{
            left: `${mask.x}%`,
            top: `${mask.y}%`,
            width: `${mask.width}%`,
            height: `${mask.height}%`,
            backgroundColor: color,
            opacity: 0.5,
          }}
        />
      ))}
    </>
  );
};
