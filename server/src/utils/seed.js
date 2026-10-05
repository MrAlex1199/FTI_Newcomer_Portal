/**
 * Database seed script.
 *
 * Populates the database with fictional development data so every feature has
 * something to render. Run with:  npm run seed  (from the server directory)
 *
 * IMPORTANT: every record here is invented. Per spec rules 6 and 7 this script
 * must never contain real employee data, real credentials, internal IP
 * addresses, or anything else that could be mistaken for confidential company
 * information. Real data only enters the system after company approval.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import {
  User,
  Department,
  Employee,
  InternBatch,
  Intern,
  Announcement,
  Policy,
  FAQ,
  KnowledgeTopic,
  KnowledgeArticle,
  CompanyInfo,
  Feedback,
  AuditLog,
  Conversation,
  ChatMessage,
} from '../models/index.js';
import { MOCK_TOPICS, MOCK_ARTICLES, LINK_PAIRS } from '../data/mockItKnowledgeData.js';

dotenv.config();

// Shared dev password. Fine for local dummy accounts; production accounts are
// created through the admin UI with generated passwords.
const DEV_PASSWORD = 'ChangeMe123!';

const log = (message) => console.log(message);
const section = (message) => console.log(`\n▸ ${message}`);

/** Wipe every seeded collection so reruns produce a clean, predictable state. */
const clearCollections = async () => {
  section('Clearing existing collections');
  const models = [
    User,
    Department,
    Employee,
    InternBatch,
    Intern,
    Announcement,
    Policy,
    FAQ,
    KnowledgeTopic,
    KnowledgeArticle,
    CompanyInfo,
    Feedback,
    AuditLog,
    Conversation,
    ChatMessage,
  ];

  for (const model of models) {
    const { deletedCount } = await model.deleteMany({});
    log(`  cleared ${model.modelName.padEnd(18)} (${deletedCount} removed)`);
  }
};

const seedDepartments = async () => {
  section('Seeding departments');
  const departments = await Department.create([
    {
      name: 'Executive Office',
      code: 'EXEC',
      description: 'Company leadership and strategic direction.',
      responsibilities: ['Company strategy', 'Corporate governance'],
      contactTopics: ['Executive approvals'],
      location: 'Building A, 4th Floor',
      extension: '1001',
      sortOrder: 1,
    },
    {
      name: 'Human Resources',
      code: 'HR',
      description: 'Recruitment, employee relations, and internship programmes.',
      responsibilities: ['Recruitment', 'Employee welfare', 'Internship coordination'],
      contactTopics: ['Internship documents', 'Leave requests', 'Employee records'],
      location: 'Building A, 2nd Floor',
      extension: '1101',
      sortOrder: 2,
    },
    {
      name: 'Information Technology',
      code: 'IT',
      description: 'Internal systems, user support, network and hardware.',
      responsibilities: [
        'Computer and network support',
        'Internal software systems',
        'Account and access management',
      ],
      contactTopics: ['Computer problems', 'Wi-Fi access', 'Printer issues', 'Account or password'],
      location: 'Building A, 3rd Floor',
      extension: '1201',
      sortOrder: 3,
    },
    {
      name: 'Marketing',
      code: 'MKT',
      description: 'Brand communication, campaigns, and product marketing.',
      responsibilities: ['Brand management', 'Campaign planning', 'Content production'],
      contactTopics: ['Marketing materials', 'Brand guidelines'],
      location: 'Building B, 2nd Floor',
      extension: '1301',
      sortOrder: 4,
    },
    {
      name: 'Sales',
      code: 'SALES',
      description: 'Domestic and dealer sales channels.',
      responsibilities: ['Dealer relations', 'Sales targets', 'Customer accounts'],
      contactTopics: ['Customer enquiries', 'Dealer support'],
      location: 'Building B, 1st Floor',
      extension: '1401',
      sortOrder: 5,
    },
  ]);

  const byCode = Object.fromEntries(departments.map((d) => [d.code, d]));
  log(`  created ${departments.length} departments`);
  return byCode;
};

const seedEmployees = async (dept) => {
  section('Seeding employees');

  // Level 1 - president. Created first so everyone else can point at it.
  const president = await Employee.create({
    employeeCode: 'EMP001',
    firstName: 'Somchai',
    lastName: 'Wattana',
    nickname: 'Chai',
    position: 'President',
    departmentId: dept.EXEC._id,
    managerId: null,
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    workEmail: 'somchai.w@example.com',
    extension: '1001',
    officeLocation: 'Building A, 4th Floor',
    bio: 'Oversees company strategy and long-term direction.',
    skills: ['Leadership', 'Strategic planning'],
  });

  // Level 2 - department heads reporting to the president.
  const managers = await Employee.create([
    {
      employeeCode: 'EMP002',
      firstName: 'Pornthip',
      lastName: 'Saelim',
      nickname: 'Thip',
      position: 'Human Resources Manager',
      departmentId: dept.HR._id,
      managerId: president._id,
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      workEmail: 'pornthip.s@example.com',
      extension: '1101',
      officeLocation: 'Building A, 2nd Floor',
      bio: 'Leads recruitment and the company internship programme.',
      skills: ['Recruitment', 'Employee relations', 'Onboarding'],
    },
    {
      employeeCode: 'EMP003',
      firstName: 'Anucha',
      lastName: 'Rattanakul',
      nickname: 'Nu',
      position: 'IT Manager',
      departmentId: dept.IT._id,
      managerId: president._id,
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      workEmail: 'anucha.r@example.com',
      extension: '1201',
      officeLocation: 'Building A, 3rd Floor',
      bio: 'Responsible for internal systems and IT service delivery.',
      skills: ['Infrastructure', 'IT service management', 'Security awareness'],
    },
    {
      employeeCode: 'EMP004',
      firstName: 'Wichai',
      lastName: 'Thongdee',
      nickname: 'Chai',
      position: 'Marketing Manager',
      departmentId: dept.MKT._id,
      managerId: president._id,
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      workEmail: 'wichai.t@example.com',
      extension: '1301',
      officeLocation: 'Building B, 2nd Floor',
      bio: 'Plans brand and product marketing activities.',
      skills: ['Brand strategy', 'Campaign planning'],
    },
    {
      employeeCode: 'EMP005',
      firstName: 'Siriporn',
      lastName: 'Chaiyaporn',
      nickname: 'Porn',
      position: 'Sales Manager',
      departmentId: dept.SALES._id,
      managerId: president._id,
      profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      workEmail: 'siriporn.c@example.com',
      extension: '1401',
      officeLocation: 'Building B, 1st Floor',
      bio: 'Manages dealer channels and sales performance.',
      skills: ['Dealer management', 'Negotiation'],
    },
  ]);

  const [hrManager, itManager, mktManager, salesManager] = managers;

  // Level 3 - individual contributors.
  const staff = await Employee.create([
    {
      employeeCode: 'EMP006',
      firstName: 'Kittipong',
      lastName: 'Sae-ung',
      nickname: 'Kit',
      position: 'IT Support Specialist',
      departmentId: dept.IT._id,
      managerId: itManager._id,
      profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      workEmail: 'kittipong.s@example.com',
      extension: '1202',
      officeLocation: 'Building A, 3rd Floor',
      bio: 'First line of support for hardware, printers, and user accounts.',
      skills: ['Windows support', 'Printer troubleshooting', 'Hardware repair'],
    },
    {
      employeeCode: 'EMP007',
      firstName: 'Naruemon',
      lastName: 'Pansri',
      nickname: 'Mon',
      position: 'Software Developer',
      departmentId: dept.IT._id,
      managerId: itManager._id,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      workEmail: 'naruemon.p@example.com',
      extension: '1203',
      officeLocation: 'Building A, 3rd Floor',
      bio: 'Builds and maintains internal web applications.',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    },
    {
      employeeCode: 'EMP008',
      firstName: 'Thanakorn',
      lastName: 'Boonmee',
      nickname: 'Korn',
      position: 'HR Officer',
      departmentId: dept.HR._id,
      managerId: hrManager._id,
      profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      workEmail: 'thanakorn.b@example.com',
      extension: '1102',
      officeLocation: 'Building A, 2nd Floor',
      bio: 'Handles internship paperwork and new joiner orientation.',
      skills: ['Documentation', 'Orientation'],
    },
    {
      employeeCode: 'EMP009',
      firstName: 'Chalisa',
      lastName: 'Nimnual',
      nickname: 'Lisa',
      position: 'Marketing Executive',
      departmentId: dept.MKT._id,
      managerId: mktManager._id,
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      workEmail: 'chalisa.n@example.com',
      extension: '1302',
      officeLocation: 'Building B, 2nd Floor',
      bio: 'Produces campaign content and manages social channels.',
      skills: ['Content writing', 'Social media'],
    },
    {
      employeeCode: 'EMP010',
      firstName: 'Peerapat',
      lastName: 'Sukjai',
      nickname: 'Pat',
      position: 'Sales Executive',
      departmentId: dept.SALES._id,
      managerId: salesManager._id,
      profileImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      workEmail: 'peerapat.s@example.com',
      extension: '1402',
      officeLocation: 'Building B, 1st Floor',
      bio: 'Supports dealer accounts in the central region.',
      skills: ['Account management', 'Customer service'],
    },
  ]);

  // Wire each department to its manager now that the employees exist.
  await Promise.all([
    Department.findByIdAndUpdate(dept.EXEC._id, { managerId: president._id }),
    Department.findByIdAndUpdate(dept.HR._id, { managerId: hrManager._id }),
    Department.findByIdAndUpdate(dept.IT._id, { managerId: itManager._id }),
    Department.findByIdAndUpdate(dept.MKT._id, { managerId: mktManager._id }),
    Department.findByIdAndUpdate(dept.SALES._id, { managerId: salesManager._id }),
  ]);

  const all = [president, ...managers, ...staff];
  const byCode = Object.fromEntries(all.map((e) => [e.employeeCode, e]));
  log(`  created ${all.length} employees across 3 reporting levels`);
  return byCode;
};

