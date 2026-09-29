import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { useEmployee, useUpdateEmployee } from '../hooks/useEmployees.js';
import { useUpdateProfile } from '../hooks/useProfile.js';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import useChat from '../hooks/useChat.js';
import { ImageWithFallback } from '../components/common/ImageUpload.jsx';
import Modal from '../components/common/Modal.jsx';
import { LoadingState, ErrorState } from '../components/common/states.jsx';

/**
 * Returns a department-specific background gradient for the Facebook-style cover banner.
 */
function getDepartmentCoverTheme(departmentName = '', departmentCode = '') {
  const text = `${departmentName} ${departmentCode}`.toLowerCase();
  if (text.includes('it') || text.includes('tech') || text.includes('information') || text.includes('software')) {
    return {
      gradient: 'from-indigo-600 via-blue-600 to-cyan-500',
      badgeTone: 'bg-indigo-900/40 text-cyan-200 border-indigo-400/30',
      accentColor: 'text-indigo-600',
    };
  }
  if (text.includes('hr') || text.includes('human') || text.includes('people') || text.includes('admin')) {
    return {
      gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
      badgeTone: 'bg-emerald-900/40 text-emerald-200 border-emerald-400/30',
      accentColor: 'text-emerald-600',
    };
  }
  if (text.includes('marketing') || text.includes('sales') || text.includes('pr') || text.includes('public')) {
    return {
      gradient: 'from-rose-500 via-pink-600 to-purple-600',
      badgeTone: 'bg-rose-900/40 text-rose-200 border-rose-400/30',
      accentColor: 'text-rose-600',
    };
  }
  if (text.includes('exec') || text.includes('board') || text.includes('director') || text.includes('ceo') || text.includes('president')) {
    return {
      gradient: 'from-amber-500 via-orange-600 to-yellow-600',
      badgeTone: 'bg-amber-900/40 text-amber-200 border-amber-400/30',
      accentColor: 'text-amber-600',
    };
  }
  if (text.includes('finance') || text.includes('account') || text.includes('audit')) {
    return {
      gradient: 'from-violet-600 via-indigo-700 to-slate-800',
      badgeTone: 'bg-violet-900/40 text-violet-200 border-violet-400/30',
      accentColor: 'text-violet-600',
    };
  }
  return {
    gradient: 'from-blue-700 via-indigo-800 to-slate-900',
    badgeTone: 'bg-blue-900/40 text-blue-200 border-blue-400/30',
    accentColor: 'text-primary-600',
  };
}

