"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Zap, Copy, GitFork, RefreshCw, ChevronRight, FileCode2, Palette, Braces, LayoutTemplate, AlertTriangle } from "lucide-react";
import ElementTree from "@/components/ElementTree";
import WarningPanel from "@/components/WarningPanel";
import StatsBar from "@/components/StatsBar";
import { convert, type ConversionResult } from "@/lib/webflow-converter";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const MONACO_OPTIONS = {
  fontSize: 13,
  fontFamily: "'Space Mono', monospace",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: "on" as const,
  wordWrap: "on" as const,
  tabSize: 2,
  theme: "vs-dark",
  padding: { top: 12, bottom: 12 },
  renderLineHighlight: "gutter" as const,
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
};

const EXAMPLE = {
  html: `<section class="hero">
  <nav class="nav">
    <a class="nav__logo" href="/">HasFlow</a>
    <ul class="nav__links">
      <li><a href="/features">Features</a></li>
      <li><a href="/pricing">Pricing</a></li>
    </ul>
    <button class="btn btn--primary">Get Started</button>
  </nav>

  <div class="hero__content">
    <h1 class="hero__title">Convert HTML to Webflow</h1>
    <p class="hero__subtitle">Paste your code. Get Webflow-ready structure instantly.</p>
    <button class="btn btn--primary">Start Converting</button>
  </div>

  <img class="hero__image" src="/hero.png" alt="HasFlow preview" />
</section>`,
  css: `/* Hero Section */
.hero {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0a0a0f;
  color: #e8e8f0;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 48px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav__logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: #4fffb0;
  text-decoration: none;
  letter-spacing: -0.02em;
}

.hero__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 24px;
  gap: 24px;
}

.hero__title {
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.btn {
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.15s, box-shadow 0.2s;
}

.btn--primary {
  background: #4fffb0;
  color: #0a0a0f;
}

.btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 255, 176, 0.3);
}`,
  js: `// Initialize on Webflow ready
window.Webflow = window.Webflow || [];
window.Webflow.push(function() {
  const btn = document.querySelector('.btn--primary');
  if (btn) {
    btn.addEventListener('click', function() {
      console.log('CTA clicked');
    });
  }
});`,
};

type InputTab = "html" | "css" | "js";
type OutputTab = "tree" | "warnings" | "css";

const INPUT_TABS: { id: InputTab; label: string; icon: React.FC<{ size: number }> }[] = [
  { id: "html", label: "HTML", icon: FileCode2 },
  { id: "css",  label: "CSS",  icon: Palette },
  { id: "js",   label: "JS",   icon: Braces },
];

const OUTPUT_TABS: { id: OutputTab; label: string; icon: React.FC<{ size: number }> }[] = [
  { id: "tree",     label: "Element Tree",  icon: LayoutTemplate },
  { id: "warnings", label: "Warnings",      icon: AlertTriangle },
  { id: "css",      label: "Sanitized CSS", icon: Palette },
];