const seedBatches = async () => {
  section('Seeding intern batches');
  const batches = await InternBatch.create([
    {
      code: '2025/02',
      title: 'Internship Batch 2025/02',
      year: 2025,
      sequence: 2,
      startDate: new Date('2025-06-02'),
      endDate: new Date('2025-08-29'),
      description: 'Completed batch. Archived for knowledge transfer.',
    },
    {
      code: '2026/01',
      title: 'Internship Batch 2026/01',
      year: 2026,
      sequence: 1,
      startDate: new Date('2026-08-03'),
      endDate: new Date('2026-10-30'),
      description: 'Current batch working across IT, HR, and Marketing.',
    },
    {
      code: '2026/02',
      title: 'Internship Batch 2026/02',
      year: 2026,
      sequence: 2,
      startDate: new Date('2026-11-02'),
      endDate: new Date('2027-01-29'),
      description: 'Upcoming batch. Placements being confirmed.',
    },
  ]);

  const byCode = Object.fromEntries(batches.map((b) => [b.code, b]));
  log(`  created ${batches.length} batches (completed / active / upcoming)`);
  return byCode;
};

const seedInterns = async (dept, emp, batch) => {
  section('Seeding interns');
  const interns = await Intern.create([
    // Completed batch 2025/02
    {
      firstName: 'Nattapong',
      lastName: 'Chanthara',
      nickname: 'Nat',
      university: "King Mongkut's University of Technology Thonburi (KMUTT)",
      faculty: 'School of Information Technology',
      major: 'Computer Science',
      year: 4,
      age: 22,
      departmentId: dept.IT._id,
      mentorId: emp.EMP006._id,
      batchId: batch['2025/02']._id,
      startDate: new Date('2025-06-02'),
      endDate: new Date('2025-08-29'),
      profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      shortBio: 'Worked with the IT support team on asset tracking.',
      projectTitle: 'IT Asset Tracking Spreadsheet Automation',
      lessonsLearned: 'Documenting a process before automating it saves a lot of rework.',
      adviceForNextBatch: 'Ask the support team to shadow real tickets in your first week.',
      privacyConsent: true,
    },
    {
      firstName: 'Supattra',
      lastName: 'Meesuk',
      nickname: 'Su',
      university: 'Kasetsart University',
      faculty: 'Faculty of Business Administration',
      major: 'Human Resource Management',
      year: 4,
      age: 21,
      departmentId: dept.HR._id,
      mentorId: emp.EMP008._id,
      batchId: batch['2025/02']._id,
      startDate: new Date('2025-06-02'),
      endDate: new Date('2025-08-29'),
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      shortBio: 'Supported orientation sessions for new joiners.',
      projectTitle: 'New Joiner Orientation Checklist',
      lessonsLearned: 'New employees ask the same ten questions - write them down once.',
      adviceForNextBatch: 'Keep a daily log; it makes the final report much easier.',
      privacyConsent: true,
    },

    // Active batch 2026/01
    {
      firstName: 'Krittapas',
      lastName: 'Thipsang',
      nickname: 'Krit',
      university: "King Mongkut's Institute of Technology Ladkrabang (KMITL)",
      faculty: 'Faculty of Information Technology',
      major: 'Software Engineering',
      year: 4,
      age: 22,
      departmentId: dept.IT._id,
      mentorId: emp.EMP007._id,
      batchId: batch['2026/01']._id,
      startDate: new Date('2026-08-03'),
      endDate: new Date('2026-10-30'),
      profileImage: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
      shortBio: 'Building the internal newcomer portal and interactive collaboration features.',
      projectTitle: 'FTI Welcome Hub - Internal Onboarding Portal',
      privacyConsent: true,
    },
    {
      firstName: 'Pimchanok',
      lastName: 'Sirirat',
      nickname: 'Pim',
      university: 'Chulalongkorn University',
      faculty: 'Faculty of Engineering',
      major: 'Computer Engineering',
      year: 3,
      age: 21,
      departmentId: dept.IT._id,
      mentorId: emp.EMP006._id,
      batchId: batch['2026/01']._id,
      startDate: new Date('2026-08-03'),
      endDate: new Date('2026-10-30'),
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      shortBio: 'Assisting with the IT knowledge base and user support systems.',
      projectTitle: 'IT Self-Service Knowledge Base',
      privacyConsent: true,
    },
    {
      firstName: 'Jirawat',
      lastName: 'Puangchan',
      nickname: 'Jira',
      university: 'Thammasat University',
      faculty: 'Thammasat Business School',
      major: 'Marketing',
      year: 4,
      age: 22,
      departmentId: dept.MKT._id,
      mentorId: emp.EMP009._id,
      batchId: batch['2026/01']._id,
      startDate: new Date('2026-08-03'),
      endDate: new Date('2026-10-30'),
      profileImage: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=400&q=80',
      shortBio: 'Supporting campaign content production and digital communications.',
      projectTitle: 'Product Launch Content Calendar',
      privacyConsent: false,
    },
    {
      firstName: 'Kanyarat',
      lastName: 'Duangdee',
      nickname: 'Kan',
      university: 'Srinakharinwirot University (SWU)',
      faculty: 'Faculty of Social Sciences',
      major: 'Human Resource Management',
      year: 3,
      age: 20,
      departmentId: dept.HR._id,
      mentorId: emp.EMP008._id,
      batchId: batch['2026/01']._id,
      startDate: new Date('2026-08-03'),
      endDate: new Date('2026-10-30'),
      profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      shortBio: 'Helping organise the onboarding document library and activities.',
      projectTitle: 'Onboarding Document Library',
      privacyConsent: true,
    },

    // Upcoming batch 2026/02
    {
      firstName: 'Teerapat',
      lastName: 'Wongsiri',
      nickname: 'Tee',
      university: 'Mahidol University',
      faculty: 'Faculty of Information and Communication Technology',
      major: 'Computer Science',
      year: 3,
      departmentId: dept.IT._id,
      mentorId: emp.EMP007._id,
      batchId: batch['2026/02']._id,
      startDate: new Date('2026-11-02'),
      endDate: new Date('2027-01-29'),
      profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      shortBio: 'Placement confirmed for the development team.',
      privacyConsent: false,
    },
    {
      firstName: 'Arisara',
      lastName: 'Kaewkla',
      nickname: 'Ari',
      university: 'Chiang Mai University',
      faculty: 'Faculty of Engineering',
      major: 'Industrial Engineering',
      year: 4,
      departmentId: dept.SALES._id,
      mentorId: emp.EMP010._id,
      batchId: batch['2026/02']._id,
      startDate: new Date('2026-11-02'),
      endDate: new Date('2027-01-29'),
      profileImage: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80',
      shortBio: 'Placement confirmed for the sales support team.',
      privacyConsent: false,
    },
  ]);

  log(`  created ${interns.length} interns across 3 batches`);
  return interns;
};

