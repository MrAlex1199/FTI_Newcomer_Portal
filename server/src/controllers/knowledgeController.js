import { KnowledgeArticle, KnowledgeTopic, KnowledgeArticleVote, KnowledgeComment, AuditLog, ARTICLE_CATEGORIES, GETTING_STARTED_SECTIONS, IT_HELP_TOPICS, CONTENT_STATUSES } from '../models/index.js';
import { USER_ROLES } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { can } from '../config/permissions.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { uploadImage, deleteImage } from '../utils/imageUpload.js';

const SORT_FIELDS = ['sortOrder', 'quickLinkOrder', 'title', 'createdAt', 'updatedAt'];
const canManage = (req) => can(req.user.role, 'knowledge:manage');

const articlePayload = (body) => {
  const fields = ['title', 'slug', 'category', 'subcategory', 'topicId', 'summary', 'content', 'coverImage', 'tags', 'targetRoles', 'sortOrder', 'isQuickLink', 'quickLinkOrder', 'status'];
  const payload = Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
  if (payload.topicId === '' || payload.topicId === 'null' || payload.topicId === 'undefined') payload.topicId = null;
  if (typeof payload.isQuickLink === 'string') payload.isQuickLink = payload.isQuickLink === 'true';
  if (typeof payload.sortOrder === 'string') payload.sortOrder = Number(payload.sortOrder);
  if (typeof payload.quickLinkOrder === 'string') payload.quickLinkOrder = Number(payload.quickLinkOrder);
  if (typeof payload.targetRoles === 'string') {
    try {
      payload.targetRoles = JSON.parse(payload.targetRoles);
    } catch {
      payload.targetRoles = payload.targetRoles ? [payload.targetRoles] : [];
    }
  }
  if (typeof payload.tags === 'string') {
    try {
      payload.tags = JSON.parse(payload.tags);
    } catch {
      payload.tags = payload.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }
  return payload;
};

const visibleFilter = (req) => {
  if (canManage(req)) return req.query.status ? { status: req.query.status } : {};
  return {
    status: 'published',
    $or: [{ targetRoles: { $size: 0 } }, { targetRoles: req.user.role }],
  };
};

const publishedVisibleFilter = (req) => ({
  status: 'published',
  $or: [{ targetRoles: { $size: 0 } }, { targetRoles: req.user.role }],
});

const assertCategoryShape = (payload, existingCategory = null, existingSubcategory = '') => {
  const category = payload.category || existingCategory;
  const subcategory = Object.prototype.hasOwnProperty.call(payload, 'subcategory') ? payload.subcategory : existingSubcategory;
  if (category === 'getting_started' && !GETTING_STARTED_SECTIONS.includes(subcategory)) {
    throw ApiError.badRequest('Getting Started articles must use a valid section', { subcategory: 'Select a valid Getting Started section' });
  }
};

const normalizeQuickLinkPayload = (payload, category) => {
  if (category !== 'it_help') {
    payload.isQuickLink = false;
    payload.quickLinkOrder = 0;
  }
  return payload;
};

const relatedArticlesFor = async (article, req) => {
  const base = { ...publishedVisibleFilter(req), category: 'it_help', _id: { $ne: article._id } };
  const sameTopic = article.subcategory
    ? await KnowledgeArticle.find({ ...base, subcategory: article.subcategory }).sort({ sortOrder: 1, title: 1 }).limit(4)
    : [];
  const remaining = sameTopic.length < 4
    ? await KnowledgeArticle.find({
        ...base,
        ...(article.subcategory && { subcategory: { $ne: article.subcategory } }),
        ...(article.tags?.length && { tags: { $in: article.tags } }),
        _id: { $nin: [article._id, ...sameTopic.map((item) => item._id)] },
      }).sort({ sortOrder: 1, title: 1 }).limit(4 - sameTopic.length)
    : [];
  return [...sameTopic, ...remaining].map(serializeArticle);
};

const currentVoteFor = async (articleId, userId) => {
  const vote = await KnowledgeArticleVote.findOne({ articleId, userId }).select('vote');
  return vote?.vote || null;
};

const serializeArticle = (article) => article.toObject({ virtuals: true });
const auditArticle = ({ req, action, article, before = null }) => AuditLog.record({
  userId: req.user.id,
  action,
  entity: 'KnowledgeArticle',
  entityId: article?._id || null,
  before,
  after: article?.toObject() || null,
  ip: req.ip,
  userAgent: req.get('user-agent') || '',
});

export const listArticleCategories = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: { categories: ARTICLE_CATEGORIES, sections: GETTING_STARTED_SECTIONS, topics: IT_HELP_TOPICS, roles: USER_ROLES } });
});

export const listArticles = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parsePagination(req.query, {
    allowedSortFields: SORT_FIELDS,
    defaultSort: { category: 1, subcategory: 1, sortOrder: 1 },
  });
  const filter = visibleFilter(req);
  if (req.query.category) filter.category = req.query.category;
  if (req.query.topicId) filter.topicId = req.query.topicId;
  if (req.query.subcategory) filter.subcategory = req.query.subcategory;
  if (req.query.search) filter.$text = { $search: req.query.search };
  if (req.query.quickLinks === 'true') {
    filter.category = 'it_help';
    filter.isQuickLink = true;
  }

  const [articles, total] = await Promise.all([
    KnowledgeArticle.find(filter)
      .populate('authorId', 'username')
      .populate('topicId', 'name slug icon parentId')
      .sort(req.query.quickLinks === 'true' ? { quickLinkOrder: 1, sortOrder: 1, title: 1 } : sort)
      .skip(skip)
      .limit(limit),
    KnowledgeArticle.countDocuments(filter),
  ]);
  res.status(200).json(paginatedResponse({ data: articles.map(serializeArticle), page, limit, total }));
});

