"use client";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { ConversionWarning } from "@/lib/webflow-converter";

interface Props {
  warnings: ConversionWarning[];
}

const icons = {
  error:   { icon: AlertCircle,   color: 'var(--error)',   bg: 'rgba(255,79,123,0.08)',  border: 'rgba(255,79,123,0.2)' },
  warning: { icon: AlertTriangle, color: 'var(--warning)', bg: 'rgba(255,184,79,0.08)', border: 'rgba(255,184,79,0.2)' },
  info:    { icon: Info,          color: '#60a5fa',         bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
};

export default function WarningPanel({ warnings }: Props) {
  if (!warnings.length) return (
    <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--muted)' }}>
      <div className="text-2xl">✓</div>
      <div className="text-sm">No issues detected</div>
    </div>
  );

  const errors = warnings.filter(w => w.type === 'error');
  const warns  = warnings.filter(w => w.type === 'warning');
  const infos  = warnings.filter(w => w.type === 'info');

  return (
    <div className="p-3 space-y-1.5 overflow-y-auto h-full">
      <div className="flex gap-2 mb-3 flex-wrap">
        {errors.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(255,79,123,0.15)', color: 'var(--error)' }}>
            {errors.length} error{errors.length > 1 ? 's' : ''}
          </span>
        )}
        {warns.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(255,184,79,0.15)', color: 'var(--warning)' }}>
            {warns.length} warning{warns.length > 1 ? 's' : ''}
          </span>
        )}
        {infos.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
            {infos.length} note{infos.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {warnings.map((w, i) => {
        const cfg = icons[w.type];
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex items-start gap-2 p-2 rounded text-xs slide-in"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <Icon size={12} className="flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
            <div className="flex-1 min-w-0">
              {w.line && <span className="font-mono mr-1.5" style={{ color: cfg.color }}>L{w.line}</span>}
              <span style={{ color: 'var(--text)' }}>{w.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
