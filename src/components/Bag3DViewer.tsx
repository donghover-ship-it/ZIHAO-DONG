import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

const BagModel = ({ color = '#333' }: { color?: string }) => {
  // A very simple procedural bag model using basic geometries
  return (
    <group>
      {/* Main Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.8, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Front Pocket */}
      <mesh position={[0, -0.2, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 1.0, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Top Handle */}
      <mesh position={[0, 0.95, 0]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.2, 0.05, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      
      {/* Straps */}
      <mesh position={[-0.4, 0, -0.35]} castShadow>
        <boxGeometry args={[0.15, 1.6, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.4, 0, -0.35]} castShadow>
        <boxGeometry args={[0.15, 1.6, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};

export const Bag3DViewer = ({ color }: { color?: string }) => {
  return (
    <div className="w-full h-full min-h-[400px] glass-panel-premium rounded-xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">3D Preview</span>
        <span className="text-[9px] text-gray-600">Drag to rotate • Scroll to zoom</span>
      </div>
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              <BagModel color={color} />
            </Float>
          </Stage>
        </Suspense>
        <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={10} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
