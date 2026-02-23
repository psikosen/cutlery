import React, { useEffect, useRef } from 'react';
import type { Creature, CreatureId } from '../../types';
import { renderCreature } from '../../renderer/creatureRenderer';

interface CreatureCanvasProps {
  creature: Creature;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
  wander?: boolean;
  foodBurstKey?: number;
  petBurstKey?: number;
}

type ConsumeStyle = 'absorb' | 'eat' | 'grab';

interface FoodDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hoverY: number;
  bobPhase: number;
  radius: number;
  color: string;
  phase: 'dropping' | 'floating' | 'consuming';
  consumeProgress: number;
  style: ConsumeStyle;
}

interface CreatureMotion {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SwimTarget {
  x: number;
  y: number;
  nextShiftAt: number;
}

const CONSUME_STYLE_BY_CREATURE: Record<CreatureId, ConsumeStyle> = {
  gore_maw: 'eat',
  mind_weaver: 'absorb',
  chain_wraith: 'grab',
  rot_engine: 'grab',
  gilt_horror: 'eat',
  hollow_singer: 'absorb',
};

const SPEED_TIERS = [2 / 3, 1 / 2] as const;

function getCreatureSpeedScale(creature: Creature) {
  const seed = `${creature.id}:${creature.appearance_seed}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const bucket = (hash >>> 0) % SPEED_TIERS.length;
  return SPEED_TIERS[bucket];
}

function randomFoodColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 72 + Math.floor(Math.random() * 18);
  const lightness = 56 + Math.floor(Math.random() * 14);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export const CreatureCanvas = React.memo(function CreatureCanvas({
  creature,
  width = 300,
  height = 300,
  style,
  onClick,
  wander = true,
  foodBurstKey = 0,
  petBurstKey = 0,
}: CreatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const foodDropRef = useRef<FoodDrop | null>(null);
  const motionRef = useRef<CreatureMotion>({ x: 0, y: 0, vx: 0, vy: 0 });
  const swimTargetRef = useRef<SwimTarget | null>(null);
  const motionInitializedRef = useRef(false);
  const lastFoodBurstKeyRef = useRef<number>(0);
  const lastPetBurstKeyRef = useRef<number>(0);
  const shakeUntilRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    startTimeRef.current = performance.now();
    const speedScale = getCreatureSpeedScale(creature);

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const getSwimBounds = () => {
      const marginX = canvas.width * 0.16;
      const marginTop = canvas.height * 0.2;
      const marginBottom = canvas.height * 0.18;
      return {
        minX: marginX,
        maxX: canvas.width - marginX,
        minY: marginTop,
        maxY: canvas.height - marginBottom,
      };
    };

    const pickSwimTarget = (elapsed: number): SwimTarget => {
      const bounds = getSwimBounds();
      return {
        x: bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
        y: bounds.minY + Math.random() * (bounds.maxY - bounds.minY),
        nextShiftAt: elapsed + 1.9 + Math.random() * 2.7,
      };
    };

    const spawnFoodDrop = (baseX: number, baseY: number, elapsed: number) => {
      const bounds = getSwimBounds();
      const side = Math.random() < 0.5 ? -1 : 1;
      const spread = (bounds.maxX - bounds.minX) * (0.2 + Math.random() * 0.15);
      const x = clamp(baseX + side * spread, bounds.minX, bounds.maxX);
      const hoverY = clamp(baseY + (Math.random() - 0.5) * 70, bounds.minY, bounds.maxY);
      const y = Math.max(bounds.minY - 60, hoverY - (34 + Math.random() * 26));
      const vy = 0.7 + Math.random() * 0.55;
      const styleForCreature = CONSUME_STYLE_BY_CREATURE[creature.id] || 'eat';
      foodDropRef.current = {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.65,
        vy,
        hoverY,
        bobPhase: Math.random() * Math.PI * 2,
        radius: 6 + Math.random() * 3,
        color: randomFoodColor(),
        phase: 'dropping',
        consumeProgress: 0,
        style: styleForCreature,
      };
      swimTargetRef.current = pickSwimTarget(elapsed + 0.35);
    };

    const drawFoodDrop = (food: FoodDrop, creatureX: number, creatureY: number, elapsed: number) => {
      ctx.save();
      ctx.shadowColor = food.color;
      ctx.shadowBlur = food.phase === 'consuming' ? 20 : 14;

      const glowRadius = food.radius + (food.phase === 'consuming' ? 8 : 6);
      ctx.globalAlpha = food.phase === 'consuming'
        ? Math.max(0.2, 1 - food.consumeProgress * 0.75)
        : 0.8;
      ctx.beginPath();
      ctx.arc(food.x, food.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = food.color;
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
      ctx.fillStyle = food.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(food.x - food.radius * 0.35, food.y - food.radius * 0.35, Math.max(1.2, food.radius * 0.28), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();

      if (food.phase === 'consuming') {
        if (food.style === 'absorb') {
          ctx.globalAlpha = Math.max(0.12, 0.75 - food.consumeProgress * 0.6);
          ctx.strokeStyle = food.color;
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 5; i++) {
            const t = i / 4;
            const beamX = food.x + (creatureX - food.x) * t + Math.sin(elapsed * 5 + i) * 2;
            const beamY = food.y + (creatureY - food.y) * t + Math.cos(elapsed * 4 + i * 1.7) * 2;
            ctx.beginPath();
            ctx.moveTo(food.x, food.y);
            ctx.lineTo(beamX, beamY);
            ctx.stroke();
          }
        }

        if (food.style === 'eat') {
          const biteWobble = Math.sin(elapsed * 38) * 1.4;
          ctx.fillStyle = 'rgba(4, 8, 18, 0.62)';
          ctx.beginPath();
          ctx.arc(food.x + biteWobble, food.y, food.radius * (0.55 + food.consumeProgress * 0.3), -0.95, 0.95);
          ctx.lineTo(food.x, food.y);
          ctx.closePath();
          ctx.fill();

          ctx.globalAlpha = Math.max(0.1, 0.5 - food.consumeProgress * 0.45);
          for (let i = 0; i < 3; i++) {
            const angle = elapsed * 14 + i * (Math.PI * 2 / 3);
            const crumbX = food.x + Math.cos(angle) * (food.radius + 3);
            const crumbY = food.y + Math.sin(angle) * (food.radius + 2);
            ctx.beginPath();
            ctx.arc(crumbX, crumbY, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = food.color;
            ctx.fill();
          }
        }

        if (food.style === 'grab') {
          const midX = (creatureX + food.x) * 0.5 + Math.sin(elapsed * 6.2) * 8;
          const midY = (creatureY + food.y) * 0.5 + Math.cos(elapsed * 5.7) * 6;
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = food.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(creatureX, creatureY);
          ctx.quadraticCurveTo(midX, midY, food.x, food.y);
          ctx.stroke();

          const clawAngle = Math.atan2(creatureY - food.y, creatureX - food.x);
          const clawSize = 4;
          ctx.beginPath();
          ctx.moveTo(food.x, food.y);
          ctx.lineTo(food.x + Math.cos(clawAngle + 0.6) * clawSize, food.y + Math.sin(clawAngle + 0.6) * clawSize);
          ctx.lineTo(food.x + Math.cos(clawAngle - 0.6) * clawSize, food.y + Math.sin(clawAngle - 0.6) * clawSize);
          ctx.closePath();
          ctx.fillStyle = food.color;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const frame = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const bounds = getSwimBounds();
      const centerX = (bounds.minX + bounds.maxX) * 0.5;
      const centerY = (bounds.minY + bounds.maxY) * 0.5;

      if (!motionInitializedRef.current) {
        motionRef.current = { x: centerX, y: centerY, vx: 0, vy: 0 };
        motionInitializedRef.current = true;
        swimTargetRef.current = pickSwimTarget(elapsed);
      }

      if (foodBurstKey > 0 && foodBurstKey !== lastFoodBurstKeyRef.current) {
        lastFoodBurstKeyRef.current = foodBurstKey;
        spawnFoodDrop(motionRef.current.x, motionRef.current.y, elapsed);
      }
      if (petBurstKey > 0 && petBurstKey !== lastPetBurstKeyRef.current) {
        lastPetBurstKeyRef.current = petBurstKey;
        shakeUntilRef.current = elapsed + 0.42;
      }

      const food = foodDropRef.current;
      const motion = motionRef.current;

      let desiredX = centerX;
      let desiredY = centerY;

      if (food) {
        if (food.phase === 'dropping') {
          food.vy += 0.045;
          food.vx *= 0.992;
          food.x += food.vx;
          food.y += food.vy;
          if (food.y >= food.hoverY) {
            food.y = food.hoverY;
            food.vy *= -0.28;
            if (Math.abs(food.vy) < 0.35) {
              food.phase = 'floating';
              food.vy = 0;
            }
          }
        } else if (food.phase === 'floating') {
          food.bobPhase += 0.08;
          food.y = food.hoverY + Math.sin(food.bobPhase) * 3;
          food.x += Math.sin(food.bobPhase * 0.65) * 0.12;
        }

        if (food.phase === 'consuming') {
          const consumeRate = food.style === 'eat' ? 0.04 : food.style === 'grab' ? 0.035 : 0.03;
          food.consumeProgress = Math.min(1, food.consumeProgress + consumeRate);
          const pull = food.style === 'grab' ? 0.2 : 0.16;
          food.x += (motion.x - food.x) * pull;
          food.y += (motion.y - food.y) * pull;
          food.radius *= food.style === 'eat' ? 0.94 : 0.95;

          if (food.consumeProgress >= 1 || food.radius < 0.7) {
            foodDropRef.current = null;
          }
        } else {
          const distanceToCreature = Math.hypot(food.x - motion.x, food.y - motion.y);
          if (distanceToCreature < 24 + food.radius) {
            food.phase = 'consuming';
            food.consumeProgress = 0;
          }
        }
      }

      const activeFood = foodDropRef.current;
      if (activeFood) {
        desiredX = activeFood.x;
        desiredY = activeFood.y;
        if (activeFood.phase === 'consuming' && activeFood.style === 'eat') {
          desiredY += 4;
        }
      } else if (wander) {
        let target = swimTargetRef.current;
        if (!target
          || elapsed > target.nextShiftAt
          || Math.hypot(target.x - motion.x, target.y - motion.y) < 22) {
          target = pickSwimTarget(elapsed);
          swimTargetRef.current = target;
        }
        desiredX = target.x;
        desiredY = target.y;
      }

      const steeringStrength = (activeFood ? 0.07 : wander ? 0.03 : 0.045) * speedScale;
      const damping = activeFood ? 0.88 : 0.91;
      motion.vx = (motion.vx + (desiredX - motion.x) * steeringStrength) * damping;
      motion.vy = (motion.vy + (desiredY - motion.y) * steeringStrength) * damping;
      motion.x += motion.vx;
      motion.y += motion.vy;

      if (motion.x < bounds.minX) {
        motion.x = bounds.minX;
        motion.vx = Math.abs(motion.vx) * 0.45;
      } else if (motion.x > bounds.maxX) {
        motion.x = bounds.maxX;
        motion.vx = -Math.abs(motion.vx) * 0.45;
      }

      if (motion.y < bounds.minY) {
        motion.y = bounds.minY;
        motion.vy = Math.abs(motion.vy) * 0.45;
      } else if (motion.y > bounds.maxY) {
        motion.y = bounds.maxY;
        motion.vy = -Math.abs(motion.vy) * 0.45;
      }

      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (elapsed < shakeUntilRef.current) {
        const t = (shakeUntilRef.current - elapsed) / 0.42;
        const strength = Math.max(0, t) * 8;
        shakeOffsetX = (Math.random() - 0.5) * strength;
        shakeOffsetY = (Math.random() - 0.5) * strength * 0.6;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(
        motion.x - canvas.width / 2 + shakeOffsetX,
        motion.y - canvas.height * 0.45 + shakeOffsetY,
      );
      renderCreature(ctx, creature, canvas.width, canvas.height, elapsed, { skipClear: true });
      ctx.restore();
      if (activeFood) {
        drawFoodDrop(activeFood, motion.x, motion.y, elapsed);
      }

      animFrameRef.current = requestAnimationFrame(frame);
    };

    animFrameRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      foodDropRef.current = null;
      swimTargetRef.current = null;
      motionInitializedRef.current = false;
      shakeUntilRef.current = 0;
    };
  }, [creature, wander, foodBurstKey, petBurstKey]);

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
    && prev.creature.custom_name === next.creature.custom_name
    && prev.width === next.width
    && prev.height === next.height
    && prev.wander === next.wander
    && prev.foodBurstKey === next.foodBurstKey
    && prev.petBurstKey === next.petBurstKey;
});
