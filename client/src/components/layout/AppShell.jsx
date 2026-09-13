import { Link } from 'react-router-dom';
import useLanguage from '../../hooks/useLanguage.js';
import SiteHeader from './SiteHeader.jsx';
import FeedbackWidget from '../common/FeedbackWidget.jsx';

export default function AppShell({ children, rightContent }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <SiteHeader rightContent={rightContent} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <FeedbackWidget />
    </div>
  );
}
