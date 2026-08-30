import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { useInternBatches, useCreateInternBatch, useUpdateInternBatch, useDeleteInternBatch } from '../hooks/useInternBatches.js';
import DataTable from '../components/common/DataTable.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import BatchForm from '../components/interns/BatchForm.jsx';
import StatusBadge from '../components/interns/StatusBadge.jsx';

export default function InternBatches() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('interns:manage');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, isFetching, refetch } = useInternBatches({ page, limit: 10 });
  const createMut = useCreateInternBatch(); const updateMut = useUpdateInternBatch(); const deleteMut = useDeleteInternBatch();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState(null); const [deleting, setDeleting] = useState(null); const [serverErrors, setServerErrors] = useState({}); const [formError, setFormError] = useState('');
  const openCreate = () => { setEditing(null); setServerErrors({}); setFormError(''); setFormOpen(true); };
  const openEdit = (batch) => { setEditing(batch); setServerErrors({}); setFormError(''); setFormOpen(true); };
  const submit = async (payload, file) => { setServerErrors({}); setFormError(''); setUploadProgress(0); const onUploadProgress = (event) => { if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100)); }; try { if (editing) await updateMut.mutateAsync({ id: editing._id, payload, file, onUploadProgress }); else await createMut.mutateAsync({ payload, file, onUploadProgress }); setFormOpen(false); setUploadProgress(0); } catch (err) { const response = err.response?.data; if (response?.errors) setServerErrors(response.errors); setFormError(response?.message || 'Could not save the batch.'); } };
  const remove = async () => { try { await deleteMut.mutateAsync(deleting._id); setDeleting(null); } catch {} };
  const columns = [
    { key: 'batch', header: 'Batch', render: (batch) => <div><Link to={`/intern-batches/${batch._id}`} className="font-medium text-primary-600 hover:underline">{batch.code}</Link><p className="text-xs text-gray-400">{batch.title}</p></div> },
    { key: 'timeline', header: 'Timeline', render: (batch) => `${new Date(batch.startDate).toLocaleDateString()} – ${new Date(batch.endDate).toLocaleDateString()}` },
    { key: 'internCount', header: 'Interns' },
    { key: 'status', header: 'Status', render: (batch) => <StatusBadge status={batch.status} /> },
  ];
  if (canManage) columns.push({ key: 'actions', header: '', className: 'text-right', render: (batch) => <div className="flex justify-end gap-2"><button onClick={() => openEdit(batch)} className="text-primary-600 hover:underline text-sm">Edit</button><button onClick={() => setDeleting(batch)} className="text-red-600 hover:underline text-sm">Delete</button></div> });
  return <div className="min-h-screen bg-gray-50"><header className="bg-white border-b border-gray-200"><div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between"><h1 className="text-xl font-bold text-primary-600">Intern Batches</h1><div className="flex gap-4"><Link to="/interns" className="text-sm text-gray-500 hover:text-gray-700">Interns</Link><Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link></div></div></header><main className="max-w-5xl mx-auto px-4 py-6"><div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold text-gray-800">Batch timeline</h2><p className="text-sm text-gray-500">Group interns by cohort and schedule.</p></div>{canManage && <button onClick={openCreate} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium">+ Add batch</button>}</div><DataTable columns={columns} rows={data?.data} loading={isLoading} error={isError ? error : null} onRetry={refetch} emptyTitle="No batches found" emptyMessage="Create the first intern batch to get started." />{data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} disabled={isFetching} />}</main><Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit intern batch' : 'Add intern batch'} size="lg">{formError && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{formError}</p>}<BatchForm initial={editing} onSubmit={submit} onCancel={() => setFormOpen(false)} submitting={createMut.isPending || updateMut.isPending} uploadProgress={uploadProgress} serverErrors={serverErrors} /></Modal><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title="Delete intern batch" message={deleting ? `Delete ${deleting.code}? Batches with assigned interns cannot be deleted.` : ''} confirmLabel="Delete" loading={deleteMut.isPending} />{deleteMut.isError && deleting && <p className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-2 shadow">{deleteMut.error?.response?.data?.message || 'Could not delete the batch.'}</p>}</div>;
}
