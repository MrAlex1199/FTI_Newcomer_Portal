import { useNavigate } from 'react-router-dom';
import useLanguage from '../../hooks/useLanguage.js';

export const DEFAULT_ONBOARDING_TASKS = {
  first_day: [
    {
      id: 'fd_badge',
      titleTh: 'รับบัตรพนักงาน บัตรผ่านประตู และสายคล้องที่ฝ่ายทรัพยากรบุคคล (ตึก A)',
      titleEn: 'Collect employee badge, keycard, and lanyard at HR (Building A)',
      descTh: 'ติดต่อเคาน์เตอร์ HR เพื่อยืนยันตัวตนและรับอุปกรณ์ประจำตัว',
      descEn: 'Visit HR front desk to verify identity and pick up essentials',
      actionLabelTh: 'ดูผังอาคาร ↗',
      actionLabelEn: 'View Campus Map ↗',
      actionLink: '/floor-plans',
      priority: 'high',
    },
    {
      id: 'fd_vault_pin',
      titleTh: 'ตั้งค่ารหัสผ่านและสร้าง PIN 6 หลักสำหรับตู้นิรภัยส่วนตัว (Personal Vault)',
      titleEn: 'Set password & 6-digit PIN for your Personal Secret Vault',
      descTh: 'ใช้จัดเก็บรหัสผ่านระบบงานและบันทึกสำคัญส่วนตัวอย่างปลอดภัยด้วย AES-GCM',
      descEn: 'Securely store system credentials and private notes encrypted with AES-GCM',
      actionLabelTh: 'ตั้งค่า PIN Vault ↗',
      actionLabelEn: 'Open Vault ↗',
      actionLink: '/vault',
      priority: 'high',
    },
    {
      id: 'fd_floor_plans',
      titleTh: 'สำรวจผังอาคาร ตำแหน่งโต๊ะทำงาน จุดปริ้นเตอร์ และห้องประชุม',
      titleEn: 'Explore floor plans: desk position, printer station, and meeting rooms',
      descTh: 'ดูพิกัดสถานที่จริงและสิ่งอำนวยความสะดวกบนแผนที่แคมปัส 20 ไร่',
      descEn: 'Check real indoor navigation and amenities on the interactive floor plan',
      actionLabelTh: 'เปิดผังโต๊ะทำงาน ↗',
      actionLabelEn: 'Open Floor Plan ↗',
      actionLink: '/floor-plans',
      priority: 'normal',
    },
    {
      id: 'fd_meet_mentor',
      titleTh: 'พบพี่เลี้ยงประจำตัว (Mentor) และแนะนำตัวกับเพื่อนร่วมทีม',
      titleEn: 'Meet your assigned mentor and introduce yourself to teammates',
      descTh: 'ค้นหาเบอร์ต่อภายใน แผนก และห้องทำงานของพี่เลี้ยงในสมุดรายนาม',
      descEn: 'Lookup internal extension, department, and desk in company directory',
      actionLabelTh: 'ค้นหาพี่เลี้ยง ↗',
      actionLabelEn: 'Find Mentor ↗',
      actionLink: '/directory',
      priority: 'normal',
    },
  ],
  first_week: [
    {
      id: 'fw_wifi_vpn',
      titleTh: 'เชื่อมต่อเครือข่าย Wi-Fi องค์กร และทดสอบการใช้งาน VPN',
      titleEn: 'Configure corporate Wi-Fi and verify remote VPN connection',
      descTh: 'อ่านขั้นตอนการติดตั้งโปรไฟล์เครือข่ายความปลอดภัยและขอสิทธิ์ในระบบไอที',
      descEn: 'Follow setup instructions for security profiles and IT system access',
      actionLabelTh: 'คู่มือไอที & VPN ↗',
      actionLabelEn: 'IT Guides & VPN ↗',
      actionLink: '/it-help',
      priority: 'high',
    },
    {
      id: 'fw_policies',
      titleTh: 'ศึกษานโยบายและข้อบังคับการทำงาน สิทธิประโยชน์ และระเบียบวันลา',
      titleEn: 'Review company policies, employee benefits, and leave regulations',
      descTh: 'ทำความเข้าใจข้อกำหนดการรักษาความปลอดภัยข้อมูลและวัฒนธรรมองค์กร FTI',
      descEn: 'Learn FTI data security compliance and core workplace standards',
      actionLabelTh: 'อ่านนโยบาย ↗',
      actionLabelEn: 'View Policies ↗',
      actionLink: '/policies',
      priority: 'normal',
    },
    {
      id: 'fw_standup',
      titleTh: 'เข้าร่วมการประชุมทีม Standup และวางแผนเป้าหมายสัปดาห์แรก',
      titleEn: 'Join team daily standup and align on first-week milestones',
      descTh: 'รับทราบภาพรวมโปรเจกต์ เครื่องมือที่ทีมใช้งาน และเป้าหมายที่คาดหวัง',
      descEn: 'Understand ongoing sprints, tools, and expected delivery goals',
      priority: 'normal',
    },
    {
      id: 'fw_org_structure',
      titleTh: 'สำรวจแผนกและโครงสร้างองค์กรเพื่อเข้าใจสายการบังคับบัญชา',
      titleEn: 'Explore department directory and organization hierarchy chart',
      descTh: 'ดูว่าใครรับผิดชอบส่วนงานไหนและติดต่อประสานงานข้ามทีมอย่างไร',
      descEn: 'Discover cross-functional teams and key department leaders',
      actionLabelTh: 'ผังองค์กร ↗',
      actionLabelEn: 'Org Chart ↗',
      actionLink: '/organization-chart',
      priority: 'normal',
    },
  ],
  before_leaving: [
    {
      id: 'bl_handover_code',
      titleTh: 'สรุปผลงาน จัดทำเอกสารส่งต่องาน และ Push Source Code ฉบับสมบูรณ์',
      titleEn: 'Finalize project summary, handover documentation, and push code repository',
      descTh: 'ส่งมอบงานให้พี่เลี้ยงหรือผู้รับผิดชอบช่วงต่อ พร้อมคำแนะนำการบำรุงรักษา',
      descEn: 'Deliver codebase and handover walkthrough notes to assigned supervisor',
      priority: 'high',
    },
    {
      id: 'bl_return_assets',
      titleTh: 'ส่งคืนคอมพิวเตอร์ โน้ตบุ๊ก อุปกรณ์เสริม และบัตรพนักงานแก่ IT / HR',
      titleEn: 'Return laptop, accessories, security tokens, and employee ID badge',
      descTh: 'ตรวจสอบความเรียบร้อยและลงนามในเอกสารส่งคืนทรัพย์สินองค์กร',
      descEn: 'Check asset checklist and sign the offboarding handover form with IT',
      actionLabelTh: 'บริการไอที ↗',
      actionLabelEn: 'IT Desk ↗',
      actionLink: '/it-help',
      priority: 'high',
    },
    {
      id: 'bl_feedback',
      titleTh: 'ทำแบบประเมินและให้ข้อเสนอแนะการทำงาน / การฝึกงาน',
      titleEn: 'Complete exit survey and share experience feedback',
      descTh: 'ช่วยเราพัฒนาสภาพแวดล้อมการทำงานและหลักสูตรปฐมนิเทศสำหรับรุ่นต่อไป',
      descEn: 'Help us improve the onboarding experience and workspace for future peers',
      priority: 'normal',
    },
  ],
};

