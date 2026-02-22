import React, { useRef, useEffect, useCallback } from 'react';
import type { Creature } from '../../types';
import { renderCreature } from '../../renderer/creatureRenderer';

interface CreatureCanvasProps {
  creature: Creature;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const CreatureCanvas = React.memo(function CreatureCanvas({ creature, width = 300, height = 300, style, onClick }: CreatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const time = (Date.now() - startTimeRef.current) / 1000;
    renderCreature(ctx, creature, canvas.width, canvas.height, time);
    animFrameRef.current = requestAnimationFrame(animate);
  }, [creature]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate]);

  // Handle DPR for sharp rendering
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  return (
    <canvas
      ref={canvasRef}
      width={width * dpr}
      height={height * dpr}
      onClick={onClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    />
  );
}, (prev, next) => {
  // Only re-render if creature data actually changed
  return prev.creature.id === next.creature.id
    && prev.creature.total_genes === next.creature.total_genes
    && prev.creature.evolution_stage === next.creature.evolution_stage
    && prev.creature.total_power === next.creature.total_power
    && prev.width === next.width
    && prev.height === next.height;
});
