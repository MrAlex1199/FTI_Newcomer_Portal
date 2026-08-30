import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
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

const PAGE_SIZE = 10;

/**
 * Employee directory: search, department filter, pagination, and (for managers)
 * create/edit/delete via modals. Read-only roles see the list without the
 * management controls - mirroring the server, which would reject those calls
 * anyway.
 */
export default function Employees() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('employees:manage');

  // Filter state lives here and feeds the query key, so any change refetches.
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);

  const params = { search, department, page, limit: PAGE_SIZE };
  const { data, isLoading, isError, error, isFetching, refetch } = useEmployees(params);
  const { data: departments = [] } = useDepartments();

  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();
  const deleteMut = useDeleteEmployee();

  // Modal state: `formOpen` with `editing` (null = create), `deleting` holds row.
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');

  const resetToFirstPage = (fn) => (value) => {
    fn(value);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setServerErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (employee) => {
    setEditing(employee);
    setServerErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    setServerErrors({});
    setFormError('');
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing._id, payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setServerErrors(res.errors);
      setFormError(res?.message || 'Could not save the employee.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(deleting._id);
      setDeleting(null);
    } catch {
      // Keep dialog open; error surfaced below via deleteMut.isError.
    }
  };

  const columns = [
    { key: 'employeeCode', header: 'Code' },
    {
      key: 'name',
      header: 'Name',
      render: (e) => (
        <div>
          <span className="font-medium text-gray-800">
            {e.firstName} {e.lastName}
          </span>
          {e.nickname && <span className="text-gray-400"> ({e.nickname})</span>}
        </div>
      ),
    },
    { key: 'position', header: 'Position' },
    { key: 'department', header: 'Department', render: (e) => e.departmentId?.name || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (e) => (
        <div className="flex gap-1">
          {!e.isActive && <Badge tone="gray">Inactive</Badge>}
          {!e.isPublished && <Badge tone="amber">Hidden</Badge>}
          {e.isActive && e.isPublished && <Badge tone="green">Active</Badge>}
        </div>
      ),
    },
  ];

  if (canManage) {
    columns.push({
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (e) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEdit(e)} className="text-primary-600 hover:underline text-sm">
            Edit
          </button>
          <button onClick={() => setDeleting(e)} className="text-red-600 hover:underline text-sm">
            Delete
          </button>
        </div>
      ),
    });
  }

  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">Employee Directory</h1>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <SearchBar value={search} onSearch={resetToFirstPage(setSearch)} placeholder="Search name, position, skills..." />
          <select
            value={department}
            onChange={(e) => resetToFirstPage(setDepartment)(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="sm:ml-auto">
            {canManage && (
              <button
                onClick={openCreate}
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
              >
                + Add employee
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={data?.data}
          loading={isLoading}
          error={isError ? error : null}
          onRetry={refetch}
          emptyTitle="No employees found"
          emptyMessage={search || department ? 'Try adjusting your filters.' : 'Add the first employee to get started.'}
        />

        {pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
            disabled={isFetching}
          />
        )}
      </main>

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit employee' : 'Add employee'}
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
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          submitting={createMut.isPending || updateMut.isPending}
          serverErrors={serverErrors}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete employee"
        message={
          deleting
            ? `Delete ${deleting.firstName} ${deleting.lastName}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleteMut.isPending}
      />
    </div>
  );
}

function Badge({ tone, children }) {
  const tones = {
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
