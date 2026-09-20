import { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';

const EMOJI_PRESETS = ['📁', '📂', '💻', '🌐', '🔒', '🖨️', '📧', '🛠️', '📱', '⚙️', '📖', '💡', '🛡️', '🚀', '📦', '🔑', '🖥️', '📡'];

export default function TopicModal({
  open,
  onClose,
  initial = null,
  defaultParentId = null,
  topics = [],
  onSubmit,
  submitting = false,
  formError = '',
}) {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setIcon(initial.icon || '📁');
      setParentId(initial.parentId ? String(initial.parentId) : '');
      setDescription(initial.description || '');
      setSortOrder(initial.sortOrder || 0);
    } else {
      setName('');
      setIcon('📁');
      setParentId(defaultParentId ? String(defaultParentId) : '');
      setDescription('');
      setSortOrder(0);
    }
  }, [initial, defaultParentId, open]);

  // Compute descendants of the current topic to prevent circular parent selection
  const descendantIds = useMemo(() => {
    if (!initial?._id) return new Set();
    const map = new Map();
    topics.forEach((top) => {
      const p = top.parentId ? String(top.parentId) : null;
      if (!map.has(p)) map.set(p, []);
      map.get(p).push(String(top._id));
    });

    const set = new Set([String(initial._id)]);
    const queue = [String(initial._id)];
    while (queue.length > 0) {
      const cur = queue.shift();
      const children = map.get(cur) || [];
      for (const ch of children) {
        if (!set.has(ch)) {
          set.add(ch);
          queue.push(ch);
        }
      }
    }
    return set;
  }, [initial, topics]);

  // Flattened hierarchical tree for clean indented <option> list
  const parentOptions = useMemo(() => {
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
        // Exclude current topic and its descendants
        if (!descendantIds.has(String(item._id))) {
          result.push({
            id: String(item._id),
            label: `${'— '.repeat(depth)}${item.icon || '📁'} ${item.name}`,
          });
          traverse(String(item._id), depth + 1);
        }
      });
    };

    traverse('root', 0);
    return result;
  }, [topics, descendantIds]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      icon: icon.trim() || '📁',
      parentId: parentId || null,
      description: description.trim(),
      sortOrder: Number(sortOrder) || 0,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? (t('editFolder') || 'Edit Folder') : (t('createFolder') || 'Create Folder')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {formError}
          </div>
        )}

        {/* Icon & Emoji selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            {t('folderIcon') || 'Folder Icon'}
          </label>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl shadow-xs">
              {icon || '📁'}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={icon}
                maxLength={4}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📁"
                className="w-20 rounded-xl border border-slate-200 px-3 py-1.5 text-center text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <span className="ml-2 text-xs text-slate-400">
                {t('customEmojiOrPreset') || 'Emoji or preset'}
              </span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2">
            {EMOJI_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setIcon(preset)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-base hover:bg-white hover:shadow-xs transition-transform active:scale-95 ${
                  icon === preset ? 'bg-white ring-2 ring-blue-500 shadow-xs' : ''
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Folder Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            {t('folderName') || 'Folder Name'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('folderNamePlaceholder') || 'e.g. Network & Connectivity, VPN Setup...'}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Parent Folder selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            {t('parentFolder') || 'Parent Folder'}
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">{t('rootLevel') || '📂 [Root Level / No Parent]'}</option>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">
            {t('parentFolderHint') || 'Folders can be nested infinitely like Obsidian vaults'}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            {t('description') || 'Description'} ({t('optional') || 'Optional'})
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('folderDescPlaceholder') || 'Brief description of topics covered inside...'}
            className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Action Buttons */}
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
            disabled={submitting || !name.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (t('saving') || 'Saving...') : (initial ? (t('saveChanges') || 'Save Changes') : (t('createFolder') || 'Create Folder'))}
          </button>
        </div>
      </form>
    </Modal>
  );
}