const seedUsers = async (emp, interns) => {
  section('Seeding users');
  const internByNickname = Object.fromEntries(interns.map((i) => [i.nickname.toLowerCase(), i]));

  const users = await User.create([
    // Standard test accounts (convenience aliases)
    {
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: DEV_PASSWORD,
      role: 'super_admin',
      employeeId: emp.EMP003._id,
    },
    {
      username: 'admin',
      email: 'admin@example.com',
      password: DEV_PASSWORD,
      role: 'admin',
      employeeId: emp.EMP002._id,
    },
    {
      username: 'editor',
      email: 'editor@example.com',
      password: DEV_PASSWORD,
      role: 'editor',
      employeeId: emp.EMP009._id,
    },
    {
      username: 'staff',
      email: 'staff@example.com',
      password: DEV_PASSWORD,
      role: 'staff',
      employeeId: emp.EMP006._id,
    },
    {
      username: 'intern',
      email: 'intern@example.com',
      password: DEV_PASSWORD,
      role: 'intern',
      internId: internByNickname['krit']?._id ?? null,
    },

    // 1:1 Accounts for all Employees
    {
      username: 'somchai',
      email: 'somchai.w@example.com',
      password: DEV_PASSWORD,
      role: 'admin',
      employeeId: emp.EMP001._id,
    },
    {
      username: 'pornthip',
      email: 'pornthip.s@example.com',
      password: DEV_PASSWORD,
      role: 'admin',
      employeeId: emp.EMP002._id,
    },
    {
      username: 'anucha',
      email: 'anucha.r@example.com',
      password: DEV_PASSWORD,
      role: 'super_admin',
      employeeId: emp.EMP003._id,
    },
    {
      username: 'wichai',
      email: 'wichai.t@example.com',
      password: DEV_PASSWORD,
      role: 'staff',
      employeeId: emp.EMP004._id,
    },
    {
      username: 'siriporn',
      email: 'siriporn.c@example.com',
      password: DEV_PASSWORD,
      role: 'staff',
      employeeId: emp.EMP005._id,
    },
    {
      username: 'kittipong',
      email: 'kittipong.s@example.com',
      password: DEV_PASSWORD,
      role: 'staff',
      employeeId: emp.EMP006._id,
    },
    {
      username: 'naruemon',
      email: 'naruemon.p@example.com',
      password: DEV_PASSWORD,
      role: 'staff',
      employeeId: emp.EMP007._id,
    },
    {
      username: 'thanakorn',
      email: 'thanakorn.b@example.com',
      password: DEV_PASSWORD,
      role: 'staff',
      employeeId: emp.EMP008._id,
    },
    {
      username: 'chalisa',
      email: 'chalisa.n@example.com',
      password: DEV_PASSWORD,
      role: 'editor',
      employeeId: emp.EMP009._id,
    },
    {
      username: 'peerapat',
      email: 'peerapat.s@example.com',
      password: DEV_PASSWORD,
      role: 'staff',
      employeeId: emp.EMP010._id,
    },

    // 1:1 Accounts for all Interns
    {
      username: 'krit',
      email: 'krit.t@example.com',
      password: DEV_PASSWORD,
      role: 'intern',
      internId: internByNickname['krit']?._id ?? null,
    },
    {
      username: 'pim',
      email: 'pim.s@example.com',
      password: DEV_PASSWORD,
      role: 'intern',
      internId: internByNickname['pim']?._id ?? null,
    },
    {
      username: 'jira',
      email: 'jira.p@example.com',
      password: DEV_PASSWORD,
      role: 'intern',
      internId: internByNickname['jira']?._id ?? null,
    },
    {
      username: 'kan',
      email: 'kan.d@example.com',
      password: DEV_PASSWORD,
      role: 'intern',
      internId: internByNickname['kan']?._id ?? null,
    },
    {
      username: 'nat',
      email: 'nat.c@example.com',
      password: DEV_PASSWORD,
      role: 'intern',
      internId: internByNickname['nat']?._id ?? null,
    },
    {
      username: 'supattra',
      email: 'supattra.m@example.com',
      password: DEV_PASSWORD,
      role: 'intern',
      internId: internByNickname['su']?._id ?? null,
    },
    {
      username: 'tee',
      email: 'tee.w@example.com',
      password: DEV_PASSWORD,
      role: 'intern',
      internId: internByNickname['tee']?._id ?? null,
    },
    {
      username: 'ari',
      email: 'ari.k@example.com',
      password: DEV_PASSWORD,
      role: 'intern',
      internId: internByNickname['ari']?._id ?? null,
    },
  ]);

  const byRole = {};
  const byUsername = {};
  users.forEach((u) => {
    byUsername[u.username] = u;
    if (!byRole[u.role]) byRole[u.role] = u;
  });
  byRole.admin = byUsername['admin'] || byUsername['pornthip'];
  byRole.super_admin = byUsername['superadmin'] || byUsername['anucha'];
  byRole.staff = byUsername['staff'] || byUsername['kittipong'];
  byRole.intern = byUsername['intern'] || byUsername['krit'];
  byRole.editor = byUsername['editor'] || byUsername['chalisa'];

  log(`  created ${users.length} users (1:1 with all employees and interns + aliases)`);
  return { ...byRole, byUsername, allUsers: users };
};

