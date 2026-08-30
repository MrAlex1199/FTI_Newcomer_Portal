import { useState } from 'react';
import useAuth from '../../hooks/useAuth.js';
import { useSubmitFeedback } from '../../hooks/useFeedback.js';
import Modal from './Modal.jsx';
import { useToast } from '../../hooks/ToastContext.jsx';

const CATEGORIES = [
  ['missing_information', 'Missing information'],
  ['unclear_guide', 'Unclear guide'],
  ['first_day_issue', 'First-day issue'],
  ['suggestion', 'Suggestion'],
  ['bug', 'Bug or technical issue'],
  ['other', 'Other'],
];

export default function FeedbackWidget() {
  const { hasPermission } = useAuth();
  const submit = useSubmitFeedback();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(null);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState('');
  if (!hasPermission('feedback:submit')) return null;

  const reset = () => { setOpen(false); setMessage(''); setRating(null); setError(''); };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const result = await submit.mutateAsync({ category, message, ...(rating && { rating }) });
      setTicket(result.data.feedback.ticketNumber);
      reset();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to submit feedback.';
      setError(message);
      showToast(message, 'error');
    }
  };

  return <><button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" aria-label="Send feedback">Feedback</button><Modal open={open} onClose={reset} title="Share feedback" size="md"><form onSubmit={handleSubmit} className="space-y-4"><p className="text-sm text-gray-500">Help us improve the newcomer experience. Your message will be reviewed by the portal team.</p>{error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<label className="block text-sm font-medium text-gray-700">Category<select required value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-sm font-medium text-gray-700">Message<textarea required minLength="5" maxLength="2000" rows="5" value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Tell us what happened or what we can improve..." /><span className="mt-1 block text-right text-xs text-gray-400">{message.length}/2000</span></label><div><p className="text-sm font-medium text-gray-700">Optional rating</p><div className="mt-1 flex gap-1" role="radiogroup" aria-label="Optional rating">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(rating === value ? null : value)} className={`text-2xl ${rating && value <= rating ? 'text-amber-400' : 'text-gray-300'} hover:text-amber-400`} aria-label={`${value} star${value === 1 ? '' : 's'}`} aria-pressed={rating === value}>★</button>)}</div></div><div className="flex justify-end gap-3"><button type="button" onClick={reset} className="rounded-md border border-gray-300 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={submit.isPending} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submit.isPending ? 'Sending...' : 'Send feedback'}</button></div></form></Modal><Modal open={!!ticket} onClose={() => setTicket('')} title="Feedback received" size="sm"><div className="text-center"><p className="text-sm text-gray-600">Thank you. Your feedback has been submitted.</p><p className="mt-4 text-xs uppercase tracking-wide text-gray-500">Ticket number</p><p className="mt-1 font-mono text-2xl font-bold text-primary-600 select-all">{ticket}</p><button type="button" onClick={() => setTicket('')} className="mt-5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white">Close</button></div></Modal></>;
}