export default function InteractiveChecklist({
  section = 'first_day',
  completedTaskIds = [],
  onToggleTask,
}) {
  const { currentLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const tasks = DEFAULT_ONBOARDING_TASKS[section] || [];
  const completedSet = new Set(completedTaskIds);

  const completedCount = tasks.filter((t) => completedSet.has(t.id)).length;
  const totalCount = tasks.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 shadow-xs mb-8 transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('interactiveChecklist')}
            </h2>
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {currentLanguage === 'th'
              ? 'เช็คความพร้อมและทำตามขั้นตอนสำคัญ เพื่อให้การเริ่มต้นงานเป็นไปอย่างราบรื่น'
              : 'Complete actionable tasks to ensure a smooth onboarding and transition'}
          </p>
        </div>

        {/* Mini progress bar */}
        <div className="flex items-center gap-3 sm:w-48 shrink-0">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAllDone
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-primary-500 to-teal-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[2.5rem] text-right">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Task list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
        {tasks.map((task) => {
          const isDone = completedSet.has(task.id);
          const title = currentLanguage === 'th' ? task.titleTh : task.titleEn;
          const desc = currentLanguage === 'th' ? task.descTh : task.descEn;
          const actionLabel = currentLanguage === 'th' ? task.actionLabelTh : task.actionLabelEn;

          return (
            <div
              key={task.id}
              className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-2 rounded-xl transition-all duration-200 ${
                isDone
                  ? 'bg-slate-50/50 dark:bg-slate-800/20'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              }`}
            >
              {/* Checkbox & Text */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-checked={isDone}
                  role="checkbox"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500/30 ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent hover:border-primary-400 group-hover:scale-105'
                  }`}
                >
                  ✓
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      onClick={() => onToggleTask(task.id)}
                      className={`text-sm font-semibold cursor-pointer select-none transition-all ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                      }`}
                    >
                      {title}
                    </span>
                    {task.priority === 'high' && !isDone && (
                      <span className="rounded-sm bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900">
                        {currentLanguage === 'th' ? 'สำคัญ' : 'Priority'}
                      </span>
                    )}
                  </div>
                  {desc && (
                    <p
                      className={`text-xs mt-0.5 transition-colors ${
                        isDone
                          ? 'text-slate-400/80 dark:text-slate-600'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {task.actionLink && (
                <div className="pl-8 sm:pl-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(task.actionLink)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-xs transition-all active:scale-95"
                  >
                    <span>{actionLabel}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion celebratory state */}
      {isAllDone && (
        <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 dark:from-emerald-950/40 dark:to-teal-950/30 p-4 text-center sm:text-left flex flex-col sm:flex-row items-center gap-3 animate-fadeIn">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-lg shadow-xs">
            🎉
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              {t('congratsPhaseTitle')}
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              {t('congratsPhaseDesc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
