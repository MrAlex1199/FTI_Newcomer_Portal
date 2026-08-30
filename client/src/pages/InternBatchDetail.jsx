import { Link, useParams } from 'react-router-dom';
import { useInternBatch } from '../hooks/useInternBatches.js';
import DataTable from '../components/common/DataTable.jsx';
import StatusBadge from '../components/interns/StatusBadge.jsx';
import { ImageWithFallback } from '../components/common/ImageUpload.jsx';

export default function InternBatchDetail() {
  const { id } = useParams();
  const { data: batch, isLoading, isError, error } = useInternBatch(id);
  if (isLoading) return <Shell><p className="py-12 text-center text-gray-500">Loading batch...</p></Shell>;
  if (isError) return <Shell><p className="py-12 text-center text-red-600">{error?.response?.data?.message || 'Unable to load batch.'}</p></Shell>;
  if (!batch) return null;
  const columns = [
    { key: 'name', header: 'Intern', render: (intern) => <Link to={`/interns/${intern._id}`} className="text-primary-600 hover:underline">{intern.firstName} {intern.lastName}</Link> },
    { key: 'university', header: 'University' },
    { key: 'department', header: 'Department', render: (intern) => intern.departmentId?.name || '—' },
    { key: 'mentor', header: 'Mentor', render: (intern) => intern.mentorId ? `${intern.mentorId.firstName} ${intern.mentorId.lastName}` : '—' },
    { key: 'status', header: 'Status', render: (intern) => <StatusBadge status={intern.status} /> },
  ];
  return <Shell><p className="text-sm text-gray-500"><Link to="/intern-batches" className="hover:underline">Intern Batches</Link> / Detail</p><div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-2 mb-6"><div><h1 className="text-2xl font-bold text-gray-800">{batch.code} <span className="text-base font-normal text-gray-400">{batch.title}</span></h1><p className="text-gray-500 mt-1">{batch.description || 'No description provided.'}</p></div><Link to={`/interns?batch=${batch._id}`} className="text-sm bg-primary-600 text-white px-4 py-2 rounded-md text-center">View filtered interns</Link></div><ImageWithFallback src={batch.groupPhoto} alt="Batch group" className="w-full max-h-56 object-cover rounded-lg" fallback="Group photo placeholder" /><div className="grid gap-4 sm:grid-cols-4 mb-6"><Info label="Status" value={<StatusBadge status={batch.status} />} /><Info label="Interns" value={batch.internCount} /><Info label="Start" value={new Date(batch.startDate).toLocaleDateString()} /><Info label="End" value={new Date(batch.endDate).toLocaleDateString()} /></div><section className="bg-white border border-gray-200 rounded-lg p-4 mb-6"><h2 className="font-semibold text-gray-800 mb-3">Batch timeline</h2><div className="h-4 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full ${batch.status === 'completed' ? 'bg-gray-400 w-full' : batch.status === 'upcoming' ? 'bg-blue-400 w-1/4' : 'bg-green-500 w-2/3'}`} /></div><div className="flex justify-between text-xs text-gray-500 mt-2"><span>{new Date(batch.startDate).toLocaleDateString()}</span><span>{batch.status}</span><span>{new Date(batch.endDate).toLocaleDateString()}</span></div></section><h2 className="font-semibold text-gray-800 mb-3">Batch members</h2><DataTable columns={columns} rows={batch.interns} emptyTitle="No interns assigned" emptyMessage="Add interns to this batch to see the cohort here." /></Shell>;
}
function Shell({ children }) { return <div className="min-h-screen bg-gray-50"><header className="bg-white border-b border-gray-200"><div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between"><h1 className="text-xl font-bold text-primary-600">FTI Welcome Hub</h1><Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link></div></header><main className="max-w-5xl mx-auto px-4 py-6">{children}</main></div>; }
function Info({ label, value }) { return <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs uppercase tracking-wide text-gray-400">{label}</p><p className="text-gray-700 mt-1">{value}</p></div>; }
