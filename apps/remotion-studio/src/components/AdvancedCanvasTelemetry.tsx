import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame} from 'remotion';

export const AdvancedCanvasTelemetry: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {width, height} = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0A1422';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(77, 105, 135, 0.24)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const channels = [
      {y: 190, amplitude: 72, frequency: 0.018, phase: 0, label: 'VIBRATION'},
      {y: 365, amplitude: 48, frequency: 0.024, phase: 1.4, label: 'PRESSURE'},
      {y: 540, amplitude: 58, frequency: 0.014, phase: 2.2, label: 'TEMPERATURE'},
    ];

    for (const channel of channels) {
      ctx.beginPath();
      for (let x = 0; x < width; x += 4) {
        const value =
          Math.sin(x * channel.frequency + frame * 0.08 + channel.phase) *
          channel.amplitude;
        const secondary =
          Math.sin(x * channel.frequency * 0.37 + frame * 0.035) *
          channel.amplitude *
          0.22;
        const y = channel.y + value + secondary;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#42C7B8';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#42C7B8';
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#93A4B8';
      ctx.font = '22px system-ui';
      ctx.fillText(channel.label, 28, channel.y - 86);
    }

    const scanX = (frame * 14) % width;
    const gradient = ctx.createLinearGradient(scanX - 100, 0, scanX + 30, 0);
    gradient.addColorStop(0, 'rgba(66,199,184,0)');
    gradient.addColorStop(1, 'rgba(66,199,184,0.28)');
    ctx.fillStyle = gradient;
    ctx.fillRect(scanX - 100, 0, 130, height);
  }, [frame]);

  return (
    <canvas
      ref={canvasRef}
      width={1600}
      height={700}
      style={{
        width: 1600,
        height: 700,
        borderRadius: 28,
        border: '1px solid #2A3B52',
        boxShadow: '0 24px 80px rgba(0,0,0,.35)',
      }}
    />
  );
};
