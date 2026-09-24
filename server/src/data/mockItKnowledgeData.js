/**
 * Comprehensive Mock IT Knowledge Base Seed Data
 * Covers Software (OS, Windows, Linux, Word, Excel, Teams, ERP, Outlook),
 * Hardware (CPU, RAM, Storage, Printers, Peripherals, CCTV),
 * Network (Wi-Fi, VPN, Diagnostics), and Security & Policies.
 */

export const MOCK_TOPICS = [
  // 1. Root Topics
  {
    name: '💻 ซอฟต์แวร์และแอปพลิเคชัน (Software & Applications)',
    slug: 'software-apps',
    icon: '💻',
    description: 'ระบบปฏิบัติการ โปรแกรมสำนักงาน ระบบ ERP และเครื่องมือการทำงานในองค์กร',
    sortOrder: 1,
  },
  {
    name: '🖥️ ฮาร์ดแวร์และอุปกรณ์ (Hardware & Equipment)',
    slug: 'hardware-devices',
    icon: '🖥️',
    description: 'คอมพิวเตอร์ ชิ้นส่วนภายใน (CPU, RAM, SSD), เครื่องพิมพ์ จอภาพ และระบบกล้อง CCTV',
    sortOrder: 2,
  },
  {
    name: '🌐 เครือข่ายและการเชื่อมต่อ (Network & Connectivity)',
    slug: 'network-connectivity',
    icon: '🌐',
    description: 'Wi-Fi สำนักงาน, LAN, VPN เชื่อมต่อระยะไกล และการวินิจฉัยเครือข่าย',
    sortOrder: 3,
  },
  {
    name: '🔒 ความปลอดภัยและนโยบาย (IT Security & Policies)',
    slug: 'security-policies',
    icon: '🔒',
    description: 'การยืนยันตัวตน 2FA, การป้องกันภัยไซเบอร์ และระเบียบการยืมคืนอุปกรณ์ไอที',
    sortOrder: 4,
  },

  // 2. Subtopics: Software & Applications
  {
    name: '🪟 ระบบปฏิบัติการ (Operating Systems)',
    slug: 'os-systems',
    icon: '🪟',
    parentSlug: 'software-apps',
    description: 'คู่มือการใช้งานและแก้ปัญหา Windows 11/10 และระบบปฏิบัติการ Linux',
    sortOrder: 1,
  },
  {
    name: 'Windows 11 & 10',
    slug: 'os-windows',
    icon: '🪟',
    parentSlug: 'os-systems',
    description: 'การตั้งค่า Windows, การอัปเดตระบบ, Task Manager และ BitLocker',
    sortOrder: 1,
  },
  {
    name: 'Linux Ubuntu & CLI',
    slug: 'os-linux',
    icon: '🐧',
    parentSlug: 'os-systems',
    description: 'คำสั่ง Linux Terminal เบื้องต้น, การเชื่อมต่อ SSH และการจัดการสิทธิ์ไฟล์',
    sortOrder: 2,
  },
  {
    name: '📊 โปรแกรมสำนักงาน (Office & Productivity)',
    slug: 'office-productivity',
    icon: '📊',
    parentSlug: 'software-apps',
    description: 'การใช้งานโปรแกรม Microsoft 365, Word, Excel, PowerPoint และ Teams',
    sortOrder: 2,
  },
  {
    name: 'Microsoft Word',
    slug: 'office-word',
    icon: '📝',
    parentSlug: 'office-productivity',
    description: 'การจัดหน้าเอกสาร สารบัญอัตโนมัติ การแชร์แก้ไขร่วมกัน และกู้คืนไฟล์',
    sortOrder: 1,
  },
  {
    name: 'Microsoft Excel',
    slug: 'office-excel',
    icon: '📈',
    parentSlug: 'office-productivity',
    description: 'สูตรคำนวณขั้นสูง XLOOKUP, PivotTable และการแก้ปัญหาสูตรคำนวณช้า',
    sortOrder: 2,
  },
  {
    name: 'Teams & PowerPoint',
    slug: 'office-teams-ppt',
    icon: '👥',
    parentSlug: 'office-productivity',
    description: 'การประชุมออนไลน์ การตั้งค่ากล้องไมค์ และเทคนิคการนำเสนอพรีเซนเทชัน',
    sortOrder: 3,
  },
  {
    name: '🏢 ระบบงานองค์กร (Enterprise Systems)',
    slug: 'enterprise-systems',
    icon: '🏢',
    parentSlug: 'software-apps',
    description: 'ระบบ ERP องค์กร, พอร์ทัลภายใน และระบบอีเมล Microsoft Outlook 365',
    sortOrder: 3,
  },
  {
    name: 'Enterprise ERP & Portal',
    slug: 'enterprise-erp',
    icon: '🗄️',
    parentSlug: 'enterprise-systems',
    description: 'การเข้าใช้งานระบบ SAP/ERP, ขั้นตอนขออนุมัติเอกสาร และการรีเซ็ตรหัสผ่าน',
    sortOrder: 1,
  },
  {
    name: 'Microsoft Outlook 365',
    slug: 'enterprise-outlook',
    icon: '📧',
    parentSlug: 'enterprise-systems',
    description: 'การตั้งค่า Signature ลายเซ็นอีเมล, Shared Mailbox และการตั้งกฎ Mail Rules',
    sortOrder: 2,
  },

  // 3. Subtopics: Hardware & Equipment
  {
    name: '⚡ คอมพิวเตอร์และชิ้นส่วน (Workstations & Components)',
    slug: 'workstations-components',
    icon: '⚡',
    parentSlug: 'hardware-devices',
    description: 'เจาะลึกชิ้นส่วนฮาร์ดแวร์ CPU, RAM, การอัปเกรด และ SSD/ฮาร์ดดิสก์',
    sortOrder: 1,
  },
  {
    name: 'CPU & ประสิทธิภาพประมวลผล',
    slug: 'hw-cpu',
    icon: '🧠',
    parentSlug: 'workstations-components',
    description: 'การตรวจสอบ CPU Usage, อาการเครื่องร้อน Thermal Throttling และสเปกประมวลผล',
    sortOrder: 1,
  },
  {
    name: 'RAM & หน่วยความจำระบบ',
    slug: 'hw-ram',
    icon: '💾',
    parentSlug: 'workstations-components',
    description: 'การตรวจสอบ Memory Leak, การเปิด Dual Channel และการอัปเกรด RAM',
    sortOrder: 2,
  },
  {
    name: 'Storage SSD & Hard Drives',
    slug: 'hw-storage',
    icon: '💽',
    parentSlug: 'workstations-components',
    description: 'SSD NVMe vs SATA, การเคลียร์พื้นที่ Drive C และตรวจสุขภาพไดรฟ์ SMART',
    sortOrder: 3,
  },
  {
    name: '🖨️ เครื่องพิมพ์และสแกนเนอร์ (Printers & Scanners)',
    slug: 'printers-scanners',
    icon: '🖨️',
    parentSlug: 'hardware-devices',
    description: 'ระบบพิมพ์ Follow-Me รูดบัตร, วิธีแก้กระดาษติด, เปลี่ยนตลับหมึก และ Scan to Email',
    sortOrder: 2,
  },
  {
    name: '🔌 จอภาพและอุปกรณ์ต่อพ่วง (Displays & Docks)',
    slug: 'displays-peripherals',
    icon: '🔌',
    parentSlug: 'hardware-devices',
    description: 'การต่อจอคู่ 2-3 จอ, USB-C Docking Stations, คีย์บอร์ดและเมาส์ไร้สาย',
    sortOrder: 3,
  },
  {
    name: '📹 ระบบกล้องวงจรปิด (CCTV & Surveillance)',
    slug: 'cctv-surveillance',
    icon: '📹',
    parentSlug: 'hardware-devices',
    description: 'การดูภาพสดบน Smart Floor Plan, ระเบียบขอดูภาพย้อนหลังตาม PDPA และแก้ปัญหากล้องออฟไลน์',
    sortOrder: 4,
  },

  // 4. Subtopics: Network & Connectivity
  {
    name: '📶 Wi-Fi & เครือข่ายสำนักงาน',
    slug: 'wifi-lan',
    icon: '📶',
    parentSlug: 'network-connectivity',
    description: 'การต่อ FTI-Staff WPA2-Enterprise, Wi-Fi ผู้มาติดต่อ FTI-Guest และสาย LAN',
    sortOrder: 1,
  },
  {
    name: '🛡️ VPN & รีโมตทำงานทางไกล',
    slug: 'vpn-remote-access',
    icon: '🛡️',
    parentSlug: 'network-connectivity',
    description: 'การเชื่อมต่อ Cisco AnyConnect VPN และ Remote Desktop (RDP) ทำงานจากบ้าน',
    sortOrder: 2,
  },
  {
    name: '🛠️ การวินิจฉัยและแก้ปัญหาเครือข่าย',
    slug: 'network-troubleshooting',
    icon: '🛠️',
    parentSlug: 'network-connectivity',
    description: 'คำสั่ง Ping, Traceroute, Flush DNS และการรีเซ็ต Winsock แก้อินเทอร์เน็ตหลุด',
    sortOrder: 3,
  },

  // 5. Subtopics: IT Security & Policies
  {
    name: '🔑 บัญชีผู้ใช้และระบบ 2FA (Accounts & MFA)',
    slug: 'accounts-mfa',
    icon: '🔑',
    parentSlug: 'security-policies',
    description: 'นโยบายรหัสผ่านที่ปลอดภัย, การผูกแอป Microsoft Authenticator และรีเซ็ตรหัส SSPR',
    sortOrder: 1,
  },
  {
    name: '🛡️ ความปลอดภัยไซเบอร์และ Phishing',
    slug: 'cybersecurity-phishing',
    icon: '🛡️',
    parentSlug: 'security-policies',
    description: 'วิธีตรวจสอบอีเมลหลอกลวง Phishing, การสแกนไวรัส และการป้องกันมัลแวร์เรียกค่าไถ่',
    sortOrder: 2,
  },
  {
    name: '🎧 บริการไอที ยืมคืนอุปกรณ์ และ SLA',
    slug: 'it-helpdesk-loans',
    icon: '🎧',
    parentSlug: 'security-policies',
    description: 'ระเบียบการยืม-คืนโน้ตบุ๊กสำรอง/โปรเจกเตอร์, ขั้นตอนขอลิขสิทธิ์ และระดับการบริการ SLA',
    sortOrder: 3,
  },
];

