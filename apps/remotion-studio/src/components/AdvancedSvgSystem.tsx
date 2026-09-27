import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {videoTheme} from '@video-studio/design-system';

const nodes = [
  {x: 210, y: 360, label: 'SOURCE'},
  {x: 610, y: 220, label: 'PROCESS'},
  {x: 1010, y: 360, label: 'CONTROL'},
  {x: 1410, y: 220, label: 'OUTPUT'},
];

const links = [
  'M 270 360 C 390 360 430 220 550 220',
  'M 670 220 C 790 220 830 360 950 360',
  'M 1070 360 C 1190 360 1230 220 1350 220',
];

export const AdvancedSvgSystem: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg
      viewBox="0 0 1620 720"
      style={{width: '100%', height: '100%', overflow: 'visible'}}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {links.map((d, index) => {
        const local = interpolate(progress, [index / 3, (index + 1) / 3], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <path
            key={d}
            d={d}
            pathLength={1}
            fill="none"
            stroke={videoTheme.colors.accent}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={1}
            strokeDashoffset={1 - local}
            opacity={0.9}
            filter="url(#glow)"
          />
        );
      })}

      {nodes.map((node, index) => {
        const appear = interpolate(frame, [index * 10, index * 10 + 16], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <g key={node.label} transform={`translate(${node.x} ${node.y}) scale(${0.82 + appear * 0.18})`} opacity={appear}>
            <circle r={72} fill="#101A2B" stroke="#2A3B52" strokeWidth={4} />
            <circle r={54} fill="none" stroke={videoTheme.colors.accent} strokeWidth={3} opacity={0.7} />
            <text
              y={118}
              textAnchor="middle"
              fill="#F7FAFC"
              fontSize={24}
              fontFamily={videoTheme.font.family}
              letterSpacing={3}
            >
              {node.label}
            </text>
          </g>
        );
      })}

      <text
        x={810}
        y={640}
        textAnchor="middle"
        fill="#93A4B8"
        fontSize={25}
        fontFamily={videoTheme.font.family}
        letterSpacing={5}
      >
        ANIMATED SVG · VECTOR SYSTEM FLOW
      </text>
    </svg>
  );
};
