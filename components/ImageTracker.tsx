'use client';

import { useEffect } from 'react';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';

interface ImageTrackerProps {
  onImageDetected: (position: THREE.Vector3) => void;
  onImageLost: () => void;
}

export default function ImageTracker({ onImageDetected, onImageLost }: ImageTrackerProps) {
  const { session } = useXR();

  useEffect(() => {
    if (!session) return;

    let referenceSpace: XRReferenceSpace | null = null;

    // Request reference space
    session.requestReferenceSpace('local').then((refSpace) => {
      referenceSpace = refSpace;
    });

    // Set up image tracking frame listener
    const frameHandler = (time: number, frame: XRFrame) => {
      if (!referenceSpace) return;
      if (!frame.trackedAnchors) return;

      // Check for tracked images
      frame.trackedAnchors.forEach((anchor: any) => {
        if (anchor.anchorSpace && referenceSpace) {
          // Get the pose of the tracked image
          const pose = frame.getPose(anchor.anchorSpace, referenceSpace);
          
          if (pose) {
            const position = new THREE.Vector3(
              pose.transform.position.x,
              pose.transform.position.y,
              pose.transform.position.z
            );
            onImageDetected(position);
          }
        }
      });
    };

    // Note: WebXR image tracking is still experimental
    // We'll use a simpler approach with requestAnimationFrame
    let animationId: number;
    
    const checkTracking = () => {
      // This will be handled by the XR session's frame loop
      animationId = requestAnimationFrame(checkTracking);
    };

    checkTracking();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [session, onImageDetected, onImageLost]);

  return null;
}