export const getArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findOne({ _id: req.params.id, ...visibleFilter(req) })
    .populate('authorId', 'username')
    .populate('topicId', 'name slug icon parentId');
  if (!article) throw ApiError.notFound('Knowledge article not found');
  if (!canManage(req)) await KnowledgeArticle.updateOne({ _id: article._id }, { $inc: { viewCount: 1 } });
  const data = serializeArticle(article);
  if (article.category === 'it_help') {
    [data.relatedArticles, data.currentUserVote] = await Promise.all([
      relatedArticlesFor(article, req),
      currentVoteFor(article._id, req.user.id),
    ]);
  } else {
    data.relatedArticles = [];
    data.currentUserVote = null;
  }
  res.status(200).json({ success: true, data: { article: data } });
});

export const createArticle = asyncHandler(async (req, res) => {
  const payload = articlePayload(req.body);
  if (!Object.prototype.hasOwnProperty.call(payload, 'status')) payload.status = 'draft';
  assertCategoryShape(payload);
  normalizeQuickLinkPayload(payload, payload.category);

  let uploaded;
  let article;
  try {
    if (req.file) {
      uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/knowledge', { maxWidth: 1200 });
    }
    article = await KnowledgeArticle.create({
      ...payload,
      ...(uploaded && { coverImage: uploaded.url, coverImagePublicId: uploaded.publicId }),
      authorId: req.user.id,
    });
    await article.populate('authorId', 'username');
    await auditArticle({ req, action: article.status === 'published' ? 'publish' : 'create', article });
    res.status(201).json({ success: true, data: { article: serializeArticle(article) } });
  } catch (error) {
    if (uploaded && !article) await deleteImage(uploaded.publicId);
    throw error;
  }
});

export const updateArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id).select('+coverImagePublicId');
  if (!article) throw ApiError.notFound('Knowledge article not found');
  const before = article.toObject();
  const previousCoverImagePublicId = article.coverImagePublicId;
  const payload = articlePayload(req.body);
  assertCategoryShape(payload, article.category, article.subcategory);
  normalizeQuickLinkPayload(payload, payload.category || article.category);

  let uploaded;
  let saved = false;
  try {
    if (req.file) {
      uploaded = await uploadImage(req.file.buffer, 'fti-welcome-hub/knowledge', { maxWidth: 1200 });
    }
    Object.assign(article, payload);
    if (uploaded) {
      article.coverImage = uploaded.url;
      article.coverImagePublicId = uploaded.publicId;
    }
    await article.save();
    saved = true;
    await article.populate('authorId', 'username');
    const action = before.status !== article.status && article.status === 'published'
      ? 'publish'
      : before.status === 'published' && article.status !== 'published'
        ? 'unpublish'
        : 'update';
    await auditArticle({ req, action, article, before });

    if ((uploaded || Object.prototype.hasOwnProperty.call(payload, 'coverImage')) && previousCoverImagePublicId) {
      await deleteImage(previousCoverImagePublicId);
    }
    res.status(200).json({ success: true, data: { article: serializeArticle(article) } });
  } catch (error) {
    if (uploaded && !saved) await deleteImage(uploaded.publicId);
    throw error;
  }
});

export const deleteArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id).select('+coverImagePublicId');
  if (!article) throw ApiError.notFound('Knowledge article not found');
  const before = article.toObject();

  if (article.coverImagePublicId) {
    await deleteImage(article.coverImagePublicId);
  }
  if (article.images && article.images.length > 0) {
    await Promise.allSettled(
      article.images.filter((img) => img.publicId).map((img) => deleteImage(img.publicId))
    );
  }

  await KnowledgeArticleVote.deleteMany({ articleId: article._id });
  await KnowledgeComment.deleteMany({ articleId: article._id });
  await article.deleteOne();
  await auditArticle({ req, action: 'delete', article, before });
  res.status(200).json({ success: true, message: 'Knowledge article deleted' });
});

export const listQuickLinks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, {
    allowedSortFields: ['quickLinkOrder', 'sortOrder', 'title'],
    defaultSort: { quickLinkOrder: 1, sortOrder: 1, title: 1 },
  });
  const filter = { ...publishedVisibleFilter(req), category: 'it_help', isQuickLink: true };
  const [articles, total] = await Promise.all([
    KnowledgeArticle.find(filter).populate('authorId', 'username').sort({ quickLinkOrder: 1, sortOrder: 1, title: 1 }).skip(skip).limit(limit),
    KnowledgeArticle.countDocuments(filter),
  ]);
  res.status(200).json(paginatedResponse({ data: articles.map(serializeArticle), page, limit, total }));
});

export const voteArticle = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findOne({ _id: req.params.id, ...publishedVisibleFilter(req) });
  if (!article || article.category !== 'it_help') throw ApiError.notFound('IT help article not found');

  const nextVote = req.body.vote;
  const existing = await KnowledgeArticleVote.findOne({ articleId: article._id, userId: req.user.id });
  if (!existing) {
    await KnowledgeArticleVote.create({ articleId: article._id, userId: req.user.id, vote: nextVote });
    await KnowledgeArticle.updateOne(
      { _id: article._id },
      { $inc: { [nextVote === 'helpful' ? 'helpfulCount' : 'notHelpfulCount']: 1 } },
    );
  } else if (existing.vote !== nextVote) {
    const decrement = existing.vote === 'helpful' ? 'helpfulCount' : 'notHelpfulCount';
    const increment = nextVote === 'helpful' ? 'helpfulCount' : 'notHelpfulCount';
    existing.vote = nextVote;
    await existing.save();
    await KnowledgeArticle.updateOne({ _id: article._id }, { $inc: { [decrement]: -1, [increment]: 1 } });
  }

  const updated = await KnowledgeArticle.findById(article._id).select('helpfulCount notHelpfulCount');
  res.status(200).json({
    success: true,
    data: {
      vote: nextVote,
      helpfulCount: updated.helpfulCount,
      notHelpfulCount: updated.notHelpfulCount,
    },
  });
});

