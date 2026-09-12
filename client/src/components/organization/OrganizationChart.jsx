import { useEffect, useMemo, useState } from 'react';
import { ImageWithFallback } from '../common/ImageUpload.jsx';
import useLanguage from '../../hooks/useLanguage.js';

const collectNodes = (nodes, output = []) => {
  (nodes || []).forEach((node) => {
    output.push(node);
    if (node.children?.length) {
      collectNodes(node.children, output);
    }
  });
  return output;
};

const initialsFor = (node) =>
  `${node.firstName?.[0] || ''}${node.lastName?.[0] || ''}`.toUpperCase() || '??';

function NodeAvatar({ node, size = 'md' }) {
  const sizeClass =
    size === 'sm'
      ? 'w-9 h-9 text-xs'
      : size === 'lg'
      ? 'w-16 h-16 text-lg'
      : 'w-12 h-12 text-sm';

  return (
    <ImageWithFallback
      src={node.profileImage}
      alt={node.fullName}
      className={`${sizeClass} rounded-full object-cover shrink-0 border-2 border-white shadow-sm ring-1 ring-gray-200`}
      fallback={initialsFor(node)}
    />
  );
}

export default function OrganizationChart({
  tree,
  departments = [],
  departmentId,
  onDepartmentChange,
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' | 'department'
  const [layoutStyle, setLayoutStyle] = useState('compact'); // 'compact' | 'horizontal'
  const [focusedId, setFocusedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [selected, setSelected] = useState(null);

  // All flat nodes and map
  const allNodes = useMemo(() => {
    const list = collectNodes([...(tree?.roots || []), ...(tree?.orphans || [])]);
    // Deduplicate by ID
    const seen = new Set();
    return list.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [tree]);

  const allNodesMap = useMemo(() => {
    const map = new Map();
    allNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [allNodes]);

  // Parent map for reporting lines and breadcrumbs
  const parentMap = useMemo(() => {
    const map = new Map();
    const traverse = (nodes, parent = null) => {
      (nodes || []).forEach((node) => {
        if (parent) map.set(node.id, parent);
        if (node.children?.length) traverse(node.children, node);
      });
    };
    traverse(tree?.roots || []);
    traverse(tree?.orphans || []);
    return map;
  }, [tree]);

  // Nodes that have children
  const nodesWithChildren = useMemo(
    () => allNodes.filter((node) => node.children?.length > 0),
    [allNodes]
  );

  // Auto-expand all nodes initially
  useEffect(() => {
    setExpandedIds(new Set(nodesWithChildren.map((n) => n.id)));
    setFocusedId(null);
    setSelected(null);
  }, [tree, nodesWithChildren]);

  // Search matches
  const matchingIds = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return new Set();
    return new Set(
      allNodes
        .filter((node) =>
          [
            node.fullName,
            node.nickname,
            node.employeeCode,
            node.position,
            node.department?.name,
            node.department?.code,
          ].some((val) => val?.toLowerCase().includes(term))
        )
        .map((n) => n.id)
    );
  }, [allNodes, search]);

  // Auto-expand parents of search matches
  useEffect(() => {
    if (!search.trim() || matchingIds.size === 0) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      matchingIds.forEach((id) => {
        let currParent = parentMap.get(id);
        while (currParent) {
          next.add(currParent.id);
          currParent = parentMap.get(currParent.id);
        }
      });
      return next;
    });
  }, [search, matchingIds, parentMap]);

  const toggleExpand = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(nodesWithChildren.map((n) => n.id)));
  const collapseAll = () => setExpandedIds(new Set());

  // Focus node logic
  const focusedNode = focusedId ? allNodesMap.get(focusedId) || null : null;

  // Breadcrumbs from root to focused node
  const breadcrumbs = useMemo(() => {
    if (!focusedNode) return [];
    const trail = [];
    let curr = focusedNode;
    while (curr) {
      trail.unshift(curr);
      curr = parentMap.get(curr.id);
    }
    return trail;
  }, [focusedNode, parentMap]);

  // Active roots for Hierarchy View
  const activeRoots = useMemo(() => {
    if (focusedNode) return [focusedNode];
    return tree?.roots || [];
  }, [focusedNode, tree]);

  // Department grouping for Department View
  const departmentGroups = useMemo(() => {
    const groups = new Map();

    // Group all nodes by department
    allNodes.forEach((node) => {
      const deptName = node.department?.name || t('departmentNotAssigned');
      const deptId = node.department?.id || 'unassigned';
      const deptCode = node.department?.code || '';

      if (!groups.has(deptId)) {
        groups.set(deptId, {
          id: deptId,
          name: deptName,
          code: deptCode,
          head: null,
          members: [],
        });
      }

      const group = groups.get(deptId);
      group.members.push(node);
    });

    // Determine department head for each group
    groups.forEach((group) => {
      // Find person with 'manager', 'head', 'director', 'president' or least manager within department
      const headCandidate = group.members.find((m) => {
        const pos = (m.position || '').toLowerCase();
        return (
          pos.includes('president') ||
          pos.includes('director') ||
          pos.includes('manager') ||
          pos.includes('head')
        );
      });
      group.head = headCandidate || group.members[0];
      // Remaining members
      group.teamMembers = group.members.filter((m) => m.id !== group.head?.id);
    });

    return Array.from(groups.values());
  }, [allNodes, t]);

  const totalCount = allNodes.length;

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPeopleHelp')}
              className="w-full pl-9.5 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Filter */}
            <select
              value={departmentId || ''}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none font-medium"
            >
              <option value="">{t('allDepartments')}</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80">
              <button
                type="button"
                onClick={() => setViewMode('hierarchy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'hierarchy'
                    ? 'bg-white text-primary-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                {t('hierarchyView')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('department')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'department'
                    ? 'bg-white text-primary-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {t('departmentView')}
              </button>
            </div>
          </div>
        </div>

        {/* Status / Quick Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-3 text-gray-500">
            <span>
              {search.trim()
                ? t('matches', { count: matchingIds.size, suffix: matchingIds.size === 1 ? '' : 'es' })
                : t('peopleCount', { count: totalCount })}
            </span>
            {viewMode === 'hierarchy' && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <button
                  type="button"
                  onClick={expandAll}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('expandAll')}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="text-gray-500 hover:text-gray-700 font-medium"
                >
                  {t('collapseAll')}
                </button>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                {/* Layout Style Toggle: Compact vs Horizontal */}
                <div className="inline-flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200/80">
                  <button
                    type="button"
                    onClick={() => setLayoutStyle('compact')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                      layoutStyle === 'compact'
                        ? 'bg-white text-primary-800 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title={t('layoutCompactHelp')}
                  >
                    <span>📑</span>
                    <span>{t('layoutCompact')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutStyle('horizontal')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                      layoutStyle === 'horizontal'
                        ? 'bg-white text-primary-800 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title={t('layoutHorizontalHelp')}
                  >
                    <span>📐</span>
                    <span>{t('layoutHorizontal')}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <span className="text-gray-400">{t('clickDetails')}</span>
        </div>
      </div>

      {/* Focus Breadcrumb Banner (if drill-down is active) */}
      {focusedNode && (
        <div className="flex items-center justify-between gap-3 bg-blue-50/80 border border-blue-200/80 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto text-xs py-0.5">
            <span className="font-semibold text-blue-900 shrink-0">🎯 {t('focusedOn', { name: focusedNode.fullName })}:</span>
            <button
              type="button"
              onClick={() => setFocusedId(null)}
              className="text-blue-700 hover:underline shrink-0"
            >
              {t('viewFullOrg')}
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.id} className="flex items-center gap-1 text-blue-500 shrink-0">
                <span>/</span>
                <button
                  type="button"
                  onClick={() => setFocusedId(crumb.id)}
                  className={`hover:underline ${
                    crumb.id === focusedId ? 'font-bold text-blue-950' : 'text-blue-700'
                  }`}
                >
                  {crumb.fullName}
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFocusedId(null)}
            className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-white hover:bg-blue-100 rounded-lg border border-blue-200 shrink-0 transition-colors"
          >
            ✕ {t('viewFullOrg')}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {allNodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          {t('noMatchingEmployees')}
        </div>
      ) : viewMode === 'hierarchy' ? (
        /* ================= MODE A: HIERARCHY TREE VIEW ================= */
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto py-10 px-6 min-h-[500px]">
            <div className="flex flex-col items-center min-w-max mx-auto space-y-12">
              {activeRoots.map((root) => (
                <TreeNode
                  key={root.id}
                  node={root}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onSelect={setSelected}
                  onFocus={setFocusedId}
                  selectedId={selected?.id}
                  matchingIds={matchingIds}
                  layoutStyle={layoutStyle}
                  t={t}
                />
              ))}

              {/* Unassigned / Orphans Section */}
              {!focusedNode && tree?.orphans?.length > 0 && (
                <div className="w-full pt-8 border-t border-dashed border-gray-200">
                  <div className="text-center mb-6">
                    <h4 className="text-sm font-semibold text-gray-700">
                      {t('unassignedManager')}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('unassignedManagerHelp')}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {tree.orphans.map((orphan) => (
                      <EmployeeCard
                        key={orphan.id}
                        node={orphan}
                        onSelect={setSelected}
                        onFocus={setFocusedId}
                        isSelected={selected?.id === orphan.id}
                        isMatch={matchingIds.has(orphan.id)}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= MODE B: DEPARTMENT TEAMS VIEW ================= */
        <div className="grid gap-6 md:grid-cols-2">
          {departmentGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col"
            >
              {/* Department Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 font-bold flex items-center justify-center text-xs">
                    {group.code || group.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {group.name}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {group.code && `${group.code} • `}
                      {group.members.length} {t('peopleCount', { count: group.members.length })}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {group.members.length}
                </span>
              </div>

              {/* Department Head (Featured) */}
              {group.head && (
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    👑 {t('departmentHead')}
                  </span>
                  <div
                    onClick={() => setSelected(group.head)}
                    className={`p-3 rounded-xl border bg-amber-50/40 border-amber-200 hover:border-amber-300 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      selected?.id === group.head.id ? 'ring-2 ring-primary-500' : ''
                    } ${matchingIds.has(group.head.id) ? 'bg-amber-100/60 ring-2 ring-amber-400' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <NodeAvatar node={group.head} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {group.head.fullName}
                          {group.head.nickname && (
                            <span className="text-xs font-normal text-gray-500 ml-1">
                              ({group.head.nickname})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-amber-900 font-medium truncate">
                          {group.head.position}
                        </p>
                      </div>
                    </div>

                    {group.head.children?.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusedId(group.head.id);
                          setViewMode('hierarchy');
                        }}
                        className="px-2 py-1 text-[11px] font-medium text-primary-700 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 shrink-0"
                        title={t('focusTeam')}
                      >
                        🎯 {t('focusTeam')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Team Members List */}
              {group.teamMembers.length > 0 && (
                <div className="space-y-2 flex-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    {t('teamMembers')} ({group.teamMembers.length})
                  </span>
                  <div className="grid gap-2 sm:grid-cols-1">
                    {group.teamMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => setSelected(member)}
                        className={`p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          selected?.id === member.id ? 'ring-2 ring-primary-500 bg-primary-50/20' : ''
                        } ${matchingIds.has(member.id) ? 'bg-amber-50 ring-2 ring-amber-300' : ''}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <NodeAvatar node={member} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {member.fullName}
                              {member.nickname && (
                                <span className="text-gray-400 font-normal ml-1">
                                  ({member.nickname})
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {member.position}
                            </p>
                          </div>
                        </div>

                        {member.children?.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFocusedId(member.id);
                              setViewMode('hierarchy');
                            }}
                            className="p-1 text-gray-400 hover:text-primary-600 rounded shrink-0"
                            title={t('focusTeam')}
                          >
                            🎯
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Employee Detail Slide-over Drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl p-6 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.fullName} details`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">
                  {t('employeeProfile')}
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  {selected.fullName}
                </h2>
                {selected.nickname && (
                  <p className="text-xs text-gray-500">
                    {t('nickname')}: <span className="font-semibold text-gray-700">{selected.nickname}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold transition-colors"
                aria-label={t('closeDetails')}
              >
                ✕
              </button>
            </div>

            {/* Profile Highlight */}
            <div className="flex items-center gap-4 py-5 border-b border-gray-100">
              <NodeAvatar node={selected} size="lg" />
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {selected.position || t('positionNotSpecified')}
                </p>
                <p className="text-xs text-primary-700 font-medium mt-0.5">
                  {selected.department?.name || t('departmentNotAssigned')}
                </p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                  {selected.isActive ? t('active') : t('inactive')}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2.5 py-4 border-b border-gray-100">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('employeeCodeLabel')}
                </p>
                <p className="text-xs font-bold text-gray-800 mt-0.5">
                  {selected.employeeCode || '—'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('departmentCode')}
                </p>
                <p className="text-xs font-bold text-gray-800 mt-0.5">
                  {selected.department?.code || '—'}
                </p>
              </div>
            </div>

            {/* Direct Reporting Relationship */}
            <div className="py-4 space-y-4 flex-1">
              {/* Reports To (Manager) */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  {t('reportsTo')}
                </p>
                {parentMap.get(selected.id) ? (
                  <div
                    onClick={() => setSelected(parentMap.get(selected.id))}
                    className="p-3 rounded-xl border border-gray-200 hover:border-primary-400 bg-gray-50/50 hover:bg-primary-50/20 cursor-pointer transition-all flex items-center gap-3"
                  >
                    <NodeAvatar node={parentMap.get(selected.id)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {parentMap.get(selected.id).fullName}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {parentMap.get(selected.id).position}
                      </p>
                    </div>
                    <span className="text-xs text-primary-600 font-semibold">→</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic bg-gray-50 p-2.5 rounded-xl">
                    {t('noManager')}
                  </p>
                )}
              </div>

              {/* Direct Reports (Subordinates) */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  {t('directReports')} ({selected.children?.length || 0})
                </p>
                {selected.children?.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selected.children.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => setSelected(child)}
                        className="p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-all flex items-center gap-2.5"
                      >
                        <NodeAvatar node={child} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {child.fullName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {child.position}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">→</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded-xl">
                    {t('noDirectReports')}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              {selected.children?.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFocusedId(selected.id);
                    setViewMode('hierarchy');
                    setSelected(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  🎯 {t('focusTeam')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {t('closeDetails')}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ================= RECURSIVE TREE NODE COMPONENT ================= */
function TreeNode({
  node,
  expandedIds,
  onToggleExpand,
  onSelect,
  onFocus,
  selectedId,
  matchingIds,
  layoutStyle = 'compact',
  t,
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const childCount = node.children?.length || 0;

  // Determine if all children of this node are leaf nodes (individual contributors without subordinates)
  const allChildrenAreLeaves =
    hasChildren && node.children.every((child) => !child.children || child.children.length === 0);

  // Compact layout rule: When compact mode is enabled, node has 2+ subordinates, and all of them are leaves,
  // stack them vertically under their manager so they don't blow out horizontally and crowd adjacent department branches.
  const useCompactSubordinates =
    layoutStyle === 'compact' && hasChildren && allChildrenAreLeaves && childCount >= 2;

  return (
    <div className="flex flex-col items-center">
      {/* Employee Card */}
      <EmployeeCard
        node={node}
        onSelect={onSelect}
        onFocus={onFocus}
        isSelected={selectedId === node.id}
        isMatch={matchingIds.has(node.id)}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        onToggleExpand={() => onToggleExpand(node.id)}
        t={t}
      />

      {/* Stem connector leading down to children */}
      {hasChildren && isExpanded && (
        <div className="w-0.5 h-6 bg-primary-200" />
      )}

      {/* Children branches: Case 1 - Compact Subordinate Stacking (Fixes 2+ subordinates crowding others) */}
      {hasChildren && isExpanded && useCompactSubordinates && (
        <div className="relative flex flex-col items-center pt-0">
          <div className="relative pl-6 py-2 flex flex-col space-y-3">
            {/* Continuous vertical trunk line on left */}
            <div className="absolute left-2.5 top-0 bottom-6 w-0.5 bg-primary-200" />

            {node.children.map((child) => (
              <div key={child.id} className="relative flex items-center">
                {/* Horizontal branch tick leading into child card */}
                <div className="absolute -left-3.5 top-1/2 w-3.5 h-0.5 bg-primary-200 -translate-y-1/2" />
                <EmployeeCard
                  node={child}
                  onSelect={onSelect}
                  onFocus={onFocus}
                  isSelected={selectedId === child.id}
                  isMatch={matchingIds.has(child.id)}
                  hasChildren={false}
                  isExpanded={false}
                  onToggleExpand={() => {}}
                  compact={true}
                  t={t}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Children branches: Case 2 - Standard / Horizontal with Self-Centering Pure CSS Connectors */}
      {hasChildren && isExpanded && !useCompactSubordinates && (
        <div className="relative flex flex-col items-center pt-0">
          <div className="flex items-start justify-center">
            {node.children.map((child, index) => (
              <div key={child.id} className="relative flex flex-col items-center px-4">
                {/* Self-balancing horizontal bus connector */}
                {childCount > 1 && (
                  <div className="absolute top-0 left-0 right-0 h-0.5">
                    {/* Left half-bar: connects this card center to left sibling */}
                    {index > 0 && (
                      <div className="absolute top-0 left-0 w-1/2 h-0.5 bg-primary-200" />
                    )}
                    {/* Right half-bar: connects this card center to right sibling */}
                    {index < childCount - 1 && (
                      <div className="absolute top-0 right-0 w-1/2 h-0.5 bg-primary-200" />
                    )}
                  </div>
                )}

                {/* Vertical line from bus bar directly down to child card center */}
                <div className="w-0.5 h-6 bg-primary-200" />

                <TreeNode
                  node={child}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  onSelect={onSelect}
                  onFocus={onFocus}
                  selectedId={selectedId}
                  matchingIds={matchingIds}
                  layoutStyle={layoutStyle}
                  t={t}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= INDIVIDUAL EMPLOYEE CARD ================= */
function EmployeeCard({
  node,
  onSelect,
  onFocus,
  isSelected,
  isMatch,
  hasChildren,
  isExpanded,
  onToggleExpand,
  compact = false,
  t,
}) {
  return (
    <div
      onClick={() => onSelect(node)}
      className={`relative w-64 bg-white rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 select-none ${
        compact ? 'p-2.5' : 'p-3.5'
      } ${
        isSelected
          ? 'ring-2 ring-primary-500 border-primary-400 bg-primary-50/10'
          : isMatch
          ? 'ring-2 ring-amber-400 border-amber-300 bg-amber-50/30'
          : 'border-gray-200/90 hover:border-primary-300'
      }`}
    >
      {/* Department accent pill at top */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tracking-wide truncate max-w-[150px]">
          {node.department?.name || t('departmentNotAssigned')}
        </span>
        {node.employeeCode && (
          <span className="text-[10px] text-gray-400 font-mono">
            {node.employeeCode}
          </span>
        )}
      </div>

      {/* Profile Row */}
      <div className="flex items-center gap-2.5">
        <NodeAvatar node={node} size={compact ? 'sm' : 'md'} />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-gray-900 truncate leading-tight">
            {node.fullName}
          </h4>
          {node.nickname && (
            <span className="text-xs text-gray-400 font-normal">
              ({node.nickname})
            </span>
          )}
          <p className="text-xs text-primary-700 font-medium truncate mt-0.5">
            {node.position || t('positionNotSpecified')}
          </p>
        </div>
      </div>

      {/* Action / Report Pill Row */}
      {(!compact || hasChildren) && (
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                isExpanded
                  ? 'bg-primary-100/70 text-primary-800 hover:bg-primary-200/70'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              <span>{isExpanded ? '▲' : '▼'}</span>
              <span>
                {node.children.length} {t('directReports')}
              </span>
            </button>
          ) : (
            <span className="text-[11px] text-gray-400">
              {t('noDirectReports')}
            </span>
          )}

          {hasChildren && onFocus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFocus(node.id);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-gray-100 transition-colors"
              title={t('focusTeam')}
            >
              🎯
            </button>
          )}
        </div>
      )}
    </div>
  );
}
