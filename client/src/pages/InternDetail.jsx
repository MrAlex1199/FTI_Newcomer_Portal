import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { useIntern, useUpdateIntern } from '../hooks/useInterns.js';
import { useUpdateProfile } from '../hooks/useProfile.js';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import useChat from '../hooks/useChat.js';
import { ImageWithFallback } from '../components/common/ImageUpload.jsx';
import StatusBadge from '../components/interns/StatusBadge.jsx';
import Modal from '../components/common/Modal.jsx';
import { LoadingState, ErrorState } from '../components/common/states.jsx';

/**
 * Returns an energetic academic gradient for the intern profile cover banner.
 */
function getInternCoverTheme(departmentName = '') {
  const text = (departmentName || '').toLowerCase();
  if (text.includes('it') || text.includes('tech') || text.includes('software')) {
    return {
      gradient: 'from-indigo-600 via-purple-600 to-cyan-500',
      badgeTone: 'bg-indigo-950/40 text-cyan-200 border-indigo-400/30',
      accentColor: 'text-indigo-600',
    };
  }
  if (text.includes('hr') || text.includes('human') || text.includes('admin')) {
    return {
      gradient: 'from-teal-600 via-emerald-600 to-cyan-600',
      badgeTone: 'bg-teal-950/40 text-emerald-200 border-emerald-400/30',
      accentColor: 'text-emerald-600',
    };
  }
  if (text.includes('marketing') || text.includes('sales') || text.includes('pr')) {
    return {
      gradient: 'from-pink-600 via-rose-600 to-purple-600',
      badgeTone: 'bg-rose-950/40 text-rose-200 border-rose-400/30',
      accentColor: 'text-rose-600',
    };
  }
  return {
    gradient: 'from-violet-600 via-indigo-600 to-sky-500',
    badgeTone: 'bg-violet-950/40 text-sky-200 border-violet-400/30',
    accentColor: 'text-purple-600',
  };
}

