import { Link } from 'react-router-dom';
import useLanguage from '../../hooks/useLanguage.js';

const DEPT_ICONS = {
  IT: '💻',
  HR: '👥',
  MKT: '📢',
  SALES: '📈',
  ACC: '💰',
  FIN: '💵',
  LOG: '🚚',
  PRC: '📦',
  ENG: '⚙️',
  QA: '🎯',
  LEG: '⚖️',
  EXEC: '👑',
};

export default function DepartmentCard({ department, canManage, onEdit, onDelete }) {
  const { t } = useLanguage();

  if (!department) return null;

  const codeKey = (department.code || '').toUpperCase();
  const icon = DEPT_ICONS[codeKey] || '🏢';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary-400 hover:shadow-xl hover:ring-2 hover:ring-primary-100/50">
      <div>
        {/* Top Header: Icon + Department Name & Code + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-2xl shadow-xs group-hover:scale-105 transition-transform duration-200">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {department.code && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700">
                    {department.code}
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                <Link to={`/departments/${department._id}`} className="hover:underline">
                  {department.name}
                </Link>
              </h3>
            </div>
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              department.isActive
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                department.isActive ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            {department.isActive ? t('active') : t('inactive')}
          </span>
        </div>

        {/* Manager Chip */}
        <div className="mt-4 rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 font-medium">{t('manager')}:</span>
          <span className="text-xs font-bold text-slate-800 truncate">
            {department.managerId ? (
              <span className="inline-flex items-center gap-1.5">
                <span>👤</span>
                <span>
                  {department.managerId.firstName} {department.managerId.lastName}
                </span>
              </span>
            ) : (
              <span className="text-slate-400 font-normal">—</span>
            )}
          </span>
        </div>

        {/* 2 Stat Boxes: Employees & Interns */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-2.5 text-center">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
              👥 {t('employees')}
            </span>
            <span className="mt-0.5 text-lg font-black text-slate-900 block">
              {department.employeeCount ?? 0}
            </span>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-2.5 text-center">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
              🎓 {t('interns')}
            </span>
            <span className="mt-0.5 text-lg font-black text-slate-900 block">
              {department.internCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Detail Link + Admin Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <Link
          to={`/departments/${department._id}`}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
        >
          <span>{t('viewDepartmentDetail') || 'ดูสมาชิกและโครงสร้าง →'}</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(department)}
              className="rounded-lg p-1.5 text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-primary-600 transition-colors"
              title={t('edit')}
            >
              ✏️ {t('edit')}
            </button>
            <button
              type="button"
              onClick={() => onDelete(department)}
              className="rounded-lg p-1.5 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title={t('delete')}
            >
              🗑️ {t('delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
