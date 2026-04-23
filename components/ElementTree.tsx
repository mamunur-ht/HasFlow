"use client";
import { useState } from "react";
import { ChevronRight, ChevronDown, AlertTriangle, Info } from "lucide-react";
import type { WebflowElement } from "@/lib/webflow-converter";

interface Props {
  elements: WebflowElement[];
  depth?: number;
}

function ElementNode({ el, depth = 0 }: { el: WebflowElement; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = el.children.length > 0;
  const hasWarnings = el.warnings.length > 0;
  const isUnsupported = el.webflowType.includes('⚠️') || el.warnings.some(w => w.includes('not supported'));

  return (
    <div style={{ marginLeft: depth > 0 ? '16px' : '0' }}>
      <div
        className="flex items-start gap-1.5 py-1 px-2 rounded group cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => hasChildren && setOpen(!open)}
      >
        <span className="mt-0.5 flex-shrink-0 w-4">
          {hasChildren
            ? open ? <ChevronDown size={12} style={{ color: 'var(--muted)' }} />
                   : <ChevronRight size={12} style={{ color: 'var(--muted)' }} />
            : <span style={{ display: 'inline-block', width: 12 }} />
          }
        </span>

        <span
          className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0"
          style={{
            background: isUnsupported ? 'rgba(255,79,123,0.15)' : 'rgba(79,255,176,0.1)',
            color: isUnsupported ? 'var(--error)' : 'var(--accent)',
            border: `1px solid ${isUnsupported ? 'rgba(255,79,123,0.3)' : 'rgba(79,255,176,0.2)'}`,
          }}
        >
          {el.tag}
        </span>

        <span className="text-xs flex-1 truncate" style={{ color: 'var(--muted)' }}>
          {el.webflowType}
        </span>

        {el.classes.length > 0 && (
          <div className="flex gap-1 flex-wrap max-w-[140px]">
            {el.classes.slice(0, 2).map(c => (
              <span key={c} className="text-xs px-1 rounded font-mono" style={{ background: 'rgba(123,97,255,0.15)', color: 'var(--accent2)' }}>
                .{c}
              </span>
            ))}
            {el.classes.length > 2 && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>+{el.classes.length - 2}</span>
            )}
          </div>
        )}

        {hasWarnings && (
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
        )}
      </div>

      {hasWarnings && open && (
        <div style={{ marginLeft: `${(depth + 1) * 16 + 4}px` }} className="mb-1">
          {el.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 py-0.5 px-2 rounded text-xs" style={{ color: 'var(--warning)' }}>
              <Info size={10} className="mt-0.5 flex-shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      {hasChildren && open && (
        <div>
          {el.children.map((child, i) => (
            <ElementNode key={i} el={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ElementTree({ elements, depth = 0 }: Props) {
  if (!elements.length) return (
    <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--muted)' }}>
      No elements yet — paste HTML and hit Convert
    </div>
  );
  return (
    <div className="py-2">
      {elements.map((el, i) => (
        <ElementNode key={i} el={el} depth={depth} />
      ))}
    </div>
  );
}
