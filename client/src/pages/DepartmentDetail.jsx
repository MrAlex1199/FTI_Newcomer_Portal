import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import Modal from '../components/common/Modal.jsx';
import EmployeeCard from '../components/employees/EmployeeCard.jsx';
import InternCard from '../components/interns/InternCard.jsx';
import { ImageWithFallback } from '../components/common/ImageUpload.jsx';
import { useDepartment, useUpdateDepartment } from '../hooks/useDepartments.js';
import useLanguage from '../hooks/useLanguage.js';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/ToastContext.jsx';
import useChat from '../hooks/useChat.js';

// Department Themes for Cover & Branding
const DEPT_THEMES = {
  IT: {
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    emblemBg: 'from-blue-500 to-indigo-600',
    icon: '💻',
    accent: 'blue',
    label: 'Technology & Digital Infrastructure',
  },
  HR: {
    gradient: 'from-rose-500 via-pink-600 to-purple-600',
    emblemBg: 'from-rose-500 to-pink-600',
    icon: '👥',
    accent: 'rose',
    label: 'Human Resources & People Development',
  },
  MKT: {
    gradient: 'from-amber-500 via-orange-600 to-rose-500',
    emblemBg: 'from-amber-500 to-orange-600',
    icon: '📢',
    accent: 'amber',
    label: 'Marketing & Brand Communications',
  },
  SALES: {
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    emblemBg: 'from-emerald-500 to-teal-600',
    icon: '📈',
    accent: 'emerald',
    label: 'Business Development & Sales Operations',
  },
  ACC: {
    gradient: 'from-emerald-700 via-green-600 to-teal-700',
    emblemBg: 'from-emerald-600 to-green-700',
    icon: '💰',
    accent: 'emerald',
    label: 'Accounting & Fiscal Compliance',
  },
  FIN: {
    gradient: 'from-teal-600 via-emerald-600 to-cyan-600',
    emblemBg: 'from-teal-600 to-emerald-700',
    icon: '💵',
    accent: 'teal',
    label: 'Corporate Finance & Treasury',
  },
  LOG: {
    gradient: 'from-sky-600 via-blue-700 to-indigo-800',
    emblemBg: 'from-sky-500 to-blue-700',
    icon: '🚚',
    accent: 'sky',
    label: 'Logistics & Supply Chain Management',
  },
  PRC: {
    gradient: 'from-indigo-600 via-blue-600 to-cyan-600',
    emblemBg: 'from-indigo-500 to-blue-600',
    icon: '📦',
    accent: 'indigo',
    label: 'Procurement & Vendor Operations',
  },
  ENG: {
    gradient: 'from-slate-700 via-zinc-800 to-blue-900',
    emblemBg: 'from-slate-700 to-zinc-800',
    icon: '⚙️',
    accent: 'slate',
    label: 'Engineering & Industrial Standards',
  },
  QA: {
    gradient: 'from-purple-600 via-violet-700 to-indigo-800',
    emblemBg: 'from-purple-600 to-indigo-700',
    icon: '🎯',
    accent: 'purple',
    label: 'Quality Assurance & Standards Testing',
  },
  LEG: {
    gradient: 'from-amber-700 via-yellow-800 to-stone-800',
    emblemBg: 'from-amber-700 to-stone-800',
    icon: '⚖️',
    accent: 'amber',
    label: 'Legal Affairs & Corporate Governance',
  },
  EXEC: {
    gradient: 'from-violet-700 via-purple-800 to-indigo-950',
    emblemBg: 'from-violet-700 to-indigo-900',
    icon: '👑',
    accent: 'violet',
    label: 'Executive Leadership & Strategy',
  },
};

const getDepartmentCoverTheme = (dept) => {
  const codeKey = (dept?.code || '').toUpperCase().trim();
  if (DEPT_THEMES[codeKey]) return DEPT_THEMES[codeKey];
  return {
    gradient: 'from-blue-700 via-indigo-700 to-slate-800',
    emblemBg: 'from-blue-600 to-indigo-700',
    icon: '🏢',
    accent: 'blue',
    label: dept?.name || 'Department Office',
  };
};

