import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import OrganizationChart from '../components/organization/OrganizationChart.jsx';
import { useOrganizationTree } from '../hooks/useOrganization.js';
import { useDepartments } from '../hooks/useDepartments.js';
import useLanguage from '../hooks/useLanguage.js';
import AppShell from '../components/layout/AppShell.jsx';

export default function Organization() {
  const { t } = useLanguage();
  const [departmentId, setDepartmentId] = useState('');
  const { data: departments = [] } = useDepartments();
  const {
    data: tree,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrganizationTree(departmentId ? { department: departmentId } : {});

  return (
    <AppShell>
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Link to="/" className="hover:text-primary-600 transition-colors">
              {t('dashboard')}
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-800">{t('organizationChart')}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('organizationTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            {t('organizationSubtitle')}
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-xs space-y-4">
          <div className="inline-block animate-spin text-3xl">🌳</div>
          <p className="text-sm font-semibold text-gray-600">{t('loadingChart')}</p>
        </div>
      )}

      {/* Error Banner */}
      {isError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-xs space-y-3">
          <p className="font-bold text-base">⚠️ {t('chartError')}</p>
          <p className="text-xs text-red-600">
            {error?.response?.data?.message || error?.message}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            {t('tryAgain')}
          </button>
        </div>
      )}

      {/* Main Organization Chart View */}
      {tree && !isError && (
        <OrganizationChart
          tree={tree}
          departments={departments}
          departmentId={departmentId}
          onDepartmentChange={setDepartmentId}
        />
      )}
    </AppShell>
  );
}
