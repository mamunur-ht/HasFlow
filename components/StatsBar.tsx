"use client";
import { Layers, Tag, AlertTriangle, Code2 } from "lucide-react";

interface Props {
  stats: {
    totalElements: number;
    classesFound: number;
    unsupportedTags: number;
    inlineStylesConverted: number;
  } | null;
}

export default function StatsBar({ stats }: Props) {
  if (!stats) return null;

  const items = [
    { icon: Layers,        label: 'Elements', value: stats.totalElements,        color: 'var(--accent)' },
    { icon: Tag,           label: 'Classes',  value: stats.classesFound,          color: 'var(--accent2)' },
    { icon: AlertTriangle, label: 'Issues',   value: stats.unsupportedTags,       color: stats.unsupportedTags > 0 ? 'var(--warning)' : 'var(--muted)' },
    { icon: Code2,         label: 'Inline →', value: stats.inlineStylesConverted, color: '#60a5fa' },
  ];

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      {items.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <Icon size={12} style={{ color }} />
          <span className="text-xs font-mono" style={{ color }}>{value}</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: 'var(--accent)' }} />
        <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>Ready for Webflow</span>
      </div>
    </div>
  );
}
