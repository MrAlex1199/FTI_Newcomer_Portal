import { Link } from 'react-router-dom';
import useLanguage from '../../hooks/useLanguage.js';
import { ImageWithFallback } from '../common/ImageUpload.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function InternCard({ intern, canManage, onEdit, onDelete }) {
  const { t } = useLanguage();

  if (!intern) return null;

  const initials = `${intern.firstName?.[0] || ''}${intern.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary-400 hover:shadow-xl hover:ring-2 hover:ring-primary-100/50">
      <div>
        {/* Top Header: Avatar + Name + Batch + Status */}
        <div className="flex items-start gap-3.5">
          <Link to={`/interns/${intern._id}`} className="relative shrink-0 block group/avatar">
            <ImageWithFallback
              src={intern.profileImage}
              alt={`${intern.firstName} ${intern.lastName}`}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs group-hover/avatar:ring-purple-400 group-hover:scale-105 transition-all duration-200"
              fallback={initials}
            />
            {/* Status dot */}
            <span
              className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                intern.status === 'active'
                  ? 'bg-emerald-500'
                  : intern.status === 'completed'
                  ? 'bg-slate-400'
                  : 'bg-amber-500'
              }`}
              title={t(intern.status)}
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {intern.batchId && (
                <Link
                  to={`/intern-batches/${intern.batchId._id}`}
                  className="rounded-md bg-purple-50 border border-purple-200/80 px-2 py-0.5 text-[11px] font-mono font-bold text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  🚀 {intern.batchId.code}
                </Link>
              )}
              {intern.nickname && (
                <span className="rounded-md bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 text-[11px] font-semibold text-purple-700">
                  {intern.nickname}
                </span>
              )}
              <div className="ml-auto">
                <StatusBadge status={intern.status} />
              </div>
            </div>

            <Link to={`/interns/${intern._id}`} className="block">
              <h3 className="mt-1.5 text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                {intern.firstName} {intern.lastName}
              </h3>
            </Link>

            <p className="text-xs font-medium text-slate-500 truncate" title={`${intern.university || ''} - ${intern.major || ''}`}>
              🎓 {intern.university || '—'} {intern.major ? `(${intern.major})` : ''}
            </p>
          </div>
        </div>

        {/* Department & Mentor Grid */}
        <div className="mt-3.5 space-y-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium">{t('departments')}:</span>
            <span className="font-semibold text-slate-700 truncate max-w-[65%]">
              🏢 {intern.departmentId?.name || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400 font-medium">{t('mentor')}:</span>
            <span className="font-medium text-slate-700 truncate max-w-[65%]">
              {intern.mentorId ? (
                <Link to={`/employees/${intern.mentorId._id}`} className="hover:text-primary-600 transition-colors hover:underline">
                  👤 {intern.mentorId.firstName} {intern.mentorId.lastName}
                </Link>
              ) : (
                '—'
              )}
            </span>
          </div>
        </div>

        {/* Contact info chips */}
        {(intern.email || intern.phone) && (
          <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
            {intern.email && (
              <a
                href={`mailto:${intern.email}`}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-50 hover:text-primary-600 transition-colors truncate"
                title={intern.email}
              >
                <span className="text-slate-400">✉️</span>
                <span className="truncate">{intern.email}</span>
              </a>
            )}
            {intern.phone && (
              <a
                href={`tel:${intern.phone}`}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-50 hover:text-primary-600 transition-colors truncate"
                title={intern.phone}
              >
                <span className="text-slate-400">📞</span>
                <span className="truncate">{intern.phone}</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Detail Link + Admin Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <Link
          to={`/interns/${intern._id}`}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
        >
          <span>{t('viewProfile') || 'ดูข้อมูลนักศึกษา'}</span>
          <span>→</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(intern)}
              className="rounded-lg p-1.5 text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-primary-600 transition-colors"
              title={t('edit')}
            >
              ✏️ {t('edit')}
            </button>
            <button
              type="button"
              onClick={() => onDelete(intern)}
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