export default function EmployeeDetail({ isSelf = false }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const chatContext = useChat();

  // If `isSelf`, resolve employee id from logged-in user
  const effectiveId = useMemo(() => {
    if (isSelf) {
      if (user?.employeeId?._id) return user.employeeId._id;
      if (typeof user?.employeeId === 'string') return user.employeeId;
    }
    return paramId;
  }, [isSelf, paramId, user]);

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(effectiveId);
  const updateEmployeeMut = useUpdateEmployee();
  const updateProfileMut = useUpdateProfile();

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    workEmail: '',
    extension: '',
    officeLocation: '',
    bio: '',
    skills: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Determine permissions
  const isManagerOrAdmin = hasPermission('employees:manage');
  const isProfileOwner = useMemo(() => {
    if (!user || !employee) return false;
    const userEmpId = user.employeeId?._id || user.employeeId;
    return Boolean(userEmpId && String(userEmpId) === String(employee._id));
  }, [user, employee]);
  const canEditThisProfile = isProfileOwner || isManagerOrAdmin;

  // Open edit modal & prefill form
  const handleOpenEdit = () => {
    if (!employee) return;
    setEditForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      nickname: employee.nickname || '',
      workEmail: employee.workEmail || '',
      extension: employee.extension || '',
      officeLocation: employee.officeLocation || '',
      bio: employee.bio || '',
      skills: (employee.skills || []).join(', '),
    });
    setPhotoPreview(employee.profileImage || '');
    setPhotoFile(null);
    setSaveError('');
    setSaveSuccess('');
    setEditModalOpen(true);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setIsSaving(true);

    try {
      if (isManagerOrAdmin) {
        // Full employee update
        const payload = {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          nickname: editForm.nickname.trim(),
          workEmail: editForm.workEmail.trim(),
          extension: editForm.extension.trim(),
          officeLocation: editForm.officeLocation.trim(),
          bio: editForm.bio.trim(),
          skills: editForm.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        };
        await updateEmployeeMut.mutateAsync({
          id: employee._id,
          payload,
          file: photoFile,
        });
      } else {
        // User profile update
        const payload = {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          nickname: editForm.nickname.trim(),
        };
        await updateProfileMut.mutateAsync({
          payload,
          file: photoFile,
        });
      }

      await refreshUser?.();
      await refetch();
      setSaveSuccess(t('profileUpdated'));
      setTimeout(() => {
        setEditModalOpen(false);
        setSaveSuccess('');
      }, 1000);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || t('saveEmployeeError'));
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Profile Link
  const handleCopyLink = () => {
    const url = window.location.origin + `/employees/${employee?._id || ''}`;
    navigator.clipboard.writeText(url);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 3000);
  };

  // Start Chat Action
  const handleStartChat = () => {
    if (chatContext?.openDirectChat && employee?.userId) {
      chatContext.openDirectChat(employee.userId);
    } else {
      navigate('/chat');
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-20">
          <LoadingState label={t('loadingData')} />
        </div>
      </AppShell>
    );
  }

  if (isError || !employee) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-12 px-4">
          <ErrorState
            error={error}
            onRetry={refetch}
            title={t('employeeNotFound')}
            message={error?.response?.data?.message || t('employeeNotFound')}
          />
          <div className="mt-6 text-center">
            <Link
              to="/employees"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors"
            >
              {t('backToEmployees')}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const deptName = employee.departmentId?.name || '';
  const deptCode = employee.departmentId?.code || '';
  const coverTheme = getDepartmentCoverTheme(deptName, deptCode);
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/employees"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>{t('employees')}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">{employee.firstName} {employee.lastName}</span>
          </Link>

          {copyToast && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-md flex items-center gap-1.5">
              <span>✅</span>
              <span>{t('profileLinkCopied')}</span>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* FACEBOOK-STYLE PROFILE HEADER CARD (COVER + AVATAR + ACTIONS) */}
        {/* ============================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Cover Banner */}
          <div className={`relative h-48 sm:h-64 lg:h-72 w-full bg-gradient-to-r ${coverTheme.gradient} overflow-hidden`}>
            {/* SVG Geometric Pattern Overlay */}
            <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <defs>
                  <pattern id="fb-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="20" cy="20" r="3" fill="#ffffff" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#fb-pattern)" />
              </svg>
            </div>

            {/* Department Badge on Cover */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              {employee.departmentId ? (
                <Link
                  to={`/departments/${employee.departmentId._id}`}
                  className={`inline-flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all hover:scale-105 ${coverTheme.badgeTone}`}
                >
                  <span>🏢</span>
                  <span>{deptName}</span>
                  {deptCode && <span className="opacity-75 font-mono font-medium">({deptCode})</span>}
                </Link>
              ) : null}
            </div>
          </div>

          {/* Avatar & Header Meta Cluster */}
          <div className="relative px-5 sm:px-8 pb-6 sm:pb-8">
            {/* Top Row: Floating Avatar on Left + Action Buttons on Right */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              {/* Avatar perfectly centered on the cover banner seam (50% in cover, 50% in white card) */}
              <div className="-mt-14 sm:-mt-[72px] relative shrink-0 self-start sm:self-auto z-10">
                <ImageWithFallback
                  src={employee.profileImage}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl object-cover ring-4 ring-white shadow-xl bg-white"
                  fallback={initials}
                />
                {/* Status Indicator */}
                <span
                  className={`absolute bottom-2 right-2 h-5 w-5 rounded-full ring-3 ring-white shadow-xs ${
                    employee.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  title={employee.isActive ? t('active') : t('inactive')}
                />
              </div>

              {/* Action Buttons Cluster (Facebook Header Style) */}
              <div className="flex items-center gap-2.5 flex-wrap pt-3 sm:pt-0 sm:pb-1">
                {canEditThisProfile && (
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <span>✏️</span>
                    <span>{t('editMyProfile')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStartChat}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
                  title={t('startChat')}
                >
                  <span>💬</span>
                  <span className="hidden sm:inline">{t('startChat')}</span>
                </button>

                {employee.workEmail && (
                  <a
                    href={`mailto:${employee.workEmail}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95"
                    title={t('sendEmail')}
                  >
                    <span>✉️</span>
                    <span className="hidden sm:inline">{t('sendEmail')}</span>
                  </a>
                )}

                {(employee.extension || employee.phone) && (
                  <a
                    href={`tel:${employee.extension || employee.phone}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95"
                    title={t('callPhone')}
                  >
                    <span>📞</span>
                    <span className="hidden sm:inline">{t('callPhone')}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                  title={t('copyProfileLink')}
                >
                  <span>🔗</span>
                  <span className="sr-only sm:not-sr-only">{t('copyProfileLink')}</span>
                </button>
              </div>
            </div>

            {/* Name, Titles & Badges - 100% on the crisp clean white background */}
            <div className="mt-4 sm:mt-5 space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {employee.firstName} {employee.lastName}
                </h1>
                {employee.nickname && (
                  <span className="rounded-full bg-blue-50 border border-blue-200/80 px-3 py-1 text-xs sm:text-sm font-bold text-blue-700 shadow-2xs">
                    {language === 'th' ? `ชื่อเล่น: ${employee.nickname}` : `"${employee.nickname}"`}
                  </span>
                )}
              </div>

              <p className="text-base sm:text-lg font-semibold text-slate-700">
                {employee.position || t('positionNotSpecified')}
              </p>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {employee.employeeCode && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                    #{employee.employeeCode}
                  </span>
                )}
                {employee.departmentId && (
                  <Link
                    to={`/departments/${employee.departmentId._id}`}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    🏢 {deptName}
                  </Link>
                )}
                {employee.isActive && (
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/70">
                    ● {t('active')}
                  </span>
                )}
                {!employee.isPublished && (
                  <span className="rounded-lg bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/70">
                    🔒 {t('hidden')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2-COLUMN FACEBOOK-STYLE TIMELINE GRID */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ------------------------------------------------------------ */}
          {/* LEFT COLUMN: ABOUT, WORK DETAILS, SKILLS (7 OF 12 SPANS)    */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-7 space-y-6">
            {/* About / Bio Card */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg text-primary-600">
                  📝
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {t('bio')}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'th' ? 'แนะนำตัวและประวัติย่อ' : 'Personal introduction and background'}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {employee.bio ? (
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {employee.bio}
                  </p>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                    <p className="text-sm text-slate-500 italic">
                      {t('noBioListed')}
                    </p>
                    {canEditThisProfile && (
                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="mt-3 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        + {language === 'th' ? 'เพิ่มข้อมูลแนะนำตัว' : 'Add bio introduction'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Work & Office Details Grid */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
                  💼
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {t('workDetails')}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'th' ? 'ข้อมูลสังกัดและสถานที่ปฏิบัติงาน' : 'Position, workspace, and office credentials'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('position')}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {employee.position || '—'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('employeeCode')}
                  </span>
                  <p className="mt-1 text-sm font-mono font-bold text-slate-800">
                    {employee.employeeCode || '—'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('officeLocation')}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📍</span>
                    <span>{employee.officeLocation || '—'}</span>
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('extension')}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>☎️</span>
                    <span>{employee.extension || employee.phone || '—'}</span>
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('workEmail')}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-800 truncate">
                    {employee.workEmail ? (
                      <a href={`mailto:${employee.workEmail}`} className="text-primary-600 hover:underline">
                        {employee.workEmail}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('memberSince')}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {employee.createdAt
                      ? new Date(employee.createdAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </section>

            {/* Skills & Expertise Card */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-lg text-purple-600">
                  🛠️
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {t('skillsAndExpertise')}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'th' ? 'ทักษะและความสามารถพิเศษ' : 'Key technical and professional competencies'}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {employee.skills && employee.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {employee.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 px-3.5 py-1.5 text-xs font-bold text-primary-700 shadow-2xs transition-all hover:scale-105"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                    <p className="text-sm text-slate-500 italic">
                      {t('noSkillsListed')}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT COLUMN: DEPARTMENT, HIERARCHY, CONTACT (5 OF 12 SPANS) */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Department Summary Card */}
            {employee.departmentId && (
              <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    <h2 className="text-base font-bold text-slate-900">
                      {t('department')}
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {employee.departmentId.code}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <h3 className="text-lg font-black text-slate-900">
                    {employee.departmentId.name}
                  </h3>

                  {employee.departmentId.description && (
                    <p className="text-xs text-slate-600 line-clamp-3">
                      {employee.departmentId.description}
                    </p>
                  )}

                  {employee.departmentId.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span>📍</span>
                      <span>{employee.departmentId.location}</span>
                    </p>
                  )}

                  <div className="pt-2">
                    <Link
                      to={`/departments/${employee.departmentId._id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 px-4 text-xs font-bold text-slate-700 transition-colors"
                    >
                      <span>{t('viewDepartmentDetail') || 'ดูข้อมูลแผนกและสมาชิก'}</span>
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Reporting Line & Hierarchy Card */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👔</span>
                  <h2 className="text-base font-bold text-slate-900">
                    {t('reportingLine')}
                  </h2>
                </div>
                <Link
                  to="/organization"
                  className="text-xs font-bold text-primary-600 hover:underline"
                >
                  {t('organizationChart')} →
                </Link>
              </div>

              {/* Direct Manager */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  {t('directManager')}
                </span>

                {employee.managerId ? (
                  <Link
                    to={`/employees/${employee.managerId._id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 transition-all group"
                  >
                    <ImageWithFallback
                      src={employee.managerId.profileImage}
                      alt={`${employee.managerId.firstName} ${employee.managerId.lastName}`}
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-white shadow-xs group-hover:ring-primary-300 transition-all"
                      fallback={`${employee.managerId.firstName?.[0] || ''}${employee.managerId.lastName?.[0] || ''}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate">
                          {employee.managerId.firstName} {employee.managerId.lastName}
                        </p>
                        {employee.managerId.nickname && (
                          <span className="text-[11px] font-semibold text-blue-600">
                            ({employee.managerId.nickname})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {employee.managerId.position || '—'}
                      </p>
                    </div>
                    <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-primary-600 transition-all text-xs font-bold">
                      →
                    </span>
                  </Link>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {t('noManager')}
                  </p>
                )}
              </div>

              {/* Direct Reports */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  {t('directReportsCount', { count: employee.directReports?.length || 0 })}
                </span>

                {employee.directReports && employee.directReports.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {employee.directReports.map((report) => (
                      <Link
                        key={report._id}
                        to={`/employees/${report._id}`}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/60 transition-all group"
                      >
                        <ImageWithFallback
                          src={report.profileImage}
                          alt={`${report.firstName} ${report.lastName}`}
                          className="h-9 w-9 rounded-xl object-cover ring-1 ring-white shadow-2xs group-hover:ring-primary-300 transition-all"
                          fallback={`${report.firstName?.[0] || ''}${report.lastName?.[0] || ''}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate">
                            {report.firstName} {report.lastName}
                            {report.nickname && <span className="text-slate-400 font-normal"> ({report.nickname})</span>}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {report.position || '—'}
                          </p>
                        </div>
                        <span className="text-slate-300 group-hover:text-primary-600 transition-colors text-xs">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {t('noDirectReportsListed')}
                  </p>
                )}
              </div>
            </section>

            {/* Quick Contact Hub Card */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="text-lg">⚡</span>
                <h2 className="text-base font-bold text-slate-900">
                  {t('quickContact')}
                </h2>
              </div>

              <div className="space-y-2.5 pt-1">
                {employee.workEmail && (
                  <a
                    href={`mailto:${employee.workEmail}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors text-xs font-medium text-slate-700"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base">✉️</span>
                      <span className="truncate">{employee.workEmail}</span>
                    </div>
                    <span className="text-primary-600 font-bold shrink-0">{t('sendEmail')}</span>
                  </a>
                )}

                {(employee.extension || employee.phone) && (
                  <a
                    href={`tel:${employee.extension || employee.phone}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors text-xs font-medium text-slate-700"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base">📞</span>
                      <span className="truncate">{employee.extension || employee.phone}</span>
                    </div>
                    <span className="text-primary-600 font-bold shrink-0">{t('callPhone')}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleStartChat}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100 transition-colors text-xs font-medium text-blue-800 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">💬</span>
                    <span>{language === 'th' ? 'สนทนาผ่าน FTI Chat' : 'Start Instant Chat'}</span>
                  </div>
                  <span className="text-blue-600 font-bold">{t('startChat')}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: EDIT PROFILE / EMPLOYEE DETAILS                        */}
      {/* ============================================================== */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={t('editProfileTitle')}
        size="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <p className="text-xs text-slate-500 -mt-2">
            {t('editProfileSubtitle')}
          </p>

          {saveError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
              ⚠️ {saveError}
            </p>
          )}

          {saveSuccess && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700">
              ✅ {saveSuccess}
            </p>
          )}

          {/* Photo Upload Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {t('profilePhoto')}
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt=""
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary-200"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-xl font-bold text-slate-600">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs">
                  <span>📷</span>
                  <span>{t('choosePhoto')}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoSelect}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">
                  PNG, JPG, or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Name & Nickname Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('firstName')} *
              </label>
              <input
                type="text"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('lastName')} *
              </label>
              <input
                type="text"
                required
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('nickname')}
              </label>
              <input
                type="text"
                value={editForm.nickname}
                onChange={(e) => setEditForm((f) => ({ ...f, nickname: e.target.value }))}
                placeholder={language === 'th' ? 'เช่น อเล็กซ์, บอส' : 'e.g. Alex, Sam'}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          {/* Manager / Admin Extra Fields */}
          {isManagerOrAdmin && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('workEmail')}
                  </label>
                  <input
                    type="email"
                    value={editForm.workEmail}
                    onChange={(e) => setEditForm((f) => ({ ...f, workEmail: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('extension')}
                  </label>
                  <input
                    type="text"
                    value={editForm.extension}
                    onChange={(e) => setEditForm((f) => ({ ...f, extension: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('officeLocation')}
                </label>
                <input
                  type="text"
                  value={editForm.officeLocation}
                  onChange={(e) => setEditForm((f) => ({ ...f, officeLocation: e.target.value }))}
                  placeholder="Floor 3, Zone A"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('skills')}
                </label>
                <input
                  type="text"
                  value={editForm.skills}
                  onChange={(e) => setEditForm((f) => ({ ...f, skills: e.target.value }))}
                  placeholder="React, Node.js, Project Management"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </>
          )}

          {/* Bio Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('bio')}
            </label>
            <textarea
              rows={4}
              value={editForm.bio}
              onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder={language === 'th' ? 'แนะนำตัวเอง ประสบการณ์ และความสนใจ...' : 'Tell the team about yourself, interests, and background...'}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
