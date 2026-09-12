import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppShell from '../components/layout/AppShell.jsx';
import useLanguage from '../hooks/useLanguage.js';
import { useAdminDashboardStatistics } from '../hooks/useAdminDashboard.js';

const PALETTE = ['#2563eb', '#0891b2', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function AdminDashboard() {
  const { t, locale, language } = useLanguage();
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminDashboardStatistics();
  const [activeTab, setActiveTab] = useState('department');

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState />
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <ErrorState message={errorMessage(error, t('adminDashboardLoadError'))} onRetry={refetch} />
      </AppShell>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const pending = data?.pending || {};
  const feedback = data?.feedback || {};
  const recentActivity = data?.recentActivity || [];

  // Filter pending items where count > 0
  const pendingList = [
    { key: 'feedback', label: t('pendingFeedback'), value: pending.feedback, to: '/admin/feedback', tone: 'amber' },
    { key: 'announcements', label: t('pendingAnnouncements'), value: pending.announcements, to: '/announcements', tone: 'blue' },
    { key: 'policies', label: t('pendingPolicies'), value: pending.policies, to: '/policies', tone: 'purple' },
    { key: 'faqs', label: t('pendingFaqs'), value: pending.faqs, to: '/faq', tone: 'teal' },
    { key: 'knowledgeArticles', label: t('pendingKnowledgeArticles'), value: pending.knowledgeArticles, to: '/it-help', tone: 'emerald' },
  ].filter((item) => (item.value || 0) > 0);

  const totalPendingCount = pending.total || 0;

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Top Header & Fast Navigation */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Link to="/dashboard" className="hover:text-primary-600 transition">
                {t('dashboard')}
              </Link>
              <span>/</span>
              <span className="text-gray-800">{t('adminDashboard')}</span>
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {t('adminDashboardTitle')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('adminDashboardSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm text-xs text-gray-500">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isFetching ? 'bg-primary-400' : 'bg-emerald-400'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isFetching ? 'bg-primary-500' : 'bg-emerald-500'}`} />
              </span>
              <span>
                {data?.generatedAt
                  ? t('dashboardUpdated', { date: new Date(data.generatedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) })
                  : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-primary-600 active:scale-95 disabled:opacity-60"
            >
              <svg className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-primary-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isFetching ? t('refreshing') : t('refresh')}</span>
            </button>
          </div>
        </header>

        {/* Quick Action Toolbar */}
        <section className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{t('quickActions')}</h2>
                <p className="text-xs text-gray-500">{t('quickActionsSub')}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/employees?create=1"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-primary-500 hover:text-primary-600 hover:bg-white"
              >
                <span className="text-primary-600 font-bold">+</span>
                {t('addEmployee')}
              </Link>
              <Link
                to="/interns?create=1"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-emerald-500 hover:text-emerald-600 hover:bg-white"
              >
                <span className="text-emerald-600 font-bold">+</span>
                {t('addIntern')}
              </Link>
              <Link
                to="/announcements?create=1"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-purple-500 hover:text-purple-600 hover:bg-white"
              >
                <span className="text-purple-600 font-bold">+</span>
                {t('addAnnouncement')}
              </Link>
              <Link
                to="/departments?create=1"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-amber-500 hover:text-amber-600 hover:bg-white"
              >
                <span className="text-amber-600 font-bold">+</span>
                {t('addDepartment')}
              </Link>
              <Link
                to="/it-help?create=1"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-cyan-500 hover:text-cyan-600 hover:bg-white"
              >
                <span className="text-cyan-600 font-bold">+</span>
                {t('addItHelp')}
              </Link>
            </div>
          </div>
        </section>

        {/* 4 Master Consolidated KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Total Workforce */}
          <Link
            to="/employees"
            className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('totalWorkforce')}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900">{metrics.totalEmployees || 0}</span>
                  <span className="text-xs font-medium text-gray-500">{t('employees')}</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                {metrics.activeEmployees || 0} {t('active')}
              </span>
              <span>•</span>
              <span>{metrics.departments || 0} {t('departments')}</span>
            </div>
          </Link>

          {/* 2. Intern Cohort */}
          <Link
            to="/interns"
            className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('activeInternsOverview')}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900">{metrics.activeInterns || 0}</span>
                  <span className="text-xs font-medium text-gray-500">{t('active')}</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {metrics.upcomingInterns || 0} {t('upcomingInterns')}
              </span>
              <span>•</span>
              <span className="hover:text-emerald-700 font-medium">{t('internBatches')} →</span>
            </div>
          </Link>

          {/* 3. Content & Knowledge Articles */}
          <Link
            to="/announcements"
            className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('contentHubOverview')}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900">{metrics.liveAnnouncements || 0}</span>
                  <span className="text-xs font-medium text-gray-500">{t('liveAnnouncements')}</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-700">
                {metrics.knowledgeArticles || 0} {t('knowledgeArticles')}
              </span>
              <span>•</span>
              <span>{t('manageContent')}</span>
            </div>
          </Link>

          {/* 4. Feedback & Service Rating */}
          <Link
            to="/admin/feedback"
            className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('feedbackOverview')}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-500">
                    {metrics.feedbackAverageRating ? `${metrics.feedbackAverageRating}` : '—'}
                  </span>
                  <span className="text-xs font-medium text-gray-500">/ 5.0 ⭐</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${metrics.pendingFeedback > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                {metrics.pendingFeedback || 0} {t('pendingFeedback')}
              </span>
              <span>{metrics.feedbackTotal || 0} {t('all')}</span>
            </div>
          </Link>
        </section>

        {/* Analytics Section: Tabbed Workforce + Feedback Health */}
        <section className="grid gap-6 lg:grid-cols-12">
          {/* Left: Tabbed Workforce Distribution */}
          <div className="lg:col-span-7 rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-bold text-gray-900">{t('workforceAnalytics')}</h2>
                <p className="text-xs text-gray-500">
                  {activeTab === 'department' && `${t('byDepartment')} (Employees & Interns)`}
                  {activeTab === 'university' && `${t('byUniversity')} (Interns)`}
                  {activeTab === 'batch' && `${t('byBatch')} (Interns)`}
                </p>
              </div>

              {/* Pill Tabs */}
              <div className="inline-flex rounded-lg bg-gray-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('department')}
                  className={`rounded-md px-3 py-1.5 transition ${activeTab === 'department' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {t('byDepartment')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('university')}
                  className={`rounded-md px-3 py-1.5 transition ${activeTab === 'university' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {t('byUniversity')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('batch')}
                  className={`rounded-md px-3 py-1.5 transition ${activeTab === 'batch' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {t('byBatch')}
                </button>
              </div>
            </div>

            <div className="mt-5 h-72">
              {activeTab === 'department' && (
                <DepartmentBarChart data={charts.employeesByDepartment} barColor="#2563eb" />
              )}
              {activeTab === 'university' && (
                <UniversityPieChart data={charts.internsByUniversity} />
              )}
              {activeTab === 'batch' && (
                <DepartmentBarChart data={charts.internsByBatch} barColor="#10b981" />
              )}
            </div>
          </div>

          {/* Right: Feedback & Satisfaction Health Overview */}
          <div className="lg:col-span-5 rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="font-bold text-gray-900">{t('feedbackAnalytics')}</h2>
                  <p className="text-xs text-gray-500">{t('feedbackSatisfactionRate')} & {t('feedbackStatusBreakdown')}</p>
                </div>
                <Link to="/admin/feedback" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                  {t('openCard')} →
                </Link>
              </div>

              {/* Big Rating Banner */}
              <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                    {t('feedbackAverageRating')}
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-900">
                      {feedback.averageRating ? feedback.averageRating : '—'}
                    </span>
                    <span className="text-sm font-semibold text-amber-700">/ 5.0</span>
                  </div>
                  <div className="mt-1 flex text-amber-500 text-sm">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>
                        {i < Math.round(feedback.averageRating || 0) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-600 block">{t('feedbackTotal')}</span>
                  <span className="text-2xl font-bold text-gray-900">{feedback.total || 0}</span>
                  <span className="text-xs text-emerald-600 font-medium block mt-0.5">
                    {feedback.resolved || 0} {t('feedbackResolved')}
                  </span>
                </div>
              </div>

              {/* Progress Bar of Resolved vs Pending */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1.5">
                  <span>{t('feedbackStatusBreakdown')}</span>
                  <span>
                    {feedback.total > 0 ? `${Math.round(((feedback.resolved || 0) / feedback.total) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${feedback.total ? ((feedback.resolved || 0) / feedback.total) * 100 : 0}%` }}
                    title={`${feedback.resolved || 0} Resolved`}
                  />
                  <div
                    className="bg-amber-400 transition-all duration-500"
                    style={{ width: `${feedback.total ? ((feedback.pending || 0) / feedback.total) * 100 : 0}%` }}
                    title={`${feedback.pending || 0} Pending`}
                  />
                </div>
              </div>

              {/* Category distribution pills */}
              <div className="mt-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t('feedbackCategoryBreakdown')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(feedback.byCategory || []).length > 0 ? (
                    feedback.byCategory.map((cat) => (
                      <span
                        key={cat.label}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 font-medium"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                        <span className="capitalize">{cat.label?.replace(/_/g, ' ')}</span>
                        <span className="rounded bg-white px-1.5 py-0.2 text-gray-900 font-bold border border-gray-200 text-[10px]">
                          {cat.count}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">{t('noData')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{t('adminAreaDesc')}</span>
              <Link to="/admin/feedback" className="font-semibold text-primary-600 hover:underline">
                {t('manageContent')} →
              </Link>
            </div>
          </div>
        </section>

        {/* Lower Section: Recent Activity + Action Required */}
        <section className="grid gap-6 lg:grid-cols-12">
          {/* Recent Activity Feed */}
          <div className="lg:col-span-7 rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-bold text-gray-900">{t('recentActivity')}</h2>
                <p className="text-xs text-gray-500">{t('auditLogDesc')}</p>
              </div>
              <Link to="/admin/audit-log" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                {t('auditLog')} →
              </Link>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">{t('noRecentActivity')}</p>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-gray-100">
                {recentActivity.slice(0, 6).map((item) => (
                  <ActivityRow key={item.id} item={item} locale={locale} language={language} />
                ))}
              </div>
            )}
          </div>

          {/* Action Required / Pending Approvals */}
          <div className="lg:col-span-5 rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-gray-900">{t('actionRequired')}</h2>
                  {totalPendingCount > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                      {totalPendingCount}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      ✓ Done
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{t('status')}</span>
              </div>

              {pendingList.length === 0 ? (
                <div className="my-8 rounded-xl bg-emerald-50/60 border border-emerald-200/60 p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-emerald-900">{t('noActionRequired')}</p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-gray-100">
                  {pendingList.map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-2 w-2 rounded-full ${item.tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <span className="text-sm font-medium text-gray-800">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-800">
                          {item.value}
                        </span>
                        <Link
                          to={item.to}
                          className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition"
                        >
                          {t('reviewNow')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-1">{t('actionRequiredSub')}</p>
              <p className="text-[11px] leading-relaxed text-gray-400">
                Draft content and feedback are only visible internally to administrators and editors.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function DepartmentBarChart({ data = [], barColor = '#2563eb' }) {
  const { t } = useLanguage();
  if (!data.length) return <EmptyChart text={t('noData')} />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 25, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          angle={-20}
          textAnchor="end"
          interval={0}
          height={50}
          tick={{ fontSize: 11, fill: '#64748b' }}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Bar dataKey="count" fill={barColor} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function UniversityPieChart({ data = [] }) {
  const { t } = useLanguage();
  if (!data.length) return <EmptyChart text={t('noData')} />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="46%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={3}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${entry.label}`} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ text }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-sm text-gray-400">
      <svg className="h-8 w-8 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span>{text}</span>
    </div>
  );
}

function ActivityRow({ item, locale, language }) {
  const actionColors = {
    create: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    update: 'bg-blue-100 text-blue-800 border-blue-200',
    delete: 'bg-rose-100 text-rose-800 border-rose-200',
    publish: 'bg-purple-100 text-purple-800 border-purple-200',
    login: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const actionTh = {
    create: 'สร้าง',
    update: 'แก้ไข',
    delete: 'ลบ',
    publish: 'เผยแพร่',
    login: 'เข้าสู่ระบบ',
  };

  const entityTh = {
    employee: 'พนักงาน',
    intern: 'นักศึกษาฝึกงาน',
    department: 'แผนก',
    announcement: 'ประกาศ',
    policy: 'นโยบาย',
    faq: 'คำถามที่พบบ่อย',
    knowledge: 'คู่มือช่วยเหลือ',
    feedback: 'ข้อเสนอแนะ',
    user: 'บัญชีผู้ใช้',
  };

  const actionText = language === 'th' ? (actionTh[item.action?.toLowerCase()] || item.action) : (item.action || 'acted');
  const entityText = language === 'th' ? (entityTh[item.entity?.toLowerCase()] || item.entity) : (item.entity || 'item');
  const toneClass = actionColors[item.action?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="flex items-center justify-between gap-3 py-3 text-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">
          {item.actor ? item.actor.charAt(0).toUpperCase() : 'S'}
        </div>
        <div className="min-w-0 truncate">
          <p className="text-gray-900 font-medium truncate">
            <span className="font-semibold text-gray-800">{item.actor}</span>
            <span className="mx-1.5 text-gray-400">·</span>
            <span className={`inline-block rounded px-1.5 py-0.2 border text-[11px] font-medium ${toneClass}`}>
              {actionText}
            </span>
            <span className="ml-1 text-gray-600">{entityText}</span>
          </p>
        </div>
      </div>

      <span className="flex-shrink-0 text-gray-400 text-[11px]">
        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : ''}
      </span>
    </div>
  );
}

function LoadingState() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <div className="h-6 w-48 rounded bg-gray-200 mb-2" />
          <div className="h-4 w-72 rounded bg-gray-100" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-gray-200" />
      </div>
      <div className="h-16 w-full rounded-xl bg-blue-50/50 border border-blue-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl border border-gray-200 bg-white p-5" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 h-80 rounded-2xl border border-gray-200 bg-white" />
        <div className="lg:col-span-5 h-80 rounded-2xl border border-gray-200 bg-white" />
      </div>
      <p className="text-center text-xs text-gray-400 pt-4">{t('loadingAdminDashboard')}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center my-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-red-900 mb-1">{t('adminDashboardLoadError')}</h3>
      <p className="text-xs text-red-700 max-w-md mx-auto mb-4">{message}</p>
      <button
        type="button"
        onClick={() => onRetry()}
        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}