export default function DepartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();

  let chatContext = null;
  try {
    chatContext = useChat();
  } catch {}

  const { data: department, isLoading, isError, error } = useDepartment(id);
  const updateDepartmentMut = useUpdateDepartment();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'team' | 'services'
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('all'); // 'all' | 'employees' | 'interns'

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    location: '',
    extension: '',
    responsibilities: [],
    contactTopics: [],
  });
  const [newRespInput, setNewRespInput] = useState('');
  const [newTopicInput, setNewTopicInput] = useState('');
  const [formError, setFormError] = useState('');

  // Permission evaluation
  const canManageAdmin = hasPermission('departments:manage');
  const isDeptManager = Boolean(
    user?.employeeId &&
      department?.managerId &&
      String(user.employeeId._id || user.employeeId) === String(department.managerId._id || department.managerId)
  );
  const canEdit = canManageAdmin || isDeptManager;

  // Initialize edit form when department loads or modal opens
  const openEditModal = () => {
    if (!department) return;
    setEditForm({
      description: department.description || '',
      location: department.location || '',
      extension: department.extension || '',
      responsibilities: Array.isArray(department.responsibilities) ? [...department.responsibilities] : [],
      contactTopics: Array.isArray(department.contactTopics) ? [...department.contactTopics] : [],
    });
    setNewRespInput('');
    setNewTopicInput('');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await updateDepartmentMut.mutateAsync({
        id: department._id,
        payload: {
          description: editForm.description.trim(),
          location: editForm.location.trim(),
          extension: editForm.extension.trim(),
          responsibilities: editForm.responsibilities,
          contactTopics: editForm.contactTopics,
        },
      });
      setIsEditModalOpen(false);
      showToast(t('departmentSavedSuccess'), 'success');
    } catch (err) {
      setFormError(err?.response?.data?.message || t('saveDepartmentError'));
    }
  };

  const handleAddResponsibility = () => {
    const val = newRespInput.trim();
    if (!val) return;
    if (editForm.responsibilities.includes(val)) return;
    setEditForm((prev) => ({
      ...prev,
      responsibilities: [...prev.responsibilities, val],
    }));
    setNewRespInput('');
  };

  const handleRemoveResponsibility = (indexToRemove) => {
    setEditForm((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleAddTopic = () => {
    const val = newTopicInput.trim();
    if (!val) return;
    if (editForm.contactTopics.includes(val)) return;
    setEditForm((prev) => ({
      ...prev,
      contactTopics: [...prev.contactTopics, val],
    }));
    setNewTopicInput('');
  };

  const handleRemoveTopic = (indexToRemove) => {
    setEditForm((prev) => ({
      ...prev,
      contactTopics: prev.contactTopics.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Copy page link action
  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      showToast(t('departmentLinkCopied'), 'success');
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  // Contact Manager / Support
  const handleContactManager = () => {
    if (department?.code === 'IT' && chatContext?.openSupportChat) {
      chatContext.openSupportChat('IT');
      return;
    }
    if (department?.managerId?.userId && chatContext?.openDirectChat) {
      chatContext.openDirectChat(department.managerId.userId);
    } else {
      navigate('/chat');
    }
  };

  // Normalize employees and interns with department object
  const normalizedEmployees = useMemo(() => {
    if (!department?.employees) return [];
    return department.employees.map((emp) => ({
      ...emp,
      email: emp.email || emp.workEmail,
      departmentId:
        typeof emp.departmentId === 'object' && emp.departmentId?.name
          ? emp.departmentId
          : { _id: department._id, name: department.name, code: department.code },
    }));
  }, [department]);

  const normalizedInterns = useMemo(() => {
    if (!department?.interns) return [];
    return department.interns.map((intern) => ({
      ...intern,
      departmentId:
        typeof intern.departmentId === 'object' && intern.departmentId?.name
          ? intern.departmentId
          : { _id: department._id, name: department.name, code: department.code },
    }));
  }, [department]);

  // Filtered members for Tab 2
  const filteredEmployees = useMemo(() => {
    if (!memberSearch.trim()) return normalizedEmployees;
    const q = memberSearch.toLowerCase().trim();
    return normalizedEmployees.filter((emp) => {
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
      const nickname = (emp.nickname || '').toLowerCase();
      const code = (emp.employeeCode || '').toLowerCase();
      const position = (emp.position || '').toLowerCase();
      return name.includes(q) || nickname.includes(q) || code.includes(q) || position.includes(q);
    });
  }, [normalizedEmployees, memberSearch]);

  const filteredInterns = useMemo(() => {
    if (!memberSearch.trim()) return normalizedInterns;
    const q = memberSearch.toLowerCase().trim();
    return normalizedInterns.filter((intern) => {
      const name = `${intern.firstName || ''} ${intern.lastName || ''}`.toLowerCase();
      const nickname = (intern.nickname || '').toLowerCase();
      const university = (intern.university || '').toLowerCase();
      const major = (intern.major || '').toLowerCase();
      return name.includes(q) || nickname.includes(q) || university.includes(q) || major.includes(q);
    });
  }, [normalizedInterns, memberSearch]);

  const totalMembers = (department?.employeeCount || 0) + (department?.internCount || 0);

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-slate-500">{t('loadingDepartment')}</p>
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="mt-3 font-semibold text-red-600">{error?.response?.data?.message || t('unableLoad')}</p>
          <Link
            to="/departments"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            ← {t('allDepartments')}
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!department) return null;

  const theme = getDepartmentCoverTheme(department);

  return (
    <AppShell>
      {/* Top Breadcrumb Navigation */}
      <div className="mb-4 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link to="/departments" className="hover:text-primary-600 transition-colors font-medium">
            {t('departments')}
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
            {department.name}
          </span>
        </div>
        <Link
          to="/departments"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium text-xs"
        >
          <span>←</span>
          <span>{t('allDepartments')}</span>
        </Link>
      </div>

      {/* Main Facebook-Style Profile Page Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-6">
        {/* Cover Photo Banner */}
        <div className={`relative h-48 sm:h-64 md:h-72 w-full overflow-hidden bg-gradient-to-r ${theme.gradient}`}>
          {/* Abstract Aesthetic Overlay Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white,transparent_50%)] opacity-20 pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute left-1/4 -bottom-10 w-60 h-60 rounded-full bg-black/15 blur-xl pointer-events-none" />

          {/* Top Right Floating Badges */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
            <span className="rounded-xl bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-mono font-bold text-white shadow-xs border border-white/25">
              {department.code}
            </span>
            <span
              className={`rounded-xl backdrop-blur-md px-3 py-1 text-xs font-semibold shadow-xs border flex items-center gap-1.5 ${
                department.isActive
                  ? 'bg-emerald-500/25 text-emerald-100 border-emerald-400/40'
                  : 'bg-slate-500/25 text-slate-200 border-slate-400/40'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${department.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              {department.isActive ? t('active') : t('inactive')}
            </span>
          </div>
        </div>

        {/* Facebook Page Header: Emblem & Identity & Actions (100% on white bg to prevent margin collapse) */}
        <div className="px-6 sm:px-8 pb-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Emblem Squircle: Centered exactly 50% across the cover seam (-mt-14 on mobile, -mt-20 on desktop) */}
            <div className="-mt-14 sm:-mt-20 shrink-0 relative z-10">
              <div
                className={`h-28 w-28 sm:h-36 sm:w-36 rounded-3xl ring-4 ring-white shadow-2xl bg-gradient-to-br ${theme.emblemBg} p-1 flex flex-col items-center justify-center text-white transition-transform duration-200 hover:scale-[1.02]`}
              >
                <span className="text-4xl sm:text-5xl drop-shadow-sm">{theme.icon}</span>
                <span className="mt-1 font-mono text-xs sm:text-sm font-extrabold tracking-wider bg-black/25 px-2 py-0.5 rounded-lg border border-white/20">
                  {department.code}
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center flex-wrap gap-2.5 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleContactManager}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-primary-700 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <span>💬</span>
                <span>{t('contactManager')}</span>
              </button>

              <Link
                to={`/organization?dept=${department._id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">{t('viewInOrgChart')}</span>
              </Link>

              {department.location && (
                <Link
                  to={`/floorplan?dept=${department._id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
                >
                  <span>🏢</span>
                  <span className="hidden sm:inline">{t('viewFloorPlan')}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                title={t('copyDepartmentLink')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white h-10 w-10 text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              >
                <span>🔗</span>
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={openEditModal}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-800 shadow-2xs transition hover:bg-amber-100 active:scale-95"
                >
                  <span>✏️</span>
                  <span>{t('editDepartmentPage')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Department Identity Text */}
          <div className="mt-4 sm:mt-5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {department.name}
              </h1>
              <span className="rounded-full bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 font-bold border border-blue-200/80">
                ✓ Official Department
              </span>
            </div>

            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              {department.description || t('noDescriptionProvided')}
            </p>

            {/* Quick Metadata Chips */}
            <div className="mt-4 flex items-center gap-2.5 flex-wrap text-xs sm:text-sm text-slate-600 font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700">
                <span>👥</span>
                <span>
                  <strong>{department.employeeCount ?? 0}</strong> {t('employees')}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 text-purple-700 px-3 py-1.5 border border-purple-200/70">
                <span>🎓</span>
                <span>
                  <strong>{department.internCount ?? 0}</strong> {t('interns')}
                </span>
              </span>

              {department.location && (
                <Link
                  to={`/floorplan?dept=${department._id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <span>📍</span>
                  <span>{department.location}</span>
                </Link>
              )}

              {department.extension && (
                <a
                  href={`tel:${department.extension}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <span>📞</span>
                  <span>Ext. {department.extension}</span>
                </a>
              )}

              {department.managerId && (
                <Link
                  to={`/employees/${department.managerId._id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <span>👤</span>
                  <span>
                    {department.managerId.firstName} {department.managerId.lastName}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Facebook Page Navigation Tabs */}
        <div className="border-t border-slate-200 px-6 sm:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 py-3.5 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>📌</span>
              <span>{t('departmentOverview')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-2 py-3.5 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === 'team'
                  ? 'border-primary-600 text-primary-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>👥</span>
              <span>{t('teamAndMembers')}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-mono">
                {totalMembers}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 py-3.5 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === 'services'
                  ? 'border-primary-600 text-primary-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>⚡</span>
              <span>{t('servicesAndTopics')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW (ภาพรวม) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Quick Info & Spotlight Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* About Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>ℹ️</span>
                <span>{t('aboutDepartment')}</span>
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {department.description || t('noDescriptionProvided')}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <span className="text-slate-400">📍</span>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{t('location')}</p>
                    <p className="font-semibold text-slate-800">
                      {department.location || '—'}
                      {department.location && (
                        <Link
                          to={`/floorplan?dept=${department._id}`}
                          className="ml-2 text-xs text-primary-600 hover:underline font-normal"
                        >
                          ({t('viewFloorPlan')})
                        </Link>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-slate-400">📞</span>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{t('extension')}</p>
                    <p className="font-semibold text-slate-800">{department.extension || '—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-slate-400">🛡️</span>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{t('status')}</p>
                    <p className="font-semibold text-slate-800">
                      {department.isActive ? t('active') : t('inactive')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Head / Manager Spotlight Card */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>👑</span>
                <span>{t('departmentHead')}</span>
              </h2>

              {department.managerId ? (
                <div className="mt-4">
                  <div className="flex items-start gap-3.5">
                    <Link to={`/employees/${department.managerId._id}`} className="shrink-0 relative group">
                      <ImageWithFallback
                        src={department.managerId.profileImage}
                        alt={`${department.managerId.firstName} ${department.managerId.lastName}`}
                        className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white shadow-md group-hover:scale-105 transition-transform"
                        fallback={`${department.managerId.firstName?.[0] || ''}${department.managerId.lastName?.[0] || ''}`}
                      />
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white bg-emerald-500" />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {department.managerId.employeeCode && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                            {department.managerId.employeeCode}
                          </span>
                        )}
                        {department.managerId.nickname && (
                          <span className="rounded-md bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            {department.managerId.nickname}
                          </span>
                        )}
                      </div>

                      <Link to={`/employees/${department.managerId._id}`} className="block">
                        <h3 className="mt-1 text-base font-bold text-slate-900 hover:text-primary-600 transition-colors truncate">
                          {department.managerId.firstName} {department.managerId.lastName}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 truncate font-medium">
                        {department.managerId.position || t('manager')}
                      </p>
                    </div>
                  </div>

                  {/* Manager contact details */}
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    {(department.managerId.workEmail || department.managerId.email) && (
                      <a
                        href={`mailto:${department.managerId.workEmail || department.managerId.email}`}
                        className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 hover:text-primary-600 transition-colors truncate"
                      >
                        <span className="text-slate-400">✉️</span>
                        <span className="truncate">{department.managerId.workEmail || department.managerId.email}</span>
                      </a>
                    )}
                    {department.managerId.phone && (
                      <a
                        href={`tel:${department.managerId.phone}`}
                        className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 hover:text-primary-600 transition-colors truncate"
                      >
                        <span className="text-slate-400">📱</span>
                        <span className="truncate">{department.managerId.phone}</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleContactManager}
                    className="mt-3.5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-700 transition active:scale-98"
                  >
                    <span>💬</span>
                    <span>{t('contactManager')}</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 rounded-xl bg-slate-50 p-4 text-center">
                  <span className="text-2xl">👤</span>
                  <p className="mt-1 text-xs text-slate-500">{t('notAssigned')}</p>
                </div>
              )}
            </div>

            {/* Workforce Distribution Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>📊</span>
                <span>{t('workforceDistribution')}</span>
              </h2>

              <div className="mt-4">
                {/* Visual ratio progress bar */}
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                  <div
                    className="bg-primary-600 transition-all duration-500"
                    style={{
                      width: `${totalMembers ? ((department.employeeCount || 0) / totalMembers) * 100 : 0}%`,
                    }}
                    title={`${t('employees')}: ${department.employeeCount || 0}`}
                  />
                  <div
                    className="bg-purple-500 transition-all duration-500"
                    style={{
                      width: `${totalMembers ? ((department.internCount || 0) / totalMembers) * 100 : 0}%`,
                    }}
                    title={`${t('interns')}: ${department.internCount || 0}`}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-center">
                    <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                      👥 {t('employees')}
                    </span>
                    <span className="mt-0.5 text-xl font-black text-slate-900 block">
                      {department.employeeCount ?? 0}
                    </span>
                  </div>

                  <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 text-center">
                    <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
                      🎓 {t('interns')}
                    </span>
                    <span className="mt-0.5 text-xl font-black text-slate-900 block">
                      {department.internCount ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Resources & Helpdesk Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>🚀</span>
                <span>{t('quickHelpdesk')}</span>
              </h2>
              <div className="mt-3 space-y-2">
                <Link
                  to="/knowledge"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <span>📚</span>
                    <span>{t('viewKnowledge')}</span>
                  </span>
                  <span className="text-slate-400">→</span>
                </Link>

                <Link
                  to="/chat"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <span>💬</span>
                    <span>{t('viewHelpdesk')}</span>
                  </span>
                  <span className="text-slate-400">→</span>
                </Link>

                <Link
                  to={`/organization?dept=${department._id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <span>🌐</span>
                    <span>{t('viewInOrgChart')}</span>
                  </span>
                  <span className="text-slate-400">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Main Feed Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Core Responsibilities Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🎯</span>
                  <span>{t('coreResponsibilities')}</span>
                </h2>
                {canEdit && (
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    + {t('editDepartmentPage')}
                  </button>
                )}
              </div>

              {department.responsibilities && department.responsibilities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {department.responsibilities.map((resp, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition-all hover:border-primary-200 hover:bg-white hover:shadow-xs"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100/70 text-xs font-bold text-primary-700">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-800 leading-snug">{resp}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 text-sm">
                  <p>— {t('noDescriptionProvided')} —</p>
                </div>
              )}
            </div>

            {/* Topics You Can Contact This Department For */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>💬</span>
                  <span>{t('topicsCanContact')}</span>
                </h2>
              </div>

              {department.contactTopics && department.contactTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {department.contactTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-700"
                    >
                      <span>💡</span>
                      <span>{topic}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 text-sm">
                  <p>— {t('noDescriptionProvided')} —</p>
                </div>
              )}
            </div>

            {/* Featured Team Members Preview */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>👥</span>
                  <span>{t('teamAndMembers')}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono">
                    {totalMembers}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('team')}
                  className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
                >
                  <span>{t('allMembers')}</span>
                  <span>→</span>
                </button>
              </div>

              {totalMembers > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Show up to 4 employees and 2 interns */}
                  {normalizedEmployees.slice(0, 4).map((emp) => (
                    <Link
                      key={emp._id}
                      to={`/employees/${emp._id}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 transition-all hover:bg-white hover:border-primary-300 hover:shadow-xs group"
                    >
                      <ImageWithFallback
                        src={emp.profileImage}
                        alt={`${emp.firstName} ${emp.lastName}`}
                        className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200 group-hover:ring-primary-400 transition-all shrink-0"
                        fallback={`${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-primary-600 truncate">
                            {emp.firstName} {emp.lastName}
                          </p>
                          {emp.nickname && (
                            <span className="rounded bg-blue-50 text-blue-700 text-[10px] font-semibold px-1">
                              {emp.nickname}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{emp.position || '—'}</p>
                      </div>
                    </Link>
                  ))}

                  {normalizedInterns.slice(0, 2).map((intern) => (
                    <Link
                      key={intern._id}
                      to={`/interns/${intern._id}`}
                      className="flex items-center gap-3 rounded-xl border border-purple-100/70 bg-purple-50/20 p-3 transition-all hover:bg-white hover:border-purple-300 hover:shadow-xs group"
                    >
                      <ImageWithFallback
                        src={intern.profileImage}
                        alt={`${intern.firstName} ${intern.lastName}`}
                        className="h-11 w-11 rounded-xl object-cover ring-1 ring-purple-200 group-hover:ring-purple-400 transition-all shrink-0"
                        fallback={`${intern.firstName?.[0] || ''}${intern.lastName?.[0] || ''}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-purple-600 truncate">
                            {intern.firstName} {intern.lastName}
                          </p>
                          <span className="rounded bg-purple-100 text-purple-700 text-[10px] font-semibold px-1">
                            🎓 Intern
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{intern.university || '—'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 text-sm">
                  <p>{t('noAssignedEmployees')}</p>
                </div>
              )}

              {totalMembers > 6 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('team')}
                  className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  {t('allMembers')} ({totalMembers}) →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM & MEMBERS (ทีมงานและสมาชิก) */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Search Bar & Member Type Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Live Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder={t('searchMembers')}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {memberSearch && (
                <button
                  type="button"
                  onClick={() => setMemberSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMemberTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  memberTypeFilter === 'all'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('allMembers')} ({totalMembers})
              </button>

              <button
                type="button"
                onClick={() => setMemberTypeFilter('employees')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  memberTypeFilter === 'employees'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('employeesCount', { count: normalizedEmployees.length })}
              </button>

              <button
                type="button"
                onClick={() => setMemberTypeFilter('interns')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  memberTypeFilter === 'interns'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                {t('internsCount', { count: normalizedInterns.length })}
              </button>
            </div>
          </div>

          {/* Regular Employees Section */}
          {(memberTypeFilter === 'all' || memberTypeFilter === 'employees') && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>👥</span>
                  <span>{t('fullTimeEmployees')}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 font-mono font-bold">
                    {filteredEmployees.length}
                  </span>
                </h2>
              </div>

              {filteredEmployees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredEmployees.map((emp) => (
                    <EmployeeCard key={emp._id} employee={emp} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center text-slate-500">
                  <span className="text-3xl">👥</span>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{t('noAssignedEmployees')}</p>
                </div>
              )}
            </div>
          )}

          {/* Interns Section */}
          {(memberTypeFilter === 'all' || memberTypeFilter === 'interns') && (
            <div className="pt-2">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🎓</span>
                  <span>{t('interns')}</span>
                  <span className="rounded-full bg-purple-100 text-purple-700 px-2.5 py-0.5 text-xs font-mono font-bold">
                    {filteredInterns.length}
                  </span>
                </h2>
              </div>

              {filteredInterns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredInterns.map((intern) => (
                    <InternCard key={intern._id} intern={intern} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center text-slate-500">
                  <span className="text-3xl">🎓</span>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{t('noAssignedInterns')}</p>
                </div>
              )}
            </div>
          )}

          {/* Global Empty Search State */}
          {filteredEmployees.length === 0 && filteredInterns.length === 0 && memberSearch && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center">
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-base font-bold text-slate-800">{t('noMembersMatch')}</p>
              <button
                type="button"
                onClick={() => setMemberSearch('')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {t('clearSearchInput')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SERVICES & TOPICS (บทบาทและบริการ) */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Deep-Dive Responsibilities Section */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <span>🎯</span>
              <span>{t('coreResponsibilities')}</span>
            </h2>

            {department.responsibilities && department.responsibilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {department.responsibilities.map((resp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 shadow-2xs hover:bg-white hover:border-primary-300 hover:shadow-xs transition-all"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white shadow-xs">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 leading-snug">{resp}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {theme.label} · FTI Headquarters
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
                <p>— {t('noDescriptionProvided')} —</p>
              </div>
            )}
          </div>

          {/* Contact Topics & Inquiry Directory */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <span>💬</span>
              <span>{t('topicsCanContact')}</span>
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Guidance for new staff and interns on when and how to reach out to this department.
            </p>

            {department.contactTopics && department.contactTopics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {department.contactTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-primary-400 hover:shadow-xs transition-all"
                  >
                    <span className="text-2xl">💡</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{topic}</p>
                      <p className="text-xs text-slate-400">
                        {department.extension ? `Ext. ${department.extension}` : 'Direct Contact'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
                <p>— {t('noDescriptionProvided')} —</p>
              </div>
            )}
          </div>

          {/* Escalation & Contact Pathways */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-indigo-200">
                  <span>⚡</span>
                  <span>Contact Protocols</span>
                </span>
                <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                  Need Help or Have Inquiries?
                </h3>
                <p className="mt-1 text-sm text-indigo-200/80 max-w-xl">
                  Reach out directly to the department manager or call via internal extension. For general technical help, check our IT Knowledge Base.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleContactManager}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-md transition hover:bg-slate-100 active:scale-95"
                >
                  💬 {t('contactManager')}
                </button>
                <Link
                  to="/knowledge"
                  className="rounded-xl bg-white/10 border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                >
                  📚 {t('viewKnowledge')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('editDepartmentPage')}
        size="lg"
      >
        <form onSubmit={handleSaveDepartment} className="space-y-4">
          <p className="text-xs text-slate-500 -mt-2">{t('editDepartmentModalSubtitle')}</p>

          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
              {formError}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {t('description')}
            </label>
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t('description')}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Location & Extension Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                {t('location')}
              </label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Floor 3, Zone A"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                {t('extension')}
              </label>
              <input
                type="text"
                value={editForm.extension}
                onChange={(e) => setEditForm((prev) => ({ ...prev, extension: e.target.value }))}
                placeholder="e.g. 1042"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Responsibilities Tag Editor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {t('coreResponsibilities')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newRespInput}
                onChange={(e) => setNewRespInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddResponsibility();
                  }
                }}
                placeholder="Type responsibility and press Enter..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddResponsibility}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              {editForm.responsibilities.length > 0 ? (
                editForm.responsibilities.map((resp, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200 shadow-2xs"
                  >
                    <span>{resp}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveResponsibility(idx)}
                      className="text-slate-400 hover:text-red-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 self-center">No responsibilities added yet</span>
              )}
            </div>
          </div>

          {/* Contact Topics Tag Editor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              {t('topicsCanContact')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                placeholder="Type contact topic and press Enter..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              {editForm.contactTopics.length > 0 ? (
                editForm.contactTopics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200 shadow-2xs"
                  >
                    <span>💡 {topic}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="text-slate-400 hover:text-red-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 self-center">No contact topics added yet</span>
              )}
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={updateDepartmentMut.isPending}
              className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primary-700 transition disabled:opacity-50"
            >
              {updateDepartmentMut.isPending ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
