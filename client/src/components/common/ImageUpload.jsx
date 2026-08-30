import { useEffect, useRef, useState } from 'react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 5000;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const inspectImage = (file) => new Promise((resolve) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    const valid = image.width > 0 && image.height > 0 && image.width <= MAX_DIMENSION && image.height <= MAX_DIMENSION;
    URL.revokeObjectURL(url);
    resolve(valid ? '' : `Image dimensions must be between 1 and ${MAX_DIMENSION}px`);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    resolve('The selected file is not a valid image');
  };
  image.src = url;
});

/** Existing URL/avatar fallback that also recovers from broken remote images. */
export function ImageWithFallback({ src, alt = '', className = '', fallback = 'IMG' }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);
  if (failed) return <div className={`${className} bg-primary-100 text-primary-700 flex items-center justify-center font-semibold`} aria-label={alt}>{fallback}</div>;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

/** Reusable image picker with local validation, preview, replacement, and progress. */
export default function ImageUpload({ value = '', onChange, label = 'Image', progress = null, error = '', disabled = false, placeholder = 'IMG' }) {
  const [preview, setPreview] = useState('');
  const [clientError, setClientError] = useState('');
  const objectUrl = useRef('');

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  const clearPreview = () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = '';
    setPreview('');
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      clearPreview(); setClientError('Only JPG, PNG, and WebP images are allowed'); onChange(null); return;
    }
    if (file.size > MAX_FILE_SIZE) {
      clearPreview(); setClientError('Image must not exceed 5MB'); onChange(null); return;
    }
    const imageError = await inspectImage(file);
    if (imageError) {
      clearPreview(); setClientError(imageError); onChange(null); return;
    }
    clearPreview();
    objectUrl.current = URL.createObjectURL(file);
    setPreview(objectUrl.current);
    setClientError('');
    onChange(file);
  };

  const remove = () => {
    clearPreview(); setClientError(''); onChange(null);
  };
  const message = clientError || error;
  const shownImage = preview || value;

  return <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="flex items-center gap-4">
      <ImageWithFallback src={shownImage} alt={label} className="w-20 h-20 rounded-lg object-cover" fallback={placeholder} />
      <div className="space-y-2">
        <input type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFile} disabled={disabled} className="block text-sm text-gray-600" />
        <div className="flex gap-2 text-xs">
          {(preview || value) && <button type="button" onClick={remove} disabled={disabled} className="text-red-600 hover:underline">Remove image</button>}
          <span className="text-gray-400">JPG, PNG, or WebP · max 5MB</span>
        </div>
      </div>
    </div>
    {progress !== null && progress !== undefined && progress > 0 && progress < 100 && <div className="mt-2"><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="text-xs text-gray-500 mt-1">Uploading {progress}%</p></div>}
    {message && <p className="text-xs text-red-600 mt-1">{message}</p>}
  </div>;
}
