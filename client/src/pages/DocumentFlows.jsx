// client/src/pages/DocumentFlows.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import useLanguage from '../hooks/useLanguage.js';
import { DOCUMENT_FLOWS, FLOW_CATEGORIES } from '../data/documentFlowsData.js';
import FlowStepper from '../components/documentFlows/FlowStepper.jsx';
import SampleFormModal from '../components/documentFlows/SampleFormModal.jsx';

const STORAGE_KEY = 'fti_doc_flows_understood_steps';

export default function DocumentFlows() {
  const { t, language, isTh, locale } = useLanguage();

  // Filters & selection
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFlowId, setActiveFlowId] = useState(DOCUMENT_FLOWS[0].id);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Sample modal
  const [sampleModalOpen, setSampleModalOpen] = useState(false);

  // Comprehension persistence (Set of `${flowId}_${stepNumber}`)
  const [understoodSteps, setUnderstoodSteps] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(understoodSteps));
    } catch {
      // Ignore quota errors
    }
  }, [understoodSteps]);

  // Filter flows by category and search query
  const filteredFlows = useMemo(() => {
    return DOCUMENT_FLOWS.filter((flow) => {
      const matchCat = selectedCategoryId === 'all' || flow.category === selectedCategoryId;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchCat;

      const titleMatch = (flow.titleTh + ' ' + flow.titleEn).toLowerCase().includes(q);
      const descMatch = (flow.descTh + ' ' + flow.descEn).toLowerCase().includes(q);
      const codeMatch = (flow.code + ' ' + flow.isoStandard).toLowerCase().includes(q);
      const stepMatch = flow.steps.some(
        (s) => (s.titleTh + ' ' + s.titleEn + ' ' + s.descTh).toLowerCase().includes(q)
      );

      return matchCat && (titleMatch || descMatch || codeMatch || stepMatch);
    });
  }, [selectedCategoryId, searchQuery]);

  // Active flow object
  const activeFlow = useMemo(() => {
    return DOCUMENT_FLOWS.find((f) => f.id === activeFlowId) || filteredFlows[0] || DOCUMENT_FLOWS[0];
  }, [activeFlowId, filteredFlows]);

  // When active flow changes, reset active step index if out of bounds
  useEffect(() => {
    if (activeStepIndex >= activeFlow.steps.length) {
      setActiveStepIndex(0);
    }
  }, [activeFlow, activeStepIndex]);

  // Total steps in all flows
  const totalStepsCount = useMemo(() => {
    return DOCUMENT_FLOWS.reduce((acc, f) => acc + f.steps.length, 0);
  }, []);

  const progressPercent = Math.min(
    100,
    Math.round((understoodSteps.length / totalStepsCount) * 100)
  );

  // Toggle step understood
  const currentStepKey = `${activeFlow.id}_${activeFlow.steps[activeStepIndex]?.stepNumber}`;
  const isCurrentStepUnderstood = understoodSteps.includes(currentStepKey);

  const handleToggleUnderstood = () => {
    setUnderstoodSteps((prev) => {
      if (prev.includes(currentStepKey)) {
        return prev.filter((k) => k !== currentStepKey);
      } else {
        return [...prev, currentStepKey];
      }
    });
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* 1. Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/dashboard" className="hover:text-primary-600 transition">
                {t('dashboard')}
              </Link>
              <span>/</span>
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                {isTh ? 'ขั้นตอนและโฟลว์เอกสาร (Document Flows)' : 'Document Flows & SOP'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>🔄</span>
              <span>{isTh ? 'ขั้นตอนและโฟลว์เอกสารตามมาตรฐานองค์กร' : 'Enterprise Document Flows & SOP'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              {isTh
                ? 'คู่มือกระบวนการปฏิบัติงานมาตรฐาน (SOP / ISO 9001 / ISO 27001 / ITIL) เช่น การแจ้งซ่อมและเบิกเปลี่ยนอุปกรณ์ IT, การขอซื้อพัสดุ, การลา/WFH และการเสนออนุมัติเอกสาร'
                : 'Standard operating procedures (SOP / ISO 9001 / ISO 27001 / ITIL) for IT hardware replacement, procurement, leave, and document sign-offs.'}
            </p>
          </div>

          {/* Comprehension Progress Widget */}
          <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center gap-4 min-w-[240px]">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center font-bold text-xs text-primary-600 dark:text-primary-400">
                {progressPercent}%
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isTh ? 'ความเข้าใจในขั้นตอน' : 'Understanding'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {understoodSteps.length}/{totalStepsCount}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {progressPercent === 100
                  ? (isTh ? '🎉 ครบถ้วนทุกขั้นตอนแล้ว!' : '🎉 All steps understood!')
                  : (isTh ? 'คลิกบันทึกเมื่อศึกษาแต่ละขั้นตอนแล้ว' : 'Check steps as you review them')}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Search & Category Tabs */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTh ? 'ค้นหาโฟลว์, ขั้นตอน, ใบเบิก, เครื่องเสีย, ISO...' : 'Search flows, forms, equipment, ISO...'}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                to="/maintenance"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <span>🔧</span>
                <span>{isTh ? 'ไปหน้าแจ้งซ่อมจริง' : 'Go to Maintenance'}</span>
              </Link>
              <Link
                to="/policies"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <span>📋</span>
                <span>{isTh ? 'ระเบียบนโยบาย' : 'Policies'}</span>
              </Link>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FLOW_CATEGORIES.map((cat) => {
              const active = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                    active
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{isTh ? cat.labelTh : cat.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Workflow Selector Cards (5 Main ISO Flows) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>📚</span>
              <span>{isTh ? 'เลือกกระบวนการมาตรฐานที่ต้องการศึกษา' : 'Select Standard Operating Procedure'}</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {filteredFlows.length} {isTh ? 'กระบวนการ' : 'workflows'}
            </span>
          </div>

          {filteredFlows.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-xs sm:text-sm">
              {isTh ? 'ไม่พบกระบวนการที่ตรงกับเงื่อนไขการค้นหา' : 'No document flows found matching your criteria.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {filteredFlows.map((flow) => {
                const isSelected = flow.id === activeFlow.id;
                const flowSteps = flow.steps || [];
                const understoodCount = flowSteps.filter((s) =>
                  understoodSteps.includes(`${flow.id}_${s.stepNumber}`)
                ).length;
                const isAllUnderstood = understoodCount === flowSteps.length && flowSteps.length > 0;

                return (
                  <button
                    key={flow.id}
                    type="button"
                    onClick={() => {
                      setActiveFlowId(flow.id);
                      setActiveStepIndex(0);
                    }}
                    className={`text-left p-4 rounded-2xl border transition flex flex-col justify-between group focus:outline-hidden ${
                      isSelected
                        ? 'bg-primary-50/50 dark:bg-primary-950/30 border-primary-500 dark:border-primary-600 ring-2 ring-primary-500/20 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        <span className="text-xl">{flow.icon}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${flow.badgeColor}`}
                        >
                          {flow.code}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug transition ${
                          isSelected
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-slate-900 dark:text-white group-hover:text-primary-600'
                        }`}
                      >
                        {isTh ? flow.titleTh : flow.titleEn}
                      </h3>

                      {/* ISO Tag */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        มาตรฐาน: {flow.isoStandard}
                      </p>
                    </div>

                    {/* Card Footer: Step count & status */}
                    <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {flowSteps.length} {isTh ? 'ขั้นตอน' : 'steps'}
                      </span>
                      {isAllUnderstood ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          ✓ {isTh ? 'เข้าใจแล้ว' : 'Done'}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">
                          {understoodCount}/{flowSteps.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Active Flow Workspace */}
        {activeFlow && (
          <div className="space-y-6 pt-2">
            {/* Active Flow Banner Card */}
            <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xl">{activeFlow.icon}</span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary-700/80 text-white border border-primary-600">
                      {activeFlow.code}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {activeFlow.isoStandard}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {isTh ? activeFlow.titleTh : activeFlow.titleEn}
                  </h2>
                  <p className="text-xs sm:text-sm text-primary-100/90 leading-relaxed">
                    {isTh ? activeFlow.descTh : activeFlow.descEn}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {activeFlow.sampleDocument && (
                    <button
                      type="button"
                      onClick={() => setSampleModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-primary-900 hover:bg-primary-50 shadow-md transition transform active:scale-98"
                    >
                      <span>📄</span>
                      <span>{isTh ? 'ดูตัวอย่างแบบฟอร์มจำลอง' : 'View Sample Form'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Decorative background glow */}
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Stepper & Inspector */}
            <FlowStepper
              flow={activeFlow}
              activeStepIndex={activeStepIndex}
              onSelectStep={setActiveStepIndex}
              onOpenSampleModal={() => setSampleModalOpen(true)}
              isUnderstood={isCurrentStepUnderstood}
              onToggleUnderstood={handleToggleUnderstood}
              language={language}
              locale={locale}
            />
          </div>
        )}

        {/* 5. Additional Support & Reference FAQ Card */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>💡</span>
            <span>{isTh ? 'เกร็ดความรู้และข้อควรจำในการส่งต่อเอกสาร (Key Takeaways)' : 'Document Flow Best Practices'}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-primary-700 dark:text-primary-300 block mb-1">
                {isTh ? '1. ตรวจสอบลำดับการอนุมัติเสมอ' : '1. Verify Approval Matrix'}
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {isTh
                  ? 'เอกสารส่วนใหญ่ต้องผ่านหัวหน้างานสายตรงก่อนส่งต่อฝ่ายปลายทาง เพื่อป้องกันการถูกปฏิเสธหรือส่งกลับแก้ไข'
                  : 'Always obtain immediate supervisor sign-off before escalating to receiving departments.'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">
                {isTh ? '2. รักษาหลักฐานและเลขที่เอกสาร' : '2. Keep Ticket & Document Ref'}
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {isTh
                  ? 'จดบันทึกเลขที่เอกสาร (เช่น IT-REQ-XXXX หรือ Ticket ID) ไว้เสมอ เพื่อใช้ติดตามสถานะกับเจ้าหน้าที่ผู้รับผิดชอบ'
                  : 'Retain reference numbers (e.g. IT-REQ-XXXX) to track progress across involved departments.'}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1">
                {isTh ? '3. ติดต่อสอบถามได้ทันทีทางแชท' : '3. Reach Out via Instant Chat'}
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {isTh
                  ? 'หากไม่แน่ใจว่าต้องใช้ฟอร์มใด สามารถสอบถามในห้องแชท "IT Helpdesk" หรือ "ฝ่ายทรัพยากรบุคคล (HR)" ได้ตลอดเวลาทำการ'
                  : 'Unsure which form to use? Contact IT Helpdesk or HR channels anytime during business hours.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Form Interactive Modal */}
      <SampleFormModal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        flow={activeFlow}
        language={language}
        locale={locale}
      />
    </AppShell>
  );
}
