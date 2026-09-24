import { KnowledgeArticle, KnowledgeTopic, KnowledgeArticleVote, KnowledgeComment, AuditLog, ARTICLE_CATEGORIES, GETTING_STARTED_SECTIONS, IT_HELP_TOPICS, CONTENT_STATUSES } from '../models/index.js';
import { USER_ROLES } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { can } from '../config/permissions.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';
import { uploadImage, deleteImage } from '../utils/imageUpload.js';
import { MOCK_TOPICS, MOCK_ARTICLES, LINK_PAIRS } from '../data/mockItKnowledgeData.js';

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
  const authorId = req.user ? (req.user.id || req.user._id) : null;

  // 0. Clean wipe existing it_help articles and topics
  await KnowledgeArticle.deleteMany({ category: 'it_help' });
  await KnowledgeTopic.deleteMany({ category: 'it_help' });

  // 1. Create topics
  const topicMap = new Map();
  for (const t of MOCK_TOPICS) {
    const topic = await KnowledgeTopic.create({
      name: t.name,
      slug: t.slug,
      icon: t.icon,
      description: t.description,
      category: 'it_help',
      sortOrder: t.sortOrder,
      createdBy: authorId,
    });
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

  // 2. Create articles
  const createdArticles = [];
  for (const art of MOCK_ARTICLES) {
    const topic = topicMap.get(art.topicSlug);
    const topicId = topic ? topic._id : null;

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

  // 3. Interlink related articles for the Obsidian Graph View
  const articleBySlug = new Map(createdArticles.map((a) => [a.slug, a]));

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
      linksCount: LINK_PAIRS.length,
    },
  });
});

export { CONTENT_STATUSES };

