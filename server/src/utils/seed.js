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
  KnowledgeArticle,
  CompanyInfo,
  Feedback,
  AuditLog,
} from '../models/index.js';

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
    KnowledgeArticle,
    CompanyInfo,
    Feedback,
    AuditLog,
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
      university: 'Example University of Technology',
      faculty: 'Faculty of Information Technology',
      major: 'Information Technology',
      year: 4,
      age: 22,
      departmentId: dept.IT._id,
      mentorId: emp.EMP006._id,
      batchId: batch['2025/02']._id,
      startDate: new Date('2025-06-02'),
      endDate: new Date('2025-08-29'),
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
      university: 'Example Rajabhat University',
      faculty: 'Faculty of Management Science',
      major: 'Human Resource Management',
      year: 4,
      age: 21,
      departmentId: dept.HR._id,
      mentorId: emp.EMP008._id,
      batchId: batch['2025/02']._id,
      startDate: new Date('2025-06-02'),
      endDate: new Date('2025-08-29'),
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
      university: 'Example University of Technology',
      faculty: 'Faculty of Information Technology',
      major: 'Information Technology',
      year: 4,
      age: 22,
      departmentId: dept.IT._id,
      mentorId: emp.EMP007._id,
      batchId: batch['2026/01']._id,
      startDate: new Date('2026-08-03'),
      endDate: new Date('2026-10-30'),
      shortBio: 'Building the internal newcomer portal.',
      projectTitle: 'FTI Welcome Hub - Internal Onboarding Portal',
      privacyConsent: true,
    },
    {
      firstName: 'Pimchanok',
      lastName: 'Sirirat',
      nickname: 'Pim',
      university: 'Example Technology Institute',
      faculty: 'Faculty of Engineering',
      major: 'Computer Engineering',
      year: 3,
      age: 21,
      departmentId: dept.IT._id,
      mentorId: emp.EMP006._id,
      batchId: batch['2026/01']._id,
      startDate: new Date('2026-08-03'),
      endDate: new Date('2026-10-30'),
      shortBio: 'Assisting with the IT knowledge base and user support.',
      projectTitle: 'IT Self-Service Knowledge Base',
      privacyConsent: true,
    },
    {
      firstName: 'Jirawat',
      lastName: 'Puangchan',
      nickname: 'Jira',
      university: 'Example Rajabhat University',
      faculty: 'Faculty of Management Science',
      major: 'Marketing',
      year: 4,
      age: 22,
      departmentId: dept.MKT._id,
      mentorId: emp.EMP009._id,
      batchId: batch['2026/01']._id,
      startDate: new Date('2026-08-03'),
      endDate: new Date('2026-10-30'),
      shortBio: 'Supporting campaign content production.',
      projectTitle: 'Product Launch Content Calendar',
      privacyConsent: false,
    },
    {
      firstName: 'Kanyarat',
      lastName: 'Duangdee',
      nickname: 'Kan',
      university: 'Example Business College',
      faculty: 'Faculty of Business Administration',
      major: 'Human Resource Management',
      year: 3,
      age: 20,
      departmentId: dept.HR._id,
      mentorId: emp.EMP008._id,
      batchId: batch['2026/01']._id,
      startDate: new Date('2026-08-03'),
      endDate: new Date('2026-10-30'),
      shortBio: 'Helping organise the onboarding document library.',
      projectTitle: 'Onboarding Document Library',
      privacyConsent: true,
    },

    // Upcoming batch 2026/02
    {
      firstName: 'Teerapat',
      lastName: 'Wongsiri',
      nickname: 'Tee',
      university: 'Example University of Technology',
      faculty: 'Faculty of Information Technology',
      major: 'Computer Science',
      year: 3,
      departmentId: dept.IT._id,
      mentorId: emp.EMP007._id,
      batchId: batch['2026/02']._id,
      startDate: new Date('2026-11-02'),
      endDate: new Date('2027-01-29'),
      shortBio: 'Placement confirmed for the development team.',
      privacyConsent: false,
    },
    {
      firstName: 'Arisara',
      lastName: 'Kaewkla',
      nickname: 'Ari',
      university: 'Example Technology Institute',
      faculty: 'Faculty of Engineering',
      major: 'Industrial Engineering',
      year: 4,
      departmentId: dept.SALES._id,
      mentorId: emp.EMP010._id,
      batchId: batch['2026/02']._id,
      startDate: new Date('2026-11-02'),
      endDate: new Date('2027-01-29'),
      shortBio: 'Placement confirmed for the sales support team.',
      privacyConsent: false,
    },
  ]);

  log(`  created ${interns.length} interns across 3 batches`);
  return interns;
};