export const MOCK_ARTICLES = [
  // ==========================================
  // SECTION 1: Software & Applications
  // ==========================================
  {
    title: 'การติดตั้งและตั้งค่าเริ่มต้น Windows 11 Enterprise สำหรับพนักงานใหม่',
    slug: 'windows-11-enterprise-setup',
    topicSlug: 'os-windows',
    isQuickLink: true,
    quickLinkOrder: 1,
    tags: ['windows', 'os', 'setup', 'newcomer', 'software'],
    summary: 'คู่มือการตั้งค่า Windows 11 Enterprise เครื่องแรก การเข้าสู่ระบบด้วยบัญชี FTI Azure AD การตั้งค่าแป้นพิมพ์ และการเปิดใช้งาน BitLocker',
    content: `# การตั้งค่าเริ่มต้น Windows 11 Enterprise สำหรับพนักงานใหม่

ระบบคอมพิวเตอร์ของสถาบันไทย-เยอรมัน (FTI) ใช้ระบบปฏิบัติการ **Windows 11 Enterprise** เพื่อความเสถียรและความปลอดภัยสูงสุดในการทำงาน

> [!NOTE]
> คอมพิวเตอร์บริษัททุกเครื่องจะถูกผูกกับระบบโดเมน **FTI Active Directory / Azure AD** อัตโนมัติในครั้งแรกที่เปิดเครื่อง

## ขั้นตอนการเริ่มใช้งานเครื่องใหม่

- [ ] เชื่อมต่อคอมพิวเตอร์เข้ากับสาย LAN หรือเชื่อมต่อ Wi-Fi ที่ได้รับอนุญาต
- [ ] ในหน้าจอ Sign-in ให้ป้อนอีเมลองค์กร (\`username@fti.or.th\`) และรหัสผ่านชั่วคราว
- [ ] ระบบจะบังคับให้เปลี่ยนรหัสผ่านใหม่ทันที (ต้องมีความยาวอย่างน้อย 12 ตัวอักษร)
- [ ] ตั้งค่าคีย์บอร์ดภาษาไทย โดยกด \`Win + Spacebar\` เพื่อสลับภาษา (Grave Accent \`~\` สามารถตั้งค่าเพิ่มใน Settings)
- [ ] ตรวจสอบสถานะการเข้ารหัส **BitLocker Drive Encryption** ที่ไดรฟ์ C: ให้แสดงสถานะมีแม่กุญแจล็อกเรียบร้อย

\`\`\`bash
# ตรวจสอบสถานะการผูกโดเมนผ่าน Command Prompt
whoami /fqdn
dsregcmd /status
\`\`\`

> [!TIP]
> หากเปิดเครื่องแล้วไม่สามารถสลับภาษาไทยด้วยปุ่มตัวหนอน (\`~\`) ได้ ให้ไปที่ **Settings > Time & Language > Typing > Advanced keyboard settings > Input language hot keys**`,
  },
  {
    title: 'การใช้งาน Task Manager และวิเคราะห์โปรแกรมค้างใน Windows',
    slug: 'windows-task-manager-troubleshooting',
    topicSlug: 'os-windows',
    tags: ['windows', 'troubleshooting', 'task-manager', 'performance'],
    summary: 'วิธีเปิด Task Manager เพื่อตรวจสอบการทำงานของ CPU, RAM, Disk และการปิดโปรแกรมที่ไม่ตอบสนอง (End Task) อย่างถูกวิธี',
    content: `# การใช้ Task Manager จัดการโปรแกรมค้างและตรวจเช็กประสิทธิภาพ

เมื่อคอมพิวเตอร์เริ่มทำงานช้าลงหรือมีโปรแกรมค้าง (Not Responding) **Task Manager** คือเครื่องมือแรกที่ช่วยตรวจหาสาเหตุ

## คีย์ลัดเข้า Task Manager ทันที
- กดปุ่ม **\`Ctrl + Shift + Esc\`** พร้อมกันเพื่อเปิด Task Manager ได้ทันทีโดยไม่ต้องผ่านหน้าจอเลือก

## จุดตรวจเช็กสำคัญ 3 จุด

1. **Processes Tab:** ดูแถบสีแดง/ส้มที่ช่อง CPU หรือ Memory ว่าโปรแกรมใดกินทรัพยากรผิดปกติ
2. **Performance Tab:** ดูภาพรวมของ CPU, Memory (RAM), Disk 0 (C:), และ Wi-Fi/Ethernet
3. **Startup Apps Tab:** ปิดการใช้งาน (Disable) โปรแกรมที่ไม่จำเป็นตอนเปิดเครื่อง เพื่อช่วยให้บูตเร็วขึ้น

| คอลัมน์ | ค่าปกติทั่วไป | จุดที่ต้องเฝ้าระวัง |
|---|---|---|
| **CPU Usage** | 5% - 30% (ขณะไม่ได้เปิดงานหนัก) | ค้างอยู่ที่ 90% - 100% ต่อเนื่องเกิน 2 นาที |
| **Memory** | 40% - 70% | สูงเกิน 90% เครื่องจะเริ่มดึง SSD มาทำ Virtual RAM ทำให้หน่วง |
| **Disk (SSD)** | 0% - 10% | ค้างที่ 100% แสดงว่ามี Background indexing หรืออัปเดตระบบ |

> [!WARNING]
> อย่าปิด Process ที่เป็นของ **Windows Explorer** หรือบริการด้านความปลอดภัย เช่น **CrowdStrike/Windows Defender** เพราะอาจทำให้หน้าจอเดสก์ท็อปดับ`,
  },
  {
    title: 'คำสั่ง Linux Terminal พื้นฐานสำหรับสายงานเทคนิคและ Data',
    slug: 'linux-terminal-essential-commands',
    topicSlug: 'os-linux',
    tags: ['linux', 'terminal', 'cli', 'ubuntu', 'dev'],
    summary: 'รวมคำสั่งพื้นฐาน Linux Bash shell ที่จำเป็นในการทำงานกับ Server, การตรวจสอบเนื้อที่ดิสก์, การดู Log และการจัดการสิทธิ์ไฟล์',
    content: `# รวมคำสั่ง Linux Terminal พื้นฐาน (Ubuntu & Enterprise Server)

สำหรับวิศวกร นักพัฒนาระบบ และทีม Data ที่ต้องเข้าใช้งานเซิร์ฟเวอร์ Linux ผ่าน SSH คู่มือนี้รวบรวมคำสั่งพื้นฐานที่ใช้บ่อยที่สุด

## 1. การจัดการโฟลเดอร์และไฟล์

\`\`\`bash
# ดูตำแหน่งปัจจุบัน และดูรายการไฟล์แบบละเอียด
pwd
ls -la

# สร้างโฟลเดอร์ และเปลี่ยนไดเรกทอรี
mkdir -p project/docs
cd project/docs

# คัดลอกและย้ายไฟล์
cp -r source_folder/ destination/
mv old_name.txt new_name.txt

# ค้นหาไฟล์ตามชื่อ
find . -name "*.log" -type f
\`\`\`

## 2. การตรวจสอบการทำงานและทรัพยากรระบบ

\`\`\`bash
# ตรวจสอบการใช้งาน RAM แบบเข้าใจง่าย (หน่วย MB / GB)
free -h

# ตรวจสอบเนื้อที่ฮาร์ดดิสก์ทุกพาร์ติชัน
df -h

# ดู Process ที่กำลังทำงานแบบเรียลไทม์
top
# หรือใช้ htop หากติดตั้งไว้
htop
\`\`\`

> [!NOTE]
> ในการจัดการสิทธิ์ไฟล์ (Permissions) รหัส \`chmod 755\` หมายถึงเจ้าของอ่าน/เขียน/รันได้ ส่วนผู้อื่นอ่านและรันได้อย่างเดียว`,
  },
  {
    title: 'การเชื่อมต่อ Linux Server ระยะไกลด้วย SSH Key Pairs อย่างปลอดภัย',
    slug: 'linux-ssh-key-pairs-setup',
    topicSlug: 'os-linux',
    tags: ['linux', 'ssh', 'security', 'remote-access'],
    summary: 'วิธีการสร้างกุญแจ SSH Key (ed25519) บนเครื่องพนักงาน เพื่อเชื่อมต่อไปยังเซิร์ฟเวอร์กลางโดยไม่ต้องกรอกรหัสผ่านทุกครั้ง',
    content: `# การตั้งค่า SSH Key Pairs สำหรับเข้าใช้งาน Server องค์กร

การใช้รหัสผ่านธรรมดาในการล็อกอิน SSH มีความเสี่ยงต่อการถูกดักจับข้อมูล สถาบันฯ จึงกำหนดให้ใช้ **SSH Key Pairs (ed25519)** สำหรับการเชื่อมต่อเซิร์ฟเวอร์ทั้งหมด

## ขั้นตอนการสร้างและส่งกุญแจ

- [ ] เปิด PowerShell หรือ Terminal บนเครื่องของท่าน
- [ ] รันคำสั่งสร้างกุญแจคู่ความปลอดภัยสูง:
\`\`\`bash
ssh-keygen -t ed25519 -C "your_email@fti.or.th"
\`\`\`
- [ ] กด Enter เพื่อเลือกตำแหน่งบันทึกไฟล์เริ่มต้น (\`~/.ssh/id_ed25519\`)
- [ ] ตั้งรหัสผ่าน Passphrase ป้องกันกุญแจ (แนะนำอย่างยิ่ง)
- [ ] คัดลอกเนื้อหาในไฟล์ Public Key (\`id_ed25519.pub\`) ส่งให้ผู้ดูแลระบบ Server เพื่อลงทะเบียนใน \`~/.ssh/authorized_keys\`

> [!IMPORTANT]
> **ห้ามส่งไฟล์ Private Key (\`id_ed25519\`) ให้ผู้อื่นโดยเด็ดขาด** ให้ส่งเฉพาะไฟล์ที่มีนามสกุล \`.pub\` เท่านั้น`,
  },
  {
    title: 'เทคนิคการจัดฟอร์แมตเอกสารราชการและสร้างสารบัญอัตโนมัติใน Microsoft Word',
    slug: 'microsoft-word-formatting-toc',
    topicSlug: 'office-word',
    tags: ['word', 'office', 'formatting', 'documentation'],
    summary: 'ขั้นตอนการใช้งาน Styles (Heading 1, 2, 3) เพื่อสร้างสารบัญอัตโนมัติ การตั้งค่าระยะขอบหน้ากระดาษ และการใส่เลขหน้าแบบแยกส่วน',
    content: `# การจัดเอกสารทางการและสร้างสารบัญอัตโนมัติใน Microsoft Word

การพิมพ์รายงานหรือเอกสารคู่มือของสถาบันฯ ควรใช้คุณสมบัติ **Heading Styles** เพื่อให้เอกสารมีโครงสร้างที่ถูกต้อง และสามารถสร้างสารบัญ (Table of Contents) ได้ในคลิกเดียว

## ขั้นตอนการสร้างสารบัญอัตโนมัติ

1. **กำหนดหัวข้อด้วย Styles:**
   - หัวข้อบทใหญ่ -> เลือกเป็น **Heading 1** (ฟอนต์ TH Sarabun PSK 16pt หนา)
   - หัวข้อย่อย -> เลือกเป็น **Heading 2**
   - ประเด็นย่อยในบท -> เลือกเป็น **Heading 3**
2. **แทรกสารบัญ:**
   - เลื่อนเคอร์เซอร์ไปยังหน้าที่ต้องการวางสารบัญ
   - ไปที่แท็บ **References > Table of Contents** แล้วเลือกรูปแบบอัตโนมัติ
3. **การอัปเดตสารบัญ:**
   - เมื่อแก้ไขเนื้อหาหรือเลขหน้าเปลี่ยน ให้คลิกขวาที่สารบัญแล้วเลือก **Update Field > Update entire table**

> [!TIP]
> หากต้องการแยกเลขหน้าส่วนบทนำ (ก, ข, ค) ออกจากส่วนเนื้อหา (1, 2, 3) ให้แทรก **Page Layout > Breaks > Section Breaks (Next Page)** แล้วปลดปุ่ม "Link to Previous" ที่ส่วนหัวกระดาษ`,
  },
  {
    title: 'การกู้คืนไฟล์เอกสาร Word ที่ไม่ได้บันทึกหรือโปรแกรมปิดกะทันหัน',
    slug: 'microsoft-word-autorecover-restore',
    topicSlug: 'office-word',
    tags: ['word', 'office', 'backup', 'recovery', 'troubleshooting'],
    summary: 'วิธีค้นหาและกู้คืนไฟล์ Word ที่ลืมกดเซฟ หรือเกิดเหตุไฟดับ/เครื่องดับด้วย AutoRecover และ Version History บน OneDrive',
    content: `# วิธีกู้คืนไฟล์ Word ที่ไม่ได้บันทึก (Unsaved / Crash Recovery)

หากคุณกำลังพิมพ์งานอยู่แล้วเครื่องดับ หรือเผลอกด "Don't Save" คุณสามารถกู้คืนไฟล์กลับมาได้ด้วย 2 วิธีต่อไปนี้:

## วิธีที่ 1: กู้คืนจาก AutoRecover ของ Microsoft Word
1. เปิดโปรแกรม Microsoft Word ขึ้นมาใหม่
2. ไปที่เมนู **File > Info**
3. คลิกที่ปุ่ม **Manage Document** แล้วเลือก **Recover Unsaved Documents**
4. หน้าต่างโฟลเดอร์ไฟล์สำรอง (\`.asd\`) จะเปิดขึ้นมา เลือกไฟล์ล่าสุดที่แก้ไขแล้วกด Open จากนั้นกด Save As ทันที

## วิธีที่ 2: กู้คืนผ่าน Version History บน OneDrive
หากคุณเปิดใช้งานปุ่ม **AutoSave** (มุมบนซ้าย):
- ไปที่ **File > Info > Version History**
- คุณจะเห็นประวัติการบันทึกย้อนหลังทุกๆ 5-10 นาที สามารถคลิกดูฉบับเก่าแล้วกด **Restore** ได้ทันที

> [!IMPORTANT]
> เพื่อป้องกันงานสูญหาย แนะนำให้บันทึกไฟล์งานไว้ในโฟลเดอร์ **OneDrive - FTI** เสมอ เพื่อให้ระบบ AutoSave ทำงานแบบเรียลไทม์`,
  },
  {
    title: 'การใช้งานสูตร XLOOKUP และแก้ปัญหา Excel คำนวณช้า/ค้าง',
    slug: 'microsoft-excel-xlookup-performance',
    topicSlug: 'office-excel',
    isQuickLink: true,
    quickLinkOrder: 2,
    tags: ['excel', 'office', 'formula', 'xlookup', 'performance'],
    summary: 'สอนการใช้ XLOOKUP แทน VLOOKUP แบบมืออาชีพ พร้อมวิธีแก้ปัญหาไฟล์ Excel ขนาดใหญ่ที่เปิดช้า หรือมีอาการค้างขณะคำนวณ',
    content: `# เจาะลึกสูตร XLOOKUP และวิธีแก้ปัญหาไฟล์ Excel คำนวณช้า

ฟังก์ชัน **XLOOKUP** ใน Excel 365 ช่วยให้การค้นหาข้อมูลมีความยืดหยุ่นกว่า VLOOKUP ดั้งเดิมมาก เพราะสามารถค้นหาจากขวาไปซ้ายได้ และไม่พังเมื่อมีการแทรกคอลัมน์

## ไวยากรณ์ของ XLOOKUP

\`\`\`excel
=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode])
\`\`\`

**ตัวอย่าง:** ค้นหาแผนกของพนักงานจากรหัสพนักงาน:
\`\`\`excel
=XLOOKUP(A2, EmployeeData!A:A, EmployeeData!D:D, "ไม่พบข้อมูล")
\`\`\`

## วิธีแก้ปัญหาเมื่อไฟล์ Excel หน่วงหรือค้าง

- [ ] **ปิดโหมดคำนวณอัตโนมัติขณะกรอกข้อมูล:** ไปที่ **Formulas > Calculation Options > Manual** เพื่อไม่ให้สูตรคำนวณซ้ำทุกครั้งที่กด Enter
- [ ] **หลีกเลี่ยงการอ้างอิงทั้งคอลัมน์:** แทนที่จะเขียน \`A:A\` ให้ระบุช่วงที่แน่นอน เช่น \`A2:A5000\` เพื่อลดการประมวลผลเซลล์เปล่า 1 ล้านบรรทัด
- [ ] **ลบเซลล์ว่างที่มีฟอร์แมตเกินจริง:** กด \`Ctrl + End\` เพื่อดูจุดสิ้นสุดของชีต หากเกินจากตารางจริง ให้ลบแถวว่างทิ้งแล้วบันทึกไฟล์ใหม่
- [ ] **แปลงสูตรเป็นค่าคงที่ (Paste as Values):** สำหรับข้อมูลในอดีตที่ไม่เปลี่ยนแปลงแล้ว ให้ Copy แล้ว Paste Values ทับเพื่อลดภาระ CPU

> [!NOTE]
> หากไฟล์มีขนาดเกิน 50MB และมีสูตรข้ามไฟล์จำนวนมาก แนะนำให้ใช้ **Power Query** ดึงข้อมูลแทนการเขียนสูตรซ้อนกัน`,
  },
  {
    title: 'การตั้งค่าไมโครโฟน กล้อง และการเบลอพื้นหลังใน Microsoft Teams',
    slug: 'microsoft-teams-audio-video-setup',
    topicSlug: 'office-teams-ppt',
    tags: ['teams', 'office', 'meeting', 'audio', 'video'],
    summary: 'วิธีทดสอบอุปกรณ์หูฟัง ไมโครโฟน และกล้องเว็บแคมก่อนเข้าประชุม Teams การตัดเสียงรบกวนภายนอก และการใส่ภาพพื้นหลังเสมือน',
    content: `# คู่มือการตั้งค่าภาพและเสียงสำหรับการประชุม Microsoft Teams

การเตรียมความพร้อมก่อนเข้าประชุมออนไลน์ช่วยป้องกันปัญหาเสียงไม่ดัง เสียงก้อง หรือกล้องไม่ติดระหว่างการประชุมสำคัญ

## การทดสอบอุปกรณ์ก่อนเริ่มประชุม (Make a Test Call)
1. เปิด Microsoft Teams คลิกที่รูปโปรไฟล์หรือจุดสามจุดมุมบนขวา > **Settings**
2. เลือกแท็บ **Devices**
3. ตรวจสอบให้แน่ใจว่าเลือก Audio devices ถูกต้อง (เช่น หูฟัง USB หรือบลูทูธ)
4. คลิกปุ่ม **Make a test call** เพื่อบันทึกเสียงและฟังเสียงสะท้อนกลับของตนเอง

## การเปิดระบบตัดเสียงรบกวนอัจฉริยะ (Noise Suppression)
- ในแท็บ Devices หัวข้อ **Noise suppression** ให้เลือกเป็น **High**
- ระบบ AI จะตัดเสียงเคาะแป้นพิมพ์ เสียงพัดลม หรือเสียงเปิดซองเอกสารออกอัตโนมัติ

> [!TIP]
> หากต้องการเปลี่ยนภาพพื้นหลัง ให้คลิกที่ไอคอน **Effects and avatars** ก่อนกด Join Meeting แล้วเลือกรูปพื้นหลังทางการของสถาบันฯ ที่ระบบเตรียมไว้ให้`,
  },
  {
    title: 'การเข้าใช้งานระบบ Enterprise ERP & Intranet Portal และสิทธิ์การใช้งาน',
    slug: 'enterprise-erp-portal-access-guide',
    topicSlug: 'enterprise-erp',
    tags: ['erp', 'portal', 'intranet', 'permissions', 'finance'],
    summary: 'คู่มือการเข้าสู่ระบบ ERP ของสถาบันฯ ผ่าน Web Browser การขอเปิดสิทธิ์โมดูลจัดซื้อจัดจ้าง บัญชี และขั้นตอนการอนุมัติใบขอซื้อ (PR/PO)',
    content: `# การใช้งานระบบ Enterprise ERP และ Intranet Portal

ระบบ ERP ของสถาบันฯ ให้บริการผ่านเครือข่ายอินทราเน็ตภายใน สำหรับการจัดทำเอกสารงบประมาณ ใบขอซื้อขอจ้าง (PR/PO) และการเบิกจ่ายโครงการ

## การเข้าสู่ระบบ

- **URL เข้าใช้งาน:** \`https://erp.fti-group.corp/portal\`
- **เบราว์เซอร์ที่รองรับ:** Google Chrome, Microsoft Edge (เวอร์ชันล่าสุด)
- **การเข้าจากภายนอกสำนักงาน:** ต้องเชื่อมต่อ **Corporate VPN** ก่อนเข้าเว็บไซต์นี้เสมอ

## ขั้นตอนการขออนุมัติเอกสาร (PR Approval Workflow)

1. เข้าเมนู **E-Procurement > สร้างใบขอซื้อ (PR)**
2. ระบุรหัสโครงการ บัญชีค่าใช้จ่าย และแนบใบเสนอราคา (PDF)
3. กดปุ่ม **Submit for Approval** ระบบจะส่งการแจ้งเตือนไปยังผู้บังคับบัญชาตามลำดับขั้น
4. สามารถติดตามสถานะการอนุมัติได้ที่แท็บ **My Requests**

> [!WARNING]
> หากล็อกอินผิดเกิน 5 ครั้ง บัญชี ERP จะถูกระงับชั่วคราวเป็นเวลา 15 นาที หากจำรหัสผ่านไม่ได้ ให้กด "Forgot Password" เพื่อรับลิงก์รีเซ็ตทางอีเมล`,
  },
  {
    title: 'การตั้งค่า Signature ลายเซ็นอีเมลและ Shared Mailbox ใน Outlook 365',
    slug: 'outlook-365-signature-shared-mailbox',
    topicSlug: 'enterprise-outlook',
    tags: ['outlook', 'email', 'signature', 'shared-mailbox'],
    summary: 'วิธีติดตั้งลายเซ็นอีเมลมาตรฐานองค์กรที่มีโลโก้ FTI และการเพิ่มกล่องจดหมายกลาง (Shared Mailbox) เพื่อตอบอีเมลในนามแผนก',
    content: `# การตั้งค่าลายเซ็นอีเมล (Signature) และ Shared Mailbox ใน Outlook 365

เพื่อให้การติดต่อสื่อสารทางอีเมลกับหน่วยงานภายนอกมีความเป็นมืออาชีพ พนักงานทุกคนต้องใช้รูปแบบลายเซ็นมาตรฐานของสถาบันฯ

## การติดตั้งลายเซ็นมาตรฐาน
1. เปิด Outlook ไปที่ **File > Options > Mail > Signatures**
2. คลิก **New** ตั้งชื่อว่า "FTI Official"
3. คัดลอกแบบฟอร์มลายเซ็นที่มีโลโก้และข้อมูลตำแหน่งจาก Intranet มาวางในช่องแก้ไข
4. ปรับเปลี่ยนชื่อ นามสกุล ตำแหน่ง เบอร์ต่อโทรศัพท์ของท่านให้ถูกต้อง
5. ในช่อง **New messages** และ **Replies/forwards** ให้เลือกเป็น "FTI Official" แล้วกด OK

## การเพิ่ม Shared Mailbox ของแผนก
หากท่านได้รับสิทธิ์ดูแลอีเมลกลางของแผนก (เช่น \`contact@fti.or.th\`):
- โดยปกติ Outlook จะดึงกล่องจดหมายกลางขึ้นมาให้อัตโนมัติในแถบด้านซ้ายภายใน 1-2 ชั่วโมง
- หากยังไม่ขึ้น ให้ไปที่ **File > Account Settings > เลือกบัญชีของท่าน > Change > More Settings > Advanced > Add** แล้วพิมพ์ชื่ออีเมลแผนกลงไป

> [!NOTE]
> เมื่อส่งอีเมลในนาม Shared Mailbox ให้คลิกปุ่ม **From** แล้วเลือกที่อยู่อีเมลของแผนกก่อนกด Send`,
  },

  // ==========================================
  // SECTION 2: Hardware & Equipment
  // ==========================================
  {
    title: 'การตรวจสอบประสิทธิภาพ CPU ความร้อน และแก้ปัญหา Thermal Throttling',
    slug: 'cpu-performance-thermal-throttling',
    topicSlug: 'hw-cpu',
    tags: ['cpu', 'hardware', 'thermal', 'performance', 'cooling'],
    summary: 'ทำความเข้าใจการทำงานของ CPU สาเหตุที่พัดลมหมุนเสียงดัง อาการ Thermal Throttling ที่ทำให้เครื่องช้าลงกะทันหัน และวิธีบำรุงรักษา',
    content: `# ตรวจเช็กสุขภาพ CPU และการรับมือปัญหาความร้อน (Thermal Throttling)

หน่วยประมวลผลกลาง (**CPU**) คือหัวใจหลักของคอมพิวเตอร์ เมื่อ CPU ทำงานหนักหรือมีความร้อนสะสมสูงเกิน 95°C ระบบจะลดความเร็วลงอัตโนมัติเพื่อป้องกันชิปไหม้ ซึ่งเรียกว่า **Thermal Throttling**

## สัญญาณเตือนว่า CPU ร้อนผิดปกติ
- พัดลมระบายความร้อนของเครื่องหมุนด้วยความเร็วสูงสุดและมีเสียงดังต่อเนื่อง
- เมาส์เริ่มกระตุก หรือพิมพ์ตัวอักษรแล้วดีเลย์ไม่ขึ้นตามมือ
- โปรแกรมที่เคยเรนเดอร์เร็วกลับช้าลงอย่างเห็นได้ชัด
- โน้ตบุ๊กใต้เครื่องบริเวณช่องระบายอากาศมีความร้อนสูงมากเมื่อสัมผัส

## วิธีแก้ไขเบื้องต้น

- [ ] **อย่าวางโน้ตบุ๊กบนที่นอนหรือเบาะผ้า:** เพราะจะปิดกั้นช่องดูดอากาศด้านล่าง ควรวางบนโต๊ะเรียบหรือใช้แท่นวางโน้ตบุ๊ก
- [ ] **ตรวจสอบฝุ่นที่ช่องตะแกรงระบายความร้อน:** หากใช้งานเกิน 1 ปี อาจมีก้อนฝุ่นอุดตัน สามารถแจ้งช่างไอทีเพื่อเป่าฝุ่นและทาซิลิโคนใหม่
- [ ] **ตรวจสอบโปรแกรมแอบแฝง:** เปิด Task Manager ดูว่ามีโปรแกรมแปลกปลอมรัน CPU 100% ตลอดเวลาหรือไม่

> [!IMPORTANT]
> หากอุณหภูมิ CPU เกิน 100°C ระบบจะสั่งตัดการทำงานและดับเครื่องเองทันที (Emergency Shutdown) เพื่อความปลอดภัย`,
  },
  {
    title: 'การวิเคราะห์ปัญหา RAM ไม่พอ ปัญหา Memory Leak และการอัปเกรดหน่วยความจำ',
    slug: 'ram-memory-leak-upgrade-guide',
    topicSlug: 'hw-ram',
    isQuickLink: true,
    quickLinkOrder: 3,
    tags: ['ram', 'hardware', 'memory', 'performance', 'upgrade'],
    summary: 'สัญญาณเตือนเมื่อ RAM 8GB/16GB ไม่เพียงพอ วิธีตรวจจับโปรแกรมที่เกิด Memory Leak และหลักการเลือกซื้อ RAM แบบ Dual Channel',
    content: `# คู่มือวิเคราะห์ปัญหา RAM และแนวทางการอัปเกรดหน่วยความจำ

หน่วยความจำแรม (**RAM**) ทำหน้าที่เก็บข้อมูลที่โปรแกรมกำลังใช้งานอยู่แบบชั่วคราว หากเปิดแท็บเบราว์เซอร์และโปรแกรมพร้อมกันจำนวนมากจน RAM เต็ม ระบบจะเริ่มอืดและเกิดอาการค้าง

## อาการ Memory Leak คืออะไร?
**Memory Leak** เกิดจากข้อผิดพลาดในตัวโปรแกรม ที่จองพื้นที่ RAM เพิ่มขึ้นเรื่อยๆ แต่ไม่ยอมคืนหน่วยความจำเมื่อเลิกใช้งาน จนในที่สุดกิน RAM ทั้งหมดของเครื่อง:
- พบได้บ่อยในเบราว์เซอร์ที่มี Extension เสริมบางตัว หรือโปรแกรมที่เปิดทิ้งไว้ข้ามสัปดาห์
- **วิธีแก้เฉพาะหน้า:** ปิดโปรแกรมนั้นแล้วเปิดใหม่ หรือรีสตาร์ตเครื่องคอมพิวเตอร์

## สเปก RAM มาตรฐานของสถาบันฯ

| กลุ่มผู้ใช้งาน | ขนาด RAM แนะนำ | รูปแบบ Channel |
|---|---|---|
| **งานสำนักงาน / ธุรการ** | 16 GB DDR4/DDR5 | Dual Channel (8GB x 2) |
| **งานวิศวกรรม / Data / ออกแบบ 3D** | 32 GB - 64 GB DDR5 | Dual Channel (16GB x 2 หรือ 32GB x 2) |

> [!TIP]
> การติดตั้ง RAM แบบ **Dual Channel** (ใส่แรม 2 แถวที่สเปกและบัสเท่ากัน) จะช่วยเพิ่มแบนด์วิดท์ความเร็วการรับส่งข้อมูลของ CPU ได้สูงกว่าการใส่แรมแถวเดี่ยวถึง 20-30%`,
  },
  {
    title: 'การดูแลพื้นที่ไดรฟ์ SSD NVMe การเคลียร์แคชไดรฟ์ C และตรวจสุขภาพด้วย SMART',
    slug: 'storage-ssd-health-cleanup',
    topicSlug: 'hw-storage',
    tags: ['ssd', 'storage', 'hardware', 'disk-cleanup', 'health'],
    summary: 'การดูแลรักษา Solid State Drive (SSD), วิธีลบไฟล์ชั่วคราว Temp files เพื่อทวงคืนพื้นที่ไดรฟ์ C: และการตรวจสอบสุขภาพไดรฟ์ก่อนข้อมูลสูญหาย',
    content: `# การบำรุงรักษา SSD และเทคนิคการเคลียร์พื้นที่ไดรฟ์ C:

คอมพิวเตอร์ของสถาบันฯ ปัจจุบันใช้ **NVMe SSD** ทั้งหมดซึ่งมีความเร็วสูงกว่าฮาร์ดดิสก์จานหมุนแบบเดิมถึง 10-30 เท่า แต่หากไดรฟ์ C: มีพื้นที่เหลือน้อยกว่า 10% ความเร็วในการอ่านเขียนจะลดลงอย่างมาก

## ขั้นตอนการเคลียร์พื้นที่ไดรฟ์ C: ปลอดภัยใน 3 นาที

1. **ใช้เครื่องมือ Storage Sense ของ Windows:**
   - ไปที่ **Settings > System > Storage**
   - เปิดใช้งาน **Storage Sense** เพื่อให้ระบบลบไฟล์ขยะอัตโนมัติ
   - คลิกที่ **Temporary files** ติ๊กถูกที่ช่อง *Windows Update Cleanup* และ *Temporary files* จากนั้นกด **Remove files**
2. **ล้างโฟลเดอร์ Temp ด้วยคำสั่ง:**
   - กดปุ่ม \`Win + R\` พิมพ์ \`%temp%\` แล้วกด Enter
   - ลบไฟล์ทั้งหมดในโฟลเดอร์นี้ (หากไฟล์ใดกำลังใช้งานอยู่ให้กด Skip)

\`\`\`powershell
# ตรวจสอบสถานะสุขภาพของ SSD ผ่าน PowerShell (รันแบบ Admin)
Get-PhysicalDisk | Select-Object DeviceId, FriendlyName, MediaType, OperationalStatus, HealthStatus
\`\`\`

> [!WARNING]
> ห้ามใช้โปรแกรมทำ **Defragmentation** กับไดรฟ์ SSD เพราะจะทำให้ชิปหน่วยความจำสึกหรอเร็วขึ้น ให้ใช้เฉพาะคำสั่ง **Optimize (TRIM)** เท่านั้น`,
  },
  {
    title: 'การเชื่อมต่อระบบเครื่องพิมพ์เครือข่าย Follow-Me และการรูดบัตร RFID พิมพ์งาน',
    slug: 'setup-network-printer-follow-me',
    topicSlug: 'printers-scanners',
    isQuickLink: true,
    quickLinkOrder: 4,
    tags: ['printer', 'hardware', 'office', 'follow-me'],
    summary: 'การติดตั้งคิวเครื่องพิมพ์กลาง Follow-Me บนเครื่องคอมพิวเตอร์ และการสั่งพิมพ์แล้วไปแตะบัตรพนักงาน RFID ที่เครื่องพิมพ์จุดใดก็ได้ในอาคาร',
    content: `# ระบบการพิมพ์งาน Follow-Me Printing ด้วยบัตรพนักงาน

ระบบ **Follow-Me Printing** ช่วยให้คุณสามารถสั่งพิมพ์เอกสารเพียงครั้งเดียว แล้วเดินไปรับงานพิมพ์ที่เครื่องพิมพ์ตัวใดก็ได้ทั่วทั้งสถาบันฯ ด้วยการแตะบัตรพนักงาน

## การเพิ่มเครื่องพิมพ์บน Windows

- [ ] กดปุ่ม \`Win + R\` เพื่อเปิดหน้าต่าง Run
- [ ] พิมพ์เส้นทางเซิร์ฟเวอร์การพิมพ์: \`\\\\printserver01.fti.corp\\FollowMe-Color\` แล้วกด Enter
- [ ] ระบบจะดาวน์โหลดและติดตั้ง Driver PCL6 อัตโนมัติ
- [ ] เมื่อติดตั้งเสร็จ ให้คลิกขวาที่ชื่อเครื่องพิมพ์แล้วเลือก **Set as Default Printer**

## ขั้นตอนการรับงานพิมพ์ที่หน้าเครื่อง
1. เดินไปยังเครื่องมัลติฟังก์ชัน (MFP) ตัวใดก็ได้ที่สะดวก
2. แตะบัตรพนักงาน RFID ที่จุดอ่านบัตรข้างหน้าจอสัมผัส
3. หน้าจอจะแสดงรายการเอกสารที่ท่านสั่งพิมพ์ไว้
4. เลือกเอกสารที่ต้องการ แล้วกดปุ่ม **Print** เอกสารจะถูกพิมพ์ออกมาทันที

> [!NOTE]
> เอกสารที่สั่งพิมพ์จะอยู่ในคิวสำรองที่ปลอดภัยเป็นเวลา **24 ชั่วโมง** หากไม่มีการแตะบัตรสั่งพิมพ์ภายในเวลาดังกล่าว ระบบจะลบทิ้งอัตโนมัติเพื่อความปลอดภัยของข้อมูล`,
  },
  {
    title: 'วิธีแก้ปัญหากระดาษติดในเครื่องพิมพ์และการเปลี่ยนตลับหมึก Toner',
    slug: 'printer-paper-jam-toner-replacement',
    topicSlug: 'printers-scanners',
    tags: ['printer', 'hardware', 'maintenance', 'troubleshooting'],
    summary: 'ขั้นตอนการเปิดฝาเครื่องพิมพ์เพื่อดึงกระดาษติดอย่างปลอดภัย การล้างคิวพิมพ์ค้าง (Print Spooler) และขั้นตอนการเปลี่ยนตลับหมึกผง Toner',
    content: `# การแก้ปัญหากระดาษติดและเปลี่ยนตลับหมึกเครื่องพิมพ์

เมื่อเครื่องพิมพ์ขัดข้อง หน้าจอด้านหน้าจะแสดงรหัสข้อผิดพลาดและภาพเคลื่อนไหวแสดงจุดที่ต้องตรวจสอบ

## ข้อควรระวังเมื่อดึงกระดาษติด (Paper Jam)
- ให้ดูภาพจำลองบนหน้าจอเครื่องพิมพ์ว่ากระดาษติดอยู่ที่ประตูบานใด (เช่น Door A, Tray 2 หรือ Finisher)
- ใช้มือทั้งสองข้างจับขอบกระดาษแล้วดึงออกมาอย่างนุ่มนวล **ตามทิศทางการป้อนกระดาษ** เพื่อไม่ให้กระดาษขาดคาข้างใน
- ห้ามใช้กรรไกร ไม้บรรทัดเหล็ก หรือของมีคมแคะในช่องดรัม เพราะจะทำให้ลูกกลิ้งยางขาดหรือดรัมเป็นรอยถาวร

## การรีเซ็ตคิวพิมพ์ค้าง (Clear Print Spooler)
หากสั่งพิมพ์แล้วเครื่องนิ่ง และลบงานพิมพ์ในคิวไม่ออก ให้รันคำสั่งใน Command Prompt (Admin):

\`\`\`cmd
net stop spooler
del /Q /F /S "%systemroot%\\System32\\Spool\\Printers\\*.*"
net start spooler
\`\`\`

> [!WARNING]
> ตลับหมึกเลเซอร์ (Toner) มีผงหมึกละเอียดมาก หากผงหมึกเปื้อนมือหรือเสื้อผ้า ให้ล้างออกด้วย **น้ำเย็น** เท่านั้น ห้ามใช้น้ำอุ่นเพราะจะทำให้ผงหมึกละลายติดแน่น`,
  },
  {
    title: 'การต่อใช้งานจอภาพแยก 2 จอ (Dual Monitors) และการแก้ปัญหา USB-C Docking',
    slug: 'dual-monitors-docking-setup',
    topicSlug: 'displays-peripherals',
    tags: ['monitor', 'docking', 'display', 'hardware', 'usb-c'],
    summary: 'การจัดเรียงหน้าจอคู่บน Windows 11 การปรับแต่งความละเอียดและรีเฟรชเรท Hz และการแก้ปัญหาแท่นชาร์จ USB-C Docking จอดับหรือไม่ชาร์จไฟ',
    content: `# การตั้งค่าจอภาพต่อแยก (Dual Monitors) และแท่นต่อ USB-C Docking

การใช้งานจอภาพต่อขยายช่วยเพิ่มพื้นที่ในการทำงานเอกสารและวิเคราะห์ข้อมูลได้อย่างมีประสิทธิภาพ

## การจัดลำดับหน้าจอบน Windows 11
1. ต่อสาย HDMI / DisplayPort หรือเสียบสาย USB-C เพียงเส้นเดียวเข้ากับ Docking Station
2. ไปที่ **Settings > System > Display**
3. คลิกปุ่ม **Identify** เพื่อดูว่าจอไหนเป็นจอ 1 และจอไหนเป็นจอ 2
4. ลากไอคอนรูปหน้าจอในระบบให้ตรงกับตำแหน่งจริงของจอที่วางอยู่บนโต๊ะทำงาน
5. ที่หัวข้อ Multiple displays ให้เลือกเป็น **Extend these displays** (ขยายหน้าจอ)

## การแก้ปัญหา USB-C Docking Station รวน
หากจอดับ สัญญาณภาพหาย หรือเสียบเมาส์ผ่าน Docking แล้วไม่ติด:
- [ ] ถอดสายไฟ Adapter ที่ต่อเข้ากับ Docking ออก ทิ้งไว้ 15 วินาทีเพื่อ Reset Power Controller
- [ ] เสียบสายไฟ Adapter เข้ากับเต้ารับโดยตรง (หลีกเลี่ยงปลั๊กพ่วงราคาถูก)
- [ ] อัปเดต Firmware ของ Docking Station ผ่านเว็บไซต์ผู้ผลิต`,
  },
  {
    title: 'ระบบกล้องวงจรปิด (CCTV): การดูภาพสดและตรวจสอบตำแหน่งบน Smart Campus Floor Plan',
    slug: 'cctv-live-view-floorplan-monitoring',
    topicSlug: 'cctv-surveillance',
    isQuickLink: true,
    quickLinkOrder: 5,
    tags: ['cctv', 'surveillance', 'floor-plan', 'security', 'hardware'],
    summary: 'วิธีการตรวจสอบมุมมองกล้องวงจรปิด (FOV Coverage) บนแผนผังดิจิทัล Smart Floor Plan ของสถาบันฯ การดูภาพสด และระดับสิทธิ์การเข้าถึง',
    content: `# การดูภาพสดกล้องวงจรปิดผ่าน Smart Campus Floor Plan

สถาบันฯ ได้ติดตั้งระบบ **Interactive Smart Floor Plan** ที่ผสานตำแหน่งกล้องวงจรปิด (CCTV) และทิศทางมุมมอง (FOV Cone) เข้ากับแผนผังอาคารแบบเรียลไทม์

## คุณสมบัติของระบบกล้องบนแปลนดิจิทัล

- **การแสดงผลทิศทางกล้อง (Field of View - FOV):**
  - กล้องแต่ละตัวจะมีกรวยแสดงมุมองศาการมองเห็น (เช่น 75°, 90°, 120°) และระยะส่อง (เมตร)
  - แถบสีสถานะ: 🟢 ปกติ (Active), 🟡 อยู่ระหว่างซ่อม (Maintenance), 🔴 กล้องออฟไลน์ (Broken)
- **การเข้าดูภาพสด (Live Streaming):**
  - เจ้าหน้าที่รักษาความปลอดภัยและผู้ดูแลอาคารสามารถคลิกที่ไอคอนกล้อง 📹 บนแปลนเพื่อเปิดหน้าต่างดูภาพสดได้ทันที
  - สามารถสลับระหว่างมุมมอง Master Plan (พื้นที่รวม 20 ไร่) หรือเจาะจงรายชั้นของอาคาร HQ และคลังสินค้า

> [!NOTE]
> พนักงานทั่วไปสามารถดูตำแหน่งจุดติดตั้งกล้องเพื่อความปลอดภัยในชีวิตและทรัพย์สิน แต่การเปิดดูภาพสดสงวนไว้เฉพาะผู้มีสิทธิ์ความปลอดภัย (Security Operator Role) ตามมาตรการ PDPA`,
  },
  {
    title: 'ระเบียบการขอดูภาพบันทึกย้อนหลังกล้องวงจรปิดตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
    slug: 'cctv-footage-request-pdpa-policy',
    topicSlug: 'cctv-surveillance',
    tags: ['cctv', 'pdpa', 'policy', 'legal', 'security'],
    summary: 'ขั้นตอนและเอกสารที่ต้องใช้ในการยื่นคำร้องขอดูภาพเหตุการณ์ย้อนหลัง กรณีทรัพย์สินสูญหายหรืออุบัติเหตุภายในพื้นที่สถาบันฯ',
    content: `# ระเบียบการขอดูภาพย้อนหลังกล้องวงจรปิด (CCTV Request & PDPA)

เพื่อให้สอดคล้องกับ **พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)** การเปิดเผยหรือขอดูภาพบันทึกจากกล้องวงจรปิดจะต้องดำเนินการตามขั้นตอนที่กฎหมายกำหนด

## เงื่อนไขและเหตุผลที่สามารถยื่นคำร้องได้
1. เกิดอุบัติเหตุหรือเหตุฉุกเฉินต่อบุคคลภายในพื้นที่สถาบันฯ
2. ทรัพย์สินของทางราชการหรือทรัพย์สินส่วนบุคคลสูญหายหรือเสียหาย
3. ได้รับหมายเรียกหรือหนังสือขอความร่วมมือจากเจ้าหน้าที่ตำรวจ/พนักงานสอบสวน

## ขั้นตอนการยื่นคำร้อง
- [ ] กรอกแบบฟอร์ม **คำร้องขอดูข้อมูลภาพจากกล้องวงจรปิด (แบบ CCTV-01)** ในระบบ Intranet
- [ ] แนบหลักฐานประกอบ: สำเนาบัตรประจำตัวประชาชน/บัตรพนักงาน และใบแจ้งความจากสถานีตำรวจ (กรณีคดีอาญา/ทรัพย์สินสูญหาย)
- [ ] ระบุวัน เวลา และจุดเกิดเหตุให้แคบที่สุด (จำกัดช่วงเวลาไม่เกิน 2 ชั่วโมง)
- [ ] ฝ่ายรักษาความปลอดภัยและเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) จะพิจารณาอนุมัติภายใน **3 วันทำการ**

> [!WARNING]
> ภาพบันทึกจากกล้องวงจรปิดจะถูกเก็บสำรองไว้ในระบบ NVR เป็นเวลา **30 วัน** หลังจากนั้นระบบจะบันทึกทับอัตโนมัติ`,
  },
  {
    title: 'คู่มือการตรวจสอบและแก้ปัญหากล้องวงจรปิดออฟไลน์ (CCTV Troubleshooting)',
    slug: 'cctv-offline-camera-troubleshooting',
    topicSlug: 'cctv-surveillance',
    tags: ['cctv', 'troubleshooting', 'poe', 'network', 'hardware'],
    summary: 'ขั้นตอนสำหรับทีมช่างเทคนิคในการตรวจสอบกล้อง IP Camera ที่สัญญาณดับ ตรวจสอบไฟเลี้ยง PoE Switch และการเช็กสายสัญญาณ UTP',
    content: `# ขั้นตอนการตรวจสอบและแก้ไขกล้องวงจรปิดออฟไลน์ (IP Camera Offline)

เมื่อพบไอคอนกล้องวงจรปิดแสดงสถานะสีแดง (Broken / Offline) บนระบบ Smart Floor Plan ทีมเทคนิคสามารถตรวจสอบตามลำดับขั้นตอนดังนี้:

## 1. ตรวจสอบระบบจ่ายไฟผ่านสายแลน (Power over Ethernet - PoE)
- กล้อง IP Camera เกือบทั้งหมดใช้ไฟเลี้ยงผ่านสาย LAN (PoE 802.3af/at)
- ตรวจสอบที่ตู้ Rack สวิตช์ประจำชั้น: ดูไฟสถานะพอร์ตของ PoE Switch ว่าไฟ Link/Power ติดหรือไม่
- หากพอร์ตดับ ให้ลองสลับพอร์ตหรือใช้สาย Patch Cord เส้นใหม่ทดสอบ

## 2. ทดสอบการเชื่อมต่อเครือข่ายด้วยคำสั่ง Ping
- นำ IP Address ของกล้อง (ตรวจสอบได้จากหน้ารายละเอียดทรัพย์สิน) มาทดสอบ:

\`\`\`bash
# ทดสอบ Ping ตรวจสอบการตอบสนองของกล้อง
ping 192.168.20.105 -t

# สแกนพอร์ต RTSP (Stream Video Port 554)
Test-NetConnection -ComputerName 192.168.20.105 -Port 554
\`\`\`

> [!TIP]
> หากกล้องไม่ตอบสนองหลังจากไฟดับหรือมีฟ้าผ่า ให้ตรวจสอบเบรกเกอร์กันกระชาก (Surge Protector) ที่ตู้ควบคุมระบบ CCTV ประจำอาคาร`,
  },

  // ==========================================
  // SECTION 3: Network & Connectivity
  // ==========================================
  {
    title: 'การเชื่อมต่อ Wi-Fi สำนักงาน (FTI-Staff) และการแก้ปัญหาใบรับรอง Certificate',
    slug: 'connecting-to-office-wifi-fti-staff',
    topicSlug: 'wifi-lan',
    isQuickLink: true,
    quickLinkOrder: 6,
    tags: ['wifi', 'network', 'certificate', 'wireless'],
    summary: 'ขั้นตอนการต่อ Wi-Fi องค์กร WPA2-Enterprise ด้วยบัญชีผู้ใช้โดเมน FTI และการยอมรับใบรับรองความปลอดภัย',
    content: `# การเชื่อมต่อเครือข่ายไร้สาย FTI-Staff (WPA2-Enterprise)

เครือข่าย **FTI-Staff** ถูกออกแบบมาสำหรับคอมพิวเตอร์และสมาร์ตโฟนของพนักงาน ให้สามารถเข้าถึงเซิร์ฟเวอร์ภายใน เครื่องพิมพ์ และอินเทอร์เน็ตความเร็วสูง

## ข้อมูลการเชื่อมต่อ

| พารามิเตอร์ | ค่าที่กำหนด |
|---|---|
| **SSID** | \`FTI-Staff\` |
| **Security Type** | WPA2 / WPA3-Enterprise |
| **EAP Method** | PEAP |
| **Phase 2 Authentication** | MSCHAPv2 |
| **Username** | รหัสพนักงาน หรืออีเมลองค์กร (\`username@fti.or.th\`) |

## ขั้นตอนการแก้ปัญหาเมื่อต่อไม่ติด
- หากเพิ่งเปลี่ยนรหัสผ่าน Windows มา ให้กด **Forget Network** เครือข่าย FTI-Staff ก่อน แล้วเชื่อมต่อใหม่ด้วยรหัสผ่านล่าสุด
- เมื่อระบบถามหาใบรับรองความปลอดภัย (Certificate) ให้กด **Trust** หรือ **Accept** ใบรับรอง \`fti-root-ca.crt\``,
  },
  {
    title: 'การขอรหัสผ่าน Wi-Fi ผู้มาติดต่อ (FTI-Guest) สำหรับแขกและวิทยากรภายนอก',
    slug: 'guest-wifi-access-fti-guest',
    topicSlug: 'wifi-lan',
    tags: ['wifi', 'guest', 'network', 'visitors'],
    summary: 'การขอรหัสผ่านใช้งาน Wi-Fi ชั่วคราวสำหรับวิทยากร แขกผู้มาเยือน และขั้นตอนการล็อกอินผ่าน Captive Portal',
    content: `# การให้บริการ Wi-Fi สำหรับผู้มาติดต่อ (FTI-Guest)

ผู้มาเยือน ผู้เข้ารับการฝึกอบรม หรือวิทยากรภายนอก สามารถเชื่อมต่อเครือข่าย **FTI-Guest** เพื่อใช้งานอินเทอร์เน็ตทั่วไปได้

## วิธีการเข้าใช้งาน
1. เลือกเชื่อมต่อ SSID: \`FTI-Guest\`
2. เบราว์เซอร์จะเปิดหน้าต่างล็อกอิน (Captive Portal) ขึ้นมาให้อัตโนมัติ
3. ป้อนเบอร์โทรศัพท์มือถือของท่านเพื่อรับรหัสผ่านผ่าน SMS OTP
4. สิทธิ์การใช้งานจะมีอายุ **8 ชั่วโมง** ต่อการล็อกอินหนึ่งครั้ง

> [!WARNING]
> เครือข่าย FTI-Guest ถูกแยกโซนปลอดภัย (VLAN Isolation) จะไม่สามารถเข้าถึงระบบงานภายใน เครื่องพิมพ์ หรือแชร์ไดรฟ์ของพนักงานได้`,
  },
  {
    title: 'การติดตั้งและเชื่อมต่อ Cisco AnyConnect VPN สำหรับทำงานนอกสถานที่ (Work from Home)',
    slug: 'cisco-anyconnect-vpn-setup',
    topicSlug: 'vpn-remote-access',
    isQuickLink: true,
    quickLinkOrder: 7,
    tags: ['vpn', 'cisco', 'remote-work', 'wfh', 'security'],
    summary: 'คู่มือการติดตั้งโปรแกรม Cisco AnyConnect VPN บน Windows และ macOS พร้อมการยืนยันตัวตนผ่าน Microsoft Authenticator',
    content: `# การติดตั้งและใช้งาน Corporate VPN (Cisco AnyConnect)

เมื่อพนักงานต้องเดินทางไปปฏิบัติงานนอกสถานที่ หรือทำงานในรูปแบบ Work from Home การเชื่อมต่อผ่าน **VPN** เป็นสิ่งจำเป็นในการเข้าถึงระบบภายในอย่างปลอดภัย

## ข้อมูลเกตเวย์ VPN
- **Gateway Server:** \`vpn.fti-group.corp\`
- **การยืนยันตัวตน:** บัญชีอีเมล FTI + การกดอนุมัติบนสมาร์ตโฟน (MFA Push Notification)

## ขั้นตอนการเชื่อมต่อ

- [ ] เปิดโปรแกรม **Cisco AnyConnect Secure Mobility Client**
- [ ] ในช่องใส่ที่อยู่ ให้พิมพ์ \`vpn.fti-group.corp\` แล้วกด **Connect**
- [ ] กรอกอีเมลและรหัสผ่านองค์กรของท่าน
- [ ] ระบบจะส่งการแจ้งเตือนไปยังโทรศัพท์มือถือ ให้เปิดแอป **Microsoft Authenticator** แล้วกด Approve
- [ ] สังเกตที่ไอคอนแม่กุญแจที่มุมล่างขวาของหน้าจอ เมื่อขึ้นแม่กุญแจสีเหลืองปิดล็อก แสดงว่าเชื่อมต่อสำเร็จ`,
  },
  {
    title: 'การเชื่อมต่อรีโมตเดสก์ท็อป (Remote Desktop - RDP) กลับมายังเครื่องที่ทำงาน',
    slug: 'remote-desktop-rdp-vpn-workflow',
    topicSlug: 'vpn-remote-access',
    tags: ['rdp', 'remote-desktop', 'windows', 'wfh'],
    summary: 'วิธีการเปิดใช้งาน Remote Desktop จากโน้ตบุ๊กที่บ้าน เพื่อเข้าควบคุมคอมพิวเตอร์ Workstation ที่ตั้งอยู่ที่ทำงานผ่าน VPN',
    content: `# การใช้งาน Remote Desktop (RDP) ผ่านอุโมงค์ VPN

หากท่านจำเป็นต้องใช้งานโปรแกรมที่ติดตั้งอยู่เฉพาะบนคอมพิวเตอร์ตั้งโต๊ะในออฟฟิศ ท่านสามารถสั่งรีโมตหน้าจอผ่านระบบ RDP ได้

## สิ่งที่ต้องเตรียมก่อนใช้งาน
1. **คอมพิวเตอร์ที่ทำงานต้องเปิดเครื่องทิ้งไว้** (ห้ามกด Shut down หรือ Sleep)
2. จดบันทึกชื่อเครื่องคอมพิวเตอร์ของท่านไว้ (เช่น \`WKSTN-IT-0042.fti.corp\`)
3. เชื่อมต่อ Corporate VPN บนเครื่องที่บ้านให้เรียบร้อยก่อนเสมอ

## วิธีการเชื่อมต่อ
1. ที่เครื่องที่บ้าน กดปุ่ม \`Win + R\` พิมพ์ \`mstsc\` แล้วกด Enter
2. ในช่อง Computer ให้พิมพ์ชื่อเครื่องของท่าน เช่น \`WKSTN-IT-0042.fti.corp\`
3. คลิก **Show Options** ป้อนชื่อผู้ใช้ในรูปแบบ \`FTI\\username\`
4. กด Connect แล้วใส่รหัสผ่าน หน้าจอคอมพิวเตอร์ที่ทำงานจะปรากฏขึ้นมา`,
  },
  {
    title: 'คำสั่งวินิจฉัยเน็ตเวิร์กเบื้องต้น: Ping, Traceroute, Flush DNS และ Winsock Reset',
    slug: 'network-troubleshooting-ping-dns-winsock',
    topicSlug: 'network-troubleshooting',
    tags: ['network', 'troubleshooting', 'cmd', 'dns', 'ping'],
    summary: 'รวมคำสั่ง Command Prompt สำหรับแก้ปัญหาเปิดเว็บไม่ได้ เน็ตหลุด หรือสัญลักษณ์กากบาทสีแดง/เครื่องหมายตกใจสีเหลืองที่ไอคอนเน็ต',
    content: `# เครื่องมือวินิจฉัยและแก้ปัญหาเครือข่ายด้วยตนเอง

เมื่อไอคอนอินเทอร์เน็ตขึ้นเครื่องหมายตกใจสีเหลือง ("Connected, No Internet") คำสั่งเหล่านี้จะช่วยล้างแคชและขอรับการตั้งค่าเครือข่ายใหม่จากเราเตอร์

## ชุดคำสั่งล้างระบบเครือข่าย (รันผ่าน Command Prompt as Admin)

\`\`\`cmd
:: 1. สละหมายเลข IP เดิมที่อาจมีปัญหา
ipconfig /release

:: 2. ล้างแคช DNS ที่อาจจำค่าเว็บไซต์เก่าผิดพลาด
ipconfig /flushdns

:: 3. ขอรับหมายเลข IP ใหม่จาก DHCP Server
ipconfig /renew

:: 4. รีเซ็ตระบบเน็ตเวิร์กสแต็กของ Windows
netsh winsock reset
netsh int ip reset
\`\`\`

## การทดสอบว่าเชื่อมต่ออินเทอร์เน็ตออกไปข้างนอกได้หรือไม่
\`\`\`cmd
:: ทดสอบส่งสัญญาณไปยัง DNS กลางของ Google (ดูว่าสายแลน/เน็ตเวิร์กยังส่งข้อมูลได้ไหม)
ping 8.8.8.8 -n 4

:: ทดสอบว่าระบบแปลงชื่อเว็บไซต์ (DNS) ทำงานได้ปกติหรือไม่
ping www.google.com -n 4
\`\`\`

> [!IMPORTANT]
> หลังจากรันคำสั่ง \`netsh winsock reset\` ต้องรีสตาร์ตเครื่องคอมพิวเตอร์ 1 ครั้งเพื่อเริ่มต้นระบบเครือข่ายใหม่`,
  },

  // ==========================================
  // SECTION 4: IT Security & Policies
  // ==========================================
  {
    title: 'นโยบายรหัสผ่านที่ปลอดภัยและการตั้งค่าระบบรีเซ็ตรหัสผ่านตนเอง (SSPR)',
    slug: 'password-policy-sspr-setup',
    topicSlug: 'accounts-mfa',
    isQuickLink: true,
    quickLinkOrder: 8,
    tags: ['password', 'security', 'sspr', 'policy'],
    summary: 'เกณฑ์การตั้งรหัสผ่านตามมาตรฐานความปลอดภัย ISO 27001 และการลงทะเบียนระบบ Self-Service Password Reset เพื่อปลดล็อกรหัสด้วยตนเอง 24 ชั่วโมง',
    content: `# นโยบายรหัสผ่านปลอดภัยและการใช้งานระบบ SSPR

เพื่อปกป้องข้อมูลสำคัญของสถาบันฯ พนักงานทุกคนต้องปฏิบัติตามมาตรฐานการตั้งรหัสผ่าน และลงทะเบียนระบบกู้คืนรหัสผ่านด้วยตนเอง

## เกณฑ์การตั้งรหัสผ่าน (Password Complexity)
- ความยาวอย่างน้อย **12 ตัวอักษร**
- ต้องประกอบด้วย: ตัวอักษรพิมพ์ใหญ่ (A-Z), พิมพ์เล็ก (a-z), ตัวเลข (0-9) และอักขระพิเศษ (@, #, $, %, !)
- รหัสผ่านมีอายุใช้งาน **90 วัน** (ระบบจะแจ้งเตือนล่วงหน้า 14 วันก่อนหมดอายุ)
- ห้ามใช้รหัสผ่านซ้ำกับ 5 ครั้งล่าสุด และห้ามใช้วันเดือนปีเกิดหรือชื่อของตนเอง

## การเปิดใช้งานระบบรีเซ็ตรหัสผ่านตนเอง (SSPR)
- เข้าไปลงทะเบียนข้อมูลความปลอดภัยที่: \`https://mysignins.microsoft.com/security-info\`
- ผูกเบอร์โทรศัพท์มือถือและอีเมลสำรองส่วนตัว
- เมื่อคุณลืมรหัสผ่าน สามารถกดปุ่ม **"Forgot my password"** ที่หน้าจอ Login เพื่อรับรหัส OTP ทาง SMS และตั้งรหัสผ่านใหม่ได้ทันทีโดยไม่ต้องรอฝ่ายไอที`,
  },
  {
    title: 'คู่มือการติดตั้งและใช้งานแอปพลิเคชัน Microsoft Authenticator สำหรับระบบ 2FA',
    slug: 'microsoft-authenticator-2fa-setup',
    topicSlug: 'accounts-mfa',
    tags: ['2fa', 'mfa', 'authenticator', 'security', 'mobile'],
    summary: 'ขั้นตอนการติดตั้งแอป Microsoft Authenticator บนสมาร์ตโฟน iOS/Android และการสแกน QR Code เพื่อเปิดใช้งานการยืนยันตัวตนสองชั้น',
    content: `# การเปิดใช้งานระบบยืนยันตัวตนสองชั้น (2-Factor Authentication)

การยืนยันตัวตนสองชั้น (2FA / MFA) ช่วยป้องกันการถูกขโมยรหัสผ่านได้ถึง 99.9% แม้แฮกเกอร์จะรู้รหัสผ่านของท่านก็ไม่สามารถเข้าสู่ระบบได้หากไม่มีโทรศัพท์ของท่าน

## ขั้นตอนการติดตั้ง

1. ดาวน์โหลดแอป **Microsoft Authenticator** จาก App Store (iOS) หรือ Google Play (Android)
2. บนคอมพิวเตอร์ ให้เปิดเบราว์เซอร์ไปที่: \`https://aka.ms/mfasetup\`
3. เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน FTI
4. หน้าจอจะแสดง **QR Code** ขึ้นมา
5. เปิดแอปบนมือถือ กดเครื่องหมาย **+ (Add Account)** > เลือก **Work or school account**
6. สแกน QR Code บนหน้าจอคอมพิวเตอร์
7. ทดสอบยืนยันตัวเลข 2 หลักที่แสดงบนหน้าจอกับแอปบนมือถือ เป็นอันเสร็จสิ้น`,
  },
  {
    title: 'วิธีสังเกตและตรวจจับอีเมลหลอกลวง (Phishing Scam) และการแจ้งเตือนภัยคุกคาม',
    slug: 'phishing-detection-and-response',
    topicSlug: 'cybersecurity-phishing',
    tags: ['phishing', 'security', 'email', 'cybersecurity', 'awareness'],
    summary: 'วิธีสังเกตจุดผิดปกติของอีเมลหลอกลวงที่ปลอมตัวเป็นธนาคารหรือผู้บริหาร การตรวจสอบลิงก์แฝง และปุ่ม Report Phishing ใน Outlook',
    content: `# วิธีตรวจจับและรับมืออีเมลหลอกลวง (Phishing Email)

อีเมลหลอกลวง (**Phishing**) เป็นช่องทางหลักที่ผู้ไม่หวังดีใช้ในการแพร่กระจายมัลแวร์เรียกค่าไถ่ (Ransomware) และขโมยบัญชีผู้ใช้ในองค์กร

## 4 จุดสังเกตอีเมล Phishing ยอดฮิต

1. **ผู้ส่งปลอมแปลง (Sender Address):** ชื่อผู้ส่งอาจแสดงเป็น "HR Department" หรือ "ผู้บริหาร" แต่เมื่อดูที่อยู่อีเมลจริงกลับมาจากโดเมนภายนอก เช่น \`@gmail.com\` หรือสะกดผิด เช่น \`@fti-or.com\`
2. **สร้างความตื่นตระหนก เร่งด่วน:** เช่น "บัญชีของท่านจะถูกระงับใน 24 ชั่วโมง" หรือ "มีพัสดุด่วนค้างจ่ายเงิน"
3. **ลิงก์แฝง (Hidden Hyperlink):** ก่อนคลิกลิงก์ใดๆ ให้เลื่อนเมาส์ไปชี้ค้างไว้ (Hover) โดยไม่ต้องคลิก เพื่อดู URL ปลายทางจริง
4. **ไฟล์แนบต้องสงสัย:** ไฟล์นามสกุล \`.exe\`, \`.iso\`, \`.vbs\`, หรือไฟล์ \`.zip\` ที่มีการตั้งรหัสผ่านเพื่อหลบเลี่ยงการสแกนไวรัส

> [!WARNING]
> หากพบอีเมลน่าสงสัย **ห้ามคลิกลิงก์และห้ามเปิดไฟล์แนบเด็ดขาด** ให้คลิกที่ปุ่ม **Report Phishing** บนแถบเมนูของ Outlook ทันที เพื่อส่งข้อมูลให้ศูนย์เฝ้าระวัง SOC ตรวจสอบ`,
  },
  {
    title: 'ระเบียบการยืม-คืนอุปกรณ์ไอทีโน้ตบุ๊กสำรอง โปรเจกเตอร์ และระดับการบริการ SLA',
    slug: 'it-equipment-loan-policy-sla',
    topicSlug: 'it-helpdesk-loans',
    tags: ['loan', 'policy', 'helpdesk', 'sla', 'support'],
    summary: 'ขั้นตอนการขอยืมโน้ตบุ๊กสำหรับการเดินทางไปราชการ โปรเจกเตอร์ และกำหนดเวลาการให้บริการแก้ปัญหาของฝ่ายไอที (SLA Standards)',
    content: `# นโยบายการยืม-คืนอุปกรณ์ไอทีและระดับการบริการ (IT Service SLA)

ฝ่ายเทคโนโลยีสารสนเทศมีอุปกรณ์ส่วนกลางสำรองไว้ให้บริการสำหรับพนักงานที่ต้องออกไปปฏิบัติงานนอกสถานที่ หรือจัดงานอบรมสัมมนา

## รายการอุปกรณ์ที่ให้บริการยืม
- โน้ตบุ๊กสำรองสำหรับการเดินทางไปราชการ (ระยะเวลาไม่เกิน 14 วันทำการ)
- เครื่องฉายโปรเจกเตอร์และจอภาพพกพา
- Wireless Presenter (รีโมตพอยเตอร์เลเซอร์สไลด์)
- ลำโพงและไมโครโฟนประชุมไร้สาย (Conference Speakerphone)

## ระดับเวลาการให้บริการแก้ไขปัญหา (Service Level Agreement - SLA)

| ระดับความเร่งด่วน | ตัวอย่างปัญหา | เวลาตอบรับ | เวลาแก้ไขเป้าหมาย |
|---|---|---|---|
| **Critical (ด่วนที่สุด)** | ระบบเครือข่ายล่มทั้งอาคาร, ระบบ ERP เข้าไม่ได้ | ภายใน 15 นาที | ไม่เกิน 2 ชั่วโมง |
| **High (สูง)** | เครื่องผู้บริหารมีปัญหา, งานประชุมใหญ่เปิดไมค์/ภาพไม่ได้ | ภายใน 30 นาที | ไม่เกิน 4 ชั่วโมง |
| **Medium (ปานกลาง)** | ปริ้นเตอร์กระดาษติด, คอมพิวเตอร์พนักงานช้า | ภายใน 2 ชั่วโมง | ไม่เกิน 8 ชั่วโมงทำการ |
| **Low (ทั่วไป)** | ขอยืมอุปกรณ์ล่วงหน้า, ลงโปรแกรมเพิ่มเติม | ภายใน 4 ชั่วโมง | 1-2 วันทำการ |

> [!NOTE]
> การยืมอุปกรณ์กรุณาทำเรื่องแจ้งล่วงหน้าอย่างน้อย **3 วันทำการ** ผ่านระบบ E-Ticket เพื่อให้ทีมงานจัดเตรียมและตรวจสอบความพร้อมของอุปกรณ์`,
  },
];