const seedPolicies = async (users) => {
  section('Seeding policies');
  const policies = await Policy.create([
    {
      title: 'Dress Code',
      summary: 'Smart casual on weekdays. Company polo shirt on Fridays.',
      content:
        'Employees and interns are expected to dress in smart casual attire. ' +
        'Closed shoes are required in warehouse and production areas. ' +
        'Company polo shirts may be worn on Fridays.',
      category: 'dress_code',
      priority: 6,
      version: '1.0',
      effectiveDate: new Date('2026-01-05'),
      status: 'published',
      updatedBy: users.admin._id,
    },
    {
      title: 'Working Hours and Attendance',
      summary: 'Standard hours are 08:30 to 17:30, Monday to Friday.',
      content:
        'Standard working hours are 08:30 to 17:30 with a one hour lunch break. ' +
        'Interns should record arrival and departure times with their mentor. ' +
        'Notify your supervisor in advance if you will be late.',
      category: 'working_hours',
      priority: 8,
      version: '1.1',
      effectiveDate: new Date('2026-01-05'),
      status: 'published',
      updatedBy: users.admin._id,
    },
    {
      title: 'Leave and University Absence',
      summary: 'Submit leave requests to your mentor and HR at least one day ahead.',
      content:
        'Interns who must attend university activities should inform their mentor ' +
        'and the HR department at least one working day in advance. ' +
        'Supporting documents from the university may be requested.',
      category: 'leave',
      priority: 7,
      version: '1.0',
      effectiveDate: new Date('2026-01-05'),
      status: 'published',
      updatedBy: users.admin._id,
    },
    {
      title: 'Acceptable Use of Company Computers',
      summary: 'Company equipment is for work purposes. Install software only via IT.',
      content:
        'Company computers and accounts are provided for work purposes. ' +
        'Do not install software without an approved request to the IT department. ' +
        'Do not share your account credentials with anyone, including colleagues.',
      category: 'computer_use',
      priority: 9,
      version: '1.2',
      effectiveDate: new Date('2026-02-02'),
      status: 'published',
      updatedBy: users.super_admin._id,
    },
    {
      title: 'Confidentiality and Data Privacy',
      summary: 'Do not disclose internal information outside the company.',
      content:
        'Information accessed during your work or internship must not be disclosed ' +
        'outside the company without approval. This includes documents, customer ' +
        'details, and internal system information. Personal data must be handled ' +
        'according to company privacy practices.',
      category: 'confidentiality',
      priority: 10,
      version: '1.0',
      effectiveDate: new Date('2026-01-05'),
      status: 'published',
      updatedBy: users.super_admin._id,
    },
    {
      title: 'Photography in Company Areas',
      summary: 'Ask permission before photographing work areas.',
      content:
        'Ask your supervisor before taking photographs in production, warehouse, ' +
        'or office areas. Do not post photographs of internal areas or documents ' +
        'on social media.',
      category: 'photography',
      priority: 4,
      version: '1.0',
      effectiveDate: new Date('2026-01-05'),
      status: 'draft',
      updatedBy: users.editor._id,
    },
  ]);

  log(`  created ${policies.length} policies (5 published, 1 draft)`);
  return policies;
};

const seedFaqs = async () => {
  section('Seeding FAQ');
  const faqs = await FAQ.create([
    {
      question: 'What time should I arrive on my first day?',
      answer:
        'Please arrive by 08:30 and report to the reception desk in Building A. ' +
        'An HR officer will meet you there.',
      category: 'first_day',
      tags: ['first day', 'arrival', 'reception'],
      sortOrder: 1,
    },
    {
      question: 'Where do I park?',
      answer:
        'Staff and intern parking is available in the rear car park. ' +
        'Register your vehicle with the reception desk on your first day.',
      category: 'facilities',
      tags: ['parking', 'first day'],
      sortOrder: 2,
    },
    {
      question: 'What should I wear?',
      answer:
        'Smart casual attire. Closed shoes are required if you will visit the ' +
        'warehouse or production area. See the Dress Code policy for details.',
      category: 'first_day',
      tags: ['dress code', 'clothing'],
      sortOrder: 3,
    },
    {
      question: 'How do I get Wi-Fi access?',
      answer:
        'Submit a request to the IT department through your mentor. ' +
        'IT will provide guest or staff network access depending on your role.',
      category: 'it',
      tags: ['wifi', 'network', 'access'],
      sortOrder: 4,
    },
    {
      question: 'My computer has a problem. Who do I contact?',
      answer:
        'Contact IT Support at extension 1202, or check the IT Help Center in this ' +
        'portal for common fixes before raising a request.',
      category: 'it',
      tags: ['computer', 'support', 'help'],
      sortOrder: 5,
    },
    {
      question: 'The printer is not working. What should I check?',
      answer:
        'Check that the printer is powered on, that you selected the correct printer, ' +
        'and that there is no paper jam. See the IT Help Center printer article for ' +
        'the full checklist.',
      category: 'it',
      tags: ['printer', 'troubleshooting'],
      sortOrder: 6,
    },
    {
      question: 'I need to attend a university activity. Who do I tell?',
      answer:
        'Inform your mentor and the HR department at least one working day in advance.',
      category: 'hr',
      tags: ['leave', 'university'],
      sortOrder: 7,
    },
    {
      question: 'Where is the canteen?',
      answer:
        'The canteen is on the ground floor of Building B and is open from 11:30 to 13:30.',
      category: 'facilities',
      tags: ['canteen', 'food', 'lunch'],
      sortOrder: 8,
    },
  ]);

  log(`  created ${faqs.length} FAQ entries`);
  return faqs;
};

