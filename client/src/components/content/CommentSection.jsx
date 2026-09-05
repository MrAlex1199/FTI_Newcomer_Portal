import { useState } from 'react';
import useLanguage from '../../hooks/useLanguage.js';
import { useArticleComments, useCreateComment, useDeleteComment } from '../../hooks/useKnowledge.js';
import ConfirmDialog from '../common/ConfirmDialog.jsx';

const MAX_COMMENT_LENGTH = 2000;

const roleBadgeColor = {
  super_admin: 'bg-red-50 text-red-700 border-red-200',
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  editor: 'bg-blue-50 text-blue-700 border-blue-200',
  staff: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  intern: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function CommentSection({ articleId, currentUser, canManage = false }) {
  const { t, language } = useLanguage();
  const [commentText, setCommentText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useArticleComments(articleId);
  const createCommentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();

  const comments = data?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setErrorMsg(`Comment must not exceed ${MAX_COMMENT_LENGTH} characters`);
      return;
    }

    try {
      setErrorMsg('');
      await createCommentMutation.mutateAsync({
        articleId,
        body: trimmed,
      });
      setCommentText('');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to post comment');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCommentMutation.mutateAsync({
        articleId,
        commentId: deleteTarget._id,
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="text-base font-semibold text-gray-900">
            {t('comments')}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-semibold border border-primary-200">
            {comments.length}
          </span>
        </div>
      </div>

      {/* New Comment Input Box */}
      <form onSubmit={handleSubmit} className="mb-6 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center text-xs uppercase shadow-sm">
            {currentUser?.username?.[0] || 'U'}
          </div>
          <span className="text-xs font-medium text-gray-700">
            {currentUser?.username || 'User'}
          </span>
        </div>

        <textarea
          rows={3}
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          placeholder={t('writeComment')}
          maxLength={MAX_COMMENT_LENGTH}
          className="w-full px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 transition-all resize-none"
        />

        {errorMsg && (
          <p className="text-xs text-red-600 mt-1 mb-2 bg-red-50 p-2 rounded-lg">
            {errorMsg}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/60">
          <span className="text-[11px] text-gray-400">
            {commentText.length} / {MAX_COMMENT_LENGTH}
          </span>
          <button
            type="submit"
            disabled={!commentText.trim() || createCommentMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {createCommentMutation.isPending ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t('postingComment')}
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {t('postComment')}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-gray-400">
          {t('loading')}
        </div>
      ) : isError ? (
        <div className="py-4 text-center text-xs text-red-500">
          {t('unableLoad')}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-gray-50/50 border border-dashed border-gray-200">
          <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-xs text-gray-500">
            {t('noComments')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const author = comment.authorId || {};
            const authorIdStr = author._id || author.id || author;
            const currentUserIdStr = currentUser?.id || currentUser?._id;
            const canDelete = canManage || (authorIdStr && currentUserIdStr && String(authorIdStr) === String(currentUserIdStr));

            return (
              <div
                key={comment._id}
                className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all"
              >
                {/* Author row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-semibold flex items-center justify-center text-[10px] uppercase">
                      {author.username?.[0] || 'U'}
                    </div>
                    <span className="text-xs font-semibold text-gray-900">
                      {author.username || 'Anonymous'}
                    </span>
                    {author.role && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          roleBadgeColor[author.role] || 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {author.role}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      • {formatDate(comment.createdAt)}
                    </span>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(comment)}
                      className="p-1 text-gray-300 hover:text-red-600 rounded transition-colors"
                      title={t('deleteComment')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Comment body */}
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap pl-8">
                  {comment.body}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Comment Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('deleteComment')}
        message={t('deleteCommentConfirm')}
        loading={deleteCommentMutation.isPending}
        danger
      />
    </div>
  );
}
