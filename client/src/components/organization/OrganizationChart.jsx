import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageWithFallback } from '../common/ImageUpload.jsx';
import useLanguage from '../../hooks/useLanguage.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const collectNodes = (nodes, output = []) => {
  (nodes || []).forEach((node) => {
    output.push(node);
    collectNodes(node.children, output);
  });
  return output;
};

const initialsFor = (node) => `${node.firstName?.[0] || ''}${node.lastName?.[0] || ''}`.toUpperCase() || '??';

function NodeAvatar({ node, size = 'normal' }) {
  const sizeClass = size === 'small' ? 'w-9 h-9 text-xs' : 'w-12 h-12 text-sm';
  return (
    <ImageWithFallback
      src={node.profileImage}
      alt={node.fullName}
      className={`${sizeClass} rounded-full object-cover shrink-0`}
      fallback={initialsFor(node)}
    />
  );
}

function NodeMeta({ node }) {
  const { t } = useLanguage();
  return (
    <>
      <p className="font-semibold text-gray-800 truncate">{node.fullName}</p>
      <p className="text-xs text-gray-500 truncate">{node.position || t('positionNotSpecified')}</p>
      {node.department?.name && <p className="text-[11px] text-primary-600 truncate mt-0.5">{node.department.name}</p>}
    </>
  );
}