const seedArticles = async (users) => {
  section('Seeding knowledge articles and topics');

  // 1. Getting started onboarding guides
  const guideArticles = [
    {
      title: 'Your First Day at FTI',
      slug: 'your-first-day-at-fti',
      category: 'getting_started',
      subcategory: 'first_day',
      summary: 'What to bring, where to go, and who to meet on day one.',
      content:
        '1. Arrive by 08:30 and report to reception in Building A.\n' +
        '2. Bring your student ID card and internship documents.\n' +
        '3. An HR officer will complete your registration and issue a visitor pass.\n' +
        '4. You will be introduced to your department and mentor.\n' +
        '5. Register your vehicle if you drove to the office.',
      tags: ['first day', 'onboarding'],
      sortOrder: 1,
      status: 'published',
      authorId: users.admin._id,
    },
    {
      title: 'Your First Week',
      slug: 'your-first-week',
      category: 'getting_started',
      subcategory: 'first_week',
      summary: 'Account setup, department introductions, and finding help.',
      content:
        '1. Request your computer and account access through your mentor.\n' +
        '2. Meet the team members you will work with day to day.\n' +
        '3. Read the policies section of this portal.\n' +
        '4. Learn who to contact for IT, HR, and administrative questions.\n' +
        '5. Agree on your project scope and weekly check-in time with your mentor.',
      tags: ['first week', 'onboarding', 'accounts'],
      sortOrder: 2,
      status: 'published',
      authorId: users.admin._id,
    },
    {
      title: 'Before Your Internship Ends',
      slug: 'before-your-internship-ends',
      category: 'getting_started',
      subcategory: 'before_leaving',
      summary: 'Handover, documentation, and returning equipment.',
      content:
        '1. Hand over your work and document what you completed.\n' +
        '2. Submit source code and documentation to your mentor.\n' +
        '3. Return any borrowed equipment and access cards.\n' +
        '4. Complete the internship evaluation form.\n' +
        '5. Add your lessons learned so the next batch can benefit.',
      tags: ['handover', 'offboarding'],
      sortOrder: 3,
      status: 'published',
      authorId: users.admin._id,
    },
  ];

  await KnowledgeArticle.create(guideArticles);
  log(`  created ${guideArticles.length} getting started onboarding articles`);

  // 2. Knowledge Topics from mockItKnowledgeData
  const topicMap = new Map();
  const itManagerId = users.anucha?._id || users.admin._id;

  for (const t of MOCK_TOPICS) {
    const topic = await KnowledgeTopic.create({
      name: t.name,
      slug: t.slug,
      icon: t.icon,
      description: t.description,
      category: 'it_help',
      sortOrder: t.sortOrder,
      createdBy: itManagerId,
    });
    topicMap.set(t.slug, topic);
  }

  // Link child topics to parent topics
  for (const t of MOCK_TOPICS) {
    if (t.parentSlug && topicMap.has(t.parentSlug)) {
      const child = topicMap.get(t.slug);
      const parent = topicMap.get(t.parentSlug);
      child.parentId = parent._id;
      await child.save();
    }
  }
  log(`  created ${MOCK_TOPICS.length} hierarchical knowledge topics`);

  // 3. IT Knowledge Articles from mockItKnowledgeData
  const createdArticles = [];
  const itAuthorId = users.kittipong?._id || users.anucha?._id || users.admin._id;

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
      tags: art.tags || [],
      isQuickLink: art.isQuickLink || false,
      quickLinkOrder: art.quickLinkOrder || 0,
      sortOrder: 0,
      status: 'published',
      authorId: itAuthorId,
    });
    createdArticles.push(created);
  }
  log(`  created ${createdArticles.length} comprehensive IT knowledge articles`);

  // 4. Interlink related articles for Obsidian Graph View
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
  log(`  linked ${LINK_PAIRS.length} article pairs for 360° Obsidian Graph View`);

  return createdArticles;
};

const seedCompanyInfo = async (users) => {
  section('Seeding company information');
  const company = await CompanyInfo.create({
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
    updatedBy: users.admin._id,
  });
  log(`  created company profile: ${company.name}`);
  return company;
};

const seedAnnouncements = async (users) => {
  section('Seeding announcements');
  const now = Date.now();
  const days = (n) => new Date(now + n * 24 * 60 * 60 * 1000);

  const announcements = await Announcement.create([
    {
      title: 'Welcome to Internship Batch 2026/01',
      summary: 'ยินดีต้อนรับนักศึกษาฝึกงานรุ่นใหม่ 2026/01 เข้าสู่ครอบครัว FTI อย่างเป็นทางการ พร้อมเริ่มกิจกรรมปฐมนิเทศสัปดาห์นี้',
      content:
        'ขอต้อนรับนักศึกษาฝึกงานรุ่นใหม่ประจำปี 2026 เข้าสู่ครอบครัว FTI อย่างอบอุ่น ทุกท่านสามารถดูโปรไฟล์เพื่อนร่วมรุ่นและทำความคุ้นเคยกับระบบพอร์ทัลผ่านเมนูต่างๆ ได้ทันที ขอให้ทุกคนได้รับประสบการณ์และการเรียนรู้ที่ยอดเยี่ยมตลอดการฝึกงาน!',
      coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      category: 'welcome',
      priority: 5,
      targetRoles: [],
      publishAt: days(-14),
      isPinned: true,
      status: 'published',
      authorId: users.admin._id,
    },
    {
      title: 'Portal Maintenance & Infrastructure Upgrade',
      summary: 'แจ้งกำหนดการปิดปรับปรุงและอัปเกรดระบบเครือข่ายเซิร์ฟเวอร์ วันเสาร์นี้เวลา 20:00 - 22:00 น.',
      content:
        'ฝ่ายเทคโนโลยีสารสนเทศจะดำเนินการปิดปรับปรุงเซิร์ฟเวอร์และบำรุงรักษาระบบฐานข้อมูลในวันเสาร์นี้ ระหว่างเวลา 20:00 - 22:00 น. ในช่วงเวลาดังกล่าว พอร์ทัลอาจไม่สามารถเข้าใช้งานได้ชั่วคราว จึงขออภัยในความไม่สะดวกมา ณ ที่นี้',
      coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      category: 'maintenance',
      priority: 3,
      targetRoles: [],
      publishAt: days(-2),
      expireAt: days(5),
      status: 'published',
      authorId: users.superadmin?._id || users.admin._id,
    },
    {
      title: 'Intern Orientation & Welcome Camp Session',
      summary: 'กิจกรรมปฐมนิเทศและอบรมการใช้เครื่องมือการทำงานสำหรับนักศึกษาฝึกงาน วันศุกร์นี้ ณ ห้องประชุม A ชั้น 2',
      content:
        'ขอเชิญนักศึกษาฝึกงานทุกท่านเข้าร่วมกิจกรรมปฐมนิเทศ ณ ห้องประชุม A ชั้น 2 ในวันศุกร์นี้ เวลา 09:00 - 12:00 น. โดยจะมีการแนะนำวัฒนธรรมองค์กร การใช้เครื่องมือสื่อสารภายใน และพบปะกับพี่เลี้ยงประจำแต่ละฝ่าย',
      coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      category: 'event',
      priority: 6,
      targetRoles: [],
      publishAt: days(-5),
      expireAt: days(10),
      isPinned: true,
      status: 'published',
      authorId: users.admin._id,
    },
    {
      title: 'IT Security Awareness & Cybersecurity 2026',
      summary: 'หลักสูตรอบรมความปลอดภัยไซเบอร์ภาคบังคับสำหรับพนักงานและนักศึกษาฝึกงานทุกคน ผ่านระบบ E-Learning',
      content:
        'เพื่อยกระดับความปลอดภัยข้อมูลองค์กรตามมาตรฐาน ISO 27001 และ PDPA ขอให้บุคลากรทุกท่านเข้าเรียนหลักสูตรความปลอดภัยไซเบอร์ การป้องกันการโจมตี Phishing และการตั้งรหัสผ่าน 2FA ให้เสร็จสิ้นภายในสิ้นเดือนนี้',
      coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
      category: 'training',
      priority: 4,
      targetRoles: [],
      publishAt: days(-1),
      status: 'published',
      authorId: users.superadmin?._id || users.admin._id,
    },
    {
      title: 'Public Holiday Notice & Office Schedule',
      summary: 'แจ้งวันหยุดทำการสำนักงานเนื่องในวันหยุดนักขัตฤกษ์ และการเปิดทำการตามปกติในวันถัดไป',
      content:
        'สำนักงาน FTI จะหยุดทำการเนื่องในวันหยุดนักขัตฤกษ์ และจะเปิดทำการตามปกติในวันทำการถัดไป ในช่วงวันหยุด ระบบ Smart Floor Plan และกล้องวงจรปิดยังคงบันทึกข้อมูลตามมาตรฐานความปลอดภัย หากมีเหตุฉุกเฉินสามารถติดต่อสายด่วนเจ้าหน้าที่รักษาความปลอดภัยได้ตลอด 24 ชั่วโมง',
      coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      category: 'holiday',
      priority: 2,
      targetRoles: [],
      publishAt: days(-3),
      expireAt: days(20),
      status: 'published',
      authorId: users.admin._id,
    },
    {
      title: 'Annual Innovation Showcase & Townhall 2026',
      summary: 'งานนำเสนอผลงานนวัตกรรมและโปรเจกต์ประจำปีของบุคลากร FTI พร้อมเวทีทาวน์ฮอลล์พบผู้บริหาร',
      content:
        'เตรียมพบกับงาน FTI Innovation Showcase 2026 ที่จะเปิดโอกาสให้ทุกแผนกและน้องๆ นักศึกษาฝึกงานได้นำเสนอผลงานโปรเจกต์ดีเด่น พร้อมรับฟังวิสัยทัศน์องค์กรและถาม-ตอบกับผู้บริหารแบบเป็นกันเอง',
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      category: 'news',
      priority: 4,
      targetRoles: [],
      publishAt: days(-1),
      expireAt: days(30),
      status: 'published',
      authorId: users.editor?._id || users.admin._id,
    },
  ]);

  log(`  created ${announcements.length} announcements with high-res cover posters`);
  return announcements;
};