const seedUsers = async (emp, interns) => {
  section('Seeding users');
  const krittapas = interns.find((i) => i.firstName === 'Krittapas');

  const users = await User.create([
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
      internId: krittapas?._id ?? null,
    },
  ]);

  log(`  created ${users.length} users (one per role)`);
  return Object.fromEntries(users.map((u) => [u.role, u]));
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
  section('Seeding knowledge articles');
  const articles = await KnowledgeArticle.create([
    // Getting started guide
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

    // IT help centre
    {
      title: 'Printer Is Not Printing',
      slug: 'printer-is-not-printing',
      category: 'it_help',
      subcategory: 'printer',
      summary: 'Step-by-step checklist before contacting IT support.',
      content:
        'Check the following in order:\n' +
        '1. Is the printer powered on and showing a ready status?\n' +
        '2. Is your computer connected to the office network?\n' +
        '3. Did you select the correct printer in the print dialog?\n' +
        '4. Is there a paper jam or an empty paper tray?\n' +
        '5. Open the print queue and clear any stuck jobs.\n' +
        '6. Try printing a test page.\n\n' +
        'If the problem continues, contact IT Support at extension 1202.',
      tags: ['printer', 'troubleshooting', 'hardware'],
      sortOrder: 1,
      isQuickLink: true,
      quickLinkOrder: 1,
      helpfulCount: 12,
      notHelpfulCount: 1,
      viewCount: 87,
      status: 'published',
      authorId: users.super_admin._id,
    },
    {
      title: 'Cannot Connect to Wi-Fi',
      slug: 'cannot-connect-to-wifi',
      category: 'it_help',
      subcategory: 'wifi',
      summary: 'Common causes when a device will not join the office network.',
      content:
        '1. Confirm Wi-Fi is enabled on your device.\n' +
        '2. Select the network your department uses.\n' +
        '3. Confirm your account has been granted network access by IT.\n' +
        '4. Forget the network and reconnect to refresh the settings.\n' +
        '5. Restart your device.\n\n' +
        'If you still cannot connect, contact IT Support with your device type ' +
        'and the error message shown.',
      tags: ['wifi', 'network', 'connectivity'],
      sortOrder: 2,
      isQuickLink: true,
      quickLinkOrder: 2,
      helpfulCount: 9,
      notHelpfulCount: 2,
      viewCount: 64,
      status: 'published',
      authorId: users.super_admin._id,
    },
    {
      title: 'Forgotten Account Password',
      slug: 'forgotten-account-password',
      category: 'it_help',
      subcategory: 'password',
      summary: 'How to request a password reset safely.',
      content:
        'Submit a password reset request to the IT department through your mentor ' +
        'or by calling extension 1202. IT will verify your identity before resetting ' +
        'the account.\n\n' +
        'Never share your password with anyone, and never send a password by chat ' +
        'or email. Change any temporary password at your first login.',
      tags: ['password', 'account', 'security'],
      sortOrder: 3,
      isQuickLink: true,
      quickLinkOrder: 3,
      helpfulCount: 7,
      notHelpfulCount: 0,
      viewCount: 41,
      status: 'published',
      authorId: users.super_admin._id,
    },
    {
      title: 'Computer Is Running Slowly',
      slug: 'computer-is-running-slowly',
      category: 'it_help',
      subcategory: 'windows',
      summary: 'First checks for a slow workstation.',
      content:
        '1. Restart the computer - this resolves many temporary issues.\n' +
        '2. Close applications you are not using.\n' +
        '3. Check available disk space.\n' +
        '4. Confirm pending system updates have finished installing.\n\n' +
        'If the computer is still slow after these steps, contact IT Support so the ' +
        'hardware can be checked.',
      tags: ['windows', 'performance', 'slow'],
      sortOrder: 4,
      helpfulCount: 5,
      notHelpfulCount: 3,
      viewCount: 38,
      status: 'published',
      authorId: users.super_admin._id,
    },
    {
      title: 'Requesting New Software',
      slug: 'requesting-new-software',
      category: 'it_help',
      subcategory: 'software_request',
      summary: 'The approval path for installing software on company computers.',
      content:
        '1. Discuss the requirement with your mentor.\n' +
        '2. Submit a software request to the IT department stating the software name, ' +
        'version, and business reason.\n' +
        '3. IT will review licensing and security before installing.\n\n' +
        'Do not download or install software yourself, including free tools.',
      tags: ['software', 'request', 'licensing'],
      sortOrder: 5,
      helpfulCount: 4,
      notHelpfulCount: 0,
      viewCount: 22,
      status: 'published',
      authorId: users.super_admin._id,
    },
  ]);

  log(`  created ${articles.length} knowledge articles (3 guide, 5 IT help)`);
  return articles;
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
      summary: 'Six new interns joined the IT, HR, and Marketing departments this month.',
      content:
        'Please join us in welcoming the 2026/01 internship batch. ' +
        'You can see their profiles in the Intern Directory.',
      category: 'welcome',
      priority: 5,
      targetRoles: [],
      publishAt: days(-14),
      isPinned: true,
      status: 'published',
      authorId: users.admin._id,
    },
    {
      title: 'Portal Maintenance This Weekend',
      summary: 'The portal will be unavailable on Saturday between 20:00 and 22:00.',
      content:
        'Scheduled maintenance will take place on Saturday from 20:00 to 22:00. ' +
        'The portal may be briefly unavailable during this window.',
      category: 'maintenance',
      priority: 3,
      targetRoles: [],
      publishAt: days(-2),
      expireAt: days(5),
      status: 'published',
      authorId: users.super_admin._id,
    },
    {
      title: 'Intern Orientation Session',
      summary: 'Orientation for new interns is scheduled for Friday at 09:00.',
      content:
        'All interns in the current batch should attend the orientation session in ' +
        'Meeting Room A on Friday at 09:00. Bring a notebook.',
      category: 'event',
      priority: 6,
      targetRoles: ['intern'],
      publishAt: days(-5),
      expireAt: days(10),
      status: 'published',
      authorId: users.admin._id,
    },
    {
      title: 'IT Security Awareness Training',
      summary: 'Short online training on phishing and password safety.',
      content:
        'All staff and interns should complete the security awareness training this ' +
        'month. Your mentor will share the training link.',
      category: 'training',
      priority: 4,
      targetRoles: ['staff', 'intern', 'editor'],
      publishAt: days(-1),
      status: 'published',
      authorId: users.super_admin._id,
    },
    {
      title: 'Public Holiday Notice',
      summary: 'The office will be closed for the upcoming public holiday.',
      content:
        'The office will be closed for the public holiday. Normal working hours ' +
        'resume the following working day.',
      category: 'holiday',
      priority: 2,
      targetRoles: [],
      publishAt: days(-3),
      expireAt: days(20),
      status: 'published',
      authorId: users.admin._id,
    },
    {
      title: 'Draft: Q4 Company Meeting',
      summary: 'Details to be confirmed.',
      content: 'Agenda and venue for the Q4 company meeting are being finalised.',
      category: 'news',
      priority: 1,
      targetRoles: [],
      publishAt: days(14),
      status: 'draft',
      authorId: users.editor._id,
    },
  ]);

  log(`  created ${announcements.length} announcements (5 published, 1 draft/scheduled)`);
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
    KnowledgeArticle.countDocuments(),
    Feedback.countDocuments(),
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
    'Knowledge articles',
    'Feedback',
  ];

  labels.forEach((label, index) => {
    log(`  ${label.padEnd(20)} ${counts[index]}`);
  });

  log('\n  Login accounts (development only):');
  log('  ┌──────────────┬──────────────┬───────────────┐');
  log('  │ username     │ role         │ password      │');
  log('  ├──────────────┼──────────────┼───────────────┤');
  for (const [username, role] of [
    ['superadmin', 'super_admin'],
    ['admin', 'admin'],
    ['editor', 'editor'],
    ['staff', 'staff'],
    ['intern', 'intern'],
  ]) {
    log(`  │ ${username.padEnd(12)} │ ${role.padEnd(12)} │ ${DEV_PASSWORD.padEnd(13)} │`);
  }
  log('  └──────────────┴──────────────┴───────────────┘');
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
