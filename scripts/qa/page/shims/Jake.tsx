// QA-only shim: the real Jake inside a transform-free group the checker can find. Never used by the video bundle.
import React from 'react';
import { Jake as RealJake } from '../../../../src/mascot/Jake';
export * from '../../../../src/mascot/Jake';
export const Jake: typeof RealJake = (p) => (
  <group name="qa:jake" userData={{ qaChar: 'jake' }}>
    <RealJake {...p} />
  </group>
);
