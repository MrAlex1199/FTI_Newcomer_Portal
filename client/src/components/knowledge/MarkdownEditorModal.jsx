import { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../common/Modal.jsx';
import ImageUpload from '../common/ImageUpload.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import useLanguage from '../../hooks/useLanguage.js';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0E00-\u0E7F-]/g, '')
    .replace(/\s+/g, '-');
}

const EMPTY_ARTICLE = {
  title: '',
  slug: '',
  topicId: '',
  subcategory: 'windows',
  summary: '',
  content: '',
  coverImage: '',
  tags: '',
  targetRoles: [],
  sortOrder: 0,
  quickLinkOrder: 0,
  isQuickLink: false,
  status: 'draft',
};

export default function MarkdownEditorModal({
  open,
  onClose,
  initial = null,
  defaultTopicId = null,
  topics = [],
  roles = [],
  onSubmit,
  submitting = false,
  formError = '',
}) {
  const { t, label } = useLanguage();
  const textareaRef = useRef(null);

  const [form, setForm] = useState(EMPTY_ARTICLE);
  const [coverFile, setCoverFile] = useState(null);
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'split' | 'preview'
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        ...EMPTY_ARTICLE,
        ...initial,
        topicId: initial.topicId ? (typeof initial.topicId === 'object' ? initial.topicId._id : initial.topicId) : '',
        tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : initial.tags || '',
        targetRoles: initial.targetRoles || [],
      });
      setSlugManuallyEdited(true);
      setCoverFile(null);
    } else {
      setForm({
        ...EMPTY_ARTICLE,
        topicId: defaultTopicId ? String(defaultTopicId) : (topics[0]?._id || ''),
      });
      setSlugManuallyEdited(false);
      setCoverFile(null);
    }
  }, [initial, defaultTopicId, open, topics]);

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !slugManuallyEdited) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const toggleRole = (role) => {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  // Helper to insert markdown tags at selection in textarea
  const insertFormat = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = form.content || '';
    const selected = currentVal.slice(start, end) || defaultText;
    const nextVal = `${currentVal.slice(0, start)}${prefix}${selected}${suffix}${currentVal.slice(end)}`;

    setField('content', nextVal);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    });
  };

  // Handle Tab key in textarea for indentation
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertFormat('  ', '', '');
    }
  };

  // Build hierarchical topic list for select dropdown
  const topicOptions = useMemo(() => {
    const topicMap = new Map();
    topics.forEach((top) => {
      const p = top.parentId ? String(top.parentId) : 'root';
      if (!topicMap.has(p)) topicMap.set(p, []);
      topicMap.get(p).push(top);
    });

    const result = [];
    const traverse = (parentIdKey, depth = 0) => {
      const children = topicMap.get(parentIdKey) || [];
      children.forEach((item) => {
        result.push({
          id: String(item._id),
          slug: item.slug,
          label: `${'— '.repeat(depth)}${item.icon || '📁'} ${item.name}`,
        });
        traverse(String(item._id), depth + 1);
      });
    };

    traverse('root', 0);
    return result;
  }, [topics]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    // Determine subcategory from selected topic or fallback
    const matchedTopic = topics.find((t) => String(t._id) === String(form.topicId));
    const subcategoryValue = matchedTopic ? matchedTopic.slug : (form.subcategory || 'windows');

    const tagsArray = typeof form.tags === 'string'
      ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : form.tags;

    onSubmit({
      payload: {
        ...form,
        category: 'it_help',
        topicId: form.topicId || null,
        subcategory: subcategoryValue,
        tags: tagsArray,
        sortOrder: Number(form.sortOrder) || 0,
        quickLinkOrder: Number(form.quickLinkOrder) || 0,
      },
      file: coverFile,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-slate-800">
            {initial ? (t('editNote') || 'Edit Note') : (t('newNote') || 'New Note')}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono text-slate-600 border border-slate-200">
            Obsidian Markdown
          </span>
        </div>
      }
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {formError}
          </div>
        )}

        {/* Title Input */}
        <div>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder={t('noteTitlePlaceholder') || 'Untitled Note / How to configure VPN...'}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Parent Folder & Slug */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {t('folder') || 'Folder / Topic'} <span className="text-red-500">*</span>
            </label>
            <select
              value={form.topicId}
              onChange={(e) => setField('topicId', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">{t('selectFolder') || '-- Choose Folder --'}</option>
              {topicOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {t('slug') || 'URL Slug'}
            </label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setField('slug', e.target.value);
              }}
              placeholder="url-slug"
              className="w-full rounded-xl border border-slate-200 font-mono px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <input
            type="text"
            value={form.summary}
            onChange={(e) => setField('summary', e.target.value)}
            placeholder={t('briefSummary') || 'Brief summary (1-2 sentences for preview)'}
            className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Markdown Toolbar & View Switcher */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/90 px-3 py-2">
            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                title="Bold (**text**)"
                onClick={() => insertFormat('**', '**', 'bold')}
                className="rounded px-2 py-1 font-bold text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                B
              </button>
              <button
                type="button"
                title="Italic (*text*)"
                onClick={() => insertFormat('*', '*', 'italic')}
                className="rounded px-2 py-1 italic text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                I
              </button>
              <span className="mx-0.5 h-4 w-px bg-slate-300" />
              <button
                type="button"
                title="Heading 1 (# )"
                onClick={() => insertFormat('# ', '', 'Heading 1')}
                className="rounded px-2 py-1 font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                H1
              </button>
              <button
                type="button"
                title="Heading 2 (## )"
                onClick={() => insertFormat('## ', '', 'Heading 2')}
                className="rounded px-2 py-1 font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                H2
              </button>
              <button
                type="button"
                title="Heading 3 (### )"
                onClick={() => insertFormat('### ', '', 'Heading 3')}
                className="rounded px-2 py-1 font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                H3
              </button>
              <span className="mx-0.5 h-4 w-px bg-slate-300" />
              <button
                type="button"
                title="Bullet List (- )"
                onClick={() => insertFormat('- ', '', 'List item')}
                className="rounded px-2 py-1 text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                • List
              </button>
              <button
                type="button"
                title="Checklist (- [ ] )"
                onClick={() => insertFormat('- [ ] ', '', 'Task')}
                className="rounded px-2 py-1 text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                ☑ Checklist
              </button>
              <button
                type="button"
                title="Code Block (```)"
                onClick={() => insertFormat('```bash\n', '\n```', 'echo "hello"')}
                className="rounded px-2 py-1 font-mono text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                &lt;/&gt;
              </button>
              <button
                type="button"
                title="Inline Code (`code`)"
                onClick={() => insertFormat('`', '`', 'code')}
                className="rounded px-2 py-1 font-mono text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                `code`
              </button>
              <span className="mx-0.5 h-4 w-px bg-slate-300" />
              <button
                type="button"
                title="Callout Note (> [!NOTE])"
                onClick={() => insertFormat('> [!NOTE]\n> ', '', 'Important note details')}
                className="rounded px-2 py-1 text-blue-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                ℹ️ Note
              </button>
              <button
                type="button"
                title="Callout Tip (> [!TIP])"
                onClick={() => insertFormat('> [!TIP]\n> ', '', 'Helpful tip')}
                className="rounded px-2 py-1 text-emerald-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                💡 Tip
              </button>
              <button
                type="button"
                title="Callout Warning (> [!WARNING])"
                onClick={() => insertFormat('> [!WARNING]\n> ', '', 'Caution warning')}
                className="rounded px-2 py-1 text-amber-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                ⚠️ Warning
              </button>
              <span className="mx-0.5 h-4 w-px bg-slate-300" />
              <button
                type="button"
                title="Link ([Title](url))"
                onClick={() => insertFormat('[', '](https://example.com)', 'Link title')}
                className="rounded px-2 py-1 text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                🔗 Link
              </button>
              <button
                type="button"
                title="Image (![alt](url))"
                onClick={() => insertFormat('![Image description](', ')', 'https://...')}
                className="rounded px-2 py-1 text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                🖼️ Image
              </button>
              <button
                type="button"
                title="Divider (---)"
                onClick={() => insertFormat('\n---\n', '', '')}
                className="rounded px-2 py-1 text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
              >
                —
              </button>
            </div>

            {/* Mode tabs: Write | Split | Preview */}
            <div className="flex items-center rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  activeTab === 'write' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {t('write') || 'Write'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`hidden md:block rounded-md px-2.5 py-1 transition-all ${
                  activeTab === 'split' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {t('split') || 'Split'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  activeTab === 'preview' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {t('preview') || 'Preview'}
              </button>
            </div>
          </div>

          {/* Editor / Preview Content Area */}
          <div className="min-h-[300px]">
            {/* Write View */}
            {activeTab === 'write' && (
              <textarea
                ref={textareaRef}
                value={form.content}
                onChange={(e) => setField('content', e.target.value)}
                onKeyDown={handleKeyDown}
                rows={14}
                placeholder={t('markdownPlaceholder') || '# Steps to resolve...\n\n> [!NOTE]\n> Please ensure you are connected to the office WiFi.\n\n```bash\nipconfig /flushdns\n```'}
                className="w-full resize-y border-0 p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
              />
            )}

            {/* Split View */}
            {activeTab === 'split' && (
              <div className="grid h-[380px] grid-cols-2 divide-x divide-slate-200">
                <textarea
                  ref={textareaRef}
                  value={form.content}
                  onChange={(e) => setField('content', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('markdownPlaceholder')}
                  className="h-full resize-none border-0 p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 overflow-y-auto"
                />
                <div className="h-full overflow-y-auto bg-slate-50/40 p-4">
                  {form.content ? (
                    <MarkdownRenderer content={form.content} />
                  ) : (
                    <p className="text-xs italic text-slate-400">{t('livePreviewAppearsHere') || 'Live preview will appear here...'}</p>
                  )}
                </div>
              </div>
            )}

            {/* Preview View */}
            {activeTab === 'preview' && (
              <div className="max-h-[380px] overflow-y-auto p-5">
                {form.content ? (
                  <MarkdownRenderer content={form.content} />
                ) : (
                  <p className="text-xs italic text-slate-400">{t('noContentPreview') || 'No content to preview.'}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Metadata Details */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-3">
          {/* Cover Image Upload */}
          <div>
            <ImageUpload
              label={t('coverImage') || 'Cover Image'}
              value={form.coverImage}
              onChange={(file) => setCoverFile(file)}
              disabled={submitting}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('tags') || 'Tags (comma separated)'}
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setField('tags', e.target.value)}
                placeholder="wifi, network, vpn"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('status') || 'Status'}
              </label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="draft">📝 {t('draft') || 'Draft'}</option>
                <option value="published">🚀 {t('published') || 'Published'}</option>
                <option value="archived">📦 {t('archived') || 'Archived'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t('sortOrder') || 'Sort Order'}
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField('sortOrder', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Quick link toggle */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isQuickLink}
                onChange={(e) => setField('isQuickLink', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              ⭐ {t('makeQuickLink') || 'Pin to Quick Links'}
            </label>
            {form.isQuickLink && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t('order') || 'Order'}:</span>
                <input
                  type="number"
                  value={form.quickLinkOrder}
                  onChange={(e) => setField('quickLinkOrder', e.target.value)}
                  className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                />
              </div>
            )}
          </div>

          {/* Target Roles */}
          {roles.length > 0 && (
            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                {t('targetRoles') || 'Visible to Roles'}
              </span>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium cursor-pointer transition-all ${
                      form.targetRoles.includes(r)
                        ? 'border-blue-300 bg-blue-50/80 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.targetRoles.includes(r)}
                      onChange={() => toggleRole(r)}
                      className="hidden"
                    />
                    <span>{label(r)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={submitting || !form.title.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (t('saving') || 'Saving...') : (initial ? (t('saveChanges') || 'Save Changes') : (t('createNote') || 'Create Note'))}
          </button>
        </div>
      </form>
    </Modal>
  );
}
