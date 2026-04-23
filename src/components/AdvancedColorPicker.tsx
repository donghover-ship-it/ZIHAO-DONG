import React, { useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

export const AdvancedColorPicker = ({ color, onChange }: { color: string, onChange: (color: string) => void }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <HexColorPicker color={color} onChange={onChange} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">#</span>
        <HexColorInput color={color} onChange={onChange} className="glass-input-premium rounded-lg p-2 text-white w-full" />
      </div>
      {/* Simplified inputs for now, can expand later */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
        <div className="glass-tile-premium p-2 rounded-lg">R: {parseInt(color.slice(1, 3), 16)}</div>
        <div className="glass-tile-premium p-2 rounded-lg">G: {parseInt(color.slice(3, 5), 16)}</div>
        <div className="glass-tile-premium p-2 rounded-lg">B: {parseInt(color.slice(5, 7), 16)}</div>
      </div>
    </div>
  );
};
