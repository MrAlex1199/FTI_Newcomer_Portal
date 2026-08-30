import {
  Announcement,
  CompanyInfo,
  Department,
  Employee,
  FAQ,
  Intern,
  KnowledgeArticle,
  Policy,
  SearchEvent,
} from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SEARCH_TYPES } from '../validators/searchValidators.js';

const GROUP_ORDER = SEARCH_TYPES;
const DEFAULT_LIMIT = 5;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const textValues = (values) => values.flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean).map((value) => String(value));
const matches = (value, regex) => regex.test(String(value || ''));

const scoreFor = (query, values) => {
  const normalizedQuery = query.toLocaleLowerCase();
  const normalizedValues = textValues(values).map((value) => value.toLocaleLowerCase());
  if (normalizedValues.some((value) => value === normalizedQuery)) return 1;
  if (normalizedValues.some((value) => value.startsWith(normalizedQuery))) return 0.85;
  if (normalizedValues.some((value) => value.includes(normalizedQuery))) return 0.65;
  return 0.4;
};

const result = ({ id, entityType, title, summary = '', url, score, meta = {} }) => ({
  id: String(id),
  entityType,
  title: String(title || ''),
  summary: String(summary || '').slice(0, 240),
  url,
  score: Number(score.toFixed(2)),
  meta,
});

const searchable = (fields, regex) => ({ $or: fields.map((field) => ({ [field]: regex })) });
const visibleKnowledge = (role) => ({ status: 'published', $or: [{ targetRoles: { $size: 0 } }, { targetRoles: role }] });

const searchEmployees = async (regex, query, limit) => {
  const matchingDepartments = await Department.find({ isActive: true, ...searchable(['name', 'code'], regex) }).select('_id');
  const employeeSearch = searchable(['employeeCode', 'firstName', 'lastName', 'nickname', 'position', 'skills'], regex);
  const rows = await Employee.find({
    isPublished: true,
    $or: [...employeeSearch.$or, ...(matchingDepartments.length ? [{ departmentId: { $in: matchingDepartments.map((item) => item._id) } }] : [])],
  })
    .select('employeeCode firstName lastName nickname position departmentId')
    .populate('departmentId', 'name code')
    .limit(limit);
  return rows.map((item) => result({
    id: item._id,
    entityType: 'employee',
    title: `${item.firstName} ${item.lastName}`.trim(),
    summary: item.position,
    url: `/employees/${item._id}`,
    score: scoreFor(query, [item.employeeCode, item.firstName, item.lastName, item.nickname, item.position, item.departmentId?.name]),
    meta: { employeeCode: item.employeeCode, department: item.departmentId?.name || '' },
  }));
};

const searchInterns = async (regex, query, limit) => {
  const rows = await Intern.find({ isPublished: true, ...searchable(['firstName', 'lastName', 'nickname', 'university', 'faculty', 'major', 'projectTitle'], regex) })
    .select('firstName lastName nickname university faculty major projectTitle departmentId batchId')
    .populate('departmentId', 'name code')
    .populate('batchId', 'code')
    .limit(limit);
  return rows.map((item) => result({
    id: item._id,
    entityType: 'intern',
    title: `${item.firstName} ${item.lastName}`.trim(),
    summary: [item.university, item.major].filter(Boolean).join(' · '),
    url: `/interns/${item._id}`,
    score: scoreFor(query, [item.firstName, item.lastName, item.nickname, item.university, item.faculty, item.major, item.projectTitle]),
    meta: { department: item.departmentId?.name || '', batch: item.batchId?.code || '' },
  }));
};

const searchDepartments = async (regex, query, limit) => {
  const rows = await Department.find({ isActive: true, ...searchable(['name', 'code', 'description', 'responsibilities', 'contactTopics'], regex) })
    .select('name code description')
    .limit(limit);
  return rows.map((item) => result({
    id: item._id,
    entityType: 'department',
    title: item.name,
    summary: item.description,
    url: `/departments/${item._id}`,
    score: scoreFor(query, [item.name, item.code, item.description]),
    meta: { code: item.code },
  }));
};

const searchFaq = async (regex, query, limit) => {
  const rows = await FAQ.find({ isPublished: true, ...searchable(['question', 'answer', 'tags', 'category'], regex) })
    .select('question answer category tags')
    .limit(limit);
  return rows.map((item) => result({
    id: item._id,
    entityType: 'faq',
    title: item.question,
    summary: item.answer,
    url: `/faq?item=${item._id}`,
    score: scoreFor(query, [item.question, item.category, item.tags]),
    meta: { category: item.category },
  }));
};

