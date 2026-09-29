import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../common/ImageUpload.jsx';
import useLanguage from '../../hooks/useLanguage.js';
import ExecutiveLeadershipView from './ExecutiveLeadershipView.jsx';

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

const MANAGER_KEYWORDS = [
  'manager',
  'head',
  'lead',
  'supervisor',
  'ผู้อำนวยการ',
  'ผู้จัดการ',
  'หัวหน้า',
  'ผู้ช่วยผู้จัดการ',
];

export const getEmployeeTier = (node, isRoot = false) => {
  if (!node) return 'staff';
  const pos = (node.position || '').toLowerCase();
  if (isRoot || EXECUTIVE_KEYWORDS.some((kw) => pos.includes(kw))) {
    return 'executive';
  }
  if ((node.children && node.children.length > 0) || MANAGER_KEYWORDS.some((kw) => pos.includes(kw))) {
    return 'manager';
  }
  return 'staff';
};

function NodeAvatar({ node, size = 'md', tier = 'staff' }) {
  const sizeClass =
    size === 'sm'
      ? 'w-9 h-9 text-xs'
      : size === 'lg'
      ? 'w-16 h-16 text-lg'
      : size === 'xl'
      ? 'w-20 h-20 text-xl'
      : 'w-12 h-12 text-sm';

  const ringColor =
    tier === 'executive'
      ? 'ring-2 ring-amber-400 shadow-amber-200/50'
      : tier === 'manager'
      ? 'ring-2 ring-indigo-400 shadow-indigo-200/50'
      : 'ring-1 ring-gray-200';

  return (
    <div className="relative shrink-0">
      <ImageWithFallback
        src={node.profileImage}
        alt={node.fullName}
        className={`${sizeClass} rounded-2xl object-cover shrink-0 border-2 border-white shadow-sm ${ringColor}`}
        fallback={initialsFor(node)}
      />
      {tier === 'executive' && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
          👑
        </span>
      )}
    </div>
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
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'departments' | 'executives'
  const [layoutStyle, setLayoutStyle] = useState('compact'); // 'compact' | 'horizontal'
  const [focusedId, setFocusedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [selected, setSelected] = useState(null);

  // Canvas Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // All flat nodes and map
  const allNodes = useMemo(() => {
    const list = collectNodes([...(tree?.roots || []), ...(tree?.orphans || [])]);
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

  // Root ID set for tier detection
  const rootIdSet = useMemo(() => {
    return new Set((tree?.roots || []).map((r) => r.id));
  }, [tree]);

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

  // Top Stats Summary
  const stats = useMemo(() => {
    let executivesCount = 0;
    let managersCount = 0;
    const deptsSet = new Set();

    allNodes.forEach((n) => {
      const tier = getEmployeeTier(n, rootIdSet.has(n.id));
      if (tier === 'executive') executivesCount += 1;
      else if (tier === 'manager') managersCount += 1;
      if (n.department?.name) deptsSet.add(n.department.name);
    });

    return {
      total: allNodes.length,
      executives: executivesCount,
      managers: managersCount,
      departments: deptsSet.size,
    };
  }, [allNodes, rootIdSet]);

  // Auto-expand all nodes initially
  useEffect(() => {
    setExpandedIds(new Set(nodesWithChildren.map((n) => n.id)));
    setFocusedId(null);
    setSelected(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
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

  // Active roots for Hierarchy Tree View
  const activeRoots = useMemo(() => {
    if (focusedNode) return [focusedNode];
    return tree?.roots || [];
  }, [focusedNode, tree]);

  // Pan & Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleFitScreen = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) {
      handleResetZoom();
      return;
    }
    const containerWidth = containerRef.current.clientWidth;
    const canvasWidth = canvasRef.current.scrollWidth || 1000;
    if (canvasWidth > 0 && containerWidth > 0) {
      const calculatedZoom = Math.max(0.4, Math.min(1.1, (containerWidth - 60) / canvasWidth));
      setZoom(Number(calculatedZoom.toFixed(2)));
      setPan({ x: 0, y: 0 });
    }
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // only left click
    // If click inside interactive elements (buttons, card clicks), don't drag canvas
    if (e.target.closest('button, a, input, select, textarea')) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    if (isDragging) setIsDragging(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Department grouping for Department Teams View
  const departmentGroups = useMemo(() => {
    const groups = new Map();

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

    groups.forEach((group) => {
      // Find person with manager/director keywords or first member
      const headCandidate = group.members.find((m) => {
        const pos = (m.position || '').toLowerCase();
        return (
          pos.includes('president') ||
          pos.includes('director') ||
          pos.includes('manager') ||
          pos.includes('head') ||
          pos.includes('ผู้อำนวยการ') ||
          pos.includes('ผู้จัดการ') ||
          pos.includes('หัวหน้า')
        );
      });
      group.head = headCandidate || group.members[0];
      group.teamMembers = group.members.filter((m) => m.id !== group.head?.id);
    });

    return Array.from(groups.values());
  }, [allNodes, t]);

  const handleFocusExecutive = (id) => {
    setFocusedId(id);
    setViewMode('tree');
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-4 sm:p-6 overflow-y-auto' : ''}`}>
      {/* 1. TOP STATS BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Workforce */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-shadow flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0 font-bold border border-blue-100">
            👥
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold text-gray-900 leading-tight">
              {stats.total}
            </p>
            <p className="text-xs font-semibold text-gray-500 truncate">
              {t('totalWorkforce')}
            </p>
          </div>
        </div>

        {/* C-Suite Executives */}
        <div
          onClick={() => setViewMode('executives')}
          className="bg-white rounded-2xl border border-amber-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0 font-bold border border-amber-200/80 group-hover:scale-105 transition-transform">
            👑
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-extrabold text-amber-950 leading-tight">
                {stats.executives}
              </p>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                {t('openCard')} →
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 truncate">
              {t('cSuiteExecutives')}
            </p>
          </div>
        </div>

        {/* Managers & Leads */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-shadow flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0 font-bold border border-indigo-100">
            👔
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold text-gray-900 leading-tight">
              {stats.managers}
            </p>
            <p className="text-xs font-semibold text-gray-500 truncate">
              {t('managersAndLeads')}
            </p>
          </div>
        </div>

        {/* Departments & Divisions */}
        <div
          onClick={() => setViewMode('departments')}
          className="bg-white rounded-2xl border border-emerald-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 font-bold border border-emerald-100 group-hover:scale-105 transition-transform">
            🏢
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-extrabold text-gray-900 leading-tight">
                {stats.departments}
              </p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                {t('openCard')} →
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 truncate">
              {t('allDivisions')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. SMART TOOLBAR */}
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
              className="w-full pl-9.5 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
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

          {/* Department Filter & 3-in-1 View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Filter */}
            <select
              value={departmentId || ''}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-primary-500 outline-none font-semibold cursor-pointer"
            >
              <option value="">{t('allDepartments')}</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle: 3-in-1 Smart Views */}
            <div className="flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-white text-primary-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={t('hierarchyView')}
              >
                <span>🌳</span>
                <span>{t('hierarchyView')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('departments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'departments'
                    ? 'bg-white text-primary-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={t('departmentView')}
              >
                <span>🏢</span>
                <span>{t('departmentView')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('executives')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'executives'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={t('executiveLeadershipView')}
              >
                <span>👑</span>
                <span>{t('executiveLeadershipView')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-toolbar: Tree Controls (Zoom, Pan, Layout, Expand/Collapse) */}
        {viewMode === 'tree' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-gray-100 text-xs">
            {/* Left: Search match or total count + Expand/Collapse */}
            <div className="flex flex-wrap items-center gap-2.5 text-gray-500">
              <span className="font-semibold text-gray-700">
                {search.trim()
                  ? t('matches', { count: matchingIds.size, suffix: matchingIds.size === 1 ? '' : 'es' })
                  : t('peopleCount', { count: stats.total })}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <button
                type="button"
                onClick={expandAll}
                className="text-primary-600 hover:text-primary-700 font-bold cursor-pointer"
              >
                {t('expandAll')}
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
              >
                {t('collapseAll')}
              </button>

              <span className="w-1 h-1 rounded-full bg-gray-300" />

              {/* Layout Toggle: Compact vs Horizontal */}
              <div className="inline-flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setLayoutStyle('compact')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
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
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
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
            </div>

            {/* Right: Canvas Toolkit (Zoom, Fit, Fullscreen) */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200/80">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.4}
                className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                title={t('zoomOut')}
              >
                -
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-mono font-bold text-[11px] transition-colors cursor-pointer"
                title={t('resetView')}
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 1.8}
                className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                title={t('zoomIn')}
              >
                +
              </button>

              <button
                type="button"
                onClick={handleFitScreen}
                className="px-2 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-primary-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                title={t('fitScreen')}
              >
                <span>🔍</span>
                <span>{t('fitScreen')}</span>
              </button>

              <div className="w-px h-4 bg-gray-200 mx-0.5" />

              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                title={isFullscreen ? t('exitFullscreen') : t('fullscreenMode')}
              >
                {isFullscreen ? '✕' : '⛶'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. FOCUS BREADCRUMB BANNER */}
      {focusedNode && (
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-2xl px-4 py-3 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto text-xs py-0.5">
            <span className="font-bold text-blue-900 shrink-0">
              🎯 {t('focusedOn', { name: focusedNode.fullName })}:
            </span>
            <button
              type="button"
              onClick={() => setFocusedId(null)}
              className="text-blue-700 hover:underline shrink-0 font-medium"
            >
              {t('viewFullOrg')}
            </button>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1 text-blue-400 shrink-0">
                <span>/</span>
                <button
                  type="button"
                  onClick={() => setFocusedId(crumb.id)}
                  className={`hover:underline cursor-pointer ${
                    crumb.id === focusedId ? 'font-extrabold text-blue-950' : 'text-blue-700 font-medium'
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
            className="px-3 py-1 text-xs font-bold text-blue-800 bg-white hover:bg-blue-100 rounded-xl border border-blue-200 shrink-0 transition-colors shadow-2xs cursor-pointer"
          >
            ✕ {t('viewFullOrg')}
          </button>
        </div>
      )}

      {/* 4. MAIN CONTENT AREA */}
      {allNodes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500 shadow-xs">
          {t('noMatchingEmployees')}
        </div>
      ) : viewMode === 'tree' ? (
        /* ================= VIEW 1: INTERACTIVE ORG TREE (DRAG-TO-PAN CANVAS) ================= */
        <div className="relative bg-slate-50/80 border border-gray-200/90 rounded-3xl shadow-xs overflow-hidden">
          {/* Floating Pan/Zoom Canvas Hint */}
          <div className="absolute bottom-3 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md text-white/90 text-[11px] font-medium shadow-sm">
            <span>🖱️</span>
            <span>{t('panCanvasHint')}</span>
          </div>

          {/* Canvas Viewport */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full overflow-hidden select-none min-h-[580px] max-h-[820px] relative ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div
              ref={canvasRef}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'top center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="py-12 px-8 flex flex-col items-center min-w-max mx-auto space-y-12"
            >
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
                  rootIdSet={rootIdSet}
                  t={t}
                />
              ))}

              {/* Unassigned / Orphans Section */}
              {!focusedNode && tree?.orphans?.length > 0 && (
                <div className="w-full pt-10 border-t-2 border-dashed border-gray-300/80">
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                      <span>⚠️</span>
                      <span>{t('unassignedManager')}</span>
                    </span>
                    <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
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
                        tier="staff"
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : viewMode === 'executives' ? (
        /* ================= VIEW 3: EXECUTIVE LEADERSHIP ================= */
        <ExecutiveLeadershipView
          tree={tree}
          allNodes={allNodes}
          onFocusExecutive={handleFocusExecutive}
          onSelectExecutive={setSelected}
          t={t}
        />
      ) : (
        /* ================= VIEW 2: DEPARTMENT TEAMS GRID ================= */
        <div className="grid gap-6 md:grid-cols-2">
          {departmentGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Department Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-100 text-primary-800 font-extrabold flex items-center justify-center text-sm border border-primary-200 shadow-2xs">
                      {group.code || group.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                        {group.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">
                        {group.code && `${group.code} • `}
                        {group.members.length} {t('peopleCount', { count: group.members.length })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {group.members.length}
                  </span>
                </div>

                {/* Department Head (Featured) */}
                {group.head && (
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1 mb-2">
                      👑 {t('departmentHead')}
                    </span>
                    <div
                      onClick={() => setSelected(group.head)}
                      className={`p-3.5 rounded-2xl border bg-gradient-to-r from-amber-50/60 via-amber-50/20 to-white border-amber-200 hover:border-amber-400 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        selected?.id === group.head.id ? 'ring-2 ring-primary-500' : ''
                      } ${matchingIds.has(group.head.id) ? 'bg-amber-100/60 ring-2 ring-amber-400' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <NodeAvatar node={group.head} size="md" tier="manager" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {group.head.fullName}
                            {group.head.nickname && (
                              <span className="text-xs font-normal text-gray-500 ml-1">
                                ({group.head.nickname})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-amber-950 font-medium truncate mt-0.5">
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
                            setViewMode('tree');
                          }}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-primary-700 bg-white border border-primary-200 rounded-xl hover:bg-primary-50 shrink-0 shadow-2xs transition-colors cursor-pointer"
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
                  <div className="space-y-2 mb-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      {t('teamMembers')} ({group.teamMembers.length})
                    </span>
                    <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
                      {group.teamMembers.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => setSelected(member)}
                          className={`p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/80 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            selected?.id === member.id ? 'ring-2 ring-primary-500 bg-primary-50/20' : ''
                          } ${matchingIds.has(member.id) ? 'bg-amber-50 ring-2 ring-amber-300' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <NodeAvatar node={member} size="sm" tier="staff" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">
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
                                setViewMode('tree');
                              }}
                              className="p-1.5 text-gray-400 hover:text-primary-700 hover:bg-white rounded-lg shrink-0 border border-transparent hover:border-gray-200 transition-colors cursor-pointer"
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

              {/* Department Branch Explore Button */}
              {group.head && (
                <div className="pt-3 border-t border-gray-100 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFocusedId(group.head.id);
                      setViewMode('tree');
                    }}
                    className="w-full py-2 px-3 rounded-xl font-bold text-xs text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🎯</span>
                    <span>{t('viewDivisionTree')} ({group.name})</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. INTERACTIVE EMPLOYEE DETAIL SLIDE-OVER DRAWER */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl p-6 flex flex-col justify-between"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.fullName} details`}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600">
                      {t('employeeProfile')}
                    </span>
                    {/* Management Tier Pill */}
                    {(() => {
                      const tier = getEmployeeTier(selected, rootIdSet.has(selected.id));
                      return tier === 'executive' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          👑 {t('executiveTier')}
                        </span>
                      ) : tier === 'manager' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                          👔 {t('managementLevel')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          👤 {t('teamMemberLevel')}
                        </span>
                      );
                    })()}
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                    {selected.fullName}
                  </h2>
                  {selected.nickname && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('nickname')}: <span className="font-bold text-gray-800">{selected.nickname}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                  aria-label={t('closeDetails')}
                >
                  ✕
                </button>
              </div>

              {/* Profile Highlight Card */}
              <div className="flex items-center gap-4 py-5 border-b border-gray-100">
                <NodeAvatar
                  node={selected}
                  size="lg"
                  tier={getEmployeeTier(selected, rootIdSet.has(selected.id))}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-extrabold text-gray-900 leading-tight">
                    {selected.position || t('positionNotSpecified')}
                  </p>
                  <p className="text-xs text-primary-700 font-bold mt-1">
                    🏢 {selected.department?.name || t('departmentNotAssigned')}
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                    ● {selected.isActive ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2.5 py-4 border-b border-gray-100">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {t('employeeCodeLabel')}
                  </p>
                  <p className="text-xs font-mono font-bold text-gray-800 mt-0.5">
                    {selected.employeeCode || '—'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {t('departmentCode')}
                  </p>
                  <p className="text-xs font-mono font-bold text-gray-800 mt-0.5">
                    {selected.department?.code || '—'}
                  </p>
                </div>
              </div>

              {/* Direct Contact Chips */}
              <div className="py-4 border-b border-gray-100 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {t('contactDirectly')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.workEmail && (
                    <a
                      href={`mailto:${selected.workEmail}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors"
                    >
                      <span>✉️</span>
                      <span>{selected.workEmail}</span>
                    </a>
                  )}
                  {selected.phone && (
                    <a
                      href={`tel:${selected.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
                    >
                      <span>📞</span>
                      <span>{selected.phone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Reporting Lines Section */}
              <div className="py-4 space-y-4">
                {/* Reports To (Manager) */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('reportsTo')}
                  </p>
                  {parentMap.get(selected.id) ? (
                    <div
                      onClick={() => setSelected(parentMap.get(selected.id))}
                      className="p-3 rounded-2xl border border-gray-200 hover:border-primary-400 bg-gray-50/60 hover:bg-primary-50/20 cursor-pointer transition-all flex items-center gap-3"
                    >
                      <NodeAvatar
                        node={parentMap.get(selected.id)}
                        size="sm"
                        tier={getEmployeeTier(parentMap.get(selected.id), rootIdSet.has(parentMap.get(selected.id).id))}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {parentMap.get(selected.id).fullName}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {parentMap.get(selected.id).position}
                        </p>
                      </div>
                      <span className="text-xs text-primary-600 font-bold">→</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      👑 {t('noManager')} ({t('executiveTier')})
                    </p>
                  )}
                </div>

                {/* Direct Reports (Subordinates) */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
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
                          <NodeAvatar
                            node={child}
                            size="sm"
                            tier={getEmployeeTier(child, false)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 truncate">
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
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      {t('noDirectReports')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-2 mt-4">
              <Link
                to={`/employees/${selected.id}`}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-primary-600 hover:bg-primary-500 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>👤</span>
                <span>{t('viewFullProfile') || 'ดูโปรไฟล์เต็ม'}</span>
              </Link>
              {selected.children?.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFocusedId(selected.id);
                    setViewMode('tree');
                    setSelected(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  🎯 {t('focusTeam')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
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
  rootIdSet,
  t,
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const childCount = node.children?.length || 0;

  const isRoot = rootIdSet?.has(node.id) || false;
  const tier = getEmployeeTier(node, isRoot);

  // Compact layout rule: When compact mode is enabled, node has 2+ subordinates, and all of them are leaves,
  // stack them vertically under their manager so they don't blow out horizontally and crowd adjacent department branches.
  const allChildrenAreLeaves =
    hasChildren && node.children.every((child) => !child.children || child.children.length === 0);

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
        tier={tier}
        t={t}
      />

      {/* Stem connector leading down to children */}
      {hasChildren && isExpanded && (
        <div className="w-0.5 h-6 bg-gradient-to-b from-primary-400 to-primary-300" />
      )}

      {/* Children branches: Case 1 - Compact Subordinate Stacking */}
      {hasChildren && isExpanded && useCompactSubordinates && (
        <div className="relative flex flex-col items-center pt-0">
          <div className="relative pt-4 flex flex-col space-y-3">
            {/* Top feeder bridge: connects from parent center stem (50%) to left spine (-left-6) */}
            <div className="absolute top-0 right-1/2 -left-6 h-4 border-t-2 border-l-2 border-primary-300 rounded-tl-lg pointer-events-none" />

            {node.children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === childCount - 1;

              return (
                <div key={child.id} className="relative flex items-center">
                  {/* Horizontal branch tick into child card */}
                  <div className="absolute -left-6 top-1/2 w-6 h-0.5 bg-primary-300 -translate-y-1/2 pointer-events-none" />

                  {/* Vertical spine coming from above into this card's branch */}
                  <div
                    className={`absolute -left-6 w-0.5 bg-primary-300 pointer-events-none ${
                      isFirst ? 'top-0 h-1/2' : '-top-3 bottom-1/2'
                    }`}
                  />

                  {/* Vertical spine continuing downward to next sibling (only if not the last child) */}
                  {!isLast && (
                    <div className="absolute -left-6 top-1/2 bottom-0 w-0.5 bg-primary-300 pointer-events-none" />
                  )}

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
                    tier={getEmployeeTier(child, false)}
                    t={t}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Children branches: Case 2 - Standard / Horizontal with pure CSS bus connectors */}
      {hasChildren && isExpanded && !useCompactSubordinates && (
        <div className="relative flex flex-col items-center pt-0">
          <div className="flex items-start justify-center">
            {node.children.map((child, index) => (
              <div key={child.id} className="relative flex flex-col items-center px-4">
                {/* Self-balancing horizontal bus connector */}
                {childCount > 1 && (
                  <div className="absolute top-0 left-0 right-0 h-0.5">
                    {index > 0 && (
                      <div className="absolute top-0 left-0 w-1/2 h-0.5 bg-primary-200" />
                    )}
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
                  rootIdSet={rootIdSet}
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

/* ================= INDIVIDUAL EMPLOYEE CARD (UI/UX PROMAX MULTI-TIER) ================= */
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
  tier = 'staff',
  t,
}) {
  // Multi-tier styling according to UI/UX Promax
  const tierStyles = {
    executive: {
      card: 'bg-gradient-to-b from-amber-50/70 via-white to-white border-amber-300 shadow-md hover:border-amber-400 hover:shadow-xl',
      pill: 'bg-amber-100 text-amber-900 border border-amber-300/80',
      title: 'text-amber-950 font-bold',
      badge: '👑',
    },
    manager: {
      card: 'bg-gradient-to-b from-indigo-50/40 via-white to-white border-indigo-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-lg',
      pill: 'bg-indigo-50 text-indigo-900 border border-indigo-200',
      title: 'text-indigo-900 font-bold',
      badge: '👔',
    },
    staff: {
      card: 'bg-white border-gray-200/90 shadow-2xs hover:border-primary-300 hover:shadow-md',
      pill: 'bg-slate-100 text-slate-700 border border-slate-200/80',
      title: 'text-primary-700 font-medium',
      badge: null,
    },
  }[tier] || {
    card: 'bg-white border-gray-200/90',
    pill: 'bg-slate-100 text-slate-700',
    title: 'text-primary-700 font-medium',
    badge: null,
  };

  return (
    <div
      onClick={() => onSelect(node)}
      className={`relative w-68 rounded-2xl border transition-all duration-200 cursor-pointer select-none hover:-translate-y-1 ${
        compact ? 'p-3' : 'p-4'
      } ${tierStyles.card} ${
        isSelected
          ? 'ring-2 ring-primary-500 !border-primary-500 !bg-primary-50/20'
          : isMatch
          ? 'ring-2 ring-amber-400 !border-amber-400 !bg-amber-100/40'
          : ''
      }`}
    >
      {/* Top Department Accent Row */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide truncate max-w-[155px] ${tierStyles.pill}`}
        >
          {node.department?.name || t('departmentNotAssigned')}
        </span>

        <div className="flex items-center gap-1">
          {tierStyles.badge && (
            <span className="text-xs" title={t(tier === 'executive' ? 'executiveTier' : 'managementLevel')}>
              {tierStyles.badge}
            </span>
          )}
          {node.employeeCode && (
            <span className="text-[10px] text-gray-400 font-mono font-bold">
              {node.employeeCode}
            </span>
          )}
        </div>
      </div>

      {/* Profile Row */}
      <div className="flex items-center gap-3">
        <NodeAvatar node={node} size={compact ? 'sm' : 'md'} tier={tier} />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-extrabold text-gray-900 truncate leading-tight">
            {node.fullName}
          </h4>
          {node.nickname && (
            <span className="text-xs text-gray-500 font-medium">
              ({node.nickname})
            </span>
          )}
          <p className={`text-xs truncate mt-0.5 ${tierStyles.title}`}>
            {node.position || t('positionNotSpecified')}
          </p>
        </div>
      </div>

      {/* Direct Reports Pill & Actions */}
      {(!compact || hasChildren) && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isExpanded
                  ? 'bg-primary-100 text-primary-800 hover:bg-primary-200'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              <span>{isExpanded ? '▲' : '▼'}</span>
              <span>
                {node.children.length} {t('directReports')}
              </span>
            </button>
          ) : (
            <span className="text-[11px] text-gray-400 font-medium">
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
              className="p-1.5 rounded-xl text-gray-400 hover:text-primary-700 hover:bg-gray-100 transition-colors cursor-pointer"
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
