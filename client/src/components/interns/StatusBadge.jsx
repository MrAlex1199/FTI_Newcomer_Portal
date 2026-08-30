export default function StatusBadge({ status }) {
  const tones = { upcoming: 'bg-blue-100 text-blue-700', active: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${tones[status] || 'bg-gray-100 text-gray-600'}`}>{status || 'unknown'}</span>;
}
