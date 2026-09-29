import React, { useMemo } from 'react';
import { ImageWithFallback } from '../common/ImageUpload.jsx';

const collectSubordinates = (node, list = []) => {
  if (!node?.children?.length) return list;
  node.children.forEach((child) => {
    list.push(child);
    collectSubordinates(child, list);
  });
  return list;
};

const initialsFor = (node) =>
  `${node?.firstName?.[0] || ''}${node?.lastName?.[0] || ''}`.toUpperCase() || '??';

const EXECUTIVE_KEYWORDS = [
  'ceo',
  'president',
  'chief',
  'c-level',
  'managing director',
  'md',
  'director general',
  'vice president',
  'vp',
  'เลขาธิการ',
  'รองเลขาธิการ',
  'ประธาน',
  'รองประธาน',
  'ผู้อำนวยการใหญ่',
  'กรรมการผู้จัดการ',
  'ผู้อำนวยการบริหาร',
];

export default function ExecutiveLeadershipView({
  tree,
  allNodes = [],
  onFocusExecutive,
  onSelectExecutive,
  t,
}) {
  // Identify executives: Roots of the tree or nodes matching executive keywords
  const executives = useMemo(() => {
    const roots = tree?.roots || [];
    const rootIds = new Set(roots.map((r) => r.id));

    // Also look for non-root executives if any
    const titleMatchExecutives = allNodes.filter((node) => {
      if (rootIds.has(node.id)) return false;
      const pos = (node.position || '').toLowerCase();
      return EXECUTIVE_KEYWORDS.some((kw) => pos.includes(kw));
    });

    const combined = [...roots, ...titleMatchExecutives];

    // Deduplicate
    const map = new Map();
    combined.forEach((node) => {
      if (!map.has(node.id)) map.set(node.id, node);
    });

    return Array.from(map.values());
  }, [tree, allNodes]);

  return (
    <div className="space-y-6">
      {/* Intro Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-primary-950 text-white p-7 sm:p-8 shadow-lg border border-indigo-900/50">
        {/* Ambient Decorative Glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold tracking-wider uppercase">
              <span>👑</span>
              <span>{t('executiveTier')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('executiveLeadershipView')}
            </h2>
            <p className="text-sm text-indigo-200/90 leading-relaxed">
              {t('executiveLeadershipSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/15 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-2xl font-bold border border-amber-400/30">
              👑
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{executives.length}</p>
              <p className="text-xs text-indigo-200 font-medium">{t('cSuiteExecutives')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Executives Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {executives.map((exec) => {
          const subordinates = collectSubordinates(exec);
          const totalSupervised = subordinates.length;
          const directReports = exec.children?.length || 0;
          const directManagers = (exec.children || []).filter((c) => c.children?.length > 0).length;

          // Unique departments under supervision
          const deptsSet = new Set();
          if (exec.department?.name) deptsSet.add(exec.department.name);
          subordinates.forEach((sub) => {
            if (sub.department?.name) deptsSet.add(sub.department.name);
          });
          const deptsList = Array.from(deptsSet);

          return (
            <div
              key={exec.id}
              className="group relative bg-white rounded-3xl border border-amber-200/80 hover:border-amber-400/90 p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* Corner Ambient Glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-100/50 rounded-full blur-2xl group-hover:bg-amber-200/60 transition-colors pointer-events-none" />

              <div>
                {/* Top Badge & Tier */}
                <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300/80 shadow-2xs">
                    <span>👑</span>
                    <span>{t('executiveTier')}</span>
                  </span>

                  {exec.employeeCode && (
                    <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                      {exec.employeeCode}
                    </span>
                  )}
                </div>

                {/* Profile Header */}
                <div className="flex items-start gap-4 mb-5 relative z-10">
                  <div className="relative shrink-0">
                    <ImageWithFallback
                      src={exec.profileImage}
                      alt={exec.fullName}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white ring-4 ring-amber-400/30 shadow-md group-hover:ring-amber-400/60 transition-all"
                      fallback={initialsFor(exec)}
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-bold" title={t('active')}>
                      ✓
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight truncate">
                      {exec.fullName}
                    </h3>
                    {exec.nickname && (
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 mt-1">
                        ({exec.nickname})
                      </span>
                    )}
                    <p className="text-xs sm:text-sm font-semibold text-amber-950 mt-1.5 leading-snug line-clamp-2">
                      {exec.position || t('positionNotSpecified')}
                    </p>
                    {exec.department?.name && (
                      <p className="text-xs text-gray-500 font-medium mt-1 truncate">
                        🏢 {exec.department.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Supervision Stats Row */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-r from-amber-50/60 via-slate-50 to-slate-50 rounded-2xl border border-amber-100 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-black text-gray-900">{totalSupervised}</p>
                    <p className="text-[10px] font-semibold text-gray-500 leading-tight">
                      {t('directReports')}
                    </p>
                  </div>
                  <div className="text-center border-x border-gray-200/60">
                    <p className="text-lg font-black text-gray-900">{directReports}</p>
                    <p className="text-[10px] font-semibold text-gray-500 leading-tight">
                      {t('reportsTo')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-gray-900">{deptsList.length}</p>
                    <p className="text-[10px] font-semibold text-gray-500 leading-tight">
                      {t('departments')}
                    </p>
                  </div>
                </div>

                {/* Supervised Divisions Tags */}
                {deptsList.length > 0 && (
                  <div className="mb-5 space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      {t('divisionsUnderSupervision')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {deptsList.slice(0, 4).map((dept) => (
                        <span
                          key={dept}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-gray-100 text-gray-700 border border-gray-200/80 truncate max-w-[160px]"
                        >
                          {dept}
                        </span>
                      ))}
                      {deptsList.length > 4 && (
                        <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                          +{deptsList.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => onFocusExecutive(exec.id)}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 hover:from-primary-700 hover:to-indigo-800 shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🎯</span>
                  <span>{t('viewDivisionTree')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectExecutive(exec)}
                  className="py-2.5 px-3.5 rounded-xl font-bold text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>👤</span>
                  <span>{t('details')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
