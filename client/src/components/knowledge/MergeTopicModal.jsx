import { useState, useMemo } from 'react';
import Modal from '../common/Modal.jsx';
import useLanguage from '../../hooks/useLanguage.js';
import { getCleanTopicName } from '../../utils/knowledgeUtils.js';

export default function MergeTopicModal({
  open,
  onClose,
  sourceTopic = null,
  topics = [],
  articles = [],
  onMerge,
  merging = false,
  error = '',
}) {
  const { t } = useLanguage();
  const [targetTopicId, setTargetTopicId] = useState('');

  const sourceArticlesCount = useMemo(() => {
    if (!sourceTopic?._id) return 0;
    return articles.filter((a) => {
      const tId = a.topicId?._id || a.topicId;
      return String(tId) === String(sourceTopic._id);
    }).length;
  }, [sourceTopic, articles]);

  const targetOptions = useMemo(() => {
    if (!sourceTopic?._id) return [];
    return topics
      .filter((t) => String(t._id) !== String(sourceTopic._id))
      .map((t) => ({
        id: String(t._id),
        name: `${t.icon || '📁'} ${getCleanTopicName(t.name, t.icon)}`,
      }));
  }, [sourceTopic, topics]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetTopicId || !sourceTopic?._id) return;
    onMerge(sourceTopic._id, targetTopicId);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('mergeFolderTitle') || 'ยุบรวมโฟลเดอร์ (Merge Topic)'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Source Topic Info Box */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('sourceTopic') || 'โฟลเดอร์ต้นทางที่จะยุบรวม:'}
          </p>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{sourceTopic?.icon || '📁'}</span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {sourceTopic ? getCleanTopicName(sourceTopic.name, sourceTopic.icon) : ''}
              </h4>
              <p className="text-xs text-slate-500">
                {sourceArticlesCount} {t('articles') || 'บทความ'} จะถูกย้ายไปยังโฟลเดอร์ใหม่
              </p>
            </div>
          </div>
        </div>

        {/* Target Topic Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {t('targetTopic') || 'เลือกโฟลเดอร์ปลายทาง (Target Topic)'} <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={targetTopicId}
            onChange={(e) => setTargetTopicId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">{t('selectTargetTopic') || '-- เลือกโฟลเดอร์ปลายทาง --'}</option>
            {targetOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Warning callout */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <p>
              <strong>ข้อควรระวัง:</strong> บทความและโฟลเดอร์ย่อยทั้งหมดของ "{sourceTopic ? getCleanTopicName(sourceTopic.name, sourceTopic.icon) : ''}" จะถูกย้ายไปอยู่ใต้โฟลเดอร์ปลายทางที่เลือก และโฟลเดอร์เดิมจะถูกลบออกถาวร
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={merging}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('cancel') || 'ยกเลิก'}
          </button>
          <button
            type="submit"
            disabled={!targetTopicId || merging}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {merging ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{t('merging') || 'กำลังยุบรวม...'}</span>
              </>
            ) : (
              <>
                <span>🔀</span>
                <span>{t('confirmMerge') || 'ยืนยันการยุบรวม'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
