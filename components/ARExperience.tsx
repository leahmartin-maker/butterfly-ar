'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import ButterflyModel from '@/components/ButterflyModel';
import { Suspense, useEffect, useState } from 'react';

const store = createXRStore();

export default function ARExperience() {
  const [inAR, setInAR] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);

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
          onClick={() => {
            store.enterAR();
            setInAR(true);
          }}
          disabled={isSupported === false}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-purple-600 px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:bg-purple-100 transition z-10"
        >
          Enter AR Mode 🦋
        </button>
      )}

      {supportError && !inAR && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-md text-sm z-10">
          {supportError}
        </div>
      )}

      <Canvas>
        <XR store={store}>
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <Environment preset="sunset" />

            {/* Butterfly positioned 1 meter in front of user */}
            <ButterflyModel position={[0, 0, -1]} delay={0} />

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
