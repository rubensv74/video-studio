import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';

export const AdvancedThreeAsset: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const rotation = frame / fps * 0.72;
  const pulse = 1 + Math.sin(frame / 10) * 0.035;

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{position: [5.4, 3.7, 7.6], fov: 42}}
    >
      <ambientLight intensity={1.3} />
      <directionalLight position={[5, 8, 4]} intensity={4.2} />
      <directionalLight position={[-4, 2, -3]} intensity={2.2} color="#42C7B8" />

      <group rotation={[0.08, rotation, 0]} scale={pulse}>
        <mesh position={[0, -1.25, 0]}>
          <cylinderGeometry args={[2.15, 2.15, 0.34, 64]} />
          <meshStandardMaterial color="#15253A" metalness={0.75} roughness={0.28} />
        </mesh>

        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[1.45, 1.62, 2.8, 64]} />
          <meshStandardMaterial color="#243A52" metalness={0.72} roughness={0.22} />
        </mesh>

        <mesh position={[0, 1.75, 0]}>
          <cylinderGeometry args={[0.94, 1.3, 0.58, 64]} />
          <meshStandardMaterial color="#42C7B8" metalness={0.45} roughness={0.2} />
        </mesh>

        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle) => (
          <mesh
            key={angle}
            position={[Math.cos(angle) * 1.72, 0.25, Math.sin(angle) * 1.72]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.52, 0.52, 1.18]} />
            <meshStandardMaterial color="#9BB0C7" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}

        <mesh position={[0, 2.35, 0]}>
          <torusGeometry args={[1.12, 0.09, 24, 96]} />
          <meshStandardMaterial color="#F7FAFC" emissive="#42C7B8" emissiveIntensity={1.3} />
        </mesh>
      </group>
    </ThreeCanvas>
  );
};