export default function OrganizationChart({ tree, departments = [], departmentId, onDepartmentChange }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const viewportRef = useRef(null);

  const allNodes = useMemo(
    () => collectNodes([...(tree?.roots || []), ...(tree?.orphans || [])]),
    [tree]
  );
  const nodesWithChildren = useMemo(
    () => allNodes.filter((node) => node.children?.length),
    [allNodes]
  );

  useEffect(() => {
    setExpandedIds(new Set(nodesWithChildren.map((node) => node.id)));
    setSelected(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [tree, nodesWithChildren]);

  const matchingIds = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return new Set();
    return new Set(allNodes.filter((node) => [
      node.fullName,
      node.employeeCode,
      node.position,
      node.department?.name,
      node.department?.code,
    ].some((value) => value?.toLowerCase().includes(term))).map((node) => node.id));
  }, [allNodes, search]);

  const effectiveExpandedIds = useMemo(() => {
    const result = new Set(expandedIds);
    if (!search.trim()) return result;

    const expandParentsOfMatches = (nodes) => (nodes || []).reduce((found, node) => {
      const childMatch = expandParentsOfMatches(node.children);
      if (childMatch) result.add(node.id);
      return found || matchingIds.has(node.id) || childMatch;
    }, false);

    expandParentsOfMatches([...(tree?.roots || []), ...(tree?.orphans || [])]);
    return result;
  }, [expandedIds, matchingIds, search, tree]);

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(nodesWithChildren.map((node) => node.id)));
  const collapseAll = () => setExpandedIds(new Set());
  const changeZoom = (amount) => setZoom((current) => clamp(Number((current + amount).toFixed(2)), 0.55, 1.5));
  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const beginPan = (event) => {
    if (event.button !== 0 || event.target.closest('button, input, select')) return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const movePan = (event) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.originX + event.clientX - dragRef.current.startX,
      y: dragRef.current.originY + event.clientY - dragRef.current.startY,
    });
  };

  const endPan = (event) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const renderDesktopNode = (node, depth = 0) => {
    const hasChildren = Boolean(node.children?.length || node.childrenTruncated);
    const isExpanded = effectiveExpandedIds.has(node.id);
    const isMatch = matchingIds.has(node.id);
    const childCount = node.children?.length || 0;
    
    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node card */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setSelected(node)}
            className={`w-56 text-left flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isMatch ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'} ${selected?.id === node.id ? 'ring-2 ring-primary-300 border-primary-400' : ''}`}
          >
            <NodeAvatar node={node} />
            <span className="min-w-0 flex-1"><NodeMeta node={node} /></span>
          </button>
          
          {/* Expand/collapse button below the card */}
          {hasChildren && (
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => toggleExpanded(node.id)}
              className="mt-2 w-7 h-7 rounded-full border-2 border-primary-300 bg-white text-primary-700 hover:bg-primary-50 font-bold shadow-sm z-10 relative"
              aria-label={`${isExpanded ? t('collapse') : t('expand')} ${node.fullName}`}
              aria-expanded={isExpanded}
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>

        {/* Vertical connecting line from button to children */}
        {isExpanded && hasChildren && node.children?.length > 0 && (
          <div className="w-0.5 h-8 bg-primary-200" />
        )}

        {/* Children container */}
        {isExpanded && node.children?.length > 0 && (
          <div className="relative">
            {/* Horizontal connector line spanning all children */}
            {childCount > 1 && (
              <div className="absolute left-0 right-0 flex justify-center" style={{ top: '0px' }}>
                <div className="relative" style={{ width: `${(childCount - 1) * 405}px` }}>
                  <div className="absolute h-0.5 bg-primary-200" style={{ left: '0', right: '0', top: '0' }} />
                </div>
              </div>
            )}
            
            {/* Children nodes */}
            <div className="flex items-start" style={{ gap: '80px' }}>
              {node.children.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical line from horizontal connector to child node */}
                  <div className="w-0.5 h-8 bg-primary-200" />
                  {renderDesktopNode(child, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isExpanded && node.childrenTruncated && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            {t('reportsHidden', { count: node.directReportCount })}
          </p>
        )}
      </div>
    );
  };

  const renderMobileNode = (node, depth = 0) => {
    const hasChildren = Boolean(node.children?.length || node.childrenTruncated);
    const isExpanded = effectiveExpandedIds.has(node.id);
    const isMatch = matchingIds.has(node.id);
    return (
      <div key={node.id} className={depth ? 'ml-4 border-l border-gray-200 pl-3' : ''}>
        <div className={`flex items-center gap-2 py-2 ${isMatch ? 'bg-amber-50 rounded-lg' : ''}`}>
          {hasChildren ? (
            <button type="button" onClick={() => toggleExpanded(node.id)} className="w-6 h-6 rounded border border-gray-200 text-gray-600 shrink-0" aria-label={`${isExpanded ? t('collapse') : t('expand')} ${node.fullName}`}>
              {isExpanded ? '−' : '+'}
            </button>
          ) : <span className="w-6 shrink-0" />}
          <button type="button" onClick={() => setSelected(node)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
            <NodeAvatar node={node} size="small" />
            <span className="min-w-0 flex-1"><NodeMeta node={node} /></span>
          </button>
        </div>
        {isExpanded && node.children?.map((child) => renderMobileNode(child, depth + 1))}
        {isExpanded && node.childrenTruncated && <p className="ml-11 text-xs text-amber-700 py-1">{t('reportsHidden', { count: node.directReportCount })}</p>}
      </div>
    );
  };

  const renderTopLevel = (nodes, orphan = false, mobile = false) => nodes?.map((node) => (
    <section key={node.id} className={orphan ? 'border-2 border-amber-300 bg-amber-50/40 rounded-2xl p-6' : ''}>
      {orphan && <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-4 text-center">{t('orphanedLink')} {node.orphanReason === 'circular_reference' ? t('circularReference') : t('managerUnavailable')}</p>}
      <div className="flex justify-center">
        {mobile ? renderMobileNode(node) : renderDesktopNode(node)}
      </div>
    </section>
  ));

  const canFitTree = (tree?.roots?.length || 0) + (tree?.orphans?.length || 0) > 0;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
          <label className="block flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t('searchPeople')}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchPeopleHelp')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </label>
          <label className="block lg:w-64">
            <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t('department')}</span>
            <select value={departmentId || ''} onChange={(event) => onDepartmentChange(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-primary-500 outline-none">
              <option value="">{t('allDepartments')}</option>
              {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={expandAll} className="control-button">{t('expandAll')}</button>
          <button type="button" onClick={collapseAll} className="control-button">{t('collapseAll')}</button>
          <span className="hidden sm:inline h-5 w-px bg-gray-200" />
          <span className="text-sm text-gray-500">{matchingIds.size ? t('matches', { count: matchingIds.size, suffix: matchingIds.size === 1 ? '' : 'es' }) : t('peopleCount', { count: tree?.meta?.total || 0 })}</span>
          <span className="ml-auto text-xs text-gray-400">{t('clickDetails')}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-3">
          <span className="text-sm font-semibold text-gray-800">{t('organizationStructure')}</span>
          <span className="text-xs text-gray-400">{t('rootCount', { count: tree?.meta?.rootCount || 0 })} · {t('orphanCount', { count: tree?.meta?.orphanCount || 0 })}</span>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => changeZoom(-0.1)} className="zoom-button" aria-label={t('zoomOut')}>−</button>
            <span className="w-12 text-center text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => changeZoom(0.1)} className="zoom-button" aria-label={t('zoomIn')}>+</button>
            <button type="button" onClick={resetView} className="control-button ml-1">{t('resetView')}</button>
          </div>
        </div>

        {!canFitTree && <p className="p-8 text-center text-gray-500">{t('noMatchingEmployees')}</p>}
        {canFitTree && (
          <>
            <div className="hidden md:block relative h-[38rem] overflow-hidden bg-slate-50/70 cursor-grab active:cursor-grabbing" ref={viewportRef} onPointerDown={beginPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onWheel={(event) => { event.preventDefault(); changeZoom(event.deltaY > 0 ? -0.05 : 0.05); }}>
              <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative min-w-max p-12 origin-top-left" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
                <div className="space-y-12">
                  {renderTopLevel(tree.roots)}
                  {renderTopLevel(tree.orphans, true)}
                </div>
              </div>
              <p className="absolute bottom-3 left-4 rounded bg-white/90 px-2 py-1 text-xs text-gray-500 shadow-sm">{t('dragPan')}</p>
            </div>
            <div className="md:hidden p-4 space-y-4">
              <p className="text-xs text-gray-500">{t('mobileTree')}</p>
              <div className="space-y-3">{renderTopLevel(tree.roots, false, true)}{renderTopLevel(tree.orphans, true, true)}</div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-gray-900/40" role="presentation" onClick={() => setSelected(null)}>
          <aside className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl p-6" role="dialog" aria-modal="true" aria-label={`${selected.fullName} details`} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs uppercase tracking-wide text-primary-600 font-semibold">{t('employeeProfile')}</p><h2 className="text-2xl font-bold text-gray-800 mt-1">{selected.fullName}</h2></div>
              <button type="button" onClick={() => setSelected(null)} className="text-2xl leading-none text-gray-400 hover:text-gray-700" aria-label={t('closeEmployeeDetails')}>×</button>
            </div>
            <div className="flex items-center gap-4 mt-6 pb-6 border-b border-gray-200"><NodeAvatar node={selected} /><div><p className="font-semibold text-gray-800">{selected.position || t('positionNotSpecified')}</p><p className="text-sm text-gray-500">{selected.department?.name || t('departmentNotAssigned')}</p></div></div>
            <dl className="grid grid-cols-2 gap-3 mt-6">
              <Detail label={t('employeeCodeLabel')} value={selected.employeeCode} />
              <Detail label={t('departmentCode')} value={selected.department?.code} />
              <Detail label={t('status')} value={selected.isActive ? t('active') : t('inactive')} />
              <Detail label={t('directReports')} value={selected.children?.length || selected.directReportCount || 0} />
            </dl>
            {selected.orphanReason && <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">{selected.orphanReason === 'circular_reference' ? t('orphanReasonCircular') : t('orphanReasonUnavailable')}</div>}
            <button type="button" onClick={() => setSelected(null)} className="mt-8 w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">{t('closeDetails')}</button>
          </aside>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="rounded-lg bg-gray-50 p-3"><dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt><dd className="mt-1 text-sm font-medium text-gray-700">{value || '—'}</dd></div>;
}