export default function Home() {
  const [inputTab, setInputTab] = useState<InputTab>("html");
  const [outputTab, setOutputTab] = useState<OutputTab>("tree");
  const [html, setHtml] = useState("");
  const [css, setCss]   = useState("");
  const [js,  setJs]    = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [converting, setConverting] = useState(false);
  const [dividerX, setDividerX] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleConvert = useCallback(() => {
    setConverting(true);
    setTimeout(() => {
      const r = convert(html, css, js);
      setResult(r);
      setConverting(false);
      setOutputTab("tree");
    }, 300);
  }, [html, css, js]);

  const loadExample = () => {
    setHtml(EXAMPLE.html);
    setCss(EXAMPLE.css);
    setJs(EXAMPLE.js);
    setInputTab("html");
  };

  const copyOutput = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.elements, null, 2));
  };

  const getEditorValue = () => ({ html, css, js }[inputTab]);
  const setEditorValue = (val: string | undefined) => {
    if (val === undefined) return;
    if (inputTab === "html") setHtml(val);
    else if (inputTab === "css") setCss(val);
    else setJs(val);
  };
  const getLang = () => ({ html: "html", css: "css", js: "javascript" }[inputTab]);

  const onMouseDown = () => { dragging.current = true; };
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDividerX(Math.min(75, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100)));
  }, []);
  const onMouseUp = () => { dragging.current = false; };

  const warningCount = result?.warnings.filter(w => w.type !== 'info').length ?? 0;

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Zap size={18} style={{ color: 'var(--accent)' }} />
            <span className="font-black text-lg tracking-tight" style={{ fontFamily: 'Syne' }}>
              Has<span style={{ color: 'var(--accent)' }}>Flow</span>
            </span>
          </div>
          <span className="hidden sm:block text-xs px-2 py-0.5 rounded font-mono"
            style={{ background: 'rgba(79,255,176,0.08)', color: 'var(--accent)', border: '1px solid rgba(79,255,176,0.2)' }}>
            v0.1.0
          </span>
          <ChevronRight size={14} style={{ color: 'var(--border)' }} />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>HTML → Webflow Converter</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadExample}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors hover:bg-white/5"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
            <RefreshCw size={12} /> Example
          </button>
          <a href="https://github.com/mamunur-ht/HasFlow" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors hover:bg-white/5"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
            <GitFork size={12} /> GitHub
          </a>
        </div>
      </header>

      {/* Split pane */}
      <div ref={containerRef} className="flex flex-1 min-h-0 relative select-none"
        onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

        {/* LEFT: Editor */}
        <div className="flex flex-col min-h-0" style={{ width: `${dividerX}%` }}>
          <div className="flex items-center justify-between px-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="flex">
              {INPUT_TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setInputTab(id)}
                  className="flex items-center gap-1.5 px-4 py-3 transition-colors"
                  style={{
                    color: inputTab === id ? 'var(--accent)' : 'var(--muted)',
                    borderBottom: inputTab === id ? '2px solid var(--accent)' : '2px solid transparent',
                    fontFamily: 'Space Mono, monospace', fontSize: '12px',
                  }}>
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>
            <button onClick={handleConvert} disabled={converting || (!html && !css && !js)}
              className="btn-convert px-4 py-1.5 rounded text-sm flex items-center gap-2">
              {converting
                ? <><RefreshCw size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> Converting...</>
                : <><Zap size={13} /> Convert</>
              }
            </button>
          </div>

          <div className="flex-1 min-h-0" style={{ background: '#0d0d14' }}>
            <MonacoEditor
              key={inputTab}
              height="100%"
              language={getLang()}
              value={getEditorValue()}
              onChange={setEditorValue}
              options={MONACO_OPTIONS}
              theme="vs-dark"
              beforeMount={(monaco) => {
                monaco.editor.defineTheme('hasflow', {
                  base: 'vs-dark', inherit: true, rules: [],
                  colors: {
                    'editor.background': '#0d0d14',
                    'editor.lineHighlightBackground': '#1a1a24',
                    'editorLineNumber.foreground': '#3a3a50',
                    'editorLineNumber.activeForeground': '#666680',
                    'editor.selectionBackground': '#2a2a40',
                  },
                });
                monaco.editor.setTheme('hasflow');
              }}
            />
          </div>

          <div className="flex items-center px-4 py-1.5 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11 }}>
            <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace' }}>
              HTML {html.length}ch · CSS {css.length}ch · JS {js.length}ch
            </span>
          </div>
        </div>

        {/* Divider */}
        <div onMouseDown={onMouseDown}
          className="flex-shrink-0 flex items-center justify-center cursor-col-resize hover:bg-white/5 group"
          style={{ width: '5px', background: 'var(--border)', zIndex: 10 }}>
          <div className="w-0.5 h-8 rounded-full group-hover:bg-white/20" style={{ background: 'var(--border)' }} />
        </div>

        {/* RIGHT: Output */}
        <div className="flex flex-col min-h-0" style={{ flex: 1 }}>
          <div className="flex items-center justify-between px-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="flex">
              {OUTPUT_TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setOutputTab(id)}
                  className="flex items-center gap-1.5 px-4 py-3 transition-colors relative"
                  style={{
                    color: outputTab === id ? 'var(--accent)' : 'var(--muted)',
                    borderBottom: outputTab === id ? '2px solid var(--accent)' : '2px solid transparent',
                    fontFamily: 'Space Mono, monospace', fontSize: '12px',
                  }}>
                  <Icon size={12} />{label}
                  {id === 'warnings' && warningCount > 0 && (
                    <span className="ml-1 text-xs px-1 rounded-sm font-mono"
                      style={{ background: 'rgba(255,184,79,0.2)', color: 'var(--warning)', fontSize: 10 }}>
                      {warningCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {result && (
              <button onClick={copyOutput}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors hover:bg-white/5"
                style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
                <Copy size={12} /> Copy
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-auto" style={{ background: 'var(--surface)' }}>
            {!result ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: 'rgba(79,255,176,0.06)', border: '1px solid rgba(79,255,176,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Zap size={28} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Ready to convert</p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Paste your HTML, CSS & JS then hit Convert</p>
                </div>
                <button onClick={loadExample}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded hover:bg-white/5"
                  style={{ color: 'var(--accent)', border: '1px solid rgba(79,255,176,0.3)' }}>
                  <RefreshCw size={13} /> Load example
                </button>
              </div>
            ) : (
              <div className="h-full slide-in">
                {outputTab === "tree" && <ElementTree elements={result.elements} />}
                {outputTab === "warnings" && <WarningPanel warnings={result.warnings} />}
                {outputTab === "css" && (
                  <div className="h-full">
                    <MonacoEditor
                      height="100%"
                      language="css"
                      value={result.sanitizedCSS || "/* No CSS provided */"}
                      options={{ ...MONACO_OPTIONS, readOnly: true }}
                      theme="vs-dark"
                      beforeMount={(monaco) => {
                        monaco.editor.defineTheme('hasflow', {
                          base: 'vs-dark', inherit: true, rules: [],
                          colors: { 'editor.background': '#111118' },
                        });
                        monaco.editor.setTheme('hasflow');
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <StatsBar stats={result?.stats ?? null} />
        </div>
      </div>
    </div>
  );
}
