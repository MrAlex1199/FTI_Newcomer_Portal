// client/src/components/documentFlows/FlowStepper.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function FlowStepper({
  flow,
  activeStepIndex,
  onSelectStep,
  onOpenSampleModal,
  isUnderstood,
  onToggleUnderstood,
  language = 'th',
  locale = 'th'
}) {
  const isTh = language === 'th' || locale === 'th' || locale === 'th-TH';
  const steps = flow.steps || [];
  const currentStep = steps[activeStepIndex] || steps[0];

  const handlePrev = () => {
    if (activeStepIndex > 0) onSelectStep(activeStepIndex - 1);
  };

  const handleNext = () => {
    if (activeStepIndex < steps.length - 1) onSelectStep(activeStepIndex + 1);
  };

  return (
    <div className="space-y-6">
      {/* 1. Interactive Node Stepper Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {isTh ? 'ลำดับขั้นตอนการปฏิบัติงาน (Interactive Flowchart)' : 'Process Progression Stepper'}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTh
                ? `ขั้นตอนที่ ${activeStepIndex + 1} จากทั้งหมด ${steps.length} ขั้นตอน (คลิกที่โหนดเพื่อดูรายละเอียด)`
                : `Step ${activeStepIndex + 1} of ${steps.length} (Click nodes to inspect)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              ⏱️ SLA รวม: {flow.estimatedSla}
            </span>
          </div>
        </div>

        {/* Stepper Node Chain (Desktop & Tablet) */}
        <div className="hidden md:flex items-center justify-between relative">
          {/* Connector Line Behind Nodes */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 z-0">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Node Items */}
          {steps.map((st, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isActive = idx === activeStepIndex;

            return (
              <button
                key={st.stepNumber}
                type="button"
                onClick={() => onSelectStep(idx)}
                className={`relative z-10 flex flex-col items-center group transition focus:outline-hidden ${
                  isActive ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-xs ${
                    isActive
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/60 shadow-md'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-2 border-slate-300 dark:border-slate-700 group-hover:border-primary-400'
                  }`}
                >
                  {isCompleted ? '✓' : st.stepNumber}
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold text-center max-w-[110px] leading-tight line-clamp-2 transition ${
                    isActive
                      ? 'text-primary-700 dark:text-primary-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isTh ? st.titleTh : st.titleEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Stepper (Chips Grid) */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {steps.map((st, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isActive = idx === activeStepIndex;

            return (
              <button
                key={st.stepNumber}
                type="button"
                onClick={() => onSelectStep(idx)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>{isCompleted ? '✓' : st.stepNumber}</span>
                <span className="truncate max-w-[120px]">{isTh ? st.titleTh : st.titleEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Step Detail Inspector Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xs">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white text-xs font-bold">
                {currentStep.stepNumber}
              </span>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 tracking-wide uppercase">
                {isTh ? `ขั้นตอนที่ ${currentStep.stepNumber}` : `Step ${currentStep.stepNumber}`}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                ⏱️ SLA: {currentStep.sla}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              {isTh ? currentStep.titleTh : currentStep.titleEn}
            </h3>
            <p className="text-xs text-slate-500">
              {isTh ? currentStep.titleEn : currentStep.titleTh}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:self-start">
            <span className="text-xs font-medium text-slate-500">{isTh ? 'ผู้รับผิดชอบ:' : 'Actor:'}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              👤 {isTh ? currentStep.actorRoleTh : currentStep.actorRoleEn}
            </span>
          </div>
        </div>

        {/* Step Body Description */}
        <div className="py-5 space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {isTh ? 'คำอธิบายการปฏิบัติงาน (Procedure Details)' : 'Procedure Details'}
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {isTh ? currentStep.descTh : currentStep.descEn}
            </p>
          </div>

          {/* ISO Tips / Pro-tip Box */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40">
            <span className="text-lg shrink-0 mt-0.5">💡</span>
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                {isTh ? 'ข้อแนะนำตามมาตรฐาน (ISO Best Practice):' : 'ISO Standard Recommendation:'}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                {isTh ? currentStep.tipsTh : currentStep.tipsEn}
              </p>
            </div>
          </div>

          {/* Document & Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Required Documents */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {isTh ? 'เอกสารและแบบฟอร์มที่ต้องใช้' : 'Required Form / Document'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isTh ? currentStep.documentRequiredTh : currentStep.documentRequiredEn}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isTh ? 'ดำเนินการในระบบ' : 'Actions'}
                </span>
                <span className="text-xs text-slate-500">
                  {isTh ? 'ลิงก์ตรงไปยังหน้าใช้งานจริง' : 'Direct Action Link'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentStep.actionLink && (
                  <Link
                    to={currentStep.actionLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs transition"
                  >
                    <span>{isTh ? currentStep.actionLabelTh : currentStep.actionLabelEn}</span>
                  </Link>
                )}

                {flow.sampleDocument && (
                  <button
                    type="button"
                    onClick={onOpenSampleModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition"
                  >
                    <span>📄</span>
                    <span>{isTh ? 'ดูตัวอย่างแบบฟอร์ม' : 'View Sample Form'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step Footer Nav & Comprehension Checkbox */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Comprehension Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isUnderstood}
              onChange={onToggleUnderstood}
              className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {isTh ? 'ฉันเข้าใจขั้นตอนนี้แล้ว (ทำเครื่องหมายเพื่อบันทึก)' : 'I have understood this step (Mark as read)'}
            </span>
          </label>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeStepIndex === 0}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {isTh ? '← ก่อนหน้า' : '← Previous'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeStepIndex === steps.length - 1}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
            >
              {isTh ? 'ถัดไป →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
