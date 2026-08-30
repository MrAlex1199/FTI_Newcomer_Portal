import { useMemo, useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';

export default function OfficeMap({ company }) {
  const { t } = useLanguage();
  const points = company?.officePoints || [];
  const [selected, setSelected] = useState(points[0] || null);
  const mapUrl = useMemo(() => {
    if (!Number.isFinite(Number(company?.latitude)) || !Number.isFinite(Number(company?.longitude))) return '';
    const lat = Number(company.latitude); const lng = Number(company.longitude); const delta = 0.003;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [company]);
  const externalUrl = company?.latitude && company?.longitude ? `https://www.openstreetmap.org/?mlat=${company.latitude}&mlon=${company.longitude}#map=17/${company.latitude}/${company.longitude}` : '';
  return <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><div className="flex items-start justify-between gap-3 mb-4"><div><h2 className="text-lg font-semibold text-gray-800">{t('locationOfficePoints')}</h2><p className="text-sm text-gray-500">{t('mapDescription')}</p></div>{externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline shrink-0">{t('openMap')}</a>}</div>{mapUrl ? <iframe title={t('locationOfficePoints')} src={mapUrl} className="w-full h-64 rounded-lg border border-gray-200" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <div className="h-64 rounded-lg bg-slate-100 flex items-center justify-center text-sm text-gray-500">{t('mapNotConfigured')}</div>}<div className="grid gap-2 sm:grid-cols-3 mt-4">{points.map((point) => <button type="button" key={point.name} onClick={() => setSelected(point)} className={`text-left rounded-lg border p-3 transition ${selected?.name === point.name ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-200'}`}><p className="font-medium text-gray-800 text-sm">{point.name}</p><p className="text-xs text-gray-500 mt-1">{point.category || t('officePoint')}{point.extension ? ` · Ext. ${point.extension}` : ''}</p></button>)}</div>{selected && <div className="mt-4 rounded-lg bg-gray-50 p-4"><h3 className="font-semibold text-gray-800">{selected.name}</h3><p className="text-sm text-gray-600 mt-1">{selected.description || t('noDescription')}</p>{selected.contact && <p className="text-sm text-gray-600 mt-2"><span className="font-medium">{t('officeContact')}</span> {selected.contact}{selected.extension ? ` · Ext. ${selected.extension}` : ''}</p>}</div>}</section>;
}
