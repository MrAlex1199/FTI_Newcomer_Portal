import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import { Announcement, User } from '../models/index.js';

dotenv.config();

const demoAnnouncements = [
  {
    title: '[Demo] Welcome to FTI Welcome Hub',
    summary: 'A friendly starting point for newcomers: find your people, guides, policies, and support contacts.',
    content: 'Welcome to the fictional FTI Welcome Hub demo content. Use the dashboard cards to explore departments, policies, FAQs, getting-started guides, and IT help.',
    coverImage: '/mock-posters/welcome.svg',
    category: 'welcome',
    priority: 10,
    isPinned: true,
  },
  {
    title: '[Demo] IT setup day for new starters',
    summary: 'Learn how to request your account, device, Wi-Fi access, and the support you need during your first week.',
    content: 'This fictional announcement demonstrates a practical onboarding update. New starters should contact their mentor or the IT Help Center for account and device support.',
    coverImage: '/mock-posters/it-setup.svg',
    category: 'training',
    priority: 8,
  },
  {
    title: '[Demo] Meet your department and mentor',
    summary: 'Explore the organization chart and department directory before your first team introduction.',
    content: 'This fictional announcement encourages newcomers to learn about their department, reporting structure, mentor, and nearby office contacts.',
    coverImage: '/mock-posters/departments.svg',
    category: 'event',
    priority: 7,
  },
  {
    title: '[Demo] Learn and grow at FTI',
    summary: 'Browse the getting-started guides, policies, FAQ, and knowledge articles at your own pace.',
    content: 'This fictional announcement highlights the portal learning resources that help newcomers settle in confidently.',
    coverImage: '/mock-posters/learning.svg',
    category: 'news',
    priority: 6,
  },
  {
    title: '[Demo] Need help? Start here',
    summary: 'Find the right contact for IT, HR, facilities, and everyday newcomer questions.',
    content: 'This fictional announcement demonstrates a support message. Use the portal search or the relevant help page to find the next step.',
    coverImage: '/mock-posters/support.svg',
    category: 'urgent',
    priority: 5,
  },
].map((item, index) => ({
  ...item,
  targetRoles: [],
  publishAt: new Date(Date.now() - (index + 1) * 60 * 60 * 1000),
  expireAt: null,
  status: 'published',
}));

const run = async () => {
  await connectDB();
  const author = await User.findOne({ role: { $in: ['super_admin', 'admin'] } }).sort({ createdAt: 1 });
  if (!author) throw new Error('No admin account exists. Create an admin account before adding demo announcements.');

  let created = 0;
  let updated = 0;
  for (const item of demoAnnouncements) {
    const existing = await Announcement.findOne({ title: item.title });
    await Announcement.findOneAndUpdate(
      { title: item.title },
      { ...item, authorId: existing?.authorId || author._id },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
    if (existing) updated += 1;
    else created += 1;
  }

  console.log(`Mock announcements ready: ${created} created, ${updated} updated.`);
  console.log('Demo records are labeled [Demo] and use local SVG posters in client/public/mock-posters.');
};

try {
  await run();
} finally {
  await mongoose.disconnect();
}
