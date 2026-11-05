import { limitSfx } from '../audio/Sfx';
import { Bed } from './scenes';
import type { EpConfig } from './Shell';

/** placeholder, replaced below */
export const EP_CACHORRA: EpConfig = { scenes: {}, fallback: Bed, shotPlan: {}, cues: () => limitSfx([]), Overlays: () => null };