const seedFeedback = async (users) => {
  section('Seeding feedback');
  const feedback = await Feedback.create([
    {
      userId: users.intern._id,
      category: 'missing_information',
      message: 'I could not find information about where to collect my visitor pass.',
      rating: 3,
      status: 'pending',
    },
    {
      userId: users.intern._id,
      category: 'unclear_guide',
      message: 'The Wi-Fi article does not say which network name to choose.',
      rating: 4,
      status: 'in_review',
      adminNote: 'Assigned to IT to clarify the network naming.',
    },
    {
      userId: users.staff._id,
      category: 'suggestion',
      message: 'It would help to have a printer location map on the facilities page.',
      rating: 5,
      status: 'resolved',
      adminNote: 'Added to the facilities article.',
      resolvedBy: users.admin._id,
      resolvedAt: new Date(),
    },
  ]);

  log(`  created ${feedback.length} feedback entries`);
  return feedback;
};

const seedConversationsAndMessages = async (users) => {
  section('Seeding mock chat conversations and messages');
  const { byUsername, allUsers } = users;
  const allUserIds = allUsers.map((u) => u._id);

  const uKrit = byUsername['krit'] || byUsername['intern'];
  const uKit = byUsername['kittipong'] || byUsername['staff'];
  const uThip = byUsername['pornthip'] || byUsername['admin'];
  const uNu = byUsername['anucha'] || byUsername['superadmin'];
  const uPim = byUsername['pim'];
  const uLisa = byUsername['chalisa'] || byUsername['editor'];
  const uChai = byUsername['somchai'];
  const uKorn = byUsername['thanakorn'];
  const uKan = byUsername['kan'];
  const uJira = byUsername['jira'];

  // 1. Channel: #ห้องคุยทั่วไป-FTI-Lounge
  const generalChannel = await Conversation.create({
    type: 'channel',
    title: 'ห้องคุยทั่วไป (FTI Lounge)',
    icon: '💬',
    description: 'พื้นที่พูดคุยทั่วไป ทักทาย และแลกเปลี่ยนข่าวสารสำหรับชาว FTI ทุกคน',
    participants: allUserIds,
    unreadCounts: Object.fromEntries(allUserIds.map((id) => [id.toString(), 0])),
  });

  const generalMsgs = [
    {
      sender: uChai,
      content: 'สวัสดีตอนเช้าทีมงาน FTI ทุกท่านครับ ขอให้สัปดาห์นี้การทำงานราบรื่นและประสบความสำเร็จครับ 🙏',
      offsetMinutes: 120,
    },
    {
      sender: uThip,
      content: 'สวัสดีค่ะคุณสมชาย และยินดีต้อนรับน้องๆ นักศึกษาฝึกงาน Batch 2026/01 ทุกท่านอย่างเป็นทางการนะคะ 🎉',
      offsetMinutes: 110,
    },
    {
      sender: uNu,
      content: 'สวัสดีครับทุกคน ระบบเครือข่ายและระบบภายในตึก A และ B พร้อมใช้งานเต็มรูปแบบ หากใครพบปัญหาแจ้งที่ศูนย์ช่วยเหลือไอทีได้ตลอดนะครับ ⚡',
      offsetMinutes: 90,
    },
    {
      sender: uKit,
      content: 'ยินดีต้อนรับน้องๆ ครับ เที่ยงนี้มีร้านอาหารแนะนำข้างตึก B รสชาติดีมาก ใครว่างไปทานด้วยกันได้นะครับ 🍛',
      offsetMinutes: 75,
    },
    {
      sender: uKrit,
      content: 'ขอบคุณพี่ๆ ทุกคนมากครับ ฝากเนื้อฝากตัวกับพี่ๆ ทีม FTI ด้วยนะครับผม 😊',
      offsetMinutes: 60,
    },
    {
      sender: uPim,
      content: 'สวัสดีค่ะพี่ๆ ขอบคุณสำหรับการต้อนรับที่อบอุ่นนะคะ 🙏✨',
      offsetMinutes: 50,
    },
    {
      sender: uLisa,
      content: 'บ่ายนี้มีขนมเบรคที่ห้องครัวชั้น 2 นะคะ แวะมาเติมพลังกันได้เลยจ้า ☕🥐',
      offsetMinutes: 20,
    },
  ];

  for (const m of generalMsgs) {
    if (!m.sender) continue;
    const createdAt = new Date(Date.now() - m.offsetMinutes * 60 * 1000);
    await ChatMessage.create({
      conversationId: generalChannel._id,
      senderId: m.sender._id,
      content: m.content,
      readBy: allUserIds,
      createdAt,
      updatedAt: createdAt,
    });
    generalChannel.lastMessage = {
      text: m.content,
      senderId: m.sender._id,
      createdAt,
    };
  }
  await generalChannel.save();

  // 2. Channel: #กลุ่มเด็กฝึกงาน-Batch-2026/01
  const internUserIds = [uKrit?._id, uPim?._id, uJira?._id, uKan?._id, uThip?._id, uKorn?._id, uKit?._id].filter(Boolean);
  const internChannel = await Conversation.create({
    type: 'channel',
    title: 'กลุ่มเด็กฝึกงาน (Batch 2026/01)',
    icon: '🎓',
    description: 'พื้นที่ประสานงาน ติดตามความก้าวหน้า และแลกเปลี่ยนของน้องๆ ฝึกงานรุ่น 2026/01',
    participants: internUserIds,
    unreadCounts: Object.fromEntries(internUserIds.map((id) => [id.toString(), 0])),
  });

  const internMsgs = [
    {
      sender: uThip,
      content: 'น้องๆ Batch 2026/01 ทุกคน อย่าลืมส่งแบบฟอร์มเอกสารรายงานตัวฝึกงานภายในวันศุกร์นี้นะคะ 📄',
      offsetMinutes: 180,
    },
    {
      sender: uKorn,
      content: 'ใครที่เอกสารมหาวิทยาลัยยังไม่เรียบร้อย มาติดต่อพี่กรที่โต๊ะ HR ตึก A ชั้น 2 ได้เลยนะครับ ยินดีให้คำแนะนำครับ',
      offsetMinutes: 160,
    },
    {
      sender: uKan,
      content: 'รับทราบค่ะพี่กร กานต์นำส่งเอกสารเรียบร้อยแล้วค่ะ ขอบคุณมากนะคะ',
      offsetMinutes: 140,
    },
    {
      sender: uJira,
      content: 'ของผมกำลังรอตราประทับจากคณะ จะรีบนำส่งให้ภายในวันพรุ่งนี้ครับพี่กร',
      offsetMinutes: 120,
    },
    {
      sender: uKit,
      content: 'น้องกฤตและน้องพิมพ์ วันนี้เราจะมี Standup สรุปงานระบบ Welcome Hub เวลา 14:00 น. ที่ห้องประชุม IT นะครับ',
      offsetMinutes: 45,
    },
    {
      sender: uKrit,
      content: 'รับทราบครับพี่กิตติพงษ์ ตอนนี้เตรียมสรุปหัวข้อและเดโมระบบเรียบร้อยครับ 💻🚀',
      offsetMinutes: 30,
    },
    {
      sender: uPim,
      content: 'รับทราบค่ะ พร้อมเข้าร่วมประชุมค่ะ 👍',
      offsetMinutes: 25,
    },
  ];

  for (const m of internMsgs) {
    if (!m.sender) continue;
    const createdAt = new Date(Date.now() - m.offsetMinutes * 60 * 1000);
    await ChatMessage.create({
      conversationId: internChannel._id,
      senderId: m.sender._id,
      content: m.content,
      readBy: internUserIds,
      createdAt,
      updatedAt: createdAt,
    });
    internChannel.lastMessage = {
      text: m.content,
      senderId: m.sender._id,
      createdAt,
    };
  }
  await internChannel.save();

  // 3. Support: IT Helpdesk
  const itSupportParticipants = Array.from(new Set([uKit?._id, uNu?._id, uKrit?._id, uPim?._id, uThip?._id].filter(Boolean)));
  const itSupport = await Conversation.create({
    type: 'support',
    supportDepartment: 'it',
    title: 'ศูนย์ช่วยเหลือไอที (IT Support)',
    icon: '💻',
    description: 'ช่องทางแจ้งปัญหาการใช้งานคอมพิวเตอร์ อุปกรณ์ไอที และเครือข่าย',
    participants: itSupportParticipants,
    unreadCounts: Object.fromEntries(itSupportParticipants.map((id) => [id.toString(), 0])),
  });

  const itMsgs = [
    {
      sender: uKrit,
      content: 'สวัสดีครับพี่ๆ ทีม IT ขอสอบถามขั้นตอนการขอสิทธิ์เข้าใช้งานระบบฐานข้อมูลการพัฒนาหน่อยครับ',
      offsetMinutes: 100,
    },
    {
      sender: uKit,
      content: 'สวัสดีครับน้องกฤต พี่อนุมัติสิทธิ์ในระบบเรียบร้อยแล้วครับ สามารถใช้ Connection String ในคู่มือทดสอบเชื่อมต่อได้เลยครับ 🛠️',
      offsetMinutes: 80,
    },
    {
      sender: uKrit,
      content: 'เชื่อมต่อฐานข้อมูลได้สำเร็จแล้วครับ ขอบคุณพี่กิตติพงษ์มากครับผม 🙏',
      offsetMinutes: 70,
    },
  ];

  for (const m of itMsgs) {
    if (!m.sender) continue;
    const createdAt = new Date(Date.now() - m.offsetMinutes * 60 * 1000);
    await ChatMessage.create({
      conversationId: itSupport._id,
      senderId: m.sender._id,
      content: m.content,
      readBy: itSupportParticipants,
      createdAt,
      updatedAt: createdAt,
    });
    itSupport.lastMessage = {
      text: m.content,
      senderId: m.sender._id,
      createdAt,
    };
  }
  await itSupport.save();

  // 4. Support: HR Support
  const hrSupportParticipants = Array.from(new Set([uThip?._id, uKorn?._id, uKrit?._id, uPim?._id, uKan?._id].filter(Boolean)));
  const hrSupport = await Conversation.create({
    type: 'support',
    supportDepartment: 'hr',
    title: 'ฝ่ายทรัพยากรบุคคล (HR Support)',
    icon: '👥',
    description: 'ปรึกษาเรื่องสวัสดิการ กฎระเบียบบริษัท และการลงเวลาปฏิบัติงาน',
    participants: hrSupportParticipants,
    unreadCounts: Object.fromEntries(hrSupportParticipants.map((id) => [id.toString(), 0])),
  });

  const hrMsgs = [
    {
      sender: uPim,
      content: 'ขอสอบถามเรื่องการขอหนังสือรับรองการฝึกงานสำหรับการเบิกเงินสนับสนุนของทางมหาวิทยาลัยค่ะ',
      offsetMinutes: 90,
    },
    {
      sender: uKorn,
      content: 'สามารถส่งแบบคำขอผ่านอีเมล hr@fti.or.th หรือติดต่อพี่กรได้เลยครับ ทางพี่จะออกเอกสารพร้อมตราประทับให้ภายใน 2 วันทำการครับ 📄',
      offsetMinutes: 65,
    },
    {
      sender: uPim,
      content: 'ได้รับข้อมูลครบถ้วนแล้วค่ะ ขอบคุณมากค่ะพี่กร 🙏',
      offsetMinutes: 50,
    },
  ];

  for (const m of hrMsgs) {
    if (!m.sender) continue;
    const createdAt = new Date(Date.now() - m.offsetMinutes * 60 * 1000);
    await ChatMessage.create({
      conversationId: hrSupport._id,
      senderId: m.sender._id,
      content: m.content,
      readBy: hrSupportParticipants,
      createdAt,
      updatedAt: createdAt,
    });
    hrSupport.lastMessage = {
      text: m.content,
      senderId: m.sender._id,
      createdAt,
    };
  }
  await hrSupport.save();

  // 5. Direct 1-on-1: Kittipong (IT Mentor) <-> Krit (IT Intern)
  if (uKit && uKrit) {
    const directKitKrit = await Conversation.create({
      type: 'direct',
      participants: [uKit._id, uKrit._id],
      unreadCounts: { [uKit._id.toString()]: 0, [uKrit._id.toString()]: 0 },
    });

    const directMsgs1 = [
      {
        sender: uKit,
        content: 'สวัสดีกฤต การเซ็ตอัพ Environment ในโปรเจกต์ Welcome Hub เรียบร้อยดีไหม ติดปัญหาเรื่อง Node หรือแพ็กเกจอะไรไหมครับ?',
        offsetMinutes: 150,
      },
      {
        sender: uKrit,
        content: 'เรียบร้อยดีครับพี่กิต รัน dev server ได้ปกติและเชื่อมต่อ MongoDB Atlas เรียบร้อยแล้วครับ 💻',
        offsetMinutes: 130,
      },
      {
        sender: uKit,
        content: 'เยี่ยมมากครับ ลองดูโครงสร้างของระบบแชทกับผังอาคาร (Floor Plan) ไว้นะ เดี๋ยวเรามาคุยต่อเรื่องการปรับปรุง UI ให้ทันสมัยขึ้นครับ',
        offsetMinutes: 60,
      },
      {
        sender: uKrit,
        content: 'รับทราบครับพี่กิต ตอนนี้กำลังพัฒนาส่วน Date Dividers, Read Receipts และกล่องส่งข้อความใหม่อยู่ครับผม 💪✨',
        offsetMinutes: 10,
      },
    ];

    for (const m of directMsgs1) {
      const createdAt = new Date(Date.now() - m.offsetMinutes * 60 * 1000);
      await ChatMessage.create({
        conversationId: directKitKrit._id,
        senderId: m.sender._id,
        content: m.content,
        readBy: [uKit._id, uKrit._id],
        createdAt,
        updatedAt: createdAt,
      });
      directKitKrit.lastMessage = {
        text: m.content,
        senderId: m.sender._id,
        createdAt,
      };
    }
    await directKitKrit.save();
  }

  // 6. Direct 1-on-1: Pornthip (HR Manager) <-> Krit (IT Intern)
  if (uThip && uKrit) {
    const directThipKrit = await Conversation.create({
      type: 'direct',
      participants: [uThip._id, uKrit._id],
      unreadCounts: { [uThip._id.toString()]: 0, [uKrit._id.toString()]: 0 },
    });

    const directMsgs2 = [
      {
        sender: uThip,
        content: 'สวัสดีจ้ะกฤต ได้รับคีย์การ์ดและบัตรประจำตัวนักศึกษาฝึกงานเรียบร้อยแล้วใช่ไหมคะ?',
        offsetMinutes: 200,
      },
      {
        sender: uKrit,
        content: 'ได้รับครบถ้วนเรียบร้อยแล้วครับพี่ทิพย์ ขอบคุณมากครับผม 🙏',
        offsetMinutes: 180,
      },
      {
        sender: uThip,
        content: 'ยินดีมากจ้ะ ขอให้สนุกกับการฝึกงานและการเรียนรู้นะคะ หากมีเรื่องอะไรให้ HR ช่วยเหลือแจ้งได้ตลอดเลยจ้ะ 😊',
        offsetMinutes: 120,
      },
    ];

    for (const m of directMsgs2) {
      const createdAt = new Date(Date.now() - m.offsetMinutes * 60 * 1000);
      await ChatMessage.create({
        conversationId: directThipKrit._id,
        senderId: m.sender._id,
        content: m.content,
        readBy: [uThip._id, uKrit._id],
        createdAt,
        updatedAt: createdAt,
      });
      directThipKrit.lastMessage = {
        text: m.content,
        senderId: m.sender._id,
        createdAt,
      };
    }
    await directThipKrit.save();
  }

  log('  created initial mock conversations and messages');
};

