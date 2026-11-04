// QA-only shim: the real Hoot inside a transform-free group the checker can find. Never used by the video bundle.
import React from 'react';
import { Hoot as RealHoot } from '../../../../src/mascot/Mascots';
export * from '../../../../src/mascot/Mascots';
export const Hoot: typeof RealHoot = (p) => (
  <group name="qa:hoot" userData={{ qaChar: 'hoot' }}>
    <RealHoot {...p} />
  </group>
);
