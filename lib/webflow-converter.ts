/**
 * HasFlow — Webflow Converter Engine
 * Transforms HTML/CSS/JS into Webflow-compatible structure
 * following Webflow's rules and constraints.
 */

export interface WebflowElement {
  tag: string;
  webflowType: string;
  classes: string[];
  attributes: Record<string, string>;
  children: WebflowElement[];
  textContent?: string;
  warnings: string[];
  depth: number;
}

export interface ConversionWarning {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
}

export interface ConversionResult {
  elements: WebflowElement[];
  sanitizedCSS: string;
  warnings: ConversionWarning[];
  stats: {
    totalElements: number;
    classesFound: number;
    unsupportedTags: number;
    inlineStylesConverted: number;
  };
}

const TAG_MAP: Record<string, string> = {
  div: 'Block (Div)',
  section: 'Section',
  nav: 'Nav Bar',
  header: 'Block (Header)',
  footer: 'Block (Footer)',
  main: 'Block (Main)',
  article: 'Block (Article)',
  aside: 'Block (Aside)',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  p: 'Paragraph',
  span: 'Text Span',
  a: 'Link',
  button: 'Button',
  img: 'Image',
  video: 'Video',
  ul: 'List (Unordered)',
  ol: 'List (Ordered)',
  li: 'List Item',
  form: 'Form Block',
  input: 'Form Input',
  textarea: 'Form Textarea',
  select: 'Form Select',
  label: 'Form Label',
  figure: 'Block (Figure)',
  figcaption: 'Text Block',
  blockquote: 'Block Quote',
  strong: 'Bold Text',
  em: 'Italic Text',
  code: 'Code Block',
  pre: 'Preformatted',
  table: 'Table ⚠️',
  tr: 'Table Row ⚠️',
  td: 'Table Cell ⚠️',
  th: 'Table Header ⚠️',
  iframe: 'HTML Embed ⚠️',
};

const UNSUPPORTED_TAGS = new Set([
  'script', 'style', 'canvas', 'svg', 'math',
  'dialog', 'details', 'summary', 'template',
  'slot', 'portal', 'menu', 'datalist',
]);

const PROBLEMATIC_CSS: Record<string, string> = {
  'float': 'Webflow uses Flexbox/Grid — avoid float',
  'clip-path': 'Use Webflow interactions instead',
  'filter': 'Limited support in Webflow Designer',
  'content': 'CSS ::before/::after content not editable in Designer',
  'counter-increment': 'Not supported in Webflow',
  'counter-reset': 'Not supported in Webflow',
  'resize': 'Not applicable in Webflow',
  'user-select': 'Use Webflow interactions',
};

function parseHTMLToElements(html: string): WebflowElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return Array.from(doc.body.children).map(el => parseElement(el as HTMLElement, 0));
}

function parseElement(el: HTMLElement, depth: number): WebflowElement {
  const tag = el.tagName.toLowerCase();
  const warnings: string[] = [];

  if (UNSUPPORTED_TAGS.has(tag)) {
    warnings.push(`<${tag}> is not supported natively in Webflow — use HTML Embed`);
  }
  if (depth >= 3) {
    warnings.push(`Depth ${depth + 1}: element_builder limit is 3 levels — use inside-out chunking strategy`);
  }
  if (el.getAttribute('style')) {
    warnings.push(`Inline styles detected — convert to CSS classes for Webflow`);
  }
  if (tag === 'a') {
    const href = el.getAttribute('href') || '';
    if (href.startsWith('javascript:')) warnings.push(`javascript: href not allowed — use Webflow interactions`);
    if (!el.getAttribute('href')) warnings.push(`Link has no href — set a URL or use # for placeholder`);
  }
  if (tag === 'img') {
    if (!el.getAttribute('alt')) warnings.push(`Image missing alt text — required for Webflow accessibility`);
    if ((el.getAttribute('src') || '').startsWith('data:')) warnings.push(`Base64 image detected — upload to Webflow Assets instead`);
  }
  if (tag === 'input') {
    const type = el.getAttribute('type') || 'text';
    if (['color', 'range', 'file', 'datetime-local'].includes(type)) {
      warnings.push(`Input type="${type}" has limited Webflow support`);
    }
  }
  if (tag === 'table') warnings.push(`Tables have limited Designer support — consider a grid layout`);

  const children = Array.from(el.children).map(c => parseElement(c as HTMLElement, depth + 1));
  const textContent = el.children.length === 0 && el.textContent?.trim() ? el.textContent.trim() : undefined;
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name !== 'class' && attr.name !== 'style') attributes[attr.name] = attr.value;
  }

  return {
    tag,
    webflowType: TAG_MAP[tag] || `Custom (${tag})`,
    classes: Array.from(el.classList),
    attributes,
    children,
    textContent,
    warnings,
    depth,
  };
}