export default function InternDetail({ isSelf = false }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission, refreshUser } = useAuth();
  const { t, locale, language } = useLanguage();
  const chatContext = useChat();

  // If `isSelf`, resolve intern id from logged-in user
  const effectiveId = useMemo(() => {
    if (isSelf) {
      if (user?.internId?._id) return user.internId._id;
      if (typeof user?.internId === 'string') return user.internId;
    }
    return paramId;
  }, [isSelf, paramId, user]);

  const { data: intern, isLoading, isError, error, refetch } = useIntern(effectiveId);
  const updateInternMut = useUpdateIntern();
  const updateProfileMut = useUpdateProfile();

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    university: '',
    faculty: '',
    major: '',
    year: '',
    shortBio: '',
    projectTitle: '',
    lessonsLearned: '',
    adviceForNextBatch: '',
  });

  // Determine permissions
  const isManagerOrAdmin = hasPermission('interns:manage');
  const isProfileOwner = useMemo(() => {
    if (!user || !intern) return false;
    const userInternId = user.internId?._id || user.internId;
    return Boolean(userInternId && String(userInternId) === String(intern._id));
  }, [user, intern]);
  const canEditThisProfile = isProfileOwner || isManagerOrAdmin;

  // Open edit modal & prefill form
  const handleOpenEdit = () => {
    if (!intern) return;
    setEditForm({
      firstName: intern.firstName || '',
      lastName: intern.lastName || '',
      nickname: intern.nickname || '',
      university: intern.university || '',
      faculty: intern.faculty || '',
      major: intern.major || '',
      year: intern.year || '',
      shortBio: intern.shortBio || '',
      projectTitle: intern.projectTitle || '',
      lessonsLearned: intern.lessonsLearned || '',
      adviceForNextBatch: intern.adviceForNextBatch || '',
    });
    setPhotoPreview(intern.profileImage || '');
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
        // Full intern update via intern service
        const payload = {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          nickname: editForm.nickname.trim(),
          university: editForm.university.trim(),
          faculty: editForm.faculty.trim(),
          major: editForm.major.trim(),
          year: editForm.year ? Number(editForm.year) : null,
          shortBio: editForm.shortBio.trim(),
          projectTitle: editForm.projectTitle.trim(),
          lessonsLearned: editForm.lessonsLearned.trim(),
          adviceForNextBatch: editForm.adviceForNextBatch.trim(),
        };
        await updateInternMut.mutateAsync({
          id: intern._id,
          payload,
          file: photoFile,
        });
      } else {
        // Self-profile update via auth profile endpoint
        const payload = {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          nickname: editForm.nickname.trim(),
          shortBio: editForm.shortBio.trim(),
          projectTitle: editForm.projectTitle.trim(),
          lessonsLearned: editForm.lessonsLearned.trim(),
          adviceForNextBatch: editForm.adviceForNextBatch.trim(),
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
      setSaveError(err.response?.data?.message || err.message || t('saveInternError'));
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Profile Link
  const handleCopyLink = () => {
    const url = window.location.origin + `/interns/${intern?._id || ''}`;
    navigator.clipboard.writeText(url);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 3000);
  };

  // Start Chat Action
  const handleStartChat = () => {
    if (chatContext?.openDirectChat && intern?.userId) {
      chatContext.openDirectChat(intern.userId);
    } else {
      navigate('/chat');
    }
  };

  // Chat with Mentor
  const handleChatMentor = () => {
    if (chatContext?.openDirectChat && intern?.mentorId?.userId) {
      chatContext.openDirectChat(intern.mentorId.userId);
    } else {
      navigate('/chat');
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-20">
          <LoadingState label={t('loadingIntern')} />
        </div>
      </AppShell>
    );
  }

  if (isError || !intern) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto py-12 px-4">
          <ErrorState
            error={error}
            onRetry={refetch}
            title={t('internNotFound')}
            message={error?.response?.data?.message || t('internNotFound')}
          />
          <div className="mt-6 text-center">
            <Link
              to="/interns"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors"
            >
              {t('backToInterns')}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const deptName = intern.departmentId?.name || '';
  const coverTheme = getInternCoverTheme(deptName);
  const initials = `${intern.firstName?.[0] || ''}${intern.lastName?.[0] || ''}`.toUpperCase();

  // Timeline & Duration calculations
  const startDate = intern.startDate ? new Date(intern.startDate) : null;
  const endDate = intern.endDate ? new Date(intern.endDate) : null;
  const now = new Date();

  let progressPct = 0;
  let daysRemaining = 0;
  let totalDays = 0;

  if (startDate && endDate) {
    totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    if (now < startDate) {
      progressPct = 0;
      daysRemaining = totalDays;
    } else if (now > endDate) {
      progressPct = 100;
      daysRemaining = 0;
    } else {
      const elapsed = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
      daysRemaining = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/interns"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>{t('internDirectory')}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">{intern.firstName} {intern.lastName}</span>
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
            {/* SVG Geometric Constellation Pattern Overlay */}
            <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                <defs>
                  <pattern id="intern-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
                    <circle cx="25" cy="25" r="2" fill="#ffffff" />
                    <line x1="0" y1="25" x2="50" y2="25" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="25" y1="0" x2="25" y2="50" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#intern-pattern)" />
              </svg>
            </div>

            {/* Badges on Cover: Cohort Batch + Status */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 flex-wrap">
              {intern.batchId && (
                <Link
                  to={`/intern-batches/${intern.batchId._id}`}
                  className={`inline-flex items-center gap-1.5 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all hover:scale-105 shadow-sm ${coverTheme.badgeTone}`}
                >
                  <span>🚀</span>
                  <span>{intern.batchId.code}</span>
                  {intern.batchId.year && <span className="opacity-80">({intern.batchId.year})</span>}
                </Link>
              )}
              <div className="backdrop-blur-md bg-white/90 rounded-full px-2.5 py-1 shadow-sm">
                <StatusBadge status={intern.status} />
              </div>
            </div>
          </div>

          {/* Avatar & Header Meta Cluster */}
          <div className="relative px-5 sm:px-8 pb-6 sm:pb-8">
            {/* Top Row: Floating Avatar on Left + Action Buttons on Right */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              {/* Avatar perfectly centered on the cover banner seam (50% in cover, 50% in white card) */}
              <div className="-mt-14 sm:-mt-[72px] relative shrink-0 self-start sm:self-auto z-10">
                <ImageWithFallback
                  src={intern.profileImage}
                  alt={`${intern.firstName} ${intern.lastName}`}
                  className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl object-cover ring-4 ring-white shadow-xl bg-white"
                  fallback={initials}
                />
                {/* Status Indicator */}
                <span
                  className={`absolute bottom-2 right-2 h-5 w-5 rounded-full ring-3 ring-white shadow-xs ${
                    intern.status === 'active'
                      ? 'bg-emerald-500'
                      : intern.status === 'completed'
                      ? 'bg-slate-400'
                      : 'bg-amber-500'
                  }`}
                  title={t(intern.status)}
                />
              </div>

              {/* Action Buttons Cluster (Facebook Header Style) - Perfectly inside the white card */}
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
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
                  title={t('startChat')}
                >
                  <span>💬</span>
                  <span className="hidden sm:inline">{t('startChat')}</span>
                </button>

                {intern.email && (
                  <a
                    href={`mailto:${intern.email}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all active:scale-95"
                    title={t('sendEmail')}
                  >
                    <span>✉️</span>
                    <span className="hidden sm:inline">{t('sendEmail')}</span>
                  </a>
                )}

                {intern.phone && (
                  <a
                    href={`tel:${intern.phone}`}
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

            {/* Name, University, Titles & Badges - 100% on the crisp clean white background */}
            <div className="mt-4 sm:mt-5 space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {intern.firstName} {intern.lastName}
                </h1>
                {intern.nickname && (
                  <span className="rounded-full bg-purple-50 border border-purple-200/80 px-3 py-1 text-xs sm:text-sm font-bold text-purple-700 shadow-2xs">
                    {language === 'th' ? `ชื่อเล่น: ${intern.nickname}` : `"${intern.nickname}"`}
                  </span>
                )}
              </div>

              <p className="text-base sm:text-lg font-bold text-slate-700 flex items-center gap-1.5 flex-wrap">
                <span>🎓</span>
                <span>{intern.university}</span>
                {intern.major && <span className="text-slate-500 font-medium">· {intern.major}</span>}
              </p>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {intern.year && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                    {language === 'th' ? `ชั้นปีที่ ${intern.year}` : `Year ${intern.year}`}
                  </span>
                )}
                {intern.departmentId && (
                  <Link
                    to={`/departments/${intern.departmentId._id}`}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    🏢 {deptName}
                  </Link>
                )}
                {intern.batchId && (
                  <Link
                    to={`/intern-batches/${intern.batchId._id}`}
                    className="rounded-lg bg-purple-50 hover:bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200/60 transition-colors"
                  >
                    🚀 {intern.batchId.code}
                  </Link>
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
          {/* LEFT COLUMN: BIO, PROJECT, REFLECTIONS, ACADEMIC (7/12)     */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-7 space-y-6">
            {/* About / Short Bio Card */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-lg text-purple-600">
                  📝
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {t('bio')}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'th' ? 'แนะนำตัวและความสนใจ' : 'Introduction and student background'}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {intern.shortBio ? (
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {intern.shortBio}
                  </p>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                    <p className="text-sm text-slate-500 italic">
                      {t('noBio')}
                    </p>
                    {canEditThisProfile && (
                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="mt-3 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        + {language === 'th' ? 'เพิ่มข้อความแนะนำตัว' : 'Add introduction'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Internship Project & Capstone Card */}
            <section className="bg-gradient-to-br from-white to-purple-50/40 rounded-3xl border border-purple-100 p-6 sm:p-7 shadow-2xs relative overflow-hidden">
              <div className="flex items-center gap-2.5 pb-4 border-b border-purple-100/80">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-lg text-purple-700">
                  🚀
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {t('internshipProject')}
                  </h2>
                  <p className="text-xs text-purple-600/80">
                    {language === 'th' ? 'โครงงานหลักที่ได้รับมอบหมายระหว่างการฝึกงาน' : 'Assigned internship project and capstone challenge'}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {intern.projectTitle ? (
                  <div className="rounded-2xl bg-white p-5 border border-purple-200/70 shadow-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 mb-2">
                      💡 Project Title
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                      {intern.projectTitle}
                    </h3>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-purple-200 bg-white/60 p-6 text-center">
                    <p className="text-sm text-slate-500 italic">
                      {t('noProjectAssigned')}
                    </p>
                    {canEditThisProfile && (
                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                      >
                        + {language === 'th' ? 'ระบุหัวข้อโครงงาน' : 'Assign project title'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Knowledge Transfer & Reflections Card */}
            {(intern.lessonsLearned || intern.adviceForNextBatch || canEditThisProfile) && (
              <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-lg text-amber-600">
                    💡
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {t('knowledgeTransfer')}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {language === 'th' ? 'ข้อคิด บทเรียน และคำแนะนำสำหรับรุ่นถัดไป' : 'Reflections, acquired skills, and advice for future cohorts'}
                    </p>
                  </div>
                </div>

                {/* Lessons Learned */}
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    🌟 {t('lessonsLearned')}
                  </span>
                  {intern.lessonsLearned ? (
                    <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-200/60 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {intern.lessonsLearned}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {language === 'th' ? 'ยังไม่ได้ระบุข้อคิดหรือสิ่งที่ได้เรียนรู้' : 'No lessons learned recorded yet.'}
                    </p>
                  )}
                </div>

                {/* Advice for Next Batch */}
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    💬 {t('adviceNextBatch')}
                  </span>
                  {intern.adviceForNextBatch ? (
                    <div className="rounded-2xl bg-blue-50/60 p-4 border border-blue-200/60 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      "{intern.adviceForNextBatch}"
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {language === 'th' ? 'ยังไม่ได้ระบุคำแนะนำสำหรับรุ่นถัดไป' : 'No advice recorded yet.'}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Academic Profile Details Grid */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg text-primary-600">
                  🎓
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {t('academicProfile')}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {language === 'th' ? 'ข้อมูลสถาบันการศึกษาและคณะสาขา' : 'University, faculty, major, and education background'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('university')}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {intern.university || '—'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('faculty')}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {intern.faculty || '—'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('major')}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {intern.major || '—'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('studyYear')}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {intern.year ? `${intern.year}` : '—'}
                  </p>
                </div>

                {intern.age !== undefined && intern.age !== null && (
                  <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      {t('age')}
                    </span>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {intern.age} {language === 'th' ? 'ปี' : 'years'}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('status')}
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={intern.status} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT COLUMN: TIMELINE, MENTOR, BATCH, BATCHMATES (5/12)     */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Timeline & Duration Progress Card */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <h2 className="text-base font-bold text-slate-900">
                    {t('timelineProgress')}
                  </h2>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/60">
                  {totalDays} {t('days')}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                  <span>{progressPct}% {language === 'th' ? 'เสร็จสิ้น' : 'completed'}</span>
                  <span>
                    {intern.status === 'completed'
                      ? t('internshipCompleted')
                      : intern.status === 'upcoming'
                      ? t('internshipUpcoming')
                      : t('daysRemaining', { days: daysRemaining })}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      intern.status === 'completed'
                        ? 'bg-slate-400'
                        : intern.status === 'upcoming'
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">{t('start')}</span>
                  <span className="font-bold text-slate-800">
                    {startDate ? startDate.toLocaleDateString(locale) : '—'}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">{t('end')}</span>
                  <span className="font-bold text-slate-800">
                    {endDate ? endDate.toLocaleDateString(locale) : '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* Mentor & Advisor Card */}
            <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧑‍🏫</span>
                  <h2 className="text-base font-bold text-slate-900">
                    {t('mentorAdvisor')}
                  </h2>
                </div>
                {intern.mentorId && (
                  <Link
                    to={`/employees/${intern.mentorId._id}`}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    {t('viewProfile')} →
                  </Link>
                )}
              </div>

              {intern.mentorId ? (
                <div className="space-y-3">
                  <Link
                    to={`/employees/${intern.mentorId._id}`}
                    className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 transition-all group"
                  >
                    <ImageWithFallback
                      src={intern.mentorId.profileImage}
                      alt={`${intern.mentorId.firstName} ${intern.mentorId.lastName}`}
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-white shadow-xs group-hover:ring-primary-300 transition-all"
                      fallback={`${intern.mentorId.firstName?.[0] || ''}${intern.mentorId.lastName?.[0] || ''}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate">
                          {intern.mentorId.firstName} {intern.mentorId.lastName}
                        </p>
                        {intern.mentorId.nickname && (
                          <span className="text-[11px] font-semibold text-blue-600">
                            ({intern.mentorId.nickname})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {intern.mentorId.position || '—'}
                      </p>
                    </div>
                    <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-primary-600 transition-all text-xs font-bold">
                      →
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleChatMentor}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary-700 py-2.5 px-3 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                  >
                    <span>💬</span>
                    <span>{t('chatWithMentor')}</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {t('noMentor')}
                </p>
              )}
            </section>

            {/* Cohort Batch Card */}
            {intern.batchId && (
              <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <h2 className="text-base font-bold text-slate-900">
                      {t('batchCohort')}
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                    {intern.batchId.code}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    {intern.batchId.title}
                  </h3>
                  {intern.batchId.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {intern.batchId.description}
                    </p>
                  )}
                  <Link
                    to={`/intern-batches/${intern.batchId._id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 py-2.5 px-3 text-xs font-bold border border-purple-200 transition-colors mt-2"
                  >
                    <span>{t('viewBatchSchedule')}</span>
                  </Link>
                </div>
              </section>
            )}

            {/* Fellow Batchmates Card */}
            {intern.fellowBatchmates && intern.fellowBatchmates.length > 0 && (
              <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <h2 className="text-base font-bold text-slate-900">
                      {t('fellowBatchmatesCount', { count: intern.fellowBatchmates.length })}
                    </h2>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {intern.fellowBatchmates.map((mate) => (
                    <Link
                      key={mate._id}
                      to={`/interns/${mate._id}`}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/60 transition-all group"
                    >
                      <ImageWithFallback
                        src={mate.profileImage}
                        alt={`${mate.firstName} ${mate.lastName}`}
                        className="h-9 w-9 rounded-xl object-cover ring-1 ring-white shadow-2xs group-hover:ring-purple-300 transition-all"
                        fallback={`${mate.firstName?.[0] || ''}${mate.lastName?.[0] || ''}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors truncate">
                          {mate.firstName} {mate.lastName}
                          {mate.nickname && <span className="text-slate-400 font-normal"> ({mate.nickname})</span>}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          🎓 {mate.university} {mate.major ? `· ${mate.major}` : ''}
                        </p>
                      </div>
                      <span className="text-slate-300 group-hover:text-purple-600 transition-colors text-xs">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Assigned Department Card */}
            {intern.departmentId && (
              <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    <h2 className="text-base font-bold text-slate-900">
                      {t('department')}
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {intern.departmentId.code}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    {intern.departmentId.name}
                  </h3>
                  {intern.departmentId.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span>📍</span>
                      <span>{intern.departmentId.location}</span>
                    </p>
                  )}
                  <Link
                    to={`/departments/${intern.departmentId._id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 text-xs font-bold transition-colors mt-2"
                  >
                    <span>{t('viewDepartmentDetail')}</span>
                  </Link>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: EDIT INTERN PROFILE / CAPSTONE & REFLECTIONS           */}
      {/* ============================================================== */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={t('editInternProfileTitle')}
        size="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <p className="text-xs text-slate-500 -mt-2">
            {t('editInternProfileSubtitle')}
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-xl font-bold text-purple-700">
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
                placeholder={language === 'th' ? 'เช่น ตาล, บีม' : 'e.g. Beam, Ploy'}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          {/* Admin-only University & Academic Fields */}
          {isManagerOrAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('university')} *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.university}
                  onChange={(e) => setEditForm((f) => ({ ...f, university: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('major')}
                </label>
                <input
                  type="text"
                  value={editForm.major}
                  onChange={(e) => setEditForm((f) => ({ ...f, major: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('studyYear')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={editForm.year}
                  onChange={(e) => setEditForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
          )}

          {/* Short Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('shortBio')}
            </label>
            <textarea
              rows={3}
              value={editForm.shortBio}
              onChange={(e) => setEditForm((f) => ({ ...f, shortBio: e.target.value }))}
              placeholder={language === 'th' ? 'แนะนำตัวเอง ความสนใจ และเป้าหมายการฝึกงาน...' : 'Tell the team about yourself, interests, and goals...'}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Project Title Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              🚀 {t('projectTitleField')}
            </label>
            <input
              type="text"
              value={editForm.projectTitle}
              onChange={(e) => setEditForm((f) => ({ ...f, projectTitle: e.target.value }))}
              placeholder={language === 'th' ? 'เช่น ออกแบบและพัฒนาระบบ Portal สำหรับพนักงานใหม่' : 'e.g. Newcomer Portal UI/UX Overhaul & Optimization'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              🌟 {t('lessonsLearnedField')}
            </label>
            <textarea
              rows={3}
              value={editForm.lessonsLearned}
              onChange={(e) => setEditForm((f) => ({ ...f, lessonsLearned: e.target.value }))}
              placeholder={language === 'th' ? 'สิ่งที่ได้เรียนรู้จากการทำงานจริง การแก้ปัญหา และทักษะใหม่ๆ...' : 'Key takeaways, technical growth, and problem solving experiences...'}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Advice for Next Batch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              💬 {t('adviceForNextBatchField')}
            </label>
            <textarea
              rows={3}
              value={editForm.adviceForNextBatch}
              onChange={(e) => setEditForm((f) => ({ ...f, adviceForNextBatch: e.target.value }))}
              placeholder={language === 'th' ? 'คำแนะนำสำหรับรุ่นน้องที่กำลังจะมาฝึกงานในรุ่นถัดไป...' : 'Advice and tips for incoming interns in the next cohort...'}
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