const DEFAULT_IT_TOPICS_SEED = [
  { key: 'windows', name: 'Windows & Operating Systems', icon: '💻', sortOrder: 1 },
  { key: 'network', name: 'Network & Connectivity', icon: '🌐', sortOrder: 2 },
  { key: 'wifi', name: 'Office WiFi & Internet', icon: '📶', sortOrder: 3 },
  { key: 'vpn', name: 'VPN & Remote Access', icon: '🔒', sortOrder: 4 },
  { key: 'printer', name: 'Printers & Scanners', icon: '🖨️', sortOrder: 5 },
  { key: 'email', name: 'Corporate Email & Outlook', icon: '✉️', sortOrder: 6 },
  { key: 'password', name: 'Password & Accounts', icon: '🔑', sortOrder: 7 },
  { key: 'office_suite', name: 'Office Suite & Software', icon: '📄', sortOrder: 8 },
  { key: 'shared_folder', name: 'Shared Network Drive & Files', icon: '📁', sortOrder: 9 },
  { key: 'browser', name: 'Web Browsers & Security', icon: '🌍', sortOrder: 10 },
  { key: 'software_request', name: 'Software Installation & Requests', icon: '📦', sortOrder: 11 },
];

/**
 * List all knowledge topics with auto-seeding for it_help and article counts
 */
