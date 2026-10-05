import { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '../common/Modal.jsx';
import ImageUpload from '../common/ImageUpload.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import TableGeneratorModal from './TableGeneratorModal.jsx';
import WritingGuideModal from './WritingGuideModal.jsx';
import useLanguage from '../../hooks/useLanguage.js';
import { useUploadInlineKnowledgeImage } from '../../hooks/useKnowledge.js';
import { getCleanTopicName } from '../../utils/knowledgeUtils.js';

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
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_ARTICLE);
  const [coverFile, setCoverFile] = useState(null);
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'split' | 'preview'
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // New Tool Modals & Popovers
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [symbolsMenuOpen, setSymbolsMenuOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [aiMessage, setAiMessage] = useState('');

  // Inline Image Upload Hook
  const uploadInlineImageMutation = useUploadInlineKnowledgeImage();
  const isUploadingImage = uploadInlineImageMutation.isPending;

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
    setUploadError('');
    setAiMessage('');
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

  // Direct Image Upload Handler
  const handleDirectImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('ขนาดไฟล์รูปภาพต้องไม่เกิน 10MB');
      return;
    }

    try {
      setUploadError('');
      const res = await uploadInlineImageMutation.mutateAsync(file);
      const imageUrl = res.url || res.data?.url;
      if (imageUrl) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
        insertFormat(`\n![${cleanName || 'รูปภาพประกอบ'}](${imageUrl})\n`, '', '');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'อัปโหลดรูปภาพล้มเหลว กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDirectImageUpload(file);
    }
    e.target.value = '';
  };

  // Handle Drag & Drop on Textarea
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleDirectImageUpload(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle Paste on Textarea (Clipboard image detection)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleDirectImageUpload(file);
          return;
        }
      }
    }
  };

  // Handle Tab key in textarea for indentation
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertFormat('  ', '', '');
    }
  };

  // AI-Assisted Smart Transformations
  const handleAiTransform = (actionKey) => {
    setAiMenuOpen(false);
    const textarea = textareaRef.current;
    const currentVal = form.content || '';
    const start = textarea?.selectionStart || 0;
    const end = textarea?.selectionEnd || 0;
    const hasSelection = end > start;
    const targetText = hasSelection ? currentVal.slice(start, end) : currentVal;

    if (!targetText.trim() && actionKey !== 'auto_summary') {
      setAiMessage('⚠️ กรุณาพิมพ์เนื้อหาหรือไฮไลท์ข้อความที่ต้องการปรับปรุง');
      setTimeout(() => setAiMessage(''), 4000);
      return;
    }

    let transformed = targetText;
    let message = '';

    switch (actionKey) {
      case 'format_sop': {
        // Splits paragraphs/bullets and converts into numbered 1️⃣ 2️⃣ 3️⃣ SOP steps
        const lines = targetText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const badges = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
        const formattedSteps = lines.map((line, idx) => {
          const badge = badges[idx] || `${idx + 1}.`;
          const cleanLine = line.replace(/^[-*•\d.)\s]+/, '');
          return `### ${badge} ขั้นตอนที่ ${idx + 1}: ${cleanLine}\n- ดำเนินการตรวจสอบและบันทึกผลการปฏิบัติงาน\n`;
        });
        transformed = formattedSteps.join('\n');
        message = '✨ จัดระเบียบเป็นขั้นตอน SOP (1-2-3) เรียบร้อยแล้ว';
        break;
      }

      case 'text_to_table': {
        // Converts comma, tab, or dash separated lines into a Markdown table
        const lines = targetText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          const rows = lines.map((l) => l.split(/[,:\t|]+/).map((c) => c.trim()));
          const maxCols = Math.max(...rows.map((r) => r.length), 2);
          const headers = Array.from({ length: maxCols }, (_, i) => `หัวข้อ ${i + 1}`);
          const headerRow = `| ${headers.join(' | ')} |`;
          const sepRow = `| ${Array(maxCols).fill(':---').join(' | ')} |`;
          const dataRows = rows.map((r) => {
            const filled = Array.from({ length: maxCols }, (_, i) => r[i] || '-');
            return `| ${filled.join(' | ')} |`;
          });
          transformed = `\n${headerRow}\n${sepRow}\n${dataRows.join('\n')}\n`;
          message = '✨ แปลงข้อความเป็นตาราง Markdown เรียบร้อยแล้ว';
        }
        break;
      }

      case 'iso_callout': {
        transformed = `> [!IMPORTANT]\n> **มาตรฐานขั้นตอนปฏิบัติ ISO 20000 / ITIL Compliance:**\n> ${targetText.replace(/\n/g, '\n> ')}\n`;
        message = '✨ ใส่กล่องข้อกำหนดมาตรฐาน ISO เรียบร้อยแล้ว';
        break;
      }

      case 'polish_tone': {
        // Professional IT vocabulary substitutions
        let polished = targetText
          .replace(/โทรหาไอที/g, 'ประสานงานแจ้งเจ้าหน้าที่ IT Helpdesk ผ่านระบบ Ticket หรือเบอร์ภายใน #4102')
          .replace(/เครื่องพัง|คอมพัง/g, 'อุปกรณ์ขัดข้องไม่สามารถทำงานได้ตามปกติ')
          .replace(/ลงวินโดว์ใหม่/g, 'ดำเนินการ Re-image ระบบปฏิบัติการตามมาตรฐานความปลอดภัย FTI')
          .replace(/เปลี่ยนเครื่อง/g, 'ดำเนินการยื่นใบเบิกขอรับอุปกรณ์ทดแทน (Hardware Replacement)')
          .replace(/ต่อเน็ตไม่ได้/g, 'ไม่สามารถสร้างการเชื่อมต่อเครือข่าย FTI-Corporate Wi-Fi ได้');

        transformed = polished;
        message = '✨ ปรับสำนวนและคำศัพท์ให้เป็นทางการตามมาตรฐานไอทีแล้ว';
        break;
      }

      case 'auto_summary': {
        // Extracts 1-2 key sentences from content for the brief summary
        const cleanContent = (form.content || '')
          .replace(/#+.*?\n/g, '')
          .replace(/>.*?\n/g, '')
          .replace(/\[.*?\]\(.*?\)/g, '')
          .replace(/[`*_\-|]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const snippet = cleanContent.slice(0, 160);
        if (snippet) {
          setField('summary', `${snippet}...`);
          message = '✨ สรุปเนื้อหาและกรอกลงช่องบทคัดย่อเรียบร้อยแล้ว';
        } else {
          message = '⚠️ ยังไม่มีเนื้อหาเพียงพอที่จะสรุป';
        }
        setAiMessage(message);
        setTimeout(() => setAiMessage(''), 4000);
        return;
      }

      default:
        break;
    }

    if (hasSelection) {
      const nextVal = `${currentVal.slice(0, start)}${transformed}${currentVal.slice(end)}`;
      setField('content', nextVal);
    } else {
      setField('content', transformed);
    }

    setAiMessage(message);
    setTimeout(() => setAiMessage(''), 4000);
  };

  // Build hierarchical topic list for select dropdown
  const topicOptions = useMemo(() => {
    const topicMap = new Map();
    topics.forEach((top) => {
      const p = top.parentId ? (typeof top.parentId === 'object' ? String(top.parentId._id) : String(top.parentId)) : 'root';
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
          label: `${'— '.repeat(depth)}${item.icon || '📁'} ${getCleanTopicName(item.name, item.icon)}`,
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
    <>
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
            {isUploadingImage && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                กำลังอัปโหลดรูปภาพ...
              </span>
            )}
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

          {uploadError && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <span>{uploadError}</span>
              <button type="button" onClick={() => setUploadError('')} className="font-bold">✕</button>
            </div>
          )}

          {aiMessage && (
            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/90 p-2.5 text-xs text-blue-800 animate-fadeIn">
              <span>{aiMessage}</span>
              <button type="button" onClick={() => setAiMessage('')} className="font-bold">✕</button>
            </div>
          )}

          {/* Title Input */}
          <div>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder={t('noteTitlePlaceholder') || 'หัวข้อบทความ / เช่น ขั้นตอนการส่งซ่อมอุปกรณ์ไอทีและขอรับเครื่องทดแทน...'}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-base font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Parent Folder & Slug */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                {t('folder') || 'โฟลเดอร์ / หัวข้อ'} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.topicId}
                onChange={(e) => setField('topicId', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">{t('selectFolder') || '-- เลือกโฟลเดอร์ --'}</option>
                {topicOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                {t('slug') || 'URL Slug (รหัสอ้างอิง)'}
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600">
                {t('briefSummary') || 'บทคัดย่อ / สรุปสาระสำคัญ (1-2 ประโยค)'}
              </label>
              <button
                type="button"
                onClick={() => handleAiTransform('auto_summary')}
                className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>✨</span>
                <span>สรุปให้อัตโนมัติด้วย AI</span>
              </button>
            </div>
            <input
              type="text"
              value={form.summary}
              onChange={(e) => setField('summary', e.target.value)}
              placeholder="สรุปเนื้อหาเบื้องต้นสำหรับแสดงในหน้ารายการค้นหา..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Markdown Toolbar & View Switcher */}
          <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/95 px-3 py-2">
              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {/* Text Formatting */}
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
                  className="rounded px-1.5 py-1 font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
                >
                  H1
                </button>
                <button
                  type="button"
                  title="Heading 2 (## )"
                  onClick={() => insertFormat('## ', '', 'Heading 2')}
                  className="rounded px-1.5 py-1 font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
                >
                  H2
                </button>
                <button
                  type="button"
                  title="Heading 3 (### )"
                  onClick={() => insertFormat('### ', '', 'Heading 3')}
                  className="rounded px-1.5 py-1 font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
                >
                  H3
                </button>

                <span className="mx-0.5 h-4 w-px bg-slate-300" />

                {/* Table Generator Trigger */}
                <button
                  type="button"
                  title="สร้างตาราง Markdown"
                  onClick={() => setTableModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded bg-blue-50/80 border border-blue-200/80 px-2 py-1 font-semibold text-blue-700 hover:bg-blue-100/80 transition shadow-2xs"
                >
                  <span>📊</span>
                  <span>ตาราง</span>
                </button>

                {/* Special Symbols & Badges Palette Toggle */}
                <div className="relative">
                  <button
                    type="button"
                    title="สัญลักษณ์พิเศษ & ป้ายกำกับ"
                    onClick={() => setSymbolsMenuOpen(!symbolsMenuOpen)}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                  >
                    <span>🏷️</span>
                    <span>สัญลักษณ์</span>
                    <span className="text-[9px] text-slate-400">▼</span>
                  </button>

                  {/* Symbols Menu Dropdown */}
                  {symbolsMenuOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl text-xs space-y-2.5 animate-fadeIn">
                      <div>
                        <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">ขั้นตอน (Steps)</p>
                        <div className="flex items-center gap-1">
                          {['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                insertFormat(`### ${num} ขั้นตอนที่: `, '', 'รายละเอียด');
                                setSymbolsMenuOpen(false);
                              }}
                              className="rounded-lg border border-slate-200 p-1.5 hover:bg-blue-50 hover:border-blue-300 text-sm transition"
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">สถานะ & สี (Status)</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              insertFormat('🟢 `[ผ่าน/Online]` ', '', '');
                              setSymbolsMenuOpen(false);
                            }}
                            className="rounded border border-slate-200 p-1 text-left hover:bg-emerald-50"
                          >
                            🟢 สำเร็จ / ผ่าน
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              insertFormat('🟡 `[รออนุมัติ/Pending]` ', '', '');
                              setSymbolsMenuOpen(false);
                            }}
                            className="rounded border border-slate-200 p-1 text-left hover:bg-amber-50"
                          >
                            🟡 รอดำเนินการ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              insertFormat('🔴 `[ระงับ/Offline]` ', '', '');
                              setSymbolsMenuOpen(false);
                            }}
                            className="rounded border border-slate-200 p-1 text-left hover:bg-red-50"
                          >
                            🔴 ออฟไลน์/ระงับ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              insertFormat('🔵 `[ข้อมูล/Info]` ', '', '');
                              setSymbolsMenuOpen(false);
                            }}
                            className="rounded border border-slate-200 p-1 text-left hover:bg-blue-50"
                          >
                            🔵 ข้อมูลทั่วไป
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">ปุ่มคีย์บอร์ด (&lt;kbd&gt;)</p>
                        <div className="flex flex-wrap gap-1">
                          {['Ctrl', 'Alt', 'Shift', 'Enter', 'Esc', 'Win + R'].map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                const kbdTags = k.includes('+')
                                  ? k.split('+').map((part) => `<kbd>${part.trim()}</kbd>`).join(' + ')
                                  : `<kbd>${k}</kbd>`;
                                insertFormat(kbdTags, '', '');
                                setSymbolsMenuOpen(false);
                              }}
                              className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 hover:bg-white"
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSymbolsMenuOpen(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-600"
                        >
                          ปิดเมนู ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Assistant Menu Toggle */}
                <div className="relative">
                  <button
                    type="button"
                    title="เครื่องมือปรับปรุงข้อความด้วย AI"
                    onClick={() => setAiMenuOpen(!aiMenuOpen)}
                    className="inline-flex items-center gap-1 rounded bg-linear-to-r from-purple-500 to-indigo-600 px-2 py-1 font-semibold text-white shadow-2xs hover:brightness-105 transition"
                  >
                    <span>✨</span>
                    <span>AI Assistant</span>
                    <span className="text-[9px] text-purple-200">▼</span>
                  </button>

                  {/* AI Assistant Dropdown */}
                  {aiMenuOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-2xl border border-purple-200 bg-white p-2.5 shadow-xl text-xs space-y-1 animate-fadeIn">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                        ⚡ ผู้ช่วย AI จัดระเบียบเนื้อหา
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAiTransform('format_sop')}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition"
                      >
                        <span className="text-sm">🚀</span>
                        <div>
                          <p className="font-semibold">แปลงเป็นขั้นตอน SOP (1-2-3)</p>
                          <p className="text-[10px] text-slate-400">แยกข้อจำเป็นขั้นตอนมาตรฐาน</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAiTransform('text_to_table')}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition"
                      >
                        <span className="text-sm">📊</span>
                        <div>
                          <p className="font-semibold">แปลงข้อความเป็นตาราง</p>
                          <p className="text-[10px] text-slate-400">แปลงข้อความที่เลือกเป็นตารางอัตโนมัติ</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAiTransform('iso_callout')}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition"
                      >
                        <span className="text-sm">🛡️</span>
                        <div>
                          <p className="font-semibold">ใส่กล่องข้อกำหนด ISO</p>
                          <p className="text-[10px] text-slate-400">เน้นข้อปฏิบัติตามมาตรฐาน ISO 20000</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAiTransform('polish_tone')}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition"
                      >
                        <span className="text-sm">✍️</span>
                        <div>
                          <p className="font-semibold">ปรับภาษาทางการไอที</p>
                          <p className="text-[10px] text-slate-400">ปรับสำนวนคำศัพท์ให้สุภาพเป็นมืออาชีพ</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAiTransform('auto_summary')}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition"
                      >
                        <span className="text-sm">📝</span>
                        <div>
                          <p className="font-semibold">สรุปสาระสำคัญอัตโนมัติ</p>
                          <p className="text-[10px] text-slate-400">สร้างบทคัดย่อใส่ช่องสรุป</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Writing Guide Button */}
                <button
                  type="button"
                  title="ดูคู่มือและเทมเพลตมาตรฐาน"
                  onClick={() => setGuideModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50/80 px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                >
                  <span>📖</span>
                  <span>คู่มือเขียน</span>
                </button>

                <span className="mx-0.5 h-4 w-px bg-slate-300" />

                {/* Direct Image Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  title="อัปโหลดรูปภาพลงบทความโดยตรง (หรือวาง Paste / Drag & Drop)"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-100 transition shadow-2xs disabled:opacity-50"
                >
                  <span>📷</span>
                  <span>{isUploadingImage ? 'กำลังอัปโหลด...' : 'แนบรูปตรง'}</span>
                </button>

                {/* Callout Quick Buttons */}
                <button
                  type="button"
                  title="Callout Note (> [!NOTE])"
                  onClick={() => insertFormat('> [!NOTE]\n> ', '', 'ข้อความบันทึกสำคัญ')}
                  className="rounded px-1.5 py-1 text-blue-700 hover:bg-white hover:shadow-xs transition-colors"
                >
                  ℹ️
                </button>
                <button
                  type="button"
                  title="Callout Warning (> [!WARNING])"
                  onClick={() => insertFormat('> [!WARNING]\n> ', '', 'ข้อควรระวังการใช้งาน')}
                  className="rounded px-1.5 py-1 text-amber-700 hover:bg-white hover:shadow-xs transition-colors"
                >
                  ⚠️
                </button>

                <button
                  type="button"
                  title="Checklist (- [ ] )"
                  onClick={() => insertFormat('- [ ] ', '', 'งานที่ต้องตรวจสอบ')}
                  className="rounded px-1.5 py-1 text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
                >
                  ☑
                </button>
                <button
                  type="button"
                  title="Code Block (```)"
                  onClick={() => insertFormat('```bash\n', '\n```', 'ipconfig /flushdns')}
                  className="rounded px-1.5 py-1 font-mono text-slate-700 hover:bg-white hover:shadow-xs transition-colors"
                >
                  &lt;/&gt;
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
            <div className="min-h-[320px]">
              {/* Write View */}
              {activeTab === 'write' && (
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={form.content}
                    onChange={(e) => setField('content', e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    rows={15}
                    placeholder={
                      t('markdownPlaceholder') ||
                      '# หัวข้อขั้นตอน...\n\n> [!NOTE]\n> ผู้ใช้งานสามารถลากไฟล์รูปภาพมาวาง หรือกด Ctrl+V เพื่อวางรูปภาพได้ทันที\n\n```bash\nipconfig /flushdns\n```'
                    }
                    className="w-full resize-y border-0 p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
                  />
                  <div className="px-4 py-1.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400">
                    <span>💡 รองรับการลากไฟล์รูปภาพมาวาง (Drag & Drop) หรือกด Ctrl + V เพื่อแทรกรูปได้โดยตรง</span>
                    <span>{form.content?.length || 0} ตัวอักษร</span>
                  </div>
                </div>
              )}

              {/* Split View */}
              {activeTab === 'split' && (
                <div className="grid h-[420px] grid-cols-2 divide-x divide-slate-200">
                  <div className="flex flex-col h-full">
                    <textarea
                      ref={textareaRef}
                      value={form.content}
                      onChange={(e) => setField('content', e.target.value)}
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      placeholder={t('markdownPlaceholder')}
                      className="flex-1 resize-none border-0 p-4 font-mono text-xs leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 overflow-y-auto"
                    />
                    <div className="px-3 py-1 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400">
                      วางรูปได้ด้วย Ctrl + V
                    </div>
                  </div>
                  <div className="h-full overflow-y-auto bg-slate-50/40 p-4">
                    {form.content ? (
                      <MarkdownRenderer content={form.content} />
                    ) : (
                      <p className="text-xs italic text-slate-400">{t('livePreviewAppearsHere') || 'ตัวอย่างผลลัพธ์สดจะแสดงที่นี่...'}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Preview View */}
              {activeTab === 'preview' && (
                <div className="max-h-[420px] overflow-y-auto p-5">
                  {form.content ? (
                    <MarkdownRenderer content={form.content} />
                  ) : (
                    <p className="text-xs italic text-slate-400">{t('noContentPreview') || 'ยังไม่มีเนื้อหาสำหรับแสดงผล'}</p>
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
                label={t('coverImage') || 'ภาพหน้าปกบทความ (Cover Image)'}
                value={form.coverImage}
                onChange={(file) => setCoverFile(file)}
                disabled={submitting}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t('tags') || 'ป้ายกำกับ (คั่นด้วยจุลภาค)'}
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setField('tags', e.target.value)}
                  placeholder="wifi, repair, sop, iso"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t('status') || 'สถานะการเผยแพร่'}
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="draft">📝 {t('draft') || 'ฉบับร่าง (Draft)'}</option>
                  <option value="published">🚀 {t('published') || 'เผยแพร่แล้ว (Published)'}</option>
                  <option value="archived">📦 {t('archived') || 'จัดเก็บแล้ว (Archived)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t('sortOrder') || 'ลำดับการแสดงผล'}
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setField('sortOrder', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Quick Links & Target Roles Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 pt-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isQuickLink}
                  onChange={(e) => setField('isQuickLink', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold">⭐ แสดงในแท็บ Quick Links หน้าหลัก</span>
              </label>

              {form.isQuickLink && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">ลำดับ Quick Link:</span>
                  <input
                    type="number"
                    value={form.quickLinkOrder}
                    onChange={(e) => setField('quickLinkOrder', e.target.value)}
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-center text-slate-700"
                  />
                </div>
              )}
            </div>

            {/* Target Roles */}
            {roles && roles.length > 0 && (
              <div className="border-t border-slate-200/60 pt-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t('targetRoles') || 'บทบาทเป้าหมาย (หากไม่เลือกหมายถึงทุกคน)'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`rounded-xl px-2.5 py-1 text-[11px] font-medium transition ${
                        form.targetRoles.includes(role)
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {label(role)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              {t('cancel') || 'ยกเลิก'}
            </button>
            <button
              type="submit"
              disabled={submitting || isUploadingImage}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t('saving') || 'กำลังบันทึก...'}</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>{initial ? (t('saveChanges') || 'บันทึกการแก้ไข') : (t('createNote') || 'สร้างบทความ')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Table Generator Modal */}
      <TableGeneratorModal
        open={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        onInsertTable={(tableMd) => insertFormat(tableMd, '', '')}
      />

      {/* Writing Guide & SOP Template Cheatsheet Modal */}
      <WritingGuideModal
        open={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        onInsertTemplate={(templateMd) => insertFormat(templateMd, '', '')}
      />
    </>
  );
}
