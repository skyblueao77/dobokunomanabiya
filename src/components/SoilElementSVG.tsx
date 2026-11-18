import React from 'react';
import { type MohrInputs, type MohrResult } from '../utils/mohrPhysics';

interface SoilElementSVGProps {
  inputs: MohrInputs;
  result: MohrResult;
}

export const SoilElementSVG: React.FC<SoilElementSVGProps> = ({ inputs, result }) => {
  const s1Label = inputs.useEffectiveStress
    ? `σ'₁=${result.activeSigma1}`
    : `σ₁=${result.activeSigma1}`;
  const s3Label = inputs.useEffectiveStress
    ? `σ'₃=${result.activeSigma3}`
    : `σ₃=${result.activeSigma3}`;

  return (
    <div className="app-surface rounded-xl shadow-sm overflow-hidden">
      <div className="app-surface-subtle border-x-0 border-t-0 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-semibold">実空間の微小土要素（傾き θ）</span>
        <span className="text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded border border-teal-500/30 font-mono-num">
          θ = {inputs.theta}° ⇔ 円上 2θ = {2 * inputs.theta}°
        </span>
      </div>

      <div className="p-3 flex flex-col items-center">
        <svg
          viewBox="0 0 260 220"
          className="w-full max-w-[260px] h-auto select-none"
          role="img"
          aria-label="微小土要素とせん断面の角度θの対応図"
        >
          <defs>
            <marker
              id="arrow-blue"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-blue)" />
            </marker>
            <marker
              id="arrow-teal"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--diagram-teal)" />
            </marker>
          </defs>

          <rect
            x="80"
            y="60"
            width="100"
            height="100"
            fill="currentColor"
            fillOpacity="0.06"
            stroke="currentColor"
            strokeOpacity="0.78"
            strokeWidth="2"
          />

          <line
            x1="130"
            y1="24"
            x2="130"
            y2="54"
            stroke="var(--diagram-blue)"
            strokeWidth="2.5"
            markerEnd="url(#arrow-blue)"
          />
          <line
            x1="130"
            y1="196"
            x2="130"
            y2="166"
            stroke="var(--diagram-blue)"
            strokeWidth="2.5"
            markerEnd="url(#arrow-blue)"
          />
          <text
            x="130"
            y="16"
            textAnchor="middle"
            className="text-xs font-bold fill-[var(--diagram-blue)] font-mono-num"
          >
            {s1Label} kPa
          </text>

          <line
            x1="36"
            y1="110"
            x2="74"
            y2="110"
            stroke="var(--diagram-blue)"
            strokeWidth="2.5"
            markerEnd="url(#arrow-blue)"
          />
          <line
            x1="224"
            y1="110"
            x2="186"
            y2="110"
            stroke="var(--diagram-blue)"
            strokeWidth="2.5"
            markerEnd="url(#arrow-blue)"
          />
          <text
            x="18"
            y="98"
            textAnchor="start"
            className="text-xs font-bold fill-[var(--diagram-blue)] font-mono-num"
          >
            {s3Label}
          </text>

          <line
            x1="80"
            y1="110"
            x2="180"
            y2="110"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          <g transform={`rotate(${-inputs.theta} 130 110)`}>
            <line x1="82" y1="110" x2="178" y2="110" stroke="var(--diagram-teal)" strokeWidth="2.5" />
            <line
              x1="110"
              y1="103"
              x2="150"
              y2="103"
              stroke="var(--diagram-teal)"
              strokeWidth="2"
              markerEnd="url(#arrow-teal)"
            />
            <line
              x1="130"
              y1="78"
              x2="130"
              y2="106"
              stroke="var(--diagram-teal)"
              strokeWidth="2"
              markerEnd="url(#arrow-teal)"
            />
          </g>

          {inputs.theta > 0 && (
            <path
              d={`M 162 110 A 32 32 0 0 0 ${
                130 + 32 * Math.cos((inputs.theta * Math.PI) / 180)
              } ${110 - 32 * Math.sin((inputs.theta * Math.PI) / 180)}`}
              fill="none"
              stroke="var(--diagram-teal)"
              strokeWidth="1.5"
            />
          )}
          <text
            x="166"
            y="102"
            className="text-xs font-bold fill-[var(--diagram-teal)] font-mono-num"
          >
            θ={inputs.theta}°
          </text>
        </svg>

        <div className="app-surface-subtle mt-1 grid grid-cols-2 gap-2 w-full text-xs rounded-lg p-2.5">
          <div>
            <span className="app-text-muted">垂直応力:</span>{' '}
            <span className="font-bold text-teal-700 dark:text-teal-300 font-mono-num">
              {result.activeSigmaTheta} kPa
            </span>
          </div>
          <div>
            <span className="app-text-muted">せん断応力:</span>{' '}
            <span className="font-bold text-teal-700 dark:text-teal-300 font-mono-num">
              {result.tauTheta} kPa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
