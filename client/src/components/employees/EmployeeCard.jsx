import { Link } from 'react-router-dom';
import useLanguage from '../../hooks/useLanguage.js';
import { ImageWithFallback } from '../common/ImageUpload.jsx';

export default function EmployeeCard({ employee, canManage, onEdit, onDelete }) {
  const { t } = useLanguage();

  if (!employee) return null;

  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary-400 hover:shadow-xl hover:ring-2 hover:ring-primary-100/50">
      <div>
        {/* Top Header: Avatar + Name + Badges */}
        <div className="flex items-start gap-3.5">
          <Link to={`/employees/${employee._id}`} className="relative shrink-0 block group/avatar">
            <ImageWithFallback
              src={employee.profileImage}
              alt={`${employee.firstName} ${employee.lastName}`}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs group-hover/avatar:ring-primary-400 group-hover:scale-105 transition-all duration-200"
              fallback={initials}
            />
            {/* Online/Active indicator dot */}
            <span
              className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                employee.isActive ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
              title={employee.isActive ? t('active') : t('inactive')}
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {employee.employeeCode && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700">
                  {employee.employeeCode}
                </span>
              )}
              {employee.nickname && (
                <span className="rounded-md bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
                  {employee.nickname}
                </span>
              )}
            </div>

            <Link to={`/employees/${employee._id}`} className="block">
              <h3 className="mt-1 text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                {employee.firstName} {employee.lastName}
              </h3>
            </Link>

            <p className="text-xs font-medium text-slate-500 truncate">
              {employee.position || '—'}
            </p>
          </div>
        </div>

        {/* Department & Status Row */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs font-semibold text-slate-700 truncate">
            <span>🏢</span>
            <span className="truncate">{employee.departmentId?.name || t('allDepartments')}</span>
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {!employee.isActive && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                {t('inactive')}
              </span>
            )}
            {!employee.isPublished && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                {t('hidden')}
              </span>
            )}
            {employee.isActive && employee.isPublished && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {t('active')}
              </span>
            )}
          </div>
        </div>

        {/* Contact info chips */}
        {(employee.email || employee.phone) && (
          <div className="mt-3 space-y-1.5 text-xs text-slate-600">
            {employee.email && (
              <a
                href={`mailto:${employee.email}`}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-50 hover:text-primary-600 transition-colors truncate"
                title={employee.email}
              >
                <span className="text-slate-400">✉️</span>
                <span className="truncate">{employee.email}</span>
              </a>
            )}
            {employee.phone && (
              <a
                href={`tel:${employee.phone}`}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-50 hover:text-primary-600 transition-colors truncate"
                title={employee.phone}
              >
                <span className="text-slate-400">📞</span>
                <span className="truncate">{employee.phone}</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Quick Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <Link
          to={`/employees/${employee._id}`}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
        >
          <span>{t('viewProfile') || 'โปรไฟล์'}</span>
          <span>→</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(employee)}
              className="rounded-lg p-1.5 text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-primary-600 transition-colors"
              title={t('edit')}
            >
              ✏️ {t('edit')}
            </button>
            <button
              type="button"
              onClick={() => onDelete(employee)}
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
