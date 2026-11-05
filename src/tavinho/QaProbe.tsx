import { useLayoutEffect } from 'react';
import { useCurrentFrame } from 'remotion';

/**
 * QA only (rendered when the input props have `qa: true`, see scripts/qa/tavinho.mjs).
 * After each frame is laid out, logs the on-screen boxes of faces ([data-qa="face"]),
 * caption words ([data-qa="capword"]) and labels ([data-qa-label="<id>"]) as one "QA|" console line.
 * Faces inside a label or an avatar ([data-qa-avatar]) are skipped; while a full-screen card ([data-qa-cover]) is up, only that card counts.
 * Boxes are in frame pixels (1080×1920) and include every camera transform.
 */
export const QaProbe: React.FC = () => {
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    const root = document.querySelector('[data-qa="root"]') as HTMLElement | null;
    if (!root) return;
    const o = root.getBoundingClientRect();
    const k = 1080 / o.width;
    const box = (e: Element) => { const r = e.getBoundingClientRect(); return [Math.round((r.left - o.left) * k), Math.round((r.top - o.top) * k), Math.round(r.width * k), Math.round(r.height * k)]; };
    // faces drawn inside a label (an avatar in a notification) are part of that label, not a face to protect
    // a full-screen card ([data-qa-cover]) hides the scene: only the card's own label counts then
    const cover = root.querySelector('[data-qa-cover]');
    const faces = cover ? [] : [...root.querySelectorAll('[data-qa="face"]')].filter((e) => !e.closest('[data-qa-label], [data-qa-avatar]')).map(box);
    const caps = [...root.querySelectorAll('[data-qa="capword"]')].map(box);
    const labels = [...root.querySelectorAll('[data-qa-label]')].filter((e) => !cover || e === cover).map((e) => [e.getAttribute('data-qa-label'), ...box(e)]);
    console.log(`QA|${JSON.stringify({ frame, faces, caps, labels })}`);
  }, [frame]);
  return null;
};