const searchPolicies = async (regex, query, limit) => {
  const rows = await Policy.find({ status: 'published', ...searchable(['title', 'summary', 'content', 'category'], regex) })
    .select('title summary category')
    .limit(limit);
  return rows.map((item) => result({
    id: item._id,
    entityType: 'policy',
    title: item.title,
    summary: item.summary,
    url: `/policies?article=${item._id}`,
    score: scoreFor(query, [item.title, item.category, item.summary]),
    meta: { category: item.category },
  }));
};

const searchAnnouncements = async (regex, query, role, limit) => {
  const rows = await Announcement.find({ ...Announcement.visibleToRoleFilter(role), ...searchable(['title', 'summary', 'content', 'category'], regex) })
    .select('title summary category publishAt')
    .sort({ isPinned: -1, publishAt: -1 })
    .limit(limit);
  return rows.map((item) => result({
    id: item._id,
    entityType: 'announcement',
    title: item.title,
    summary: item.summary,
    url: `/announcements?article=${item._id}`,
    score: scoreFor(query, [item.title, item.category, item.summary]),
    meta: { category: item.category, publishAt: item.publishAt },
  }));
};

const searchKnowledge = async (regex, query, role, limit) => {
  const rows = await KnowledgeArticle.find({ $and: [visibleKnowledge(role), searchable(['title', 'summary', 'content', 'tags', 'subcategory'], regex)] })
    .select('title summary category subcategory')
    .limit(limit);
  return rows.map((item) => result({
    id: item._id,
    entityType: 'knowledge',
    title: item.title,
    summary: item.summary,
    url: item.category === 'it_help' ? `/it-help?article=${item._id}` : `/getting-started?article=${item._id}`,
    score: scoreFor(query, [item.title, item.subcategory, item.summary]),
    meta: { category: item.category, subcategory: item.subcategory },
  }));
};

const COMPANY_FALLBACK = {
  name: 'FTI Welcome Hub Demo Company',
  tagline: 'A fictional company profile for development and demonstration.',
  overview: 'Support people and teams with reliable services, thoughtful collaboration, and continuous learning.',
};

const searchCompany = async (regex, query) => {
  const company = await CompanyInfo.findOne({ key: 'default' }).select('name tagline overview mission vision history address officePoints');
  const source = company?.toObject() || COMPANY_FALLBACK;
  const fields = [source.name, source.tagline, source.overview, source.mission, source.vision, source.history, source.address, ...(source.officePoints || []).flatMap((point) => [point.name, point.description, point.category])];
  if (!fields.some((field) => matches(field, regex))) return [];
  return [result({
    id: company?._id || 'default',
    entityType: 'company',
    title: source.name,
    summary: source.tagline || source.overview,
    url: '/company',
    score: scoreFor(query, [source.name, source.tagline, source.overview, source.mission, source.vision, source.history, source.address]),
    meta: {},
  })];
};

const searchers = {
  employee: searchEmployees,
  intern: searchInterns,
  department: searchDepartments,
  faq: searchFaq,
  policy: searchPolicies,
  announcement: searchAnnouncements,
  knowledge: searchKnowledge,
  company: searchCompany,
};

export const globalSearch = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim().slice(0, 100);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1), 20);
  const requestedTypes = req.query.types ? String(req.query.types).split(',').filter((type) => SEARCH_TYPES.includes(type)) : SEARCH_TYPES;
  if (!query) return res.status(200).json({ success: true, data: { query: '', total: 0, groups: [] } });

  const regex = new RegExp(escapeRegex(query), 'i');
  const startedAt = Date.now();
  const entries = await Promise.all(requestedTypes.map(async (type) => {
    const rows = type === 'announcement' || type === 'knowledge'
      ? await searchers[type](regex, query, req.user.role, limit)
      : type === 'company'
        ? await searchers[type](regex, query)
        : await searchers[type](regex, query, limit);
    return [type, rows.sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))];
  }));
  const groups = entries.filter(([, rows]) => rows.length > 0).map(([type, rows]) => ({ type, count: rows.length, results: rows }));
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  void SearchEvent.create({
    query,
    userId: req.user.id,
    role: req.user.role,
    resultCount: total,
    resultTypes: groups.map((group) => group.type),
    latencyMs: Date.now() - startedAt,
  }).catch(() => {});

  res.status(200).json({ success: true, data: { query, total, groups } });
});
