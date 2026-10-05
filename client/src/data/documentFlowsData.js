// client/src/data/documentFlowsData.js
/**
 * Master Enterprise Document Flows & Standard Operating Procedures (SOP)
 * Standards compliance: ISO 9001:2015, ISO/IEC 27001:2022, ITIL v4
 */

export const FLOW_CATEGORIES = [
  { id: 'all', labelTh: 'ทั้งหมด', labelEn: 'All Categories', icon: '📂' },
  { id: 'it', labelTh: 'ฝ่ายไอทีและอุปกรณ์', labelEn: 'IT & Equipment', icon: '💻' },
  { id: 'procurement', labelTh: 'จัดซื้อและพัสดุ', labelEn: 'Procurement & Supplies', icon: '📦' },
  { id: 'hr', labelTh: 'ทรัพยากรบุคคล (HR)', labelEn: 'Human Resources', icon: '👥' },
  { id: 'general', labelTh: 'งานสารบรรณ & อนุมัติ', labelEn: 'General & Memos', icon: '📑' },
  { id: 'security', labelTh: 'ความปลอดภัยข้อมูล', labelEn: 'InfoSec & Compliance', icon: '🛡️' },
];

export const DOCUMENT_FLOWS = [
  {
    id: 'it-repair-replacement',
    code: 'SOP-IT-004',
    category: 'it',
    isoStandard: 'ISO/IEC 27001 & ITIL v4',
    titleTh: 'ขั้นตอนแจ้งซ่อม ตรวจสภาพ และเบิกเปลี่ยนอุปกรณ์ IT',
    titleEn: 'IT Equipment Repair, Diagnostics & Replacement Flow',
    descTh: 'แนวทางปฏิบัติเมื่อคอมพิวเตอร์ อุปกรณ์ หรือระบบฮาร์ดแวร์ชำรุดเสียหาย ตั้งแต่แจ้งซ่อม วินิจฉัยสภาพ จนถึงจัดทำใบเบิกอุปกรณ์ทดแทน',
    descEn: 'Standard procedure for reporting broken hardware, technical diagnosis, replacement requisition, and asset transfer.',
    estimatedSla: '1 - 3 วันทำการ (SLA ภายใน 4 ชม. สำหรับเคสเร่งด่วน)',
    icon: '💻',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    primaryFormCode: 'IT-REQ-01',
    steps: [
      {
        stepNumber: 1,
        titleTh: 'ผู้ใช้งานแจ้งปัญหา/อาการเสียในระบบ',
        titleEn: 'User Reports Issue in System',
        actorRoleTh: 'พนักงาน / นักศึกษาฝึกงานผู้ประสบปัญหา',
        actorRoleEn: 'Reporting Employee / Intern',
        sla: 'ทันทีที่พบอาการ',
        descTh: 'เปิดระบบแจ้งซ่อม กรอกรายละเอียดอาการที่พบ เช่น เปิดไม่ติด จอฟ้า เครื่องค้าง หรือแป้นพิมพ์เสีย พร้อมระบุหมายเลขครุภัณฑ์ (Asset Tag / Service Tag) และแนบรูปถ่ายหากมี',
        descEn: 'Submit an incident report via the maintenance system with symptoms, Asset/Service Tag, and photos if available.',
        tipsTh: 'จดบันทึก Error Code หรือถ่ายภาพหน้าจอตอนเครื่องดับ/ค้างไว้ จะช่วยให้ฝ่ายไอทีตรวจสอบได้เร็วขึ้น 50%',
        tipsEn: 'Taking screenshots of error codes speeds up diagnosis by 50%.',
        documentRequiredTh: 'ใบแจ้งซ่อมบำรุงออนไลน์ (Ticket / EQ-MNT-02)',
        documentRequiredEn: 'Online Maintenance Ticket (EQ-MNT-02)',
        actionLink: '/maintenance',
        actionLabelTh: 'เปิดหน้าแจ้งซ่อมบำรุง ↗',
        actionLabelEn: 'Open Maintenance Page ↗'
      },
      {
        stepNumber: 2,
        titleTh: 'เจ้าหน้าที่ไอทีตรวจสอบสภาพและวินิจฉัยทางเทคนิค',
        titleEn: 'IT Specialist Performs Physical Diagnosis',
        actorRoleTh: 'ช่างเทคนิค / IT Support Specialist',
        actorRoleEn: 'IT Support Specialist',
        sla: 'ภายใน 2 - 4 ชั่วโมง',
        descTh: 'เจ้าหน้าที่ IT เข้าตรวจสอบเครื่อง ไม่ว่าจะผ่าน Remote Support หรือนำเครื่องเข้าห้อง Lab IT เพื่อทดสอบ Hardware, RAM, Storage (SSD/HDD) และ OS Event Logs',
        descEn: 'IT technician inspects the machine remotely or in lab, testing hardware, memory, drive health, and event logs.',
        tipsTh: 'หากนำเครื่องเข้าตรวจที่ห้อง IT ชั้น 3 ให้นำสายชาร์จและอุปกรณ์ต่อพ่วงหลักมาด้วยทุกครั้ง',
        tipsEn: 'Bring power adapter and main peripherals when bringing machine to IT room on 3rd floor.',
        documentRequiredTh: 'แบบบันทึกผลการตรวจสภาพ (Diagnostic Checklist)',
        documentRequiredEn: 'Technical Diagnostic Checklist',
        actionLink: '/chat',
        actionLabelTh: 'ทักแชท IT Helpdesk ↗',
        actionLabelEn: 'Chat IT Helpdesk ↗'
      },
      {
        stepNumber: 3,
        titleTh: 'สรุปผลการวินิจฉัย (ซ่อมบำรุง หรือ ต้องเปลี่ยนเครื่อง)',
        titleEn: 'Diagnostic Verdict: Repair vs Replace',
        actorRoleTh: 'IT Support & IT Manager',
        actorRoleEn: 'IT Support & IT Manager',
        sla: 'ภายใน 1 วันทำการ',
        descTh: 'IT สรุปผล: หากเป็นปัญหาซอฟต์แวร์หรือชิ้นส่วนเล็ก ให้ทำการซ่อมบำรุงทันที; หากบอร์ดไหม้ จอแตก หรือประเมินแล้วไม่คุ้มค่าซ่อม/หมดอายุการใช้งาน IT จะออกเอกสารรับรองสภาพเพื่อขอเปลี่ยนเครื่องใหม่',
        descEn: 'Verdict rendered: if repairable, fixed immediately; if motherboard burnt, screen broken, or obsolete, IT certifies for replacement.',
        tipsTh: 'เกณฑ์การเปลี่ยนเครื่องตามมาตรฐาน ISO คือ อุปกรณ์มีอายุการใช้งานเกิน 4 ปี หรือค่าซ่อมเกิน 60% ของมูลค่าเครื่องปัจจุบัน',
        tipsEn: 'ISO standard threshold: equipment >4 years old or repair cost >60% of current asset value.',
        documentRequiredTh: 'ใบรับรองสภาพอุปกรณ์ชำรุด (IT-CERT-04)',
        documentRequiredEn: 'Equipment Decommissioning Certificate (IT-CERT-04)'
      },
      {
        stepNumber: 4,
        titleTh: 'ผู้ใช้งานจัดทำ "ใบเบิกอุปกรณ์ IT ทดแทน" (IT-REQ-01)',
        titleEn: 'User Prepares IT Requisition Form (IT-REQ-01)',
        actorRoleTh: 'ผู้ใช้งาน หรือ เลขานุการแผนก',
        actorRoleEn: 'Requester / Department Admin',
        sla: 'ภายใน 1 วันทำการ',
        descTh: 'ผู้ใช้งานกรอกแบบฟอร์มใบเบิกอุปกรณ์ IT (IT Requisition Form) แนบใบรับรองสภาพจาก IT ระบุสเปกที่ต้องการและวัตถุประสงค์การใช้งานในงานประจำ',
        descEn: 'User fills out IT Requisition Form, attaching the IT diagnosis certificate, specifying required hardware specifications.',
        tipsTh: 'ตรวจสอบชื่อผู้จัดการแผนกที่จะเป็นผู้อนุมัติให้ถูกต้องเพื่อป้องกันการตีกลับเอกสาร',
        tipsEn: 'Ensure the correct approving department manager is selected to avoid form rejection.',
        documentRequiredTh: 'ใบเบิกอุปกรณ์ IT (IT-REQ-01)',
        documentRequiredEn: 'IT Requisition Form (IT-REQ-01)',
        hasSampleModal: true
      },
      {
        stepNumber: 5,
        titleTh: 'ผู้มีอำนาจลงนามและอนุมัติ (Department & IT Managers)',
        titleEn: 'Dual Department & IT Approval',
        actorRoleTh: 'ผู้จัดการฝ่ายต้นสังกัด และ ผู้จัดการฝ่ายไอที',
        actorRoleEn: 'Department Manager & IT Manager',
        sla: '1 - 2 วันทำการ',
        descTh: 'ผู้จัดการฝ่ายต้นสังกัดลงนามเห็นชอบงบประมาณ/ความจำเป็น และส่งต่อให้ผู้จัดการฝ่าย IT อนุมัติการตัดเบิกสต็อกพัสดุอุปกรณ์',
        descEn: 'Line manager approves budget/necessity, forwarding to IT Manager to approve inventory release.',
        tipsTh: 'หากเป็นกรณีเร่งด่วนสำหรับผู้บริหารหรือพนักงานเข้าใหม่ สามารถแจ้งประสานงานด่วนทางแชท IT ได้',
        tipsEn: 'Urgent cases for executives or new joiners can be expedited via IT chat.',
        documentRequiredTh: 'การลงนามอนุมัติอิเล็กทรอนิกส์ (E-Signature)',
        documentRequiredEn: 'Digital Approval Matrix Signature'
      },
      {
        stepNumber: 6,
        titleTh: 'ส่งมอบเครื่อง ติดป้ายทะเบียนสินทรัพย์ และบันทึกประวัติ',
        titleEn: 'Handover, Asset Tagging & Handover Record',
        actorRoleTh: 'เจ้าหน้าที่ IT สินทรัพย์ และ ผู้ใช้งาน',
        actorRoleEn: 'IT Asset Admin & Recipient',
        sla: 'ภายใน 24 ชม. หลังอนุมัติ',
        descTh: 'ผู้ใช้งานรับมอบเครื่องใหม่ พร้อมลงชื่อในใบรับมอบสินทรัพย์ (Asset Handover Sheet) ไอทีทำการโอนย้ายข้อมูลจากเครื่องเก่า และนำเครื่องเก่าเข้าสู่กระบวนการล้างข้อมูลความปลอดภัย (Data Sanitization)',
        descEn: 'User receives new machine, signs Asset Handover Sheet. IT migrates data and initiates NIST-compliant data wipe on old drive.',
        tipsTh: 'อย่าลืมตรวจสอบ Serial Number บนเครื่องให้ตรงกับใบรับมอบ และตั้งรหัสผ่านใหม่ทันที',
        tipsEn: 'Verify physical serial number against handover sheet and reset login password immediately.',
        documentRequiredTh: 'ใบรับมอบสินทรัพย์ (Asset Handover & Transfer Sheet)',
        documentRequiredEn: 'Asset Handover & Transfer Sheet'
      }
    ],
    sampleDocument: {
      docNumber: 'FTI-IT-REQ-2026-0042',
      formNameTh: 'แบบฟอร์มขอเบิกและเปลี่ยนอุปกรณ์คอมพิวเตอร์ / IT',
      formNameEn: 'IT Equipment & Hardware Requisition Form',
      docRevision: 'Rev. 04 (01/2026)',
      isoCode: 'ISO 27001:2022 - Cl. 8.1 / ITIL-AM-02',
      effectiveDate: '01 มกราคม 2569',
      requesterInfo: {
        name: 'Krittapas Thipsang (Krit)',
        empId: 'INT-2026-001',
        dept: 'Information Technology (IT)',
        position: 'Software Developer Intern',
        tel: '02-345-6789 ต่อ 1402',
        email: 'krittapas.t@fti.or.th'
      },
      equipmentDetails: {
        reasonType: 'เครื่องเดิมชำรุด ไม่คุ้มค่าซ่อมบำรุง (Hardware Breakdown)',
        oldAssetTag: 'FTI-NB-2022-089',
        oldModel: 'Dell Latitude 5420 (Core i5 11th Gen / RAM 8GB)',
        defectSymptom: 'เมนบอร์ดลัดวงจร ไม่สามารถชาร์จไฟได้ ช่างเทคนิค IT ตรวจสอบแล้ว IC Power เสียหายและอุปกรณ์พ้นระยะประกัน (มีใบรับรอง IT-CERT-04)',
        requestedItem: 'โน้ตบุ๊กสำหรับงานพัฒนาซอฟต์แวร์ (Developer Laptop Spec)',
        quantity: '1 เครื่อง (พร้อมกระเป๋า, Adapter และ Mouse)',
        preferredSpec: 'CPU Core i7 / Ryzen 7, RAM 16GB+, SSD 512GB NVMe, จอ 14-15.6 นิ้ว'
      },
      signatures: [
        { roleTh: 'ผู้ขอเบิก (Requester)', name: 'Krittapas Thipsang', status: 'Submitted', date: '04/10/2026 09:30' },
        { roleTh: 'เจ้าหน้าที่ตรวจสภาพ (IT Specialist)', name: 'Kittipong Sae-ung', status: 'Verified & Certified', date: '04/10/2026 11:15' },
        { roleTh: 'ผู้จัดการฝ่ายต้นสังกัด (Manager)', name: 'Anucha Rattanakul', status: 'Approved', date: '04/10/2026 14:00' },
        { roleTh: 'ผู้อำนวยการฝ่าย IT (IT Director)', name: 'Somchai Wongsuwan', status: 'Approved', date: '04/10/2026 16:45' }
      ]
    }
  },

  {
    id: 'procurement-supplies',
    code: 'SOP-PR-002',
    category: 'procurement',
    isoStandard: 'ISO 9001:2015 Clause 8.4',
    titleTh: 'ขั้นตอนขอจัดซื้อและขอเบิกพัสดุอุปกรณ์สำนักงาน',
    titleEn: 'Office Supplies & Procurement Requisition Flow',
    descTh: 'กระบวนการขอซื้อและเบิกจ่ายพัสดุสิ้นเปลือง อุปกรณ์สำนักงาน และสินทรัพย์ทั่วไปเพื่อความโปร่งใสและตรวจสอบได้',
    descEn: 'Step-by-step requisition process for office stationery, supplies, and general operational assets.',
    estimatedSla: '3 - 7 วันทำการ (ขึ้นอยู่กับมูลค่างบประมาณ)',
    icon: '📦',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    primaryFormCode: 'PR-REQ-02',
    steps: [
      {
        stepNumber: 1,
        titleTh: 'ตรวจสอบสต็อกพัสดุในคลังกลาง',
        titleEn: 'Check Central Supply Inventory',
        actorRoleTh: 'พนักงานผู้ต้องการใช้พัสดุ',
        actorRoleEn: 'Requesting Employee',
        sla: '15 นาที',
        descTh: 'ตรวจสอบกับเจ้าหน้าที่ธุรการ/จัดซื้อว่าสิ่งของที่ต้องการมีสำรองในคลังหรือไม่ เช่น กระดาษ ปากกา หมึกพิมพ์ แฟ้ม หากมีสามารถทำเรื่องเบิกจ่ายได้ทันที',
        descEn: 'Verify if requested stationery or consumables exist in central stock before initiating new purchase.',
        tipsTh: 'คลังพัสดุส่วนกลางเปิดให้เบิกทุกวันอังคารและพฤหัสบดี เวลา 10:00 - 16:00 น.',
        tipsEn: 'Central supplies store open for withdrawal every Tuesday and Thursday 10:00 - 16:00.',
        documentRequiredTh: 'ใบเบิกพัสดุสิ้นเปลืองประจำวัน',
        documentRequiredEn: 'Daily Supply Requisition Voucher'
      },
      {
        stepNumber: 2,
        titleTh: 'จัดทำใบขอซื้อ / ขอจ้าง (Purchase Request: PR)',
        titleEn: 'Draft Purchase Requisition (PR)',
        actorRoleTh: 'ผู้ขอ หรือ ธุรการฝ่าย',
        actorRoleEn: 'Requester / Department Admin',
        sla: '1 วันทำการ',
        descTh: 'หากไม่มีในคลัง ให้เปิดใบขอซื้อ (PR-REQ-02) ระบุจำนวน วัตถุประสงค์ ราคาโดยประมาณ และแนบใบเสนอราคา (Quotation) เปรียบเทียบ 2-3 เจ้า',
        descEn: 'If out of stock, create PR with justification, estimated pricing, and comparative vendor quotations.',
        tipsTh: 'พัสดุมูลค่าเกิน 10,000 บาท ต้องมีใบเสนอราคาเปรียบเทียบอย่างน้อย 3 บริษัทตามระเบียบจัดซื้อจัดจ้าง',
        tipsEn: 'Items exceeding 10,000 THB require at least 3 comparative vendor quotes.',
        documentRequiredTh: 'แบบฟอร์มขอซื้อพัสดุ (PR-REQ-02)',
        documentRequiredEn: 'Purchase Requisition Form (PR-REQ-02)',
        hasSampleModal: true
      },
      {
        stepNumber: 3,
        titleTh: 'ตรวจสอบงบประมาณและอนุมัติใบขอซื้อ',
        titleEn: 'Budget Verification & Management Approval',
        actorRoleTh: 'ผู้จัดการฝ่าย & ฝ่ายการเงิน/บัญชี',
        actorRoleEn: 'Department Head & Finance Controller',
        sla: '1 - 2 วันทำการ',
        descTh: 'ฝ่ายการเงินตรวจสอบ Cost Center และงบประมาณคงเหลือในไตรมาส ก่อนที่ผู้มีอำนาจตามวงเงินจะลงนามอนุมัติ PR',
        descEn: 'Finance team validates departmental Cost Center budget availability prior to authorized executive signature.',
        tipsTh: 'ควรวางแผนการขอซื้อล่วงหน้าอย่างน้อย 2 สัปดาห์ก่อนสิ้นงวดบัญชี',
        tipsEn: 'Submit purchase requests at least 2 weeks before quarterly financial cutoff.',
        documentRequiredTh: 'เอกสารอนุมัติงบประมาณ (Budget Clearance Sheet)',
        documentRequiredEn: 'Budget Clearance Sheet'
      },
      {
        stepNumber: 4,
        titleTh: 'ฝ่ายจัดซื้อออกใบสั่งซื้อ (Purchase Order: PO)',
        titleEn: 'Procurement Issues Purchase Order (PO)',
        actorRoleTh: 'เจ้าหน้าที่จัดซื้อ (Procurement Officer)',
        actorRoleEn: 'Procurement Officer',
        sla: '1 - 2 วันทำการ',
        descTh: 'ฝ่ายจัดซื้อเจรจาต่อรองราคา ส่งใบ PO ให้ผู้ขายยืนยันการจัดส่ง และกำหนดวันส่งมอบสินค้าอย่างเป็นทางการ',
        descEn: 'Procurement negotiates final terms, issues binding PO to vendor, and schedules delivery.',
        tipsTh: 'ตรวจสอบเงื่อนไขการรับประกันสินค้าและใบกำกับภาษีเต็มรูปให้ครบถ้วน',
        tipsEn: 'Ensure full tax invoice and warranty terms are agreed upon.',
        documentRequiredTh: 'ใบสั่งซื้อทางการ (Purchase Order: PO)',
        documentRequiredEn: 'Formal Purchase Order (PO)'
      },
      {
        stepNumber: 5,
        titleTh: 'ตรวจรับพัสดุ ลงทะเบียน และส่งมอบ',
        titleEn: 'Inspection, Receiving & Inventory Registration',
        actorRoleTh: 'คณะกรรมการตรวจรับ และ ผู้ขอใช้งาน',
        actorRoleEn: 'Receiving Committee & End User',
        sla: 'ภายใน 24 ชม. หลังส่งมอบ',
        descTh: 'ตรวจนับจำนวน ทดสอบความสมบูรณ์ของสินค้า ลงนามในใบตรวจรับพัสดุ (GRN) ติดสติกเกอร์บาร์โค้ดสินทรัพย์ และส่งมอบให้ผู้ใช้งาน',
        descEn: 'Inspect physical count and quality, sign Goods Receipt Note (GRN), apply asset barcodes, and release to user.',
        tipsTh: 'หากพบสินค้าชำรุดเสียหาย ต้องปฏิเสธการตรวจรับและแจ้งฝ่ายจัดซื้อทันทีภายใน 24 ชั่วโมง',
        tipsEn: 'If items arrived damaged, reject delivery and alert procurement immediately.',
        documentRequiredTh: 'ใบตรวจรับพัสดุ (Goods Receipt Note: GRN)',
        documentRequiredEn: 'Goods Receipt Note (GRN)'
      }
    ],
    sampleDocument: {
      docNumber: 'FTI-PR-2026-0118',
      formNameTh: 'แบบฟอร์มขอซื้อ / ขอเบิกพัสดุสำนักงานและสินทรัพย์',
      formNameEn: 'Purchase & Supply Requisition Form',
      docRevision: 'Rev. 02 (03/2026)',
      isoCode: 'ISO 9001:2015 - Cl. 8.4 Control of External Providers',
      effectiveDate: '15 มีนาคม 2569',
      requesterInfo: {
        name: 'Pornthip Saelim (Thip)',
        empId: 'EMP-2024-002',
        dept: 'Human Resources (HR)',
        position: 'HR Manager',
        tel: '02-345-6789 ต่อ 1201',
        email: 'pornthip.s@fti.or.th'
      },
      equipmentDetails: {
        reasonType: 'จัดเตรียมอุปกรณ์ต้อนรับพนักงานและนักศึกษาฝึกงานรุ่นใหม่ (Onboarding Kit)',
        oldAssetTag: '-',
        oldModel: '-',
        defectSymptom: 'จำนวนพัสดุในคลังไม่เพียงพอต่อรอบการเข้างานใหม่ ประจำไตรมาสที่ 2/2569',
        requestedItem: 'ชุด Welcome Kit และเครื่องเขียนมาตรฐานองค์กร FTI',
        quantity: '15 ชุด (สมุดบันทึก FTI, ปากกาเลเซอร์, บัตรคล้องคอ NFC, แก้วน้ำเก็บอุณหภูมิ)',
        preferredSpec: 'แบรนด์มาตรฐาน FTI Corporate Identity สีน้ำเงินกรมท่า พร้อมกล่องบรรจุภัณฑ์'
      },
      signatures: [
        { roleTh: 'ผู้ขอซื้อ (Requester)', name: 'Pornthip Saelim', status: 'Submitted', date: '02/10/2026 10:00' },
        { roleTh: 'หัวหน้างานฝ่ายการเงิน (Finance Review)', name: 'Thanakorn Boonmee', status: 'Budget Cleared', date: '02/10/2026 13:30' },
        { roleTh: 'เจ้าหน้าที่จัดซื้อ (Procurement Officer)', name: 'Peerapat Sukjai', status: 'Vendor Verified', date: '03/10/2026 09:15' },
        { roleTh: 'กรรมการผู้จัดการ (Authorized Signer)', name: 'Somchai Wongsuwan', status: 'Approved', date: '03/10/2026 15:00' }
      ]
    }
  },

  {
    id: 'leave-wfh-request',
    code: 'SOP-HR-001',
    category: 'hr',
    isoStandard: 'ISO 30414:2019 Human Resource Management',
    titleTh: 'ขั้นตอนการยื่นใบลา และ ขอปฏิบัติงานนอกสถานที่ (WFH)',
    titleEn: 'Employee Leave & Remote Work (WFH) Approval Flow',
    descTh: 'ระเบียบการยื่นคำขอลาหยุดงานทุกประเภท (ลาพักผ่อน, ลาป่วย, ลากิจ) และการขอ Work from Home อย่างถูกต้องตามกฎหมายแรงงาน',
    descEn: 'Standard procedure for leave requests (annual, sick, personal) and Remote/WFH authorizations.',
    estimatedSla: '1 - 2 วันทำการ (ลากิจล่วงหน้าอย่างน้อย 3 วัน)',
    icon: '👥',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    primaryFormCode: 'HR-LV-01',
    steps: [
      {
        stepNumber: 1,
        titleTh: 'ตรวจสอบสิทธิ์วันลาและปฏิทินเวรของทีม',
        titleEn: 'Check Leave Quota & Team Roster',
        actorRoleTh: 'พนักงาน / นักศึกษาฝึกงาน',
        actorRoleEn: 'Employee / Intern',
        sla: '5 นาที',
        descTh: 'ตรวจสอบยอดวันลาคงเหลือในระบบ หรือตารางเวร WFH ประจำสัปดาห์ เพื่อให้มั่นใจว่ามีเพื่อนร่วมงานปฏิบัติงานสนับสนุนงานประจำอย่างต่อเนื่อง',
        descEn: 'Review remaining leave balance and team roster to prevent operational staffing gaps.',
        tipsTh: 'การ WFH ต้องไม่ตรงกับวันที่มีการประชุมใหญ่ประจำเดือน หรือวันที่กำหนดให้ Onsite',
        tipsEn: 'WFH cannot coincide with mandatory all-hands or onsite meeting days.',
        documentRequiredTh: 'รายงานโควตาวันลาออนไลน์',
        documentRequiredEn: 'Online Leave Balance Dashboard'
      },
      {
        stepNumber: 2,
        titleTh: 'ยื่นคำขอลา หรือ ขอ WFH ในระบบออนไลน์',
        titleEn: 'Submit Online Leave / WFH Request',
        actorRoleTh: 'พนักงาน / นักศึกษาฝึกงาน',
        actorRoleEn: 'Applicant',
        sla: 'ล่วงหน้า 3 วัน (ยกเว้นลาป่วย)',
        descTh: 'กรอกแบบฟอร์ม ระบุวันที่ ช่วงเวลา เหตุผล พร้อมเบอร์ติดต่อฉุกเฉิน กรณีลาป่วยเกิน 2 วันทำการต้องแนบใบรับรองแพทย์ตามกฎหมายแรงงาน',
        descEn: 'Fill out request with dates, reasoning, and emergency contact. Sick leave >2 days requires medical certificate.',
        tipsTh: 'ระบุผู้รับผิดชอบงานแทน (Delegated Person) ในระหว่างที่ไม่อยู่ เพื่อให้งานเดินหน้าได้ราบรื่น',
        tipsEn: 'Always assign a backup handover colleague for critical ongoing tasks.',
        documentRequiredTh: 'แบบฟอร์มคำขอลา / WFH (HR-LV-01)',
        documentRequiredEn: 'Leave & WFH Application Form (HR-LV-01)',
        hasSampleModal: true
      },
      {
        stepNumber: 3,
        titleTh: 'ผู้บังคับบัญชาชั้นต้นพิจารณาอนุมัติ',
        titleEn: 'Direct Supervisor Review & Approval',
        actorRoleTh: 'หัวหน้างาน / พี่เลี้ยงประจำตัว (Mentor)',
        actorRoleEn: 'Direct Supervisor / Mentor',
        sla: 'ภายใน 24 ชม.',
        descTh: 'หัวหน้างานตรวจสอบปริมาณงานและการมอบหมายงานแทน ก่อนกดอนุมัติหรือให้ความเห็นเพิ่มเติม',
        descEn: 'Supervisor reviews workload coverage and delegates before granting approval.',
        tipsTh: 'หากหัวหน้าไม่อยู่ สามารถส่งต่อให้ผู้รักษาการแทนตามสายการบังคับบัญชาได้',
        tipsEn: 'Requests can be escalated to acting deputies if line manager is unavailable.',
        documentRequiredTh: 'บันทึกการอนุมัติระบบออนไลน์',
        documentRequiredEn: 'Manager Electronic Approval Stamp'
      },
      {
        stepNumber: 4,
        titleTh: 'ฝ่ายทรัพยากรบุคคล (HR) บันทึกและตัดสถิติ',
        titleEn: 'HR Records & Synchronizes Attendance',
        actorRoleTh: 'เจ้าหน้าที่บุคคล (HR Officer)',
        actorRoleEn: 'HR Officer',
        sla: 'ภายใน 1 วันทำการ',
        descTh: 'ระบบตัดยอดวันลาโดยอัตโนมัติ ส่งข้อมูลเข้าระบบคำนวณเงินเดือน และแจ้งเตือนสถานะอนุมัติให้พนักงานทราบทางอีเมล',
        descEn: 'Leave quota deducted automatically, synced to payroll, and notification email sent to employee.',
        tipsTh: 'สามารถเช็กประวัติการลาและโควตาย้อนหลังได้ที่หน้าโปรไฟล์ส่วนตัว',
        tipsEn: 'Historical leave records can be tracked anytime on your Profile Settings page.',
        documentRequiredTh: 'บันทึกประวัติการลา (Leave Audit Log)',
        documentRequiredEn: 'Leave Audit Trail Log'
      }
    ],
    sampleDocument: {
      docNumber: 'FTI-HR-LV-2026-0305',
      formNameTh: 'แบบฟอร์มขออนุมัติการลาและปฏิบัติงานนอกสถานที่ (WFH)',
      formNameEn: 'Leave & Work-From-Home Application Form',
      docRevision: 'Rev. 03 (01/2026)',
      isoCode: 'ISO 30414:2019 HR Management - Attendance Control',
      effectiveDate: '01 มกราคม 2569',
      requesterInfo: {
        name: 'Pimchanok Sirirat (Pim)',
        empId: 'INT-2026-002',
        dept: 'Information Technology (IT)',
        position: 'Frontend Developer Intern',
        tel: '02-345-6789 ต่อ 1405',
        email: 'pimchanok.s@fti.or.th'
      },
      equipmentDetails: {
        reasonType: 'ขอปฏิบัติงานนอกสถานที่ (Work From Home) ตามสิทธิ์รายสัปดาห์',
        oldAssetTag: '-',
        oldModel: '-',
        defectSymptom: 'ต้องการสมาธิในการพัฒนาระบบ UI/UX Promax และทดสอบ Performance Testing',
        requestedItem: 'อนุมัติการทำงาน WFH วันที่ 08/10/2026 (เต็มวัน 08:30 - 17:30)',
        quantity: '1 วันทำการ',
        preferredSpec: 'พร้อม Standby ตอบแชทระบบ FTI Welcome Hub และประชุมผ่าน Google Meet ได้ตลอดเวลา'
      },
      signatures: [
        { roleTh: 'ผู้ยื่นคำขอ (Applicant)', name: 'Pimchanok Sirirat', status: 'Submitted', date: '04/10/2026 15:30' },
        { roleTh: 'พี่เลี้ยงประจำตัว (Mentor)', name: 'Naruemon Pansri', status: 'Endorsed', date: '04/10/2026 16:00' },
        { roleTh: 'ผู้จัดการฝ่ายไอที (IT Manager)', name: 'Anucha Rattanakul', status: 'Approved', date: '04/10/2026 17:15' },
        { roleTh: 'เจ้าหน้าที่ฝ่ายบุคคล (HR Audit)', name: 'Pornthip Saelim', status: 'Recorded', date: '05/10/2026 09:00' }
      ]
    }
  },

  {
    id: 'internal-memo-approval',
    code: 'SOP-GEN-003',
    category: 'general',
    isoStandard: 'ISO 9001:2015 Clause 7.5 Documented Information',
    titleTh: 'ขั้นตอนการเสนอเซ็นอนุมัติบันทึกข้อความภายใน (Internal Memo)',
    titleEn: 'Internal Memorandum & Document Approval Flow',
    descTh: 'มาตรฐานการร่างหนังสือ ขออนุมัติโครงการ งบประมาณ หรือระเบียบปฏิบัติภายในองค์กรตามระบบควบคุมเอกสาร ISO',
    descEn: 'Formal routing workflow for official memorandums, policy change proposals, and corporate budgets.',
    estimatedSla: '2 - 5 วันทำการ',
    icon: '📑',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    primaryFormCode: 'MEMO-STD-01',
    steps: [
      {
        stepNumber: 1,
        titleTh: 'ร่างบันทึกข้อความตามแบบฟอร์มมาตรฐานองค์กร',
        titleEn: 'Draft Memo Using Official Template',
        actorRoleTh: 'เจ้าของเรื่อง / ผู้ประสานงานโครงการ',
        actorRoleEn: 'Initiator / Project Lead',
        sla: '1 วันทำการ',
        descTh: 'ใช้เทมเพลตมาตรฐาน FTI (ฟอนต์ TH Sarabun PSK 16pt) ระบุ: 1. ข้อความเกริ่นนำ (ต้นเรื่อง) 2. ข้อเท็จจริงและเหตุผล 3. ข้อพิจารณาและข้อเสนอแนะ พร้อมแนบเอกสารอ้างอิง',
        descEn: 'Draft memo using standard corporate template with Background, Facts, and Recommendations sections.',
        tipsTh: 'ระบุวัตถุประสงค์ให้ชัดเจนในย่อหน้าแรก ผู้อนุมัติสามารถอ่านและเข้าใจได้ภายใน 30 วินาที',
        tipsEn: 'State clear bottom-line recommendations in first paragraph for executive rapid review.',
        documentRequiredTh: 'แบบฟอร์มบันทึกข้อความ FTI (MEMO-STD-01)',
        documentRequiredEn: 'Official FTI Memo Template (MEMO-STD-01)',
        hasSampleModal: true
      },
      {
        stepNumber: 2,
        titleTh: 'หัวหน้างานฝ่ายและผู้จัดการทบทวนเนื้อหา (Review)',
        titleEn: 'Supervisory Content & Technical Review',
        actorRoleTh: 'หัวหน้างาน / ผู้จัดการฝ่าย',
        actorRoleEn: 'Supervisor & Line Manager',
        sla: '1 - 2 วันทำการ',
        descTh: 'ตรวจสอบความถูกต้องของเนื้อหา แหล่งงบประมาณ ความสอดคล้องกับนโยบายบริษัท และให้ข้อเสนอแนะเพื่อปรับปรุงก่อนส่งต่อ',
        descEn: 'Reviewers verify factual data, budget codes, policy alignment, and endorse the document.',
        tipsTh: 'หากมีการอ้างอิงระเบียบหรือสัญญา ให้แนบสำเนาสัญญาหน้าสำคัญไว้ในภาคผนวก',
        tipsEn: 'Attach pertinent contract pages as appendices for rapid legal verification.',
        documentRequiredTh: 'เอกสารแนบท้าย (Attachments & Exhibits)',
        documentRequiredEn: 'Exhibits & Supporting Documents'
      },
      {
        stepNumber: 3,
        titleTh: 'งานสารบรรณลงทะเบียนรับ-ส่ง และออกเลขที่เอกสาร',
        titleEn: 'Central Secretariat Document Registration',
        actorRoleTh: 'เจ้าหน้าที่งานสารบรรณกลาง',
        actorRoleEn: 'Secretariat / Document Controller',
        sla: 'ภายใน 4 ชั่วโมง',
        descTh: 'งานสารบรรณลงทะเบียนในระบบควบคุมเอกสาร ออกเลขที่บันทึกข้อความ (เช่น FTI-MEMO-2026/XXXX) และส่งต่อเข้าสู่กระดานเสนอเซ็นผู้บริหาร',
        descEn: 'Secretariat assigns formal ISO document numbering and routes to executive signature inbox.',
        tipsTh: 'กรณีเรื่องด่วนพิเศษ ให้ทำแถบสีแดง "ด่วนที่สุด" ที่มุมบนขวาของเอกสาร',
        tipsEn: 'Urgent matters should carry the red "URGENT" priority banner at top-right corner.',
        documentRequiredTh: 'สมุดทะเบียนหนังสือรับ-ส่ง (Document Registry Log)',
        documentRequiredEn: 'Central Secretariat In/Out Registry'
      },
      {
        stepNumber: 4,
        titleTh: 'ผู้บริหารระดับสูงลงนามอนุมัติ (Final Approval)',
        titleEn: 'Executive Level Approval & Endorsement',
        actorRoleTh: 'รองกรรมการผู้จัดการ หรือ กรรมการผู้จัดการ',
        actorRoleEn: 'Managing Director / Executive Board',
        sla: '1 - 2 วันทำการ',
        descTh: 'ผู้บริหารพิจารณาลงนามอนุมัติ หรือให้ความเห็นชอบพร้อมระบุคำสั่งการ เพื่อให้หน่วยงานที่เกี่ยวข้องนำไปปฏิบัติต่อไป',
        descEn: 'Managing Director reviews, signs approval, and issues formal directives for execution.',
        tipsTh: 'คำสั่งการของผู้บริหารจะถูกแจ้งกลับไปยังหน่วยงานเจ้าของเรื่องทางอีเมลและระบบสารบรรณ',
        tipsEn: 'Executive decisions are automatically fed back to initiating department via notification.',
        documentRequiredTh: 'บันทึกข้อความฉบับสมบูรณ์พร้อมลายมือชื่อ',
        documentRequiredEn: 'Signed Memo with Executive Directives'
      },
      {
        stepNumber: 5,
        titleTh: 'เวียนแจ้งผู้เกี่ยวข้องและจัดเก็บสำเนา (Distribution & Archive)',
        titleEn: 'Distribution to Stakeholders & ISO Archival',
        actorRoleTh: 'งานสารบรรณ และ เจ้าของเรื่อง',
        actorRoleEn: 'Document Controller & Initiator',
        sla: 'ภายใน 24 ชม.',
        descTh: 'ส่งสำเนาหนังสือให้หน่วยงานที่เกี่ยวข้องดำเนินการ และสแกนจัดเก็บไฟล์ดิจิทัลในระบบคลังเอกสาร (Vault) ตามมาตรฐาน ISO 9001 อย่างน้อย 5 ปี',
        descEn: 'Distribute copies to stakeholder departments and archive digital PDF into Vault repository for 5 years.',
        tipsTh: 'สามารถค้นหาเอกสารอนุมัติย้อนหลังได้ในหน้า Personal Vault / Corporate Archive',
        tipsEn: 'Retrieve signed documents anytime under Personal Vault or Corporate Archive.',
        documentRequiredTh: 'บันทึกการเวียนหนังสือและใบนำส่ง',
        documentRequiredEn: 'Document Distribution Sheet'
      }
    ],
    sampleDocument: {
      docNumber: 'FTI-MEMO-2026/048',
      formNameTh: 'บันทึกข้อความขออนุมัติโครงการปรับปรุงระบบ Portal พนักงานใหม่',
      formNameEn: 'Internal Memorandum - Newcomer Portal Upgrade',
      docRevision: 'Rev. 01 (02/2026)',
      isoCode: 'ISO 9001:2015 Clause 7.5 Documented Information',
      effectiveDate: '10 กุมภาพันธ์ 2569',
      requesterInfo: {
        name: 'Anucha Rattanakul (Nu)',
        empId: 'EMP-2024-003',
        dept: 'Information Technology (IT)',
        position: 'IT Manager',
        tel: '02-345-6789 ต่อ 1401',
        email: 'anucha.r@fti.or.th'
      },
      equipmentDetails: {
        reasonType: 'ขออนุมัติพัฒนาระบบ Document Flows & Newcomer Onboarding Experience',
        oldAssetTag: '-',
        oldModel: '-',
        defectSymptom: 'พนักงานใหม่และนักศึกษาฝึกงานสอบถามขั้นตอนการแจ้งซ่อมและเบิกอุปกรณ์จำนวนมาก จึงจำเป็นต้องมีระบบแนะนำกระบวนการแบบ Interactive',
        requestedItem: 'โครงการ FTI Welcome Hub UI/UX Promax Phase 2',
        quantity: '1 โครงการ (ระยะเวลาพัฒนา 1 สัปดาห์)',
        preferredSpec: 'พัฒนาครอบคลุม 5 โฟลว์มาตรฐาน ISO พร้อมระบบตัวอย่างแบบฟอร์มและ Stepper แบบ Responsive'
      },
      signatures: [
        { roleTh: 'ผู้เสนอเรื่อง (Initiator)', name: 'Anucha Rattanakul', status: 'Submitted', date: '04/10/2026 11:00' },
        { roleTh: 'งานสารบรรณ (Document Registry)', name: 'Thanakorn Boonmee', status: 'Numbered', date: '04/10/2026 13:00' },
        { roleTh: 'ผู้อำนวยการฝ่ายทรัพยากรบุคคล (HR Director)', name: 'Pornthip Saelim', status: 'Concurred', date: '04/10/2026 14:30' },
        { roleTh: 'กรรมการผู้จัดการ (Managing Director)', name: 'Somchai Wongsuwan', status: 'Approved', date: '04/10/2026 17:00' }
      ]
    }
  },

  {
    id: 'security-incident-reporting',
    code: 'SOP-SEC-005',
    category: 'security',
    isoStandard: 'ISO/IEC 27001:2022 Control 5.24 - 5.28 & PDPA',
    titleTh: 'ขั้นตอนการรายงานเหตุการณ์ผิดปกติและความปลอดภัยข้อมูล',
    titleEn: 'Information Security Incident & Breach Reporting Flow',
    descTh: 'แนวทางปฏิบัติด่วนเมื่อพบเหตุการณ์คุกคามทางไซเบอร์ มัลแวร์เรียกค่าไถ่ อีเมลฟิชชิ่ง หรือข้อมูลส่วนบุคคลรั่วไหล',
    descEn: 'Mandatory emergency escalation flow for cyber threats, phishing, ransomware, and personal data breaches under ISO 27001 and PDPA.',
    estimatedSla: 'รายงานทันทีภายใน 1 ชม. (มาตรการระงับเหตุภายใน 2 ชม.)',
    icon: '🛡️',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    primaryFormCode: 'SEC-INC-01',
    steps: [
      {
        stepNumber: 1,
        titleTh: 'ตรวจพบสิ่งผิดปกติ หรือสงสัยว่าเกิดภัยคุกคาม',
        titleEn: 'Detection of Suspicious Cyber Event',
        actorRoleTh: 'พนักงานทุกคนในองค์กร',
        actorRoleEn: 'Any Employee / Newcomer',
        sla: 'ทันที',
        descTh: 'เช่น ได้รับอีเมลหลอกลวง (Phishing), หน้าจอขึ้นข้อความเรียกค่าไถ่ (Ransomware), ไฟร์วอลล์แจ้งเตือน, มีคนแปลกหน้าพยายามเข้าห้องเซิร์ฟเวอร์ หรือทำโน้ตบุ๊ก/แฟลชไดรฟ์ข้อมูลบริษัทสูญหาย',
        descEn: 'Identify indicators of compromise: phishing emails, ransom notes, missing encrypted drives, or unauthorized access.',
        tipsTh: 'ห้ามปิดเครื่องคอมพิวเตอร์เด็ดขาด (Do NOT shutdown) แต่ให้ถอดสาย LAN หรือปิด Wi-Fi ทันที เพื่อเก็บหลักฐานในหน่วยความจำ RAM',
        tipsEn: 'CRITICAL: Do NOT turn off the machine; disconnect LAN or Wi-Fi immediately to preserve forensic RAM evidence.',
        documentRequiredTh: 'ภาพถ่ายหน้าจอ / ตัวอย่างอีเมลแปลกปลอม',
        documentRequiredEn: 'Screenshots / EML Sample Files'
      },
      {
        stepNumber: 2,
        titleTh: 'แจ้งสายด่วน IT Security Incident Response ภายใน 1 ชม.',
        titleEn: 'Emergency Escalation to IT Security Hotline',
        actorRoleTh: 'ผู้พบเห็นเหตุการณ์',
        actorRoleEn: 'Reporting Party',
        sla: 'ภายใน 60 นาที',
        descTh: 'ติดต่อเบอร์สายด่วน IT Security (โทร. 1999 หรือ แชทช่องฉุกเฉิน) และกรอกแบบฟอร์มแจ้งเหตุการณ์ความปลอดภัย (SEC-INC-01)',
        descEn: 'Contact IT Sec Hotline immediately (Ext. 1999) and submit Security Incident Report (SEC-INC-01).',
        tipsTh: 'ตามมาตรฐาน ISO 27001 และ PDPA ต้องรายงานเหตุให้ทีมความปลอดภัยทราบเร็วที่สุด เพื่อให้ทันกรอบเวลาแจ้งต่อสำนักงาน PDPC ภายใน 72 ชม.',
        tipsEn: 'PDPA statutory requirement: security team must report breaches to regulator within 72 hours.',
        documentRequiredTh: 'แบบรายงานเหตุการณ์ความมั่นคงปลอดภัย (SEC-INC-01)',
        documentRequiredEn: 'Security Incident Report Form (SEC-INC-01)',
        actionLink: '/chat',
        actionLabelTh: 'ส่งสัญญาณด่วนถึงทีม IT ↗',
        actionLabelEn: 'Alert IT Security Team ↗',
        hasSampleModal: true
      },
      {
        stepNumber: 3,
        titleTh: 'ทีม IT Security ตัดการเชื่อมต่อและกักกันความเสียหาย (Containment)',
        titleEn: 'Containment & Threat Isolation',
        actorRoleTh: 'IT Security Incident Response Team (CIRT)',
        actorRoleEn: 'CIRT Security Engineers',
        sla: 'ภายใน 2 ชั่วโมง',
        descTh: 'บล็อก IP/Domain อันตรายที่ระบบ Firewall, ระงับบัญชีผู้ใช้ที่ถูกโจมตีชั่วคราว, ตัดอุปกรณ์ออกจากระบบเครือข่าย FTI VLAN เพื่อป้องกันการแพร่กระจายไปยังเครื่องอื่น',
        descEn: 'Block malicious IPs/Domains, suspend compromised user accounts, isolate VLAN segments to halt lateral spread.',
        tipsTh: 'ทีมรักษาความปลอดภัยจะทำการ Dump Memory และเก็บรวบรวม Log ไฟล์ไว้เพื่อการพิสูจน์หลักฐานดิจิทัล (Digital Forensics)',
        tipsEn: 'Security engineers dump memory and collect immutable system logs for digital forensics.',
        documentRequiredTh: 'บันทึกการกักกันภัยคุกคาม (Containment Log)',
        documentRequiredEn: 'Incident Containment Checklist'
      },
      {
        stepNumber: 4,
        titleTh: 'วิเคราะห์ต้นตอและการแก้ไขปัญหา (Eradication & Recovery)',
        titleEn: 'Root Cause Analysis (RCA) & Remediation',
        actorRoleTh: 'IT Specialist & External Security Partner',
        actorRoleEn: 'Security Specialist & Lead Engineers',
        sla: 'ภายใน 24 - 48 ชั่วโมง',
        descTh: 'กำจัดมัลแวร์ อุดช่องโหว่ความปลอดภัย กู้คืนข้อมูลจากระบบสำรองข้อมูลที่ปลอดภัย (Clean Backup) และทำการทดสอบระบบก่อนเปิดให้ใช้งานตามปกติ',
        descEn: 'Purge malware artifacts, patch zero-days, restore verified clean backups, and validate system integrity before restoration.',
        tipsTh: 'พนักงานทุกคนที่เกี่ยวข้องอาจต้องทำการเปลี่ยนรหัสผ่านใหม่ (Password Reset) และเปิดใช้งาน MFA ทันที',
        tipsEn: 'All impacted staff must perform mandatory password resets and re-bind Multi-Factor Authentication (MFA).',
        documentRequiredTh: 'รายงานการวิเคราะห์สาเหตุเชิงลึก (RCA Report)',
        documentRequiredEn: 'Root Cause Analysis (RCA) Report'
      },
      {
        stepNumber: 5,
        titleTh: 'ออกรายงานสรุปและมาตรการป้องกันซ้ำ (Lessons Learned)',
        titleEn: 'Post-Incident Review & Preventative Action',
        actorRoleTh: 'CISO / คณะกรรมการความปลอดภัยสารสนเทศ',
        actorRoleEn: 'CISO & Security Governance Board',
        sla: 'ภายใน 7 วันทำการ',
        descTh: 'จัดประชุมทบทวนบทเรียน (Lessons Learned) ปรับปรุงกฎไฟร์วอลล์ อัปเดตแนวปฏิบัติในคลังความรู้ไอที และจัดฝึกอบรม Security Awareness ให้พนักงาน',
        descEn: 'Conduct lessons learned debrief, harden firewall policies, update IT Knowledge Base guidelines, and assign awareness training.',
        tipsTh: 'เหตุการณ์ที่ได้รับการแก้ไขแล้วจะถูกบันทึกเป็น Case Study นิรนามในคลังความรู้ไอที เพื่อเป็นแนวทางป้องกันในอนาคต',
        tipsEn: 'Resolved incidents are anonymized into IT Knowledge Base case studies for continuous organizational learning.',
        documentRequiredTh: 'รายงานปิดเหตุการณ์และข้อเสนอแนะเชิงป้องกัน (CAPA Report)',
        documentRequiredEn: 'Incident Closure & CAPA Report'
      }
    ],
    sampleDocument: {
      docNumber: 'FTI-SEC-INC-2026-0009',
      formNameTh: 'แบบรายงานเหตุการณ์ความมั่นคงปลอดภัยสารสนเทศ (Security Incident Report)',
      formNameEn: 'Information Security & Data Incident Report',
      docRevision: 'Rev. 03 (01/2026)',
      isoCode: 'ISO/IEC 27001:2022 Cl. 5.24 - 5.28 & PDPA Act B.E. 2562',
      effectiveDate: '01 มกราคม 2569',
      requesterInfo: {
        name: 'Nattapong Chanthara (Nat)',
        empId: 'INT-2026-005',
        dept: 'Information Technology (IT)',
        position: 'DevOps / Network Intern',
        tel: '02-345-6789 ต่อ 1408',
        email: 'nattapong.c@fti.or.th'
      },
      equipmentDetails: {
        reasonType: 'ตรวจพบอีเมลสวมรอยผู้บริหารและแนบลิงก์มัลแวร์ (Executive Impersonation & Phishing)',
        oldAssetTag: '-',
        oldModel: '-',
        defectSymptom: 'ได้รับอีเมลจากที่อยู่อีเมลภายนอกที่ปลอมแปลงชื่อผู้บริหาร แจ้งให้เปลี่ยนรหัสผ่านด่วนผ่านลิงก์ฟิชชิ่งภายนอก',
        requestedItem: 'ขอให้ฝ่ายความปลอดภัยบล็อกโดเมนอันตรายและตรวจสอบประวัติการคลิกของผู้ใช้ในองค์กร',
        quantity: 'ระดับความรุนแรง: ปานกลาง (Severity Level 2 - Suspicious Traffic)',
        preferredSpec: 'ได้ทำการกักกันอีเมลและส่งไฟล์ .eml ต้นฉบับให้ทีม IT Security เรียบร้อยแล้ว'
      },
      signatures: [
        { roleTh: 'ผู้รายงานเหตุการณ์ (Reporter)', name: 'Nattapong Chanthara', status: 'Reported', date: '05/10/2026 08:45' },
        { roleTh: 'หัวหน้าทีมเผชิญเหตุ (Incident Commander)', name: 'Kittipong Sae-ung', status: 'Contained', date: '05/10/2026 09:15' },
        { roleTh: 'ผู้จัดการฝ่าย IT Security (IT Manager)', name: 'Anucha Rattanakul', status: 'Investigated & Blocked', date: '05/10/2026 10:30' },
        { roleTh: 'ผู้รับผิดชอบการคุ้มครองข้อมูล (DPO / CISO)', name: 'Somchai Wongsuwan', status: 'Acknowledged', date: '05/10/2026 11:30' }
      ]
    }
  }
];
