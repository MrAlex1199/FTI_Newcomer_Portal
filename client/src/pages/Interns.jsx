import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { useInterns, useCreateIntern, useUpdateIntern, useDeleteIntern } from '../hooks/useInterns.js';
import { useInternBatches } from '../hooks/useInternBatches.js';
import { useDepartments } from '../hooks/useDepartments.js';
import { useEmployees } from '../hooks/useEmployees.js';
import DataTable from '../components/common/DataTable.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import InternForm from '../components/interns/InternForm.jsx';
import StatusBadge from '../components/interns/StatusBadge.jsx';
import { ImageWithFallback } from '../components/common/ImageUpload.jsx';

const PAGE_SIZE = 10;

export default function Interns() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('interns:manage');
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(() => searchParams.get('department') || '');
  const [batch, setBatch] = useState(() => searchParams.get('batch') || '');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const params = { search, department, batch, status, page, limit: PAGE_SIZE };
  const { data, isLoading, isError, error, isFetching, refetch } = useInterns(params);
  const { data: departmentData = [] } = useDepartments();
  const { data: batchData } = useInternBatches({ page: 1, limit: 100 });
  const { data: employeeData } = useEmployees({ page: 1, limit: 100 });
  const batches = batchData?.data || [];
  const employees = employeeData?.data || [];
  const createMut = useCreateIntern();
  const updateMut = useUpdateIntern();
  const deleteMut = useDeleteIntern();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const reset = (setter) => (value) => { setter(value); setPage(1); };
  const openCreate = () => { setEditing(null); setServerErrors({}); setFormError(''); setFormOpen(true); };
  const openEdit = (intern) => { setEditing(intern); setServerErrors({}); setFormError(''); setFormOpen(true); };
  const submit = async (payload, file) => {
    setServerErrors({}); setFormError(''); setUploadProgress(0);
    const onUploadProgress = (event) => { if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100)); };
    try {
      if (editing) await updateMut.mutateAsync({ id: editing._id, payload, file, onUploadProgress });
      else await createMut.mutateAsync({ payload, file, onUploadProgress });
      setFormOpen(false); setUploadProgress(0);
    } catch (err) {
      const response = err.response?.data;
      if (response?.errors) setServerErrors(response.errors);
      setFormError(response?.message || 'Could not save the intern.');
    }
  };
  const remove = async () => {
    try { await deleteMut.mutateAsync(deleting._id); setDeleting(null); } catch { /* dialog remains open */ }
  };

  const columns = [
    { key: 'name', header: 'Intern', render: (intern) => <div className="flex items-center gap-2"><ImageWithFallback src={intern.profileImage} alt={`${intern.firstName} ${intern.lastName}`} className="w-8 h-8 rounded-full object-cover" fallback={`${intern.firstName?.[0] || ''}${intern.lastName?.[0] || ''}`} /><div><Link to={`/interns/${intern._id}`} className="font-medium text-primary-600 hover:underline">{intern.firstName} {intern.lastName}</Link>{intern.nickname && <p className="text-xs text-gray-400">({intern.nickname})</p>}</div></div> },
    { key: 'university', header: 'University', render: (intern) => <div>{intern.university}<p className="text-xs text-gray-400">{intern.major || '—'}</p></div> },
    { key: 'department', header: 'Department', render: (intern) => intern.departmentId?.name || '—' },
    { key: 'batch', header: 'Batch', render: (intern) => intern.batchId ? <Link to={`/intern-batches/${intern.batchId._id}`} className="text-primary-600 hover:underline">{intern.batchId.code}</Link> : '—' },
    { key: 'mentor', header: 'Mentor', render: (intern) => intern.mentorId ? `${intern.mentorId.firstName} ${intern.mentorId.lastName}` : '—' },
    { key: 'status', header: 'Status', render: (intern) => <StatusBadge status={intern.status} /> },
  ];
  if (canManage) columns.push({ key: 'actions', header: '', className: 'text-right', render: (intern) => <div className="flex justify-end gap-2"><button onClick={() => openEdit(intern)} className="text-primary-600 hover:underline text-sm">Edit</button><button onClick={() => setDeleting(intern)} className="text-red-600 hover:underline text-sm">Delete</button></div> });

  return <div className="min-h-screen bg-gray-50">
    <header className="bg-white border-b border-gray-200"><div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between"><h1 className="text-xl font-bold text-primary-600">Intern Directory</h1><div className="flex gap-4"><Link to="/intern-batches" className="text-sm text-gray-500 hover:text-gray-700">Batches</Link><Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link></div></div></header>
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4"><SearchBar value={search} onSearch={reset(setSearch)} placeholder="Search interns, university, major..." /><select value={department} onChange={(e) => reset(setDepartment)(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md"><option value="">All departments</option>{departmentData.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select><select value={batch} onChange={(e) => reset(setBatch)(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md"><option value="">All batches</option>{batches.map((b) => <option key={b._id} value={b._id}>{b.code}</option>)}</select><select value={status} onChange={(e) => reset(setStatus)(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md"><option value="">All statuses</option><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="completed">Completed</option></select><div className="lg:ml-auto">{canManage && <button onClick={openCreate} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium">+ Add intern</button>}</div></div>
      <DataTable columns={columns} rows={data?.data} loading={isLoading} error={isError ? error : null} onRetry={refetch} emptyTitle="No interns found" emptyMessage={search || department || batch || status ? 'Try adjusting your filters.' : 'Add the first intern to get started.'} />
      {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} disabled={isFetching} />}
    </main>
    <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit intern' : 'Add intern'} size="lg">{formError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{formError}</p>}<InternForm initial={editing} departments={departmentData} batches={batches} employees={employees} onSubmit={submit} onCancel={() => setFormOpen(false)} submitting={createMut.isPending || updateMut.isPending} uploadProgress={uploadProgress} serverErrors={serverErrors} /></Modal>
    <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title="Delete intern" message={deleting ? `Delete ${deleting.firstName} ${deleting.lastName}? This cannot be undone.` : ''} confirmLabel="Delete" loading={deleteMut.isPending} />
    {deleteMut.isError && deleting && <p className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2 shadow">{deleteMut.error?.response?.data?.message || 'Could not delete the intern.'}</p>}
  </div>;
}
