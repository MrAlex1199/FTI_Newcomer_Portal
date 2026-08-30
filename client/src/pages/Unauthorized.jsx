import { Link } from 'react-router-dom';

/** 403 page shown when an authenticated user hits a route their role can't access. */
export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-primary-600">403</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-800">Access denied</h1>
        <p className="mt-2 text-gray-500">
          Your account role does not have permission to view this page.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 bg-primary-600 text-white px-5 py-2 rounded-md font-medium hover:bg-primary-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
