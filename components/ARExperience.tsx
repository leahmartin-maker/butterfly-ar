'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import ButterflyModel from '@/components/ButterflyModel';
import ImageTracker from '@/components/ImageTracker';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';

const store = createXRStore();

export default function ARExperience() {
  const [inAR, setInAR] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [imageDetected, setImageDetected] = useState(false);
  const [imagePosition, setImagePosition] = useState<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('xr' in navigator) || !navigator.xr) {
      setIsSupported(false);
      setSupportError('WebXR is not available in this browser.');
      return;
    }

    navigator.xr
      .isSessionSupported('immersive-ar')
      .then((supported) => {
        setIsSupported(supported);
        if (!supported) {
          setSupportError('WebXR AR is not supported on this device.');
        }
      })
      .catch(() => {
        setIsSupported(false);
        setSupportError('Unable to check WebXR support.');
      });
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-purple-500 to-pink-500">
      {/* AR Enter Button */}
      {!inAR && (
        <button
          onClick={async () => {
            // Load the painting image for tracking
            const image = document.createElement('img');
            image.src = '/images/butterfly-painting.png';
            
            try {
              await image.decode();
              
              // Enter AR with image tracking
              await store.enterAR();
              setInAR(true);
            } catch (error) {
              console.error('Failed to enter AR:', error);
              // Fallback to regular AR without image tracking
              await store.enterAR();
              setInAR(true);
            }
          }}
          disabled={isSupported === false}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-purple-600 px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:bg-purple-100 transition z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enter AR Mode 🦋
        </button>
      )}

      {supportError && !inAR && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-md text-sm z-10">
          {supportError}
        </div>
      )}

      {/* Detection status indicator */}
      {inAR && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-md text-sm z-10">
          {imageDetected ? '✓ Painting detected!' : '🔍 Looking for painting...'}
        </div>
      )}

      <Canvas>
        <XR store={store}>
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <Environment preset="sunset" />

            {/* Image tracking */}
            <ImageTracker 
              onImageDetected={(pos) => {
                setImageDetected(true);
                setImagePosition(pos);
              }}
              onImageLost={() => {
                setImageDetected(false);
              }}
            />

            {/* Butterfly spawns from painting when detected */}
            {imageDetected && imagePosition && (
              <ButterflyModel 
                position={[
                  imagePosition.x,
                  imagePosition.y + 0.2, // Spawn slightly above painting
                  imagePosition.z
                ]} 
                delay={0} 
              />
            )}
            
            {/* Fallback: spawn in front if no image detected yet */}
            {!imageDetected && (
              <ButterflyModel position={[0, 0, -1]} delay={0} />
            )}

            {/* OrbitControls for desktop testing (disabled in AR) */}
            {!inAR && <OrbitControls />}
          </Suspense>
        </XR>
      </Canvas>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center">
        <p className="text-lg font-semibold">Point at your painting</p>
        <p className="text-sm">Butterfly will come to life!</p>
      </div>
    </div>
  );
}
