import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '../hooks/useDepartments.js';
import { useEmployees } from '../hooks/useEmployees.js';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import DepartmentForm from '../components/departments/DepartmentForm.jsx';

export default function Departments() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('departments:manage');
  const { data: departments = [], isLoading, isError, error, refetch } = useDepartments();
  const { data: employeeData } = useEmployees({ page: 1, limit: 100 });
  const employees = employeeData?.data || [];
  const createMut = useCreateDepartment();
  const updateMut = useUpdateDepartment();
  const deleteMut = useDeleteDepartment();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');

  const openCreate = () => {
    setEditing(null);
    setServerErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (department) => {
    setEditing(department);
    setServerErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    setServerErrors({});
    setFormError('');
    try {
      if (editing) await updateMut.mutateAsync({ id: editing._id, payload });
      else await createMut.mutateAsync(payload);
      setFormOpen(false);
    } catch (err) {
      const response = err.response?.data;
      if (response?.errors) setServerErrors(response.errors);
      setFormError(response?.message || 'Could not save the department.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(deleting._id);
      setDeleting(null);
    } catch {
      // Keep the dialog open so the conflict message remains visible.
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Department',
      render: (department) => (
        <div>
          <Link to={`/departments/${department._id}`} className="font-medium text-primary-600 hover:underline">
            {department.name}
          </Link>
          <p className="text-xs text-gray-400">{department.code}</p>
        </div>
      ),
    },
    { key: 'manager', header: 'Manager', render: (d) => d.managerId ? `${d.managerId.firstName} ${d.managerId.lastName}` : '—' },
    { key: 'employeeCount', header: 'Employees' },
    { key: 'internCount', header: 'Interns' },
    { key: 'status', header: 'Status', render: (d) => <Badge active={d.isActive} /> },
  ];

  if (canManage) {
    columns.push({
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (department) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => openEdit(department)} className="text-primary-600 hover:underline text-sm">Edit</button>
          <button onClick={() => setDeleting(department)} className="text-red-600 hover:underline text-sm">Delete</button>
        </div>
      ),
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">Departments</h1>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Department Directory</h2>
            <p className="text-sm text-gray-500">Browse teams, managers, and member counts.</p>
          </div>
          {canManage && <button onClick={openCreate} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">+ Add department</button>}
        </div>
        <DataTable
          columns={columns}
          rows={departments}
          loading={isLoading}
          error={isError ? error : null}
          onRetry={refetch}
          emptyTitle="No departments found"
          emptyMessage={canManage ? 'Create the first department to get started.' : 'No active departments are available.'}
        />
      </main>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit department' : 'Add department'} size="lg">
        {formError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{formError}</p>}
        <DepartmentForm
          initial={editing}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          submitting={createMut.isPending || updateMut.isPending}
          serverErrors={serverErrors}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => { if (!deleteMut.isPending) setDeleting(null); }}
        onConfirm={handleDelete}
        title="Delete department"
        message={deleting ? `Delete ${deleting.name}? Departments with employees or interns cannot be deleted.` : ''}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
      />
      {deleteMut.isError && deleting && (
        <p className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2 shadow">
          {deleteMut.error?.response?.data?.message || 'Could not delete the department.'}
        </p>
      )}
    </div>
  );
}

function Badge({ active }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{active ? 'Active' : 'Inactive'}</span>;
}
