import React, { useRef, useEffect } from 'react';
import { createSeededRng, deriveSeed, randomInt } from '../../utils/prng';

interface FallbackImageProps {
  width: number;
  height: number;
  seed?: number;
  style?: React.CSSProperties;
}

// Glossy silver/black/gold randomized fallback
export function FallbackImage({ width, height, seed = 0, style }: FallbackImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fallbackSeed = seed > 0 ? seed : randomInt(
      createSeededRng(deriveSeed(width, height, 'fallback-image')),
      1,
      99999,
    );
    const rand = createSeededRng(fallbackSeed);

    const colors = [
      ['#C0C0C0', '#2d2d2d', '#1a1a1a'],
      ['#FFD700', '#1a1a1a', '#B8860B'],
      ['#D4D4D4', '#0d0d0d', '#A8A8A8'],
      ['#FFD700', '#2d2d2d', '#C0C0C0'],
      ['#1a1a1a', '#C0C0C0', '#FFD700'],
    ];
    const palette = colors[Math.floor(rand() * colors.length)];

    // Background gradient
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, palette[0]);
    g.addColorStop(0.5, palette[1]);
    g.addColorStop(1, palette[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // Glossy highlight
    const hg = ctx.createRadialGradient(
      width * (0.3 + rand() * 0.4),
      height * (0.2 + rand() * 0.3),
      0,
      width * 0.5,
      height * 0.5,
      width * 0.8
    );
    hg.addColorStop(0, 'rgba(255,255,255,0.15)');
    hg.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    hg.addColorStop(1, 'transparent');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, width, height);

    // Abstract shapes
    for (let i = 0; i < 3 + Math.floor(rand() * 4); i++) {
      ctx.beginPath();
      ctx.arc(
        rand() * width,
        rand() * height,
        20 + rand() * 40,
        0, Math.PI * 2
      );
      ctx.fillStyle = palette[Math.floor(rand() * palette.length)] + '20';
      ctx.fill();
    }

    // Noise/grain
    for (let i = 0; i < 100; i++) {
      const nx = rand() * width;
      const ny = rand() * height;
      ctx.fillStyle = `rgba(255,255,255,${rand() * 0.08})`;
      ctx.fillRect(nx, ny, 1, 1);
    }
  }, [width, height, seed]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', ...style }}
    />
  );
}
