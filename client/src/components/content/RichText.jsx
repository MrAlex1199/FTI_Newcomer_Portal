import { useRef } from 'react';

const insertText = (textarea, value, setValue, prefix, suffix = '') => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || 'text';
  const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
  setValue(next);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
  });
};

import useLanguage from '../../hooks/useLanguage.js';

export function RichTextEditor({ label, value, onChange, error = '' }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const apply = (prefix, suffix = '') => insertText(ref.current, value, onChange, prefix, suffix);
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      <div className="rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-500">
        <div className="flex flex-wrap gap-1 bg-gray-50 border-b border-gray-200 p-2">
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => apply('**', '**')} className="rich-toolbar-button font-bold" aria-label={t('bold')}>B</button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => apply('# ')} className="rich-toolbar-button" aria-label={t('heading')}>H</button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => apply('- ')} className="rich-toolbar-button" aria-label={t('bulletList')}>• List</button>
          <span className="text-xs text-gray-400 self-center ml-2">{t('richTextHint')}</span>
        </div>
        <textarea ref={ref} value={value} onChange={(event) => onChange(event.target.value)} rows={9} className="w-full resize-y border-0 px-3 py-2 text-sm text-gray-700 outline-none" placeholder={t('writeContent')} />
      </div>
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}

const inline = (text, keyPrefix) => text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**')
  ? <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>
  : <span key={`${keyPrefix}-${index}`}>{part}</span>);

export function RichTextRenderer({ content = '' }) {
  const lines = content.split(/\r?\n/);
  return (
    <div className="space-y-2 text-sm leading-6 text-gray-700">
      {lines.map((line, index) => {
        if (!line.trim()) return <div key={index} className="h-2" aria-hidden="true" />;
        if (/^###\s/.test(line)) return <h4 key={index} className="font-semibold text-gray-800 mt-3">{inline(line.replace(/^###\s/, ''), `line-${index}`)}</h4>;
        if (/^##\s/.test(line)) return <h3 key={index} className="text-base font-semibold text-gray-800 mt-3">{inline(line.replace(/^##\s/, ''), `line-${index}`)}</h3>;
        if (/^#\s/.test(line)) return <h2 key={index} className="text-lg font-bold text-gray-800 mt-3">{inline(line.replace(/^#\s/, ''), `line-${index}`)}</h2>;
        if (/^-\s/.test(line)) return <li key={index} className="ml-5 list-disc">{inline(line.replace(/^-\s/, ''), `line-${index}`)}</li>;
        return <p key={index}>{inline(line, `line-${index}`)}</p>;
      })}
    </div>
  );
}