export const listKnowledgeTopics = asyncHandler(async (req, res) => {
  const category = req.query.category || 'it_help';

  // If it_help has no topics yet, auto-seed with defaults and link existing articles
  const existingCount = await KnowledgeTopic.countDocuments({ category });
  if (existingCount === 0 && category === 'it_help') {
    for (const item of DEFAULT_IT_TOPICS_SEED) {
      const created = await KnowledgeTopic.create({
        name: item.name,
        slug: item.key,
        icon: item.icon,
        category: 'it_help',
        parentId: null,
        sortOrder: item.sortOrder,
      });

      // Migrate existing unassigned articles matching subcategory
      await KnowledgeArticle.updateMany(
        { category: 'it_help', subcategory: item.key, topicId: null },
        { topicId: created._id }
      );
    }
  }

  // Fetch all topics in category
  const topics = await KnowledgeTopic.find({ category })
    .populate('parentId', 'name slug icon')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Aggregate counts of articles per topic
  const articleFilter = {
    category,
    ...(canManage(req) ? {} : { status: 'published' }),
  };
  const counts = await KnowledgeArticle.aggregate([
    { $match: articleFilter },
    { $group: { _id: '$topicId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  const data = topics.map((topic) => ({
    ...topic,
    articleCount: countMap[String(topic._id)] || 0,
  }));

  res.status(200).json({ success: true, data });
});

/**
 * Create a new topic or subtopic
 */
export const createKnowledgeTopic = asyncHandler(async (req, res) => {
  const { name, icon, parentId, category = 'it_help', sortOrder = 0, description = '' } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `topic-${Date.now()}`;

  const topic = await KnowledgeTopic.create({
    name,
    slug,
    icon: icon || '📁',
    parentId: parentId || null,
    category,
    sortOrder: Number(sortOrder) || 0,
    description,
    createdBy: req.user.id,
  });

  res.status(201).json({ success: true, data: topic });
});

/**
 * Update topic name, icon, parent or sortOrder
 */
export const updateKnowledgeTopic = asyncHandler(async (req, res) => {
  const topic = await KnowledgeTopic.findById(req.params.id);
  if (!topic) throw ApiError.notFound('Topic not found');

  const { name, icon, parentId, sortOrder, description } = req.body;
  if (name !== undefined) {
    topic.name = name;
    topic.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || topic.slug;
  }
  if (icon !== undefined) topic.icon = icon;
  if (parentId !== undefined) {
    if (parentId === req.params.id) {
      throw ApiError.badRequest('A topic cannot be its own parent');
    }
    topic.parentId = parentId || null;
  }
  if (sortOrder !== undefined) topic.sortOrder = Number(sortOrder) || 0;
  if (description !== undefined) topic.description = description;

  await topic.save();
  res.status(200).json({ success: true, data: topic });
});

/**
 * Delete a topic, moving any subtopics and articles up to its parent
 */
export const deleteKnowledgeTopic = asyncHandler(async (req, res) => {
  const topic = await KnowledgeTopic.findById(req.params.id);
  if (!topic) throw ApiError.notFound('Topic not found');

  // Re-parent subtopics
  await KnowledgeTopic.updateMany(
    { parentId: topic._id },
    { parentId: topic.parentId || null }
  );

  // Re-parent articles
  await KnowledgeArticle.updateMany(
    { topicId: topic._id },
    { topicId: topic.parentId || null }
  );

  await topic.deleteOne();
  res.status(200).json({ success: true, message: 'Topic deleted successfully' });
});

/**
 * Seed realistic IT Knowledge Base topics and interconnected articles
 */
export const seedMockItKnowledge = asyncHandler(async (req, res) => {
  const authorId = req.user.id;

  const MOCK_TOPICS = [
    { name: 'Network & Connectivity', slug: 'network-connectivity', icon: '🌐', description: 'Office WiFi, LAN, DNS configuration, and connectivity troubleshooting', sortOrder: 1 },
    { name: 'VPN & Remote Access', slug: 'vpn-access', icon: '🛡️', parentSlug: 'network-connectivity', description: 'Corporate VPN, secure remote desktop, and telework access', sortOrder: 2 },
    { name: 'Hardware & Peripherals', slug: 'hardware-devices', icon: '🖥️', description: 'Laptops, dual monitors, docking stations, and audio equipment', sortOrder: 3 },
    { name: 'Printers & Scanners', slug: 'printers-scanners', icon: '🖨️', parentSlug: 'hardware-devices', description: 'Network follow-me printing, scan to email, and paper jam recovery', sortOrder: 4 },
    { name: 'Cybersecurity & Accounts', slug: 'security-accounts', icon: '🔒', description: 'Passwords, 2FA MFA, BitLocker, and phishing prevention', sortOrder: 5 },
    { name: 'Software & Productivity', slug: 'software-productivity', icon: '💼', description: 'Microsoft 365, Teams meeting rooms, ERP system, and Adobe Cloud', sortOrder: 6 },
    { name: 'Cloud & File Storage', slug: 'cloud-storage', icon: '☁️', description: 'OneDrive corporate sync, department network shares, and file recovery', sortOrder: 7 },
    { name: 'IT Helpdesk & Equipment Loans', slug: 'it-helpdesk-services', icon: '🎧', description: 'Borrowing laptops/projectors, software requests, and support SLA', sortOrder: 8 },
  ];

  // 1. Create or upsert topics
  const topicMap = new Map();
  for (const t of MOCK_TOPICS) {
    let topic = await KnowledgeTopic.findOne({ slug: t.slug, category: 'it_help' });
    if (!topic) {
      topic = await KnowledgeTopic.create({
        name: t.name,
        slug: t.slug,
        icon: t.icon,
        description: t.description,
        category: 'it_help',
        sortOrder: t.sortOrder,
        createdBy: authorId,
      });
    } else {
      topic.name = t.name;
      topic.icon = t.icon;
      topic.description = t.description;
      topic.sortOrder = t.sortOrder;
      await topic.save();
    }
    topicMap.set(t.slug, topic);
  }

  // Link child topics to parents
  for (const t of MOCK_TOPICS) {
    if (t.parentSlug && topicMap.has(t.parentSlug)) {
      const child = topicMap.get(t.slug);
      const parent = topicMap.get(t.parentSlug);
      child.parentId = parent._id;
      await child.save();
    }
  }

  // 2. Define 21 realistic IT knowledge articles
  const MOCK_ARTICLES = [
    {
      title: 'Connecting to Office Wi-Fi (FTI-Staff)',
      slug: 'connecting-to-office-wifi',
      topicSlug: 'network-connectivity',
      isQuickLink: true,
      quickLinkOrder: 1,
      tags: ['wifi', 'network', 'laptop', 'mobile'],
      summary: 'Step-by-step guide to authenticate and connect company laptops and phones to the secure FTI-Staff WPA2-Enterprise wireless network.',
      content: `# Connecting to Office Wi-Fi (FTI-Staff)

The internal wireless network **FTI-Staff** provides high-speed, secure access to intranet servers, printers, and external Internet.

> [!NOTE]
> Use your company domain credentials (\`FTI\\username\`) rather than your full email address when authenticating on laptops.

## Quick Setup Steps

- [ ] Turn on Wi-Fi on your laptop or smartphone.
- [ ] Select **FTI-Staff** from the available network list.
- [ ] When prompted for EAP method, select **PEAP**.
- [ ] Set Phase 2 authentication to **MSCHAPv2**.
- [ ] Enter your corporate username and domain password.
- [ ] Accept and trust the \`fti-root-ca.crt\` internal certificate.

> [!TIP]
> If you recently changed your Windows account password, remember to "Forget Network" and reconnect with your new credentials.`,
    },
    {
      title: 'Guest Wi-Fi Access & Visitor Passcodes',
      slug: 'guest-wifi-access',
      topicSlug: 'network-connectivity',
      tags: ['wifi', 'network', 'visitors'],
      summary: 'Instructions for generating and sharing temporary guest Wi-Fi access for visitors, clients, and contractors.',
      content: `# Guest Wi-Fi Access (FTI-Guest)

Visitors and partners attending meetings in FTI offices can connect to the isolated **FTI-Guest** network.

## How Visitors Connect

1. Connect to SSID: \`FTI-Guest\`.
2. The captive portal web page will open automatically.
3. Enter the daily visitor passcode or your mobile number to receive an SMS OTP.
4. Access is granted for **8 hours** per session.

> [!WARNING]
> FTI-Guest only allows outbound web browsing (ports 80, 443). Internal file servers, local printers, and ERP databases are strictly blocked.`,
    },
    {
      title: 'Flushing DNS & Fixing "No Internet Access" Error',
      slug: 'flushing-dns-no-internet',
      topicSlug: 'network-connectivity',
      tags: ['network', 'troubleshooting', 'windows'],
      summary: 'Resolve common DNS cache poisoning, stale IP routing, and captive portal redirect errors using simple Windows commands.',
      content: `# Fixing "Connected, No Internet" & Flushing DNS

When your network icon shows a yellow triangle or "No Internet Access" while colleagues are connected, a stale local DNS cache is often the cause.

## Troubleshooting Sequence

Open **Command Prompt (CMD)** as Administrator and execute the following commands in order:

\`\`\`bash
# 1. Release existing IP lease
ipconfig /release

# 2. Flush corrupted local DNS cache
ipconfig /flushdns

# 3. Renew fresh IP from corporate DHCP
ipconfig /renew

# 4. Reset network winsock catalog
netsh winsock reset
\`\`\`

> [!IMPORTANT]
> Restart your computer after executing \`netsh winsock reset\` for the network adapter stack to reinitialize.`,
    },
    {
      title: 'Setting up Corporate Cisco VPN on Windows & Mac',
      slug: 'setting-up-corporate-vpn',
      topicSlug: 'vpn-access',
      isQuickLink: true,
      quickLinkOrder: 2,
      tags: ['vpn', 'network', 'remote-work', 'security'],
      summary: 'Comprehensive guide to installing Cisco AnyConnect VPN client for teleworking and securely accessing internal servers from home.',
      content: `# Corporate VPN Setup (Cisco AnyConnect)

Employees working remotely or traveling must connect via the FTI Virtual Private Network (VPN) to access internal file servers, Intranet, and the ERP system.

> [!NOTE]
> VPN connection requires active 2-Factor Authentication (2FA) via the Microsoft Authenticator mobile app.

## Connection Parameters

| Parameter | Value |
|---|---|
| Gateway URL | \`vpn.fti-group.com\` |
| Authentication | RADIUS / Azure AD MFA |
| Encryption | AES-256 GCM |

## Connection Sequence

- [ ] Launch **Cisco AnyConnect Secure Mobility Client**.
- [ ] Enter \`vpn.fti-group.com\` in the gateway box.
- [ ] Enter your company email and password.
- [ ] Approve the push notification on your smartphone.
- [ ] Verify the lock icon appears in your taskbar.

> [!WARNING]
> Disconnect from VPN before streaming high-bandwidth multimedia (e.g. YouTube or 4K webinars) to conserve corporate gateway bandwidth.`,
    },
    {
      title: 'VPN Split-Tunneling and Remote Desktop (RDP) Guide',
      slug: 'vpn-split-tunneling-rdp',
      topicSlug: 'vpn-access',
      tags: ['vpn', 'remote-work', 'windows'],
      summary: 'How to establish a Remote Desktop session to your office PC from home through the encrypted VPN tunnel.',
      content: `# Remote Desktop (RDP) via VPN

If you need to operate resource-heavy applications installed on your office workstation while teleworking, you can use Remote Desktop over VPN.

## Requirements

1. Your office PC must be powered ON and connected to the wired LAN.
2. Note your Office PC asset host: \`WKSTN-FTI-XXXX.corp.local\` (found on the barcode sticker).
3. Connect your home laptop to the Corporate VPN first.

## Connecting via RDP

\`\`\`bash
# Launch Windows Remote Desktop
mstsc /v:WKSTN-FTI-1042.corp.local /f
\`\`\`

> [!TIP]
> Under "Local Resources", ensure "Printers" is unchecked and "Smart cards" is checked to speed up session initialization.`,
    },
    {
      title: 'Setting up Network Multi-Function Printers (Follow-Me)',
      slug: 'setup-network-printer-follow-me',
      topicSlug: 'printers-scanners',
      isQuickLink: true,
      quickLinkOrder: 3,
      tags: ['printer', 'hardware', 'office'],
      summary: 'Add the universal Follow-Me print queue on your computer and release print jobs at any floor printer using your employee RFID badge.',
      content: `# Setting up Follow-Me Network Printing

FTI utilizes a unified **Follow-Me Printing** system. You send your document to a single virtual print queue, then swipe your employee RFID card at any printer in the building to release it.

## Adding the Printer on Windows

1. Press \`Win + R\` to open the Run dialogue.
2. Enter the print server path:
\`\`\`text
\\\\printserver01\\FollowMe-Color
\`\`\`
3. Double-click the queue; Windows will automatically download and install the certified PCL6 driver.
4. Set \`FollowMe-Color\` as your Default Printer.

> [!NOTE]
> Print jobs stay queued in the secure buffer for **24 hours**. If not swiped and released within that window, they are automatically purged for data privacy.`,
    },
    {
      title: 'Resolving Paper Jams and Replacing Printer Toner',
      slug: 'printer-paper-jam-toner-replacement',
      topicSlug: 'printers-scanners',
      tags: ['printer', 'hardware', 'troubleshooting'],
      summary: 'Quick guide for clearing printer paper jams in Tray 1/2 and requesting or replacing Black and CMYK toner cartridges.',
      content: `# Printer Paper Jam & Toner Troubleshooting

Quick checklist for resolving routine printer errors before dispatching an on-site technician.

## Clearing a Paper Jam

- [ ] Check the printer touch screen: it displays an animated 3D guide showing the exact jam location (Door A, B, or Tray 2).
- [ ] Open the indicated lever gently and pull the jammed sheet in the direction of the paper feed to avoid tearing.
- [ ] Verify no small paper scraps remain stuck in the rollers.
- [ ] Close all doors firmly until they latch.

> [!WARNING]
> Never use scissors, pens, or metal objects inside the printer drum area. It permanently scratches the OPC drum and causes black streaks.`,
    },
    {
      title: 'Configuring Dual External Monitors and Display Scaling',
      slug: 'dual-monitor-display-setup',
      topicSlug: 'hardware-devices',
      tags: ['hardware', 'monitor', 'laptop'],
      summary: 'Optimize dual-screen productivity, fix blurry text scaling issues, and set primary display preferences on Windows 11.',
      content: `# Dual External Monitor Setup & Scaling

Connecting one or two external displays to your laptop drastically improves multi-tasking and spreadsheet analysis.

## Recommended Display Settings

1. Right-click your Desktop and select **Display settings**.
2. Drag and arrange the numbered monitor rectangles to mirror their physical layout on your desk.
3. Under **Multiple displays**, select **Extend these displays** (do not use Duplicate).
4. Set Resolution to **Recommended** (e.g., \`1920 x 1080\` or \`2560 x 1440\`).
5. Ensure Scaling is set to **100%** on external monitors to prevent fuzzy fonts in legacy ERP software.

> [!TIP]
> Use the keyboard shortcut \`Win + Shift + Left/Right Arrow\` to instantly fling an active window to the adjacent monitor.`,
    },
    {
      title: 'USB-C Docking Station Troubleshooting (Display & LAN drops)',
      slug: 'usb-c-docking-station-troubleshooting',
      topicSlug: 'hardware-devices',
      tags: ['hardware', 'laptop', 'network'],
      summary: 'Diagnose and fix flickering external screens, intermittent Ethernet drops, and power delivery issues through USB-C Thunderbolt docks.',
      content: `# USB-C Docking Station Troubleshooting

If your laptop loses connection to external screens, mouse, or wired internet when plugged into the desk dock:

## Diagnostic Checklist

- [ ] Ensure the dock power adapter (130W) is plugged into the wall, not just drawing USB bus power.
- [ ] Connect the USB-C cable to the dedicated **Thunderbolt / DisplayPort** icon port on your laptop, not a data-only port.
- [ ] Unplug all cables from the dock, wait 10 seconds (power discharge), and plug them back in.
- [ ] Open **Device Manager** and check for any yellow exclamation marks under "Display adapters" or "Network adapters".

> [!NOTE]
> High-performance CAD laptops require the secondary barrel power plug in addition to the USB-C dock cable.`,
    },
    {
      title: 'Company Password Policy & Self-Service Password Reset (SSPR)',
      slug: 'password-policy-sspr',
      topicSlug: 'security-accounts',
      isQuickLink: true,
      quickLinkOrder: 4,
      tags: ['security', 'password', 'accounts'],
      summary: 'Understand enterprise password complexity rules, expiration cycles, and how to reset an expired or forgotten password without calling IT.',
      content: `# Password Policy & Self-Service Reset (SSPR)

All FTI Active Directory and Microsoft 365 accounts adhere to corporate cybersecurity standards.

## Password Requirements

- Minimum length: **12 characters**.
- Must contain at least 3 of: Uppercase (A-Z), Lowercase (a-z), Digits (0-9), Symbols (\`!@#$%^&*\`).
- Cannot contain your first name, last name, or employee ID number.
- Expiration cycle: **90 days**.

## Resetting Your Password Online

If you are locked out or forgot your password:
1. Visit: [https://passwordreset.microsoftonline.com](https://passwordreset.microsoftonline.com)
2. Enter your work email: \`name@fti-group.com\`.
3. Complete the SMS verification or Authenticator prompt.
4. Enter your new password twice and submit.`,
    },
    {
      title: 'Configuring Microsoft Authenticator for 2-Factor Auth (2FA)',
      slug: 'microsoft-authenticator-2fa-setup',
      topicSlug: 'security-accounts',
      tags: ['security', 'mfa', 'microsoft365', 'accounts'],
      summary: 'Enforce Multi-Factor Authentication on your smartphone to safeguard your account against credential theft.',
      content: `# Microsoft Authenticator 2FA Setup

Multi-Factor Authentication (MFA) adds a critical layer of security to prevent unauthorized access even if your password is compromised.

## Initial Phone Registration

- [ ] Download **Microsoft Authenticator** from the Apple App Store or Google Play Store.
- [ ] On your computer, open a browser and go to: [https://aka.ms/mfasetup](https://aka.ms/mfasetup).
- [ ] Sign in with your work email and select **Add method -> Authenticator app**.
- [ ] On your phone, tap **+** -> **Work or school account** -> **Scan QR code**.
- [ ] Point your camera at the screen to register the digital token.
- [ ] Enter the 2-digit test number displayed on your computer into your phone app.

> [!IMPORTANT]
> If you purchase a new smartphone, DO NOT wipe your old phone until you have added the new phone to your MFA security info page.`,
    },
    {
      title: 'Spotting and Reporting Phishing & Malicious Email Attacks',
      slug: 'spotting-phishing-emails',
      topicSlug: 'security-accounts',
      tags: ['security', 'email', 'policy'],
      summary: 'How to detect deceptive spoofing emails, fraudulent CEO gift card requests, malicious attachments, and click the PhishAlarm report button.',
      content: `# Spotting & Reporting Phishing Emails

Cybercriminals frequently target corporate mailboxes with realistic-looking invoices, urgent password reset notices, or impersonations of company executives.

## Common Warning Signs

- **Mismatched sender domain**: The display name says "CEO / HR", but the actual address is \`ceo-fti@gmail.com\` or \`payroll-verify.xyz\`.
- **False urgency**: "Account will be deleted within 2 hours unless you verify."
- **Unexpected attachments**: Files ending with \`.zip\`, \`.exe\`, \`.iso\`, or macro-enabled \`.xlsm\` documents.
- **Generic greetings**: "Dear Customer" or "Dear Employee" without your real name.

## What to Do

> [!WARNING]
> NEVER click links or type your credentials into forms linked from suspicious emails.

Click the **Report Phishing (Fish Hook icon)** in your Outlook ribbon. The email will be automatically quarantined and analyzed by the cybersecurity SOC team.`,
    },
    {
      title: 'BitLocker Drive Encryption & Recovery Key Retrieval',
      slug: 'bitlocker-recovery-key',
      topicSlug: 'security-accounts',
      tags: ['security', 'windows', 'hardware'],
      summary: 'What to do if your computer boots into the blue BitLocker recovery screen following a BIOS update or docking change.',
      content: `# BitLocker Drive Encryption & Recovery

All corporate laptops have their internal solid-state drives encrypted with **Windows BitLocker** to protect company data if the device is lost or stolen.

## Why Did the BitLocker Blue Screen Appear?

The BitLocker recovery prompt triggers automatically when hardware changes are detected:
- Laptop BIOS firmware update.
- Boot order change in UEFI.
- Docking station hardware handshake mismatch.

## How to Retrieve Your 48-digit Recovery Key

1. On a smartphone or another computer, go to: [https://myaccount.microsoft.com/device-list](https://myaccount.microsoft.com/device-list).
2. Sign in with your corporate account.
3. Locate your laptop name and click **View BitLocker Keys**.
4. Type the 48-digit numeric key into the blue screen and press Enter.`,
    },
    {
      title: 'Configuring Microsoft Outlook 365 & Shared Mailboxes',
      slug: 'outlook-365-shared-mailbox-setup',
      topicSlug: 'software-productivity',
      tags: ['microsoft365', 'email', 'software'],
      summary: 'Set up Microsoft 365 Outlook desktop app, configure out-of-office autoreplies, and access department shared mailboxes.',
      content: `# Outlook 365 & Shared Mailbox Setup

FTI uses Microsoft 365 Exchange Online for corporate email, calendar scheduling, and shared team communication.

## Adding a Shared Mailbox (e.g., info@, sales@, hr@)

When IT grants you permissions to a department shared mailbox:
1. It will usually appear automatically in your left Outlook folder pane within 30 minutes.
2. If it does not appear automatically:
   - Go to **File** -> **Account Settings** -> **Account Settings**.
   - Select your account -> Click **Change** -> **More Settings** -> **Advanced**.
   - Under "Open these additional mailboxes", click **Add** and type the shared mailbox name.
   - Click **Apply** and restart Outlook.

> [!TIP]
> When replying to customer inquiries from a shared mailbox, ensure the "From:" field is set to the shared address rather than your personal email.`,
    },
    {
      title: 'Teams Meeting Room Audio & Video Conferencing Equipment',
      slug: 'teams-meeting-room-av-equipment',
      topicSlug: 'software-productivity',
      tags: ['microsoft365', 'hardware', 'software'],
      summary: 'How to use meeting room touchscreen consoles, wireless presentation casting, and wide-angle conference cameras.',
      content: `# Teams Meeting Room AV Equipment

Conference rooms are equipped with integrated **Microsoft Teams Room (MTR)** touchscreen consoles and ceiling microphone arrays.

## Starting a Hybrid Meeting

- [ ] **Method 1 (One-Touch Join)**: When booking the conference room in Outlook, invite the Room resource (e.g. \`Meeting Room 3A\`). The meeting will show up on the table console; tap **Join** with one finger.
- [ ] **Method 2 (Proximity Join)**: Enter the room with your laptop, join the Teams meeting, and your laptop will detect the room via Bluetooth beacon and invite the room audio with no echo.
- [ ] **Wireless Screen Share**: In Teams, click Share -> select Room Screen or use the HDMI cable on the conference table.`,
    },
    {
      title: 'Enterprise ERP System Access & Account Permission Requests',
      slug: 'enterprise-erp-access-guide',
      topicSlug: 'software-productivity',
      tags: ['software', 'accounts', 'policy'],
      summary: 'Guide for new hires to request SAP/ERP user accounts, business role modules, and warehouse database authorization.',
      content: `# Enterprise ERP Access & Roles

The central ERP software manages company procurement, supply chain, inventory, billing, and financial accounting.

## Access Levels by Department

- **Finance & Accounting**: General Ledger (GL), Accounts Payable/Receivable (AP/AR), Asset Accounting.
- **Sales & Operations**: Sales Orders (SO), Customer Master, Quotations.
- **Warehouse & Logistics**: Inventory Movements (MIGO), Stock Overview, Shipping Delivery.

## Requesting Access

1. Discuss and confirm the exact T-Codes and authorization roles needed with your direct manager.
2. Submit an ERP Access Request ticket in the portal.
3. Manager digital approval is required before IT security activates the ERP profile.`,
    },
    {
      title: 'Mapping Department Network Shared Drives (\\\\fileserver01)',
      slug: 'mapping-network-shared-drives',
      topicSlug: 'cloud-storage',
      tags: ['cloud', 'network', 'windows'],
      summary: 'Mount network shared drive letters (Z:, P:, S:) for collaborative department folders and large project files.',
      content: `# Mapping Network Shared Drives

Department folders and legacy team archives reside on high-speed on-premise file servers.

## Standard Drive Letter Conventions

- **Drive P:\\**: Public Company Common Share (\`\\\\fileserver01\\Public\`).
- **Drive S:\\**: Secure Department-specific Share (\`\\\\fileserver01\\Departments\`).
- **Drive U:\\**: Personal Home Drive (\`\\\\fileserver01\\Users\\<username>\`).

## How to Map Drive Manually

\`\`\`cmd
# Map Department drive S: via Windows Command Prompt
net use S: \\\\fileserver01\\Departments /persistent:yes
\`\`\`

> [!NOTE]
> If you are working from home, you MUST connect to the Corporate VPN before Windows can reach \`\\\\fileserver01\`.`,
    },
    {
      title: 'Corporate OneDrive Cloud Sync & Desktop Backup Setup',
      slug: 'onedrive-backup-sync-setup',
      topicSlug: 'cloud-storage',
      tags: ['cloud', 'microsoft365', 'backup'],
      summary: 'Ensure your Desktop, Documents, and Pictures folders automatically back up to OneDrive with 1TB cloud storage.',
      content: `# OneDrive Cloud Sync & Backup

Every employee is allocated **1 TB of Microsoft OneDrive for Business** cloud storage.

## Enabling Known Folder Move (Auto Backup)

- [ ] Look for the blue cloud icon in your taskbar near the clock.
- [ ] Click the gear icon -> **Settings** -> **Sync and backup** -> **Manage backup**.
- [ ] Toggle **Desktop**, **Documents**, and **Pictures** to ON.
- [ ] Click **Start backup**.

> [!TIP]
> Files backed up to OneDrive display a green checkmark or cloud status icon. If your laptop ever breaks, signing in to a replacement laptop restores all your desktop files within minutes!`,
    },
    {
      title: 'Recovering Deleted Files from Shadow Copies and Version History',
      slug: 'recovering-deleted-files-version-history',
      topicSlug: 'cloud-storage',
      tags: ['cloud', 'backup', 'troubleshooting'],
      summary: 'Self-service recovery of accidentally overwritten or deleted Excel spreadsheets and documents without waiting for IT.',
      content: `# Recovering Overwritten & Deleted Files

Accidentally overwriting an important spreadsheet or deleting a collaborative file happens to everyone. Here is how to restore previous versions:

## Method 1: OneDrive / SharePoint Version History

1. Right-click the file in File Explorer.
2. Select **Version history**.
3. A timeline of every saved timestamp will appear; select the version before the mistake occurred and click **Restore**.

## Method 2: Network Drive Volume Shadow Copies

1. Navigate to the network folder where the file was saved.
2. Right-click the folder and select **Properties**.
3. Switch to the **Previous Versions** tab.
4. Select a shadow copy snapshot from earlier today or yesterday, and click **Open** to retrieve the file.`,
    },
    {
      title: 'IT Equipment Loan Policy (Laptops, Dongles, Projectors)',
      slug: 'it-equipment-loan-policy',
      topicSlug: 'it-helpdesk-services',
      tags: ['policy', 'hardware', 'loan'],
      summary: 'Guidelines, maximum checkout durations, and return procedures for loaner laptops, travel adapters, and presentation projectors.',
      content: `# IT Equipment Loan Policy

The IT department maintains a shared pool of mobile equipment for short-term employee checkout.

## Available Equipment & Loan Durations

| Device Category | Max Duration | Advance Notice |
|---|---|---|
| Travel Loaner Laptop | 14 days | 3 business days |
| Wireless Presentation Clicker | 3 days | Same day |
| Portable HDMI Projector | 2 days | 1 business day |
| USB-C Multi-port Dongle / Adapter | 7 days | Same day |

> [!IMPORTANT]
> Borrowers are personally responsible for equipment care. All loaner laptops are completely wiped clean upon return, so save any working files to OneDrive before returning.`,
    },
    {
      title: 'Submitting Software Installation & License Purchase Requests',
      slug: 'software-license-request-workflow',
      topicSlug: 'it-helpdesk-services',
      tags: ['software', 'policy', 'accounts'],
      summary: 'Learn the approval procedure for requesting specialized third-party desktop software, Adobe licenses, or developer IDE tools.',
      content: `# Software Installation & License Requests

To maintain software compliance and protect network integrity, standard employee Windows accounts do not have local administrator privileges to install unvetted \`.exe\` or \`.msi\` installers.

## Approval Hierarchy

1. **Freeware / Open-Source (Approved List)**: Tools like 7-Zip, Notepad++, or Google Chrome can be installed immediately by IT Helpdesk via remote assist.
2. **Paid Commercial Licenses (e.g. Adobe Creative Cloud, AutoCAD, JetBrains)**:
   - Requires department manager budget approval.
   - IT procurement will acquire the license key and assign it to your corporate email.

Submit your ticket under **Services -> Software Request** with the official vendor download link and business justification.`,
    },
  ];

  // 3. Upsert articles into database
  const createdArticles = [];
  for (const art of MOCK_ARTICLES) {
    const topic = topicMap.get(art.topicSlug);
    const topicId = topic ? topic._id : null;

    let existing = await KnowledgeArticle.findOne({ slug: art.slug });
    if (existing) {
      existing.title = art.title;
      existing.category = 'it_help';
      existing.subcategory = art.topicSlug;
      existing.topicId = topicId;
      existing.summary = art.summary;
      existing.content = art.content;
      existing.tags = art.tags;
      existing.isQuickLink = art.isQuickLink || false;
      existing.quickLinkOrder = art.quickLinkOrder || 0;
      existing.status = 'published';
      existing.authorId = authorId;
      await existing.save();
      createdArticles.push(existing);
    } else {
      const created = await KnowledgeArticle.create({
        title: art.title,
        slug: art.slug,
        category: 'it_help',
        subcategory: art.topicSlug,
        topicId: topicId,
        summary: art.summary,
        content: art.content,
        tags: art.tags,
        isQuickLink: art.isQuickLink || false,
        quickLinkOrder: art.quickLinkOrder || 0,
        sortOrder: 0,
        status: 'published',
        authorId: authorId,
      });
      createdArticles.push(created);
    }
  }

  // 4. Interlink related articles to create dense note-to-note graph edges
  const articleBySlug = new Map(createdArticles.map((a) => [a.slug, a]));
  const LINK_PAIRS = [
    ['connecting-to-office-wifi', 'guest-wifi-access'],
    ['connecting-to-office-wifi', 'flushing-dns-no-internet'],
    ['setting-up-corporate-vpn', 'vpn-split-tunneling-rdp'],
    ['setting-up-corporate-vpn', 'microsoft-authenticator-2fa-setup'],
    ['setup-network-printer-follow-me', 'printer-paper-jam-toner-replacement'],
    ['dual-monitor-display-setup', 'usb-c-docking-station-troubleshooting'],
    ['password-policy-sspr', 'microsoft-authenticator-2fa-setup'],
    ['password-policy-sspr', 'spotting-phishing-emails'],
    ['spotting-phishing-emails', 'outlook-365-shared-mailbox-setup'],
    ['mapping-network-shared-drives', 'onedrive-backup-sync-setup'],
    ['onedrive-backup-sync-setup', 'recovering-deleted-files-version-history'],
    ['it-equipment-loan-policy', 'usb-c-docking-station-troubleshooting'],
    ['software-license-request-workflow', 'enterprise-erp-access-guide'],
  ];

  for (const [slugA, slugB] of LINK_PAIRS) {
    const artA = articleBySlug.get(slugA);
    const artB = articleBySlug.get(slugB);
    if (artA && artB) {
      if (!artA.relatedArticles?.some((id) => String(id) === String(artB._id))) {
        artA.relatedArticles = [...(artA.relatedArticles || []), artB._id];
        await artA.save();
      }
      if (!artB.relatedArticles?.some((id) => String(id) === String(artA._id))) {
        artB.relatedArticles = [...(artB.relatedArticles || []), artA._id];
        await artB.save();
      }
    }
  }

  res.status(200).json({
    success: true,
    message: 'Realistic IT Knowledge Base vault seeded successfully',
    data: {
      topicsCount: MOCK_TOPICS.length,
      articlesCount: MOCK_ARTICLES.length,
    },
  });
});

export { CONTENT_STATUSES };

