import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import { useAddArticleImage, useRemoveArticleImage } from '../../hooks/useKnowledge.js';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import Modal from '../common/Modal.jsx';

const MAX_IMAGES = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ImageGallery({ articleId, images = [], canManage = false }) {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [fileError, setFileError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const addImageMutation = useAddArticleImage();
  const removeImageMutation = useRemoveArticleImage();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(t('imageTypeError') || 'Please select a JPG, PNG, or WebP image');
      setUploadFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(t('imageSizeError') || 'Image must not exceed 5MB');
      setUploadFile(null);
      return;
    }

    setFileError('');
    setUploadFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      await addImageMutation.mutateAsync({
        articleId,
        file: uploadFile,
        caption: caption.trim(),
      });
      setIsAddOpen(false);
      setUploadFile(null);
      setCaption('');
      setFileError('');
    } catch (err) {
      setFileError(err?.response?.data?.message || 'Failed to upload image');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeImageMutation.mutateAsync({
        articleId,
        imageId: deleteTarget._id,
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to remove image', err);
    }
  };

  const imageList = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      {/* Gallery Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {t('infographicImages')}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            {imageList.length}/{MAX_IMAGES}
          </span>
        </div>

        {canManage && imageList.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => {
              setUploadFile(null);
              setCaption('');
              setFileError('');
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 border border-primary-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {t('addInfographic')}
          </button>
        )}
      </div>

      {/* Gallery Content */}
      {imageList.length === 0 ? (
        canManage ? (
          <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <p className="text-sm text-gray-500 mb-2">
              {t('dragOrClickToUpload')}
            </p>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 underline"
            >
              {t('addInfographic')}
            </button>
          </div>
        ) : null
      ) : (
        <div className={`grid gap-4 ${imageList.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {imageList.map((img, idx) => (
            <div
              key={img._id || idx}
              className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div
                className="relative aspect-video sm:aspect-[16/10] bg-gray-100 overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={img.url}
                  alt={img.caption || `Infographic ${idx + 1}`}
                  className="w-full h-full object-contain p-1 group-hover:scale-[1.02] transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="px-3 py-1.5 text-xs font-medium text-white bg-black/60 rounded-full backdrop-blur-sm shadow flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    {t('viewFullImage')}
                  </span>
                </div>
              </div>

              {/* Caption & Delete action */}
              <div className="p-3 flex items-center justify-between gap-2 bg-white">
                <p className="text-xs text-gray-700 font-medium truncate" title={img.caption}>
                  {img.caption || `Diagram ${idx + 1}`}
                </p>
                {canManage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(img);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                    title={t('delete')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Full view modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
              <span className="text-sm font-semibold text-gray-800 truncate">
                {selectedImage.caption || t('infographicImages')}
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-neutral-900">
              <img
                src={selectedImage.url}
                alt={selectedImage.caption || 'Full diagram'}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
            {selectedImage.caption && (
              <div className="px-5 py-3 bg-white border-t border-gray-200 text-xs text-gray-600">
                {selectedImage.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Image Modal */}
      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t('addInfographic')}
        size="md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              {t('image')} <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              JPG, PNG, WebP (max 5MB, max 5000px)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              {t('imageCaption')}
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              placeholder="e.g. ขั้นตอนการขอสิทธิ์เข้าใช้งานระบบ"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {fileError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
              {fileError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              disabled={addImageMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!uploadFile || addImageMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {addImageMutation.isPending ? t('uploading') : t('uploadInfographic')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('delete')}
        message="Are you sure you want to delete this diagram image?"
        loading={removeImageMutation.isPending}
        danger
      />
    </div>
  );
}
