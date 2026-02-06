'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import ButterflyModel from '@/components/ButterflyModel';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';

// Configure store with image tracking BEFORE session starts
const store = createXRStore({
  imageTracking: [
    {
      image: '/images/butterfly-painting.png',
      width: 0.2, // 20cm - my painting's physical width in meters
    }
  ]
} as any);

function ImageTrackingListener({ onImageDetected }: { onImageDetected: (pos: THREE.Vector3) => void }) {
  // Listen for XR frame updates to check for tracked images
  useFrame((state) => {
    const frame = (state.gl.xr as any).getFrame?.();
    const session = state.gl.xr.getSession();
    const referenceSpace = (state.gl.xr as any).getReferenceSpace?.();

    if (!frame || !session || !referenceSpace) return;

    // Use getImageTrackingResults() for image tracking (NOT trackedAnchors)
    const imageTrackingResults = (frame as any).getImageTrackingResults?.();
    
    if (imageTrackingResults && imageTrackingResults.length > 0) {
      imageTrackingResults.forEach((result: any) => {
        // Check if the image is currently tracked
        if (result.trackingState === 'tracked' && result.imageSpace) {
          const pose = frame.getPose(result.imageSpace, referenceSpace);
          
          if (pose) {
            // Extract world position from the pose
            const position = new THREE.Vector3(
              pose.transform.position.x,
              pose.transform.position.y + 0.2, // Spawn 20cm above painting
              pose.transform.position.z
            );
            
            console.log('Image tracked at world position:', position);
            onImageDetected(position);
          }
        }
      });
    }
  });

  return null;
}

export default function ARExperience() {
  const [inAR, setInAR] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [butterflyWorldPos, setButterflyWorldPos] = useState<THREE.Vector3 | null>(null);
  const [hasSpawned, setHasSpawned] = useState(false);

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

  const handleEnterAR = async () => {
    try {
      console.log('Entering AR with image tracking...');
      await store.enterAR();
      setInAR(true);
      console.log('AR session started - point camera at your butterfly painting');
    } catch (error) {
      console.error('Failed to enter AR:', error);
      setSupportError('Failed to start AR session.');
    }
  };

  const handleImageDetection = (worldPos: THREE.Vector3) => {
    // Only capture position on FIRST detection
    if (!hasSpawned) {
      console.log('Painting detected! World position:', worldPos);
      setButterflyWorldPos(worldPos.clone());
      setHasSpawned(true);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-purple-500 to-pink-500">
      {/* AR Enter Button */}
      {!inAR && (
        <button
          onClick={handleEnterAR}
          disabled={isSupported === false}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-purple-600 px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:bg-purple-100 transition z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enter AR Mode 🦋
        </button>
      )}

      {supportError && !inAR && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-md text-sm z-10 max-w-xs text-center">
          {supportError}
        </div>
      )}

      {/* Detection status */}
      {inAR && !hasSpawned && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-md text-sm z-10 animate-pulse">
          🔍 Point camera at your butterfly painting...
        </div>
      )}
      
      {inAR && hasSpawned && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600/90 text-white px-4 py-2 rounded-md text-sm z-10">
          ✓ Butterfly spawned from painting!
        </div>
      )}

      <Canvas>
        <XR store={store}>
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <Environment preset="sunset" />

            {/* Image tracking listener (only active in AR) */}
            {inAR && <ImageTrackingListener onImageDetected={handleImageDetection} />}

            {/* Butterfly pinned to world position (NOT parented to image) */}
            {butterflyWorldPos && (
              <ButterflyModel 
                position={[
                  butterflyWorldPos.x,
                  butterflyWorldPos.y,
                  butterflyWorldPos.z
                ]} 
                delay={0} 
              />
            )}

            {/* Desktop preview only (not in AR) */}
            {!inAR && <ButterflyModel position={[0, 0, -1]} delay={0} />}

            {/* OrbitControls for desktop testing (disabled in AR) */}
          
          {/* Post-processing effects for glow/bloom */}
          <EffectComposer>
            <Bloom 
              luminanceThreshold={1} 
              mipmapBlur 
              intensity={1.5}
            />
          </EffectComposer>
            {!inAR && <OrbitControls />}
          </Suspense>
        </XR>
      </Canvas>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center z-10">
        <p className="text-lg font-semibold drop-shadow-lg">Point at your painting</p>
        <p className="text-sm drop-shadow-lg">Butterfly will come to life!</p>
      </div>
    </div>
  );
}
