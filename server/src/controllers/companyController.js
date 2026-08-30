import { CompanyInfo, AuditLog } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const DEFAULT_COMPANY_INFO = {
  key: 'default',
  name: 'FTI Welcome Hub Demo Company',
  tagline: 'A fictional company profile for development and demonstration.',
  overview: 'This sample company profile is fictional. Replace it with approved company information before production use.',
  mission: 'Support people and teams with reliable services, thoughtful collaboration, and continuous learning.',
  vision: 'Create a welcoming workplace where newcomers can contribute with confidence.',
  history: 'Founded as a development-data example for the FTI Welcome Hub project. Company milestones should be supplied by an authorized business owner.',
  address: 'Building A, Demo Business Park, Bangkok 10000',
  phone: '+66 2 000 0000',
  email: 'hello@example.invalid',
  website: 'https://example.invalid',
  latitude: 13.7563,
  longitude: 100.5018,
  mapProvider: 'openstreetmap',
  officePoints: [
    { name: 'Reception', description: 'Main visitor registration point.', contact: 'Reception', extension: '1000', category: 'reception', latitude: 13.7563, longitude: 100.5018 },
    { name: 'HR Desk', description: 'Internship documents and people support.', contact: 'Human Resources', extension: '1101', category: 'hr', latitude: 13.7568, longitude: 100.5022 },
    { name: 'IT Support', description: 'Accounts, devices, and technical help.', contact: 'Information Technology', extension: '1201', category: 'it', latitude: 13.7559, longitude: 100.5012 },
  ],
};

const companyPayload = (body) => {
  const fields = ['name', 'tagline', 'overview', 'mission', 'vision', 'history', 'address', 'phone', 'email', 'website', 'latitude', 'longitude', 'mapProvider', 'officePoints'];
  return Object.fromEntries(fields.filter((field) => field in body).map((field) => [field, body[field]]));
};

const serialize = (company) => company?.toObject ? company.toObject({ virtuals: true }) : { ...company };

export const getCompanyInfo = asyncHandler(async (_req, res) => {
  const company = await CompanyInfo.findOne({ key: 'default' }).populate('updatedBy', 'username');
  res.status(200).json({ success: true, data: { company: serialize(company || DEFAULT_COMPANY_INFO) } });
});

export const updateCompanyInfo = asyncHandler(async (req, res) => {
  const payload = companyPayload(req.body);
  const existing = await CompanyInfo.findOne({ key: 'default' });
  const before = existing ? existing.toObject() : null;
  const company = existing || new CompanyInfo({ ...DEFAULT_COMPANY_INFO, key: 'default' });
  Object.assign(company, payload, { key: 'default', updatedBy: req.user.id });
  if (!company.name) throw ApiError.badRequest('Company name is required');
  await company.save();
  await company.populate('updatedBy', 'username');
  await AuditLog.record({
    userId: req.user.id,
    action: existing ? 'update' : 'create',
    entity: 'CompanyInfo',
    entityId: company._id,
    before,
    after: company.toObject(),
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });
  res.status(200).json({ success: true, data: { company: serialize(company) } });
});
