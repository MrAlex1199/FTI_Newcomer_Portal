import { Link, useParams } from 'react-router-dom';
import { useDepartment } from '../hooks/useDepartments.js';
import DataTable from '../components/common/DataTable.jsx';

export default function DepartmentDetail() {
  const { id } = useParams();
  const { data: department, isLoading, isError, error, refetch } = useDepartment(id);

  if (isLoading) return <PageShell><div className="py-12 text-center text-gray-500">Loading department...</div></PageShell>;
  if (isError) return <PageShell><div className="py-12 text-center text-red-600">{error?.response?.data?.message || 'Unable to load department.'}</div></PageShell>;
  if (!department) return null;

  const employeeColumns = [
    { key: 'employeeCode', header: 'Code' },
    { key: 'name', header: 'Name', render: (employee) => `${employee.firstName} ${employee.lastName}` },
    { key: 'position', header: 'Position' },
    { key: 'status', header: 'Status', render: (employee) => employee.isActive ? 'Active' : 'Inactive' },
  ];
  const internColumns = [
    { key: 'name', header: 'Name', render: (intern) => <Link to={`/interns/${intern._id}`} className="text-primary-600 hover:underline">{intern.firstName} {intern.lastName}</Link> },
    { key: 'university', header: 'University' },
    { key: 'major', header: 'Major' },
    { key: 'status', header: 'Status', render: (intern) => intern.status || '—' },
  ];

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-gray-500"><Link to="/departments" className="hover:underline">Departments</Link> / Detail</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{department.name} <span className="text-base font-normal text-gray-400">({department.code})</span></h1>
          <p className="text-gray-500 mt-1">{department.description || 'No description provided.'}</p>
        </div>
        <Link to={`/employees?department=${department._id}`} className="text-sm bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-center">View filtered employees</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Employees" value={department.employeeCount} />
        <Stat label="Interns" value={department.internCount} />
        <Stat label="Manager" value={department.managerId ? `${department.managerId.firstName} ${department.managerId.lastName}` : 'Not assigned'} />
      </div>

      <section className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Department information</h2>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <Info label="Location" value={department.location || '—'} />
          <Info label="Extension" value={department.extension || '—'} />
          <Info label="Responsibilities" value={(department.responsibilities || []).join(', ') || '—'} />
          <Info label="Contact topics" value={(department.contactTopics || []).join(', ') || '—'} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Employees</h2>
        <DataTable columns={employeeColumns} rows={department.employees} emptyTitle="No employees assigned" emptyMessage="Employees assigned to this department will appear here." />
      </section>
      <section>
        <h2 className="font-semibold text-gray-800 mb-3">Interns</h2>
        <DataTable columns={internColumns} rows={department.interns} emptyTitle="No interns assigned" emptyMessage="Interns assigned to this department will appear here." />
      </section>
    </PageShell>
  );
}

function PageShell({ children }) {
  return <div className="min-h-screen bg-gray-50"><header className="bg-white border-b border-gray-200"><div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between"><h1 className="text-xl font-bold text-primary-600">FTI Welcome Hub</h1><Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link></div></header><main className="max-w-5xl mx-auto px-4 py-6">{children}</main></div>;
}
function Stat({ label, value }) { return <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-semibold text-gray-800 mt-1">{value}</p></div>; }
function Info({ label, value }) { return <div><p className="text-xs uppercase tracking-wide text-gray-400">{label}</p><p className="text-gray-700 mt-1">{value}</p></div>; }
