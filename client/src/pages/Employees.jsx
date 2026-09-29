import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import AppShell from '../components/layout/AppShell.jsx';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import {
  useEmployees,
  useDepartments,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '../hooks/useEmployees.js';
import DataTable from '../components/common/DataTable.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import EmployeeForm from '../components/employees/EmployeeForm.jsx';
import EmployeeCard from '../components/employees/EmployeeCard.jsx';
import ViewSwitcher from '../components/common/ViewSwitcher.jsx';
import { ImageWithFallback } from '../components/common/ImageUpload.jsx';

const PAGE_SIZE = 12;

export default function Employees() {
  const { hasPermission } = useAuth();
  const { t, language } = useLanguage();
  const canManage = hasPermission('employees:manage');
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(() => searchParams.get('department') || '');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');

  const { data, isLoading, isError, error, isFetching, refetch } = useEmployees({
    search,
    department,
    page,
    limit: PAGE_SIZE,
  });

  const { data: departments = [] } = useDepartments();
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();
  const deleteMut = useDeleteEmployee();

  const [formOpen, setFormOpen] = useState(() => searchParams.get('create') === '1');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const reset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setServerErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setServerErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const submit = async (payload, file) => {
    setServerErrors({});
    setFormError('');
    setUploadProgress(0);
    const onUploadProgress = (event) => {
      if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    try {
      if (editing) await updateMut.mutateAsync({ id: editing._id, payload, file, onUploadProgress });
      else await createMut.mutateAsync({ payload, file, onUploadProgress });
      setFormOpen(false);
    } catch (requestError) {
      const response = requestError.response?.data;
      if (response?.errors) setServerErrors(response.errors);
      setFormError(response?.message || t('saveEmployeeError'));
    }
  };

  const remove = async () => {
    try {
      await deleteMut.mutateAsync(deleting._id);
      setDeleting(null);
    } catch {}
  };

  const totalEmployees = data?.pagination?.total ?? data?.data?.length ?? 0;
  const activeEmployees = (data?.data || []).filter((e) => e.isActive && e.isPublished).length;

  const columns = [
    { key: 'employeeCode', header: t('code') },
    {
      key: 'name',
      header: t('name'),
      render: (item) => (
        <Link to={`/employees/${item._id}`} className="flex items-center gap-2 group/name">
          <ImageWithFallback
            src={item.profileImage}
            alt={`${item.firstName} ${item.lastName}`}
            className="w-8 h-8 rounded-full object-cover group-hover/name:ring-2 group-hover/name:ring-primary-400 transition-all"
            fallback={`${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`}
          />
          <div>
            <span className="font-medium text-gray-800 group-hover/name:text-primary-600 transition-colors">
              {item.firstName} {item.lastName}
            </span>
            {item.nickname && <span className="text-gray-400"> ({item.nickname})</span>}
          </div>
        </Link>
      ),
    },
    { key: 'position', header: t('position') },
    {
      key: 'department',
      header: t('departments'),
      render: (item) => item.departmentId?.name || '-',
    },
    {
      key: 'status',
      header: t('status'),
      render: (item) => (
        <div className="flex gap-1">
          {!item.isActive && <Badge tone="gray">{t('inactive')}</Badge>}
          {!item.isPublished && <Badge tone="amber">{t('hidden')}</Badge>}
          {item.isActive && item.isPublished && <Badge tone="green">{t('active')}</Badge>}
        </div>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item) => (
        <div className="flex justify-end items-center gap-2.5">
          <Link to={`/employees/${item._id}`} className="text-primary-600 hover:underline text-xs font-semibold">
            {t('viewProfile')}
          </Link>
          <button onClick={() => openEdit(item)} className="text-slate-600 hover:underline text-xs font-medium">
            {t('edit')}
          </button>
          <button onClick={() => setDeleting(item)} className="text-red-600 hover:underline text-xs font-medium">
            {t('delete')}
          </button>
        </div>
      ),
    });
  } else {
    columns.push({
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item) => (
        <div className="flex justify-end">
          <Link to={`/employees/${item._id}`} className="text-primary-600 hover:underline text-xs font-semibold">
            {t('viewProfile')} →
          </Link>
        </div>
      ),
    });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Top Header & Stat Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-xl text-primary-600 ring-1 ring-blue-100">
                👔
              </span>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {t('employees')}
                </h1>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {t('employeesSubtitle') || 'รายชื่อและทำเนียบบุคลากรทั้งหมดในองค์กร'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stat Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-white border border-slate-200/90 px-3.5 py-1.5 shadow-2xs text-xs font-semibold text-slate-600">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('totalCount', { count: totalEmployees })}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700">{t('activeCount', { count: activeEmployees })}</span>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-500 hover:shadow-md active:scale-95"
              >
                <span>➕</span>
                <span>{t('addEmployee')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & View Switcher Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
            <div className="relative flex-1">
              <SearchBar
                value={search}
                onSearch={reset(setSearch)}
                placeholder={t('searchEmployees')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-3.5 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => reset(setSearch)('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={department}
              onChange={(e) => reset(setDepartment)(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
            >
              <option value="">🏢 {t('allDepartments')}</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            {(search || department) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setDepartment('');
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                {language === 'th' ? 'ล้างตัวกรอง' : 'Clear filters'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <span className="text-xs text-slate-400 font-medium">
              {language === 'th' ? `แสดงผล ${data?.data?.length || 0} จาก ${totalEmployees} คน` : `Showing ${data?.data?.length || 0} of ${totalEmployees}`}
            </span>
            <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {/* Content Body: Card Grid or Table */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-6 w-full rounded bg-slate-100" />
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="h-8 w-full border-t border-slate-100 pt-3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
            <p className="text-sm font-semibold text-rose-700">{error?.message || t('errorLoading')}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
            >
              {t('retry')}
            </button>
          </div>
        ) : (data?.data || []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <span className="text-4xl">👔</span>
            <h3 className="mt-3 text-base font-bold text-slate-800">{t('noEmployees')}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {search || department ? t('adjustFilters') : t('addFirstEmployee')}
            </p>
            {(search || department) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setDepartment('');
                  setPage(1);
                }}
                className="mt-4 rounded-xl bg-primary-50 border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
              >
                {language === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Clear all filters'}
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
            {data.data.map((item) => (
              <EmployeeCard
                key={item._id}
                employee={item}
                canManage={canManage}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.data}
            loading={isLoading}
            error={isError ? error : null}
            onRetry={refetch}
            emptyTitle={t('noEmployees')}
            emptyMessage={search || department ? t('adjustFilters') : t('addFirstEmployee')}
          />
        )}

        {/* Pagination */}
        {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} disabled={isFetching} />}

        {/* Modal: Create/Edit Employee */}
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing ? t('editEmployee') : t('addEmployeeTitle')}
          size="lg"
        >
          {formError && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </p>
          )}
          <EmployeeForm
            initial={editing}
            departments={departments}
            onSubmit={submit}
            onCancel={() => setFormOpen(false)}
            submitting={createMut.isPending || updateMut.isPending}
            uploadProgress={uploadProgress}
            serverErrors={serverErrors}
          />
        </Modal>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          onConfirm={remove}
          title={t('deleteEmployee')}
          message={deleting ? t('deleteConfirm', { name: `${deleting.firstName} ${deleting.lastName}` }) : ''}
          confirmLabel={t('delete')}
          loading={deleteMut.isPending}
        />
      </div>
    </AppShell>
  );
}

function Badge({ tone, children }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    gray: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
