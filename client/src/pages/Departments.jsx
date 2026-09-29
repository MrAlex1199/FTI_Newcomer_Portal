import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import AppShell from '../components/layout/AppShell.jsx';
import useAuth from '../hooks/useAuth.js';
import useLanguage from '../hooks/useLanguage.js';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../hooks/useDepartments.js';
import { useEmployees } from '../hooks/useEmployees.js';
import DataTable from '../components/common/DataTable.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import DepartmentForm from '../components/departments/DepartmentForm.jsx';
import DepartmentCard from '../components/departments/DepartmentCard.jsx';
import ViewSwitcher from '../components/common/ViewSwitcher.jsx';

export default function Departments() {
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const { t, language } = useLanguage();
  const canManage = hasPermission('departments:manage');

  const { data: departments = [], isLoading, isError, error, refetch } = useDepartments();
  const { data: employeeData } = useEmployees({ page: 1, limit: 100 });
  const employees = employeeData?.data || [];

  const createMut = useCreateDepartment();
  const updateMut = useUpdateDepartment();
  const deleteMut = useDeleteDepartment();

  const [formOpen, setFormOpen] = useState(() => searchParams.get('create') === '1');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const open = (item = null) => {
    setEditing(item);
    setServerErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const submit = async (payload) => {
    setServerErrors({});
    setFormError('');
    try {
      if (editing) await updateMut.mutateAsync({ id: editing._id, payload });
      else await createMut.mutateAsync(payload);
      setFormOpen(false);
    } catch (requestError) {
      const response = requestError.response?.data;
      if (response?.errors) setServerErrors(response.errors);
      setFormError(response?.message || t('saveDepartmentError'));
    }
  };

  const remove = async () => {
    try {
      await deleteMut.mutateAsync(deleting._id);
      setDeleting(null);
    } catch {}
  };

  // Filter departments locally by search and status
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (statusFilter === 'active' && !d.isActive) return false;
      if (statusFilter === 'inactive' && d.isActive) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (d.name || '').toLowerCase().includes(q);
        const matchCode = (d.code || '').toLowerCase().includes(q);
        const matchManager = d.managerId
          ? `${d.managerId.firstName || ''} ${d.managerId.lastName || ''}`.toLowerCase().includes(q)
          : false;
        if (!matchName && !matchCode && !matchManager) return false;
      }
      return true;
    });
  }, [departments, search, statusFilter]);

  // Aggregate stats
  const totalDepts = departments.length;
  const activeDepts = departments.filter((d) => d.isActive).length;
  const totalEmployees = departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0);
  const totalInterns = departments.reduce((sum, d) => sum + (d.internCount || 0), 0);

  const columns = [
    {
      key: 'name',
      header: t('departments'),
      render: (item) => (
        <div>
          <Link to={`/departments/${item._id}`} className="font-semibold text-primary-600 hover:underline">
            {item.name}
          </Link>
          <p className="text-xs font-mono font-medium text-gray-400">{item.code}</p>
        </div>
      ),
    },
    {
      key: 'manager',
      header: t('manager'),
      render: (item) =>
        item.managerId ? `${item.managerId.firstName} ${item.managerId.lastName}` : '—',
    },
    { key: 'employeeCount', header: t('employees') },
    { key: 'internCount', header: t('interns') },
    {
      key: 'status',
      header: t('status'),
      render: (item) => <Badge active={item.isActive} />,
    },
  ];

  if (canManage) {
    columns.push({
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => open(item)} className="text-primary-600 hover:underline text-sm font-medium">
            {t('edit')}
          </button>
          <button onClick={() => setDeleting(item)} className="text-red-600 hover:underline text-sm font-medium">
            {t('delete')}
          </button>
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
                🏢
              </span>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {t('departmentDirectory')}
                </h1>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {t('departmentsSubtitle') || 'โครงสร้างฝ่ายและแผนกการดำเนินงานภายใน บมจ. ฟังก์ชั่น อินเตอร์เนชั่นแนล'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stat Pills */}
            <div className="hidden sm:flex items-center gap-2.5 rounded-2xl bg-white border border-slate-200/90 px-3.5 py-1.5 shadow-2xs text-xs font-semibold text-slate-600">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>{totalDepts} {language === 'th' ? 'ฝ่าย/แผนก' : 'Depts'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-700">👥 {totalEmployees} {language === 'th' ? 'พนักงาน' : 'Staff'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-purple-700">🎓 {totalInterns} {language === 'th' ? 'นักศึกษา' : 'Interns'}</span>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => open()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-500 hover:shadow-md active:scale-95"
              >
                <span>➕</span>
                <span>{t('addDepartment')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & View Switcher Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row gap-2.5 flex-1 max-w-xl">
            <div className="relative flex-1">
              <SearchBar
                value={search}
                onSearch={setSearch}
                placeholder={t('searchDepartments') || 'ค้นหาแผนก, รหัสย่อ, ผู้จัดการ...'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-3.5 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
            >
              <option value="all">🌐 {t('allStatuses') || 'ทุกสถานะ'}</option>
              <option value="active">🟢 {t('active') || 'เปิดใช้งาน'}</option>
              <option value="inactive">⚪ {t('inactive') || 'ปิดใช้งาน'}</option>
            </select>

            {(search || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                {language === 'th' ? 'ล้างตัวกรอง' : 'Clear filters'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <span className="text-xs text-slate-400 font-medium">
              {language === 'th' ? `แสดงผล ${filteredDepartments.length} จาก ${totalDepts} แผนก` : `Showing ${filteredDepartments.length} of ${totalDepts}`}
            </span>
            <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {/* Content Body: Card Grid or Table */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-10 w-full rounded bg-slate-100" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-14 rounded bg-slate-100" />
                  <div className="h-14 rounded bg-slate-100" />
                </div>
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
        ) : filteredDepartments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <span className="text-4xl">🏢</span>
            <h3 className="mt-3 text-base font-bold text-slate-800">{t('noDepartments')}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {search || statusFilter !== 'all' ? t('adjustFilters') : t('createFirstDepartment')}
            </p>
            {(search || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-4 rounded-xl bg-primary-50 border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
              >
                {language === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Clear all filters'}
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDepartments.map((dept) => (
              <DepartmentCard
                key={dept._id}
                department={dept}
                canManage={canManage}
                onEdit={open}
                onDelete={setDeleting}
              />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredDepartments}
            loading={isLoading}
            error={isError ? error : null}
            onRetry={refetch}
            emptyTitle={t('noDepartments')}
            emptyMessage={canManage ? t('createFirstDepartment') : t('noActiveDepartments')}
          />
        )}

        {/* Modal: Create/Edit Department */}
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing ? t('editDepartment') : t('addDepartment')}
          size="lg"
        >
          {formError && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
            </p>
          )}
          <DepartmentForm
            initial={editing}
            employees={employees}
            onSubmit={submit}
            onCancel={() => setFormOpen(false)}
            submitting={createMut.isPending || updateMut.isPending}
            serverErrors={serverErrors}
          />
        </Modal>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={!!deleting}
          onClose={() => {
            if (!deleteMut.isPending) setDeleting(null);
          }}
          onConfirm={remove}
          title={t('deleteDepartment')}
          message={deleting ? t('deleteDepartmentConfirm', { name: deleting.name }) : ''}
          confirmLabel={t('delete')}
          loading={deleteMut.isPending}
        />
      </div>
    </AppShell>
  );
}

function Badge({ active }) {
  const { t } = useLanguage();
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
      }`}
    >
      {active ? t('active') : t('inactive')}
    </span>
  );
}