export const LINK_PAIRS = [
  // Interconnect related articles for the Obsidian Graph View
  ['windows-11-enterprise-setup', 'windows-task-manager-troubleshooting'],
  ['windows-11-enterprise-setup', 'password-policy-sspr-setup'],
  ['windows-11-enterprise-setup', 'connecting-to-office-wifi-fti-staff'],
  ['windows-task-manager-troubleshooting', 'cpu-performance-thermal-throttling'],
  ['windows-task-manager-troubleshooting', 'ram-memory-leak-upgrade-guide'],
  ['linux-terminal-essential-commands', 'linux-ssh-key-pairs-setup'],
  ['linux-terminal-essential-commands', 'network-troubleshooting-ping-dns-winsock'],
  ['microsoft-word-formatting-toc', 'microsoft-word-autorecover-restore'],
  ['microsoft-word-autorecover-restore', 'storage-ssd-health-cleanup'],
  ['microsoft-excel-xlookup-performance', 'ram-memory-leak-upgrade-guide'],
  ['microsoft-excel-xlookup-performance', 'enterprise-erp-portal-access-guide'],
  ['microsoft-teams-audio-video-setup', 'dual-monitors-docking-setup'],
  ['microsoft-teams-audio-video-setup', 'connecting-to-office-wifi-fti-staff'],
  ['enterprise-erp-portal-access-guide', 'cisco-anyconnect-vpn-setup'],
  ['enterprise-erp-portal-access-guide', 'outlook-365-signature-shared-mailbox'],
  ['outlook-365-signature-shared-mailbox', 'phishing-detection-and-response'],
  ['cpu-performance-thermal-throttling', 'ram-memory-leak-upgrade-guide'],
  ['cpu-performance-thermal-throttling', 'storage-ssd-health-cleanup'],
  ['storage-ssd-health-cleanup', 'windows-11-enterprise-setup'],
  ['setup-network-printer-follow-me', 'printer-paper-jam-toner-replacement'],
  ['setup-network-printer-follow-me', 'connecting-to-office-wifi-fti-staff'],
  ['dual-monitors-docking-setup', 'cctv-live-view-floorplan-monitoring'],
  ['cctv-live-view-floorplan-monitoring', 'cctv-footage-request-pdpa-policy'],
  ['cctv-live-view-floorplan-monitoring', 'cctv-offline-camera-troubleshooting'],
  ['cctv-footage-request-pdpa-policy', 'phishing-detection-and-response'],
  ['cctv-offline-camera-troubleshooting', 'network-troubleshooting-ping-dns-winsock'],
  ['connecting-to-office-wifi-fti-staff', 'guest-wifi-access-fti-guest'],
  ['connecting-to-office-wifi-fti-staff', 'network-troubleshooting-ping-dns-winsock'],
  ['cisco-anyconnect-vpn-setup', 'remote-desktop-rdp-vpn-workflow'],
  ['cisco-anyconnect-vpn-setup', 'microsoft-authenticator-2fa-setup'],
  ['remote-desktop-rdp-vpn-workflow', 'windows-11-enterprise-setup'],
  ['password-policy-sspr-setup', 'microsoft-authenticator-2fa-setup'],
  ['password-policy-sspr-setup', 'phishing-detection-and-response'],
  ['microsoft-authenticator-2fa-setup', 'cisco-anyconnect-vpn-setup'],
  ['it-equipment-loan-policy-sla', 'windows-11-enterprise-setup'],
  ['it-equipment-loan-policy-sla', 'dual-monitors-docking-setup'],
];
