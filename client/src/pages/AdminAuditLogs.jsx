import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import Pagination from '../components/common/Pagination.jsx';
import useLanguage from '../hooks/useLanguage.js';
import { useAuditLogs } from '../hooks/useAuditLogs.js';

const ACTIONS = ['create', 'update', 'delete', 'login', 'logout', 'publish', 'unpublish', 'activate', 'deactivate', 'role_change', 'password_reset', 'bulk_deactivate'];

export default function AdminAuditLogs() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({ action: '', entity: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const query = { ...filters, page, limit: 20 };
  const { data, isLoading, isError, error, isFetching, refetch } = useAuditLogs(query);
  const update = (key) => (event) => { setFilters((current) => ({ ...current, [key]: event.target.value })); setPage(1); };
  const logs = data?.data || [];

  return <AppShell rightContent={<Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">{t('backDashboard')}</Link>}><main>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6"><div><h1 className="text-2xl font-bold text-gray-800">Audit Log</h1><p className="text-sm text-gray-500 mt-1">Review sensitive activity and changes made in the portal.</p></div><Link to="/admin/users" className="text-sm text-primary-600 hover:underline">User management →</Link></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-gray-200 bg-white p-4 mb-5"><select value={filters.action} onChange={update('action')} className="px-3 py-2 border border-gray-300 rounded-md"><option value="">All actions</option>{ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}</select><input value={filters.entity} onChange={update('entity')} placeholder="Entity (e.g. User)" className="px-3 py-2 border border-gray-300 rounded-md" /><label className="text-xs text-gray-500">From<input type="date" value={filters.from} onChange={update('from')} className="block w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700" /></label><label className="text-xs text-gray-500">To<input type="date" value={filters.to} onChange={update('to')} className="block w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700" /></label></div>
    {isError ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{error.response?.data?.message || 'Unable to load audit logs.'}</p><button onClick={refetch} className="mt-2 underline">Retry</button></div> : <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Details</th></tr></thead><tbody className="divide-y divide-gray-100">{isLoading ? <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">Loading audit logs...</td></tr> : logs.length === 0 ? <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No audit activity matches these filters.</td></tr> : logs.map((log) => <AuditRow key={log._id} log={log} expanded={expanded === log._id} onToggle={() => setExpanded(expanded === log._id ? null : log._id)} />)}</tbody></table></div>}
    {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} disabled={isFetching} />}
  </main></AppShell>;
}

function AuditRow({ log, expanded, onToggle }) {
  return <><tr className="hover:bg-gray-50"><td className="px-4 py-3 whitespace-nowrap text-gray-500">{new Date(log.createdAt).toLocaleString()}</td><td className="px-4 py-3"><p className="font-medium text-gray-800">{log.actor?.username || 'System'}</p><p className="text-xs text-gray-400">{log.actor?.role || ''}</p></td><td className="px-4 py-3"><span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">{log.action}</span></td><td className="px-4 py-3 text-gray-700">{log.entity}<span className="block max-w-[12rem] truncate text-xs text-gray-400">{log.entityId || '—'}</span></td><td className="px-4 py-3"><button onClick={onToggle} className="text-primary-600 hover:underline">{expanded ? 'Hide' : 'View'} changes</button></td></tr>{expanded && <tr className="bg-gray-50"><td colSpan="5" className="px-4 py-4"><div className="grid gap-4 md:grid-cols-2"><Snapshot title="Before" value={log.before} /><Snapshot title="After" value={log.after} /></div></td></tr>}</>;
}

function Snapshot({ title, value }) { return <div><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3><pre className="mt-2 max-h-64 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">{value ? JSON.stringify(value, null, 2) : '—'}</pre></div>; }