function sanitizeCSS(css: string): { sanitized: string; warnings: ConversionWarning[] } {
  const warnings: ConversionWarning[] = [];
  const output: string[] = [];
  let lineNum = 0;
  let inComment = false;

  for (const line of css.split('\n')) {
    lineNum++;
    const trimmed = line.trim();
    if (trimmed.includes('/*')) inComment = true;
    if (trimmed.includes('*/')) inComment = false;
    if (inComment) { output.push(line); continue; }
    if (trimmed.startsWith('@import')) {
      warnings.push({ type: 'warning', message: `@import not supported in Webflow — use Webflow font settings instead`, line: lineNum });
      continue;
    }
    if (trimmed.includes('var(--')) warnings.push({ type: 'info', message: `CSS variables detected — consider using Webflow Variables panel`, line: lineNum });
    for (const [prop, msg] of Object.entries(PROBLEMATIC_CSS)) {
      if (trimmed.includes(`${prop}:`)) warnings.push({ type: 'warning', message: msg, line: lineNum });
    }
    if (trimmed.includes('!important')) warnings.push({ type: 'warning', message: `!important detected — may conflict with Webflow's style system`, line: lineNum });
    if (trimmed.includes('::before') || trimmed.includes('::after')) warnings.push({ type: 'info', message: `::before/::after not editable in Webflow Designer — goes into custom CSS`, line: lineNum });
    if (trimmed.match(/[+~>]/) && !trimmed.startsWith('//')) warnings.push({ type: 'info', message: `Combinator selector detected — Webflow Designer uses class-based styling`, line: lineNum });
    output.push(line);
  }

  return { sanitized: output.join('\n'), warnings };
}

function analyzeJS(js: string): ConversionWarning[] {
  const warnings: ConversionWarning[] = [];
  js.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    const lineNum = i + 1;
    if (trimmed.includes('document.write')) warnings.push({ type: 'error', message: `document.write() is blocked in Webflow — use DOM manipulation instead`, line: lineNum });
    if (trimmed.match(/querySelector|getElementById|getElementsBy/)) warnings.push({ type: 'info', message: `DOM selectors work in Webflow — place in Page Settings > Custom Code`, line: lineNum });
    if (trimmed.includes('window.onload') || trimmed.includes('DOMContentLoaded')) warnings.push({ type: 'info', message: `Use window.Webflow.push() for init code instead`, line: lineNum });
    if (trimmed.match(/fetch\(|axios\.|XMLHttpRequest/)) warnings.push({ type: 'info', message: `API calls work — add CORS headers on your server side`, line: lineNum });
    if (trimmed.includes('localStorage') || trimmed.includes('sessionStorage')) warnings.push({ type: 'info', message: `Web Storage API works in Webflow pages`, line: lineNum });
  });
  return warnings;
}

function countElements(elements: WebflowElement[]): number {
  return elements.reduce((acc, el) => acc + 1 + countElements(el.children), 0);
}

function countClasses(elements: WebflowElement[]): number {
  const classes = new Set<string>();
  const traverse = (els: WebflowElement[]) => { for (const el of els) { el.classes.forEach(c => classes.add(c)); traverse(el.children); } };
  traverse(elements);
  return classes.size;
}

function countUnsupported(elements: WebflowElement[]): number {
  return elements.reduce((acc, el) => acc + (UNSUPPORTED_TAGS.has(el.tag) ? 1 : 0) + countUnsupported(el.children), 0);
}

export function convert(html: string, css: string, js: string): ConversionResult {
  const elements = parseHTMLToElements(html.trim() || '<div></div>');
  const { sanitized: sanitizedCSS, warnings: cssWarnings } = sanitizeCSS(css);
  const jsWarnings = js.trim() ? analyzeJS(js) : [];

  const elementWarnings: ConversionWarning[] = [];
  let inlineStylesConverted = 0;
  const traverse = (els: WebflowElement[]) => {
    for (const el of els) {
      el.warnings.forEach(w => elementWarnings.push({ type: 'warning', message: w }));
      if (el.warnings.some(w => w.includes('Inline styles'))) inlineStylesConverted++;
      traverse(el.children);
    }
  };
  traverse(elements);

  return {
    elements,
    sanitizedCSS,
    warnings: [...elementWarnings, ...cssWarnings, ...jsWarnings],
    stats: {
      totalElements: countElements(elements),
      classesFound: countClasses(elements),
      unsupportedTags: countUnsupported(elements),
      inlineStylesConverted,
    },
  };
}
