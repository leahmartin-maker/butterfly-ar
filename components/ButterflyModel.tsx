'use client';

import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

// Preload the model outside component to prevent reloading
useGLTF.preload('/models/butterfly-fixed.glb');

interface ButterflyProps {
  position: [number, number, number];
  delay?: number;
}

export default function ButterflyModel({ position, delay = 0 }: ButterflyProps) {
  const groupRef = useRef<THREE.Object3D>(null);
  
  // Load the model (will use preloaded cache)
  const { scene, animations } = useGLTF('/models/butterfly-fixed.glb');
  const { actions } = useAnimations(animations, groupRef);

  // Play the wing flapping animation
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.values(actions)[0];
      firstAction?.play();
      console.log('🦋 Playing animation:', Object.keys(actions));
    }
  }, [actions]);

  // Add emissive glow to materials for bloom effect
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          // Add warm glow to butterfly wings
          material.emissive = new THREE.Color(0xff9966); // Orange glow
          material.emissiveIntensity = 1.5; // Higher than 1 for bloom effect
        }
      }
    });
  }, [scene]);

  // Rotate butterfly slowly on Y-axis
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={scene} scale={0.02} />
    </group>
  );
}
