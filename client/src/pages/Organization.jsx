import { Link } from 'react-router-dom';
import OrganizationChart from '../components/organization/OrganizationChart.jsx';
import { useOrganizationTree } from '../hooks/useOrganization.js';
import { useDepartments } from '../hooks/useDepartments.js';
import { useState } from 'react';

export default function Organization() {
  const [departmentId, setDepartmentId] = useState('');
  const { data: departments = [] } = useDepartments();
  const { data: tree, isLoading, isError, error } = useOrganizationTree(
    departmentId ? { department: departmentId } : {}
  );

  return (
    <Shell>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-gray-500"><Link to="/dashboard" className="hover:underline">Dashboard</Link> / Organization</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">Organization Chart</h1>
          <p className="text-gray-500 mt-1">Explore the company reporting structure and select a person to view their profile.</p>
        </div>
        <Link to="/employees" className="text-sm text-primary-600 hover:underline">Open employee directory →</Link>
      </div>

      {isLoading && <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">Loading organization chart...</div>}
      {isError && <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">{error?.response?.data?.message || 'Unable to load the organization chart.'}</div>}
      {tree && !isError && <OrganizationChart tree={tree} departments={departments} departmentId={departmentId} onDepartmentChange={setDepartmentId} />}
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="min-h-screen bg-gray-50"><header className="bg-white border-b border-gray-200"><div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between"><Link to="/dashboard" className="text-xl font-bold text-primary-600">FTI Welcome Hub</Link><Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link></div></header><main className="max-w-7xl mx-auto px-4 py-6">{children}</main></div>;
}