const printSummary = async () => {
  section('Verification');
  const counts = await Promise.all([
    User.countDocuments(),
    Department.countDocuments(),
    Employee.countDocuments(),
    InternBatch.countDocuments(),
    Intern.countDocuments(),
    Announcement.countDocuments(),
    Policy.countDocuments(),
    FAQ.countDocuments(),
    KnowledgeTopic.countDocuments(),
    KnowledgeArticle.countDocuments(),
    Feedback.countDocuments(),
    Conversation.countDocuments(),
    ChatMessage.countDocuments(),
  ]);

  const labels = [
    'Users',
    'Departments',
    'Employees',
    'Intern batches',
    'Interns',
    'Announcements',
    'Policies',
    'FAQ',
    'Knowledge topics',
    'Knowledge articles',
    'Feedback',
    'Conversations',
    'Chat messages',
  ];

  labels.forEach((label, index) => {
    log(`  ${label.padEnd(20)} ${counts[index]}`);
  });

  log('\n  Login accounts (all passwords: ' + DEV_PASSWORD + '):');
  log('  ┌──────────────┬──────────────┬───────────────────────────────┐');
  log('  │ username     │ role         │ linked person                 │');
  log('  ├──────────────┼──────────────┼───────────────────────────────┤');
  for (const [username, role, person] of [
    ['admin', 'admin', 'Pornthip Saelim (HR Manager)'],
    ['superadmin', 'super_admin', 'Anucha Rattanakul (IT Manager)'],
    ['staff', 'staff', 'Kittipong Sae-ung (IT Support)'],
    ['intern', 'intern', 'Krittapas Thipsang (IT Intern)'],
    ['editor', 'editor', 'Chalisa Nimnual (Marketing)'],
    ['somchai', 'admin', 'Somchai Wattana (President)'],
    ['pornthip', 'admin', 'Pornthip Saelim (HR Manager)'],
    ['anucha', 'super_admin', 'Anucha Rattanakul (IT Manager)'],
    ['kittipong', 'staff', 'Kittipong Sae-ung (IT Support)'],
    ['krit', 'intern', 'Krittapas Thipsang (IT Intern)'],
    ['pim', 'intern', 'Pimchanok Sirirat (IT Intern)'],
    ['jira', 'intern', 'Jirawat Puangchan (MKT Intern)'],
    ['kan', 'intern', 'Kanyarat Duangdee (HR Intern)'],
  ]) {
    log(`  │ ${username.padEnd(12)} │ ${role.padEnd(12)} │ ${person.padEnd(29)} │`);
  }
  log('  └──────────────┴──────────────┴───────────────────────────────┘');
};

const run = async () => {
  // Guard: never wipe a production database by accident.
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('✖ Refusing to seed with NODE_ENV=production. Pass --force to override.');
    process.exit(1);
  }

  log('');
  log('════════════════════════════════════════════════════');
  log('  FTI Welcome Hub - Database Seed');
  log('════════════════════════════════════════════════════');

  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    console.error('✖ No database connection. Check MONGO_URI in server/.env');
    process.exit(1);
  }

  try {
    await clearCollections();

    const dept = await seedDepartments();
    const emp = await seedEmployees(dept);
    const batch = await seedBatches();
    const interns = await seedInterns(dept, emp, batch);
    const users = await seedUsers(emp, interns);

    await seedPolicies(users);
    await seedFaqs();
    await seedArticles(users);
    await seedCompanyInfo(users);
    await seedAnnouncements(users);
    await seedFeedback(users);
    await seedConversationsAndMessages(users);

    await printSummary();

    log('\n✅ Seed completed successfully.\n');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✖ Seed failed:', error.message);
    if (error.errors) {
      for (const [field, detail] of Object.entries(error.errors)) {
        console.error(`   - ${field}: ${detail.message}`);
      }
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

run();
