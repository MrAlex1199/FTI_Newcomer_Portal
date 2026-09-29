import { describe, it, expect } from 'vitest';
import { getCleanTopicName } from '../knowledgeUtils.js';

describe('getCleanTopicName', () => {
  it('cleans duplicate leading emojis', () => {
    expect(getCleanTopicName('💻 Software', '💻')).toBe('Software');
    expect(getCleanTopicName('🔒 Security')).toBe('Security');
    expect(getCleanTopicName('General Topic')).toBe('General Topic');
  });
});

describe('Knowledge Search Filter Logic', () => {
  const articles = [
    { _id: '1', title: 'VPN Connection Guide', summary: 'How to connect to company VPN', tags: ['network', 'vpn'] },
    { _id: '2', title: 'Email Setup', summary: 'Configure Outlook on mobile', tags: ['email'] },
    { _id: '3', title: 'Printer Troubleshooting', summary: 'Fix paper jam on 3rd floor', tags: ['hardware'] },
  ];

  const topics = [
    { _id: 't1', name: '🌐 Network & Connectivity', slug: 'network' },
    { _id: 't2', name: '📧 Email & Communications', slug: 'email' },
    { _id: 't3', name: '🖨️ Hardware & Devices', slug: 'hardware' },
  ];

  it('filters articles by title, summary, or tag', () => {
    const q = 'vpn';
    const matches = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        (Array.isArray(a.tags) && a.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]._id).toBe('1');
  });

  it('filters topics by name or slug', () => {
    const q = 'network';
    const matches = topics.filter(
      (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]._id).toBe('t1');
  });
});
