import { AnimatePresence, motion } from 'motion/react';
import { Clock, Download, Edit3, FileText, Inbox, RefreshCw, Save, School, Stamp, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { EntryCard } from './components/EntryCard';
import { DeleteModal } from './components/DeleteModal';
import { FormField, FormSection } from './components/FormSection';
import { Seal } from './components/Seal';
import { Entry, FormData } from './types';
import { generateExportDoc, generateExportText, storage } from './utils';

const INITIAL_FORM_DATA: FormData = {
  name: '', school: '', academicWork: '', academicIssue: '', support: '',
  conduct: '', obstacle: '', solution: '', impress: '', suggest: '',
  reflectWork: '', reflectScience: '', reflectImpress: ''
};

const DRAFT_STORAGE_KEY = 'draft_entry_mid_secondary';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<Entry | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Autosave state
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<boolean>(false);

  // Load draft on mount
  useEffect(() => {
    try {
      const savedDraftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraftRaw) {
        const parsed = JSON.parse(savedDraftRaw);
        if (parsed && parsed.data) {
          const hasContent = Object.values(parsed.data as FormData).some(v => typeof v === 'string' && v.trim() !== '');
          if (hasContent) {
            setFormData(parsed.data);
            setLastSavedTime(parsed.savedAt || 'ล่าสุด');
            setDraftRestoredNotice(true);
          }
        }
      }
    } catch (e) {
      console.error('Error restoring draft', e);
    }
  }, []);

  // Autosave effect on form data change
  useEffect(() => {
    if (editingEntry) return; // Don't overwrite draft while editing saved entry

    const hasContent = Object.values(formData).some(v => typeof v === 'string' && v.trim() !== '');
    if (hasContent) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
          data: formData,
          savedAt: timeStr,
          timestamp: Date.now()
        }));
        setLastSavedTime(timeStr);
      } catch (e) {
        console.error('Autosave error', e);
      }
    } else {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setLastSavedTime(null);
    }
  }, [formData, editingEntry]);

  // Group fields by section for progress calculation
  const sectionGroups: Array<(keyof FormData)[]> = [
    ['academicWork', 'academicIssue'],
    ['support'],
    ['conduct'],
    ['obstacle', 'solution'],
    ['impress', 'suggest'],
    ['reflectWork', 'reflectScience', 'reflectImpress']
  ];

  const sectionStatus = useMemo(() => {
    return sectionGroups.map(group => group.some(field => formData[field].trim() !== ''));
  }, [formData]);

  const filledCount = sectionStatus.filter(Boolean).length;
  const progressPercent = Math.round((filledCount / sectionGroups.length) * 100);
  const isReady = formData.name.trim() !== '' && formData.school.trim() !== '' && filledCount > 0;

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setStatusMsg({ text: '', type: '' });
  };

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormData(INITIAL_FORM_DATA);
    setLastSavedTime(null);
    setDraftRestoredNotice(false);
    setStatusMsg({ text: 'ล้างร่างแบบฟอร์มแล้ว', type: 'info' });
  };

  const loadEntries = async () => {
    setIsRefreshing(true);
    const data = await storage.getEntries();
    setEntries(data);
    setTimeout(() => setIsRefreshing(false), 500); // Visual feedback
  };

  useEffect(() => {
    // Subscribe to real-time updates across the app
    const unsubscribe = storage.subscribeEntries((data) => {
      setEntries(data);
    });
    return () => unsubscribe();
  }, []);

  const handleStartEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name || '',
      school: entry.school || '',
      academicWork: entry.academicWork || '',
      academicIssue: entry.academicIssue || '',
      support: entry.support || '',
      conduct: entry.conduct || '',
      obstacle: entry.obstacle || '',
      solution: entry.solution || '',
      impress: entry.impress || '',
      suggest: entry.suggest || '',
      reflectWork: entry.reflectWork || '',
      reflectScience: entry.reflectScience || '',
      reflectImpress: entry.reflectImpress || '',
    });
    setActiveTab('form');
    setStatusMsg({ text: 'กำลังแก้ไขข้อมูลของคุณ ' + entry.name, type: 'info' });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setFormData(INITIAL_FORM_DATA);
    setStatusMsg({ text: '', type: '' });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.school.trim()) {
      setStatusMsg({ text: 'กรุณากรอกชื่อและโรงเรียน', type: 'err' });
      return;
    }
    if (filledCount === 0) {
      setStatusMsg({ text: 'กรุณากรอกข้อมูลอย่างน้อย 1 ประเด็น', type: 'err' });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ text: 'กำลังบันทึก…', type: 'info' });

    try {
      if (editingEntry) {
        const updated: Entry = {
          ...formData,
          id: editingEntry.id,
          submittedAt: editingEntry.submittedAt,
        };
        await storage.updateEntry(updated);
        setStatusMsg({ text: 'แก้ไขข้อมูลเรียบร้อยแล้ว', type: 'success' });
        setEditingEntry(null);
      } else {
        await storage.saveEntry(formData);
        setStatusMsg({ text: 'บันทึกข้อมูลเรียบร้อยแล้ว', type: 'success' });
      }
      // Clear draft on successful submit
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setLastSavedTime(null);
      setDraftRestoredNotice(false);
      setFormData(INITIAL_FORM_DATA);
    } catch (e) {
      setStatusMsg({ text: 'บันทึกไม่สำเร็จ ลองอีกครั้ง', type: 'err' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async (entryId: string) => {
    try {
      await storage.deleteEntry(entryId);
      setDeletingEntry(null);
      loadEntries();
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  const handleExportText = () => {
    const text = generateExportText(entries);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'สัมมนาระหว่างฝึก_พี่สู่น้อง_มัธยมขนาดกลาง.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDoc = () => {
    const docHtml = generateExportDoc(entries);
    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'สัมมนาระหว่างฝึก_พี่สู่น้อง_มัธยมขนาดกลาง.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pb-12 selection:bg-clay-tint selection:text-clay-deep w-full max-w-full overflow-x-hidden">
      {/* Delete Passcode Confirmation Modal */}
      <DeleteModal
        entry={deletingEntry}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Header */}
      <header className="w-full max-w-4xl xl:max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-9 pb-5 sm:pb-7 border-b border-line flex flex-col-reverse sm:flex-row items-start justify-between gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 sm:gap-2 text-[11.5px] sm:text-[12.5px] tracking-[0.04em] sm:tracking-[0.06em] text-clay-deep font-semibold mb-1.5 sm:mb-2 break-words">
            <span className="w-[14px] sm:w-[18px] h-[1px] bg-clay flex-none"></span>
            <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-none" />
            <span>สาขาวิชาวิทยาศาสตร์ทั่วไป คณะครุศาสตร์และการพัฒนามนุษย์ มรภ.ศรีสะเกษ</span>
          </p>
          <h1 className="font-serif font-bold fluid-h1 leading-[1.35] text-ink mb-2 break-words">
            สัมมนาระหว่างฝึกปฏิบัติการสอน ๑ ภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙
          </h1>
          <p className="fluid-sub text-ink-soft leading-[1.65] mb-3.5 max-w-[65ch] break-words">
            ถอดบทเรียนก่อนออกฝึก &amp; สัมมนาสะท้อนผลการปฏิบัติการสอน — <b>กลุ่มที่ ๒ โรงเรียนมัธยมขนาดกลาง</b>
          </p>
          <div className="flex flex-wrap gap-2 text-[11.5px] sm:text-[12.5px]">
            <span className="inline-flex items-center gap-1.5 bg-paper-raised border border-line rounded-full px-2.5 sm:px-3 py-1 text-ink-soft">
              <Users className="w-3.5 h-3.5 text-clay flex-none" />
              <span>กลุ่มที่ ๒ <b className="text-ink font-semibold">โรงเรียนมัธยมขนาดกลาง</b> (นำเสนอ 10.15–10.30 น.)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-paper-raised border border-line rounded-full px-2.5 sm:px-3 py-1 text-ink-soft">
              <Clock className="w-3.5 h-3.5 text-moss flex-none" />
              <span>อาทิตย์ 16 ส.ค. 2569 | 08.30–12.00 น.</span>
            </span>
          </div>
        </div>
        <div className="flex-none self-end sm:self-start">
          <Seal isReady={isReady} />
        </div>
      </header>

      {/* Tabs */}
      <div className="w-full max-w-4xl xl:max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 mt-5 sm:mt-6 flex items-end gap-1.5 sm:gap-2 relative z-10">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 sm:flex-none relative px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-t-xl border border-b-0 text-[13.5px] sm:text-[14.5px] font-medium transition-colors min-h-[44px] flex items-center justify-center ${
            activeTab === 'form'
              ? 'bg-paper-raised text-ink border-line shadow-[0_-2px_6px_rgba(44,42,38,0.04)] font-semibold'
              : 'bg-paper text-ink-faint border-line/60 hover:text-ink-soft'
          }`}
        >
          <span>{editingEntry ? 'แก้ไขข้อมูล' : 'กรอกข้อมูล'}</span>
          {activeTab === 'form' && (
            <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-paper-raised" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 sm:flex-none relative px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-t-xl border border-b-0 text-[13.5px] sm:text-[14.5px] font-medium transition-colors min-h-[44px] flex items-center justify-center ${
            activeTab === 'list'
              ? 'bg-paper-raised text-ink border-line shadow-[0_-2px_6px_rgba(44,42,38,0.04)] font-semibold'
              : 'bg-paper text-ink-faint border-line/60 hover:text-ink-soft'
          }`}
        >
          <span>ดูข้อมูลรวม ({activeTab === 'form' ? '?' : entries.length})</span>
          {activeTab === 'list' && (
            <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-paper-raised" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl xl:max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Progress Rail */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 bg-paper-raised border border-t-0 border-line px-3.5 sm:px-6 py-3 relative z-0">
                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-[180px]">
                  <span className="text-[12px] text-ink-faint font-medium whitespace-nowrap">
                    กรอกแล้ว <b className="text-clay-deep">{filledCount}</b>/6
                  </span>
                  <div className="flex-1 max-w-xs h-[6px] bg-line rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-clay-deep to-clay rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {!editingEntry && lastSavedTime && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11.5px] sm:text-[12px] text-moss-deep font-medium bg-moss-tint/50 border border-[#c7d3ae] rounded-full px-2.5 sm:px-3 py-1 max-w-full">
                    <Save className="w-3.5 h-3.5 text-moss flex-none" />
                    <span className="truncate">บันทึกร่างอัตโนมัติแล้ว ({lastSavedTime})</span>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-ink-faint hover:text-stamp transition-colors ml-0.5 p-1 min-w-[24px] flex items-center justify-center"
                      title="ล้างร่างแบบฟอร์ม"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Draft Restored Banner */}
              {draftRestoredNotice && !editingEntry && (
                <div className="px-3.5 sm:px-6 lg:px-8 mt-4">
                  <div className="bg-moss-tint/80 border border-[#c7d3ae] rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-[13px] sm:text-[13.5px]">
                    <div className="flex items-center gap-2 text-[#31411f] font-medium min-w-0">
                      <Save className="w-4 h-4 flex-none text-moss" />
                      <span className="break-words">กู้คืนร่างข้อมูลที่คุณพิมพ์ค้างไว้ล่าสุด ({lastSavedTime}) ให้เรียบร้อยแล้ว</span>
                    </div>
                    <button
                      onClick={handleClearDraft}
                      className="inline-flex items-center gap-1 text-[12.5px] font-medium text-stamp hover:text-red-700 bg-paper-raised border border-line px-2.5 py-1.5 rounded-lg transition-colors flex-none min-h-[36px]"
                      title="ล้างร่างแล้วเริ่มใหม่"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ล้างร่าง</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Editing Indicator Banner */}
              {editingEntry && (
                <div className="px-3.5 sm:px-6 lg:px-8 mt-4">
                  <div className="bg-clay-tint/70 border border-clay/30 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-[13px] sm:text-[13.5px]">
                    <div className="flex items-center gap-2 text-clay-deep font-medium min-w-0">
                      <Edit3 className="w-4 h-4 flex-none" />
                      <span className="break-words">กำลังอยู่ในโหมดแก้ไขข้อมูลของ <b>{editingEntry.name}</b> ({editingEntry.school})</span>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-clay-deep hover:text-ink bg-paper-raised border border-clay/20 px-2.5 py-1.5 rounded-lg transition-colors flex-none min-h-[36px]"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>ยกเลิก</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="px-3.5 sm:px-6 lg:px-8 mt-5 sm:mt-6">
                {/* ID Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-paper-raised border border-line rounded-t-xl shadow-[0_1px_2px_rgba(44,42,38,0.06),_0_2px_10px_rgba(44,42,38,0.05)] p-4 sm:p-6 relative z-10"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      id="f-name"
                      label="ชื่อ-นามสกุล ผู้กรอก"
                      placeholder="เช่น นางสาวใจดี ตั้งใจฝึก"
                      type="text"
                      value={formData.name}
                      onChange={(v) => handleFieldChange('name', v)}
                    />
                    <FormField
                      id="f-school"
                      label="โรงเรียนที่ฝึกประสบการณ์"
                      placeholder="ชื่อโรงเรียน"
                      type="text"
                      value={formData.school}
                      onChange={(v) => handleFieldChange('school', v)}
                    />
                  </div>
                </motion.div>
                
                {/* Perforation Divider */}
                <div className="relative h-0 border-t-[1.5px] border-dashed border-line-strong mb-4 sm:mb-5">
                  <div className="absolute -top-[8px] -left-[8px] sm:-left-[18px] w-4 h-4 bg-paper rounded-full border border-line"></div>
                  <div className="absolute -top-[8px] -right-[8px] sm:-right-[18px] w-4 h-4 bg-paper rounded-full border border-line"></div>
                </div>

                <FormSection
                  num={1} part="๑" delay={0.05}
                  title="ด้านวิชาการและการจัดการเรียนการสอน"
                  subtitle="งานในหน้าที่ครูที่พบ แนวทางการแก้ปัญหา และประเด็นด้านการจัดการเรียนรู้"
                  isFilled={sectionStatus[0]}
                >
                  <FormField
                    id="f-academic-work"
                    label="งานในหน้าที่ครูและแนวทางการแก้ปัญหา"
                    placeholder="เล่าประสบการณ์งานสอน การเตรียมการสอน ปัญหาที่พบและวิธีแก้ไข"
                    value={formData.academicWork}
                    onChange={(v) => handleFieldChange('academicWork', v)}
                  />
                  <FormField
                    id="f-academic-issue"
                    label="ประเด็นปัญหาสำคัญด้านการจัดการเรียนรู้ในวิชา"
                    placeholder="เช่น การควบคุมชั้นเรียน สื่อการสอน การวัดผล ฯลฯ"
                    value={formData.academicIssue}
                    onChange={(v) => handleFieldChange('academicIssue', v)}
                  />
                </FormSection>

                <FormSection
                  num={2} part="๒" delay={0.1}
                  title="ด้านงานสนับสนุนและกิจกรรมพิเศษ"
                  subtitle="งานพิเศษ กิจกรรมนอกเหนือการสอนที่ได้รับมอบหมาย"
                  isFilled={sectionStatus[1]}
                >
                  <FormField
                    id="f-support"
                    label="งานสนับสนุนและกิจกรรมพิเศษที่พบ"
                    placeholder="เช่น งานธุรการ งานกิจกรรมนักเรียน งานโครงการต่าง ๆ"
                    value={formData.support}
                    onChange={(v) => handleFieldChange('support', v)}
                  />
                </FormSection>

                <FormSection
                  num={3} part="๓" delay={0.15}
                  title="ด้านกฎระเบียบ การปฏิบัติตน และจรรยาบรรณ"
                  subtitle="ข้อควรระวังและแนวปฏิบัติที่ควรรู้ก่อนออกฝึก"
                  isFilled={sectionStatus[2]}
                >
                  <FormField
                    id="f-conduct"
                    label="กฎระเบียบ การปฏิบัติตน และจรรยาบรรณที่ควรรู้"
                    placeholder="เช่น การแต่งกาย การวางตัว มารยาทกับครูพี่เลี้ยงและนักเรียน"
                    value={formData.conduct}
                    onChange={(v) => handleFieldChange('conduct', v)}
                  />
                </FormSection>

                <FormSection
                  num={4} part="๔" delay={0.2}
                  title="ปัญหา อุปสรรค และวิธีการรับมือ"
                  subtitle="สรุปปัญหาที่พบบ่อยและคำแนะนำสำหรับรุ่นน้องที่จะออกฝึก"
                  isFilled={sectionStatus[3]}
                >
                  <FormField
                    id="f-obstacle"
                    label="ปัญหา อุปสรรคที่พบ"
                    placeholder="ปัญหาที่พบระหว่างฝึกประสบการณ์"
                    value={formData.obstacle}
                    onChange={(v) => handleFieldChange('obstacle', v)}
                  />
                  <FormField
                    id="f-solution"
                    label="วิธีการรับมือ / คำแนะนำสำหรับน้อง ๆ ที่จะออกฝึก"
                    placeholder="คำแนะนำเชิงปฏิบัติที่อยากบอกน้อง ๆ"
                    value={formData.solution}
                    onChange={(v) => handleFieldChange('solution', v)}
                  />
                </FormSection>

                <FormSection
                  num={5} part="๕" delay={0.25}
                  title="ความประทับใจและข้อเสนอแนะเพื่อการพัฒนา"
                  isFilled={sectionStatus[4]}
                >
                  <FormField
                    id="f-impress"
                    label="ความประทับใจระหว่างฝึกประสบการณ์"
                    placeholder="เรื่องราวหรือช่วงเวลาที่ประทับใจ"
                    value={formData.impress}
                    onChange={(v) => handleFieldChange('impress', v)}
                  />
                  <FormField
                    id="f-suggest"
                    label="ข้อเสนอแนะเพื่อการพัฒนา"
                    placeholder="ข้อเสนอแนะต่อหลักสูตร การนิเทศ หรือการเตรียมความพร้อม"
                    value={formData.suggest}
                    onChange={(v) => handleFieldChange('suggest', v)}
                  />
                </FormSection>

                <FormSection
                  num={6} part="๖" delay={0.3}
                  title="สัมมนาสะท้อนผลการปฏิบัติการสอนในสถานศึกษา"
                  subtitle="ช่วง 10.00–11.30 น. — สะท้อนผลจากการฝึกปฏิบัติการสอนจริงในสถานศึกษา"
                  isFilled={sectionStatus[5]}
                >
                  <FormField
                    id="f-reflect-work"
                    label="งานในหน้าที่ครูและแนวทางการแก้ปัญหา"
                    placeholder="สะท้อนงานในหน้าที่ครูที่ปฏิบัติจริง และแนวทางการแก้ปัญหาที่ใช้"
                    value={formData.reflectWork}
                    onChange={(v) => handleFieldChange('reflectWork', v)}
                  />
                  <FormField
                    id="f-reflect-science"
                    label="ประเด็นปัญหาสำคัญด้านการจัดการเรียนรู้วิทยาศาสตร์"
                    placeholder="ปัญหาเฉพาะด้านการจัดการเรียนรู้วิทยาศาสตร์ที่พบระหว่างฝึกสอน"
                    value={formData.reflectScience}
                    onChange={(v) => handleFieldChange('reflectScience', v)}
                  />
                  <FormField
                    id="f-reflect-impress"
                    label="ความประทับใจและข้อเสนอแนะเพื่อการพัฒนา"
                    placeholder="ความประทับใจจากการปฏิบัติการสอน และข้อเสนอแนะเพื่อการพัฒนา"
                    value={formData.reflectImpress}
                    onChange={(v) => handleFieldChange('reflectImpress', v)}
                  />
                </FormSection>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-4">
                  <p className="text-[12px] text-ink-faint text-center sm:text-left max-w-md leading-relaxed">
                    ข้อมูลที่บันทึกจะแสดงในแท็บ "ดูข้อมูลรวม" ให้เพื่อนทุกคนเห็นร่วมกัน เพื่อนำไปใช้จัดทำสไลด์และวิเคราะห์ภาพรวมต่อไป
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {statusMsg.text && (
                      <motion.span 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`text-[13px] font-medium text-center sm:text-right ${statusMsg.type === 'err' ? 'text-clay-deep' : 'text-moss'}`}
                      >
                        {statusMsg.text}
                      </motion.span>
                    )}
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="flex-none flex items-center justify-center gap-2 bg-clay hover:bg-clay-deep text-paper-raised font-semibold text-[14.5px] px-6 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 disabled:bg-line-strong disabled:hover:translate-y-0 disabled:shadow-none w-full sm:w-auto min-h-[48px]"
                    >
                      <Stamp className="w-4 h-4" />
                      <span>{isLoading ? 'กำลังบันทึก...' : (editingEntry ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="px-3.5 sm:px-6 lg:px-8"
            >
              <div className="flex items-center justify-between mt-5 sm:mt-6 mb-4">
                <span className="text-[13px] sm:text-[13.5px] text-ink-faint">
                  มีข้อมูลทั้งหมด <b className="text-ink font-semibold">{entries.length}</b> รายการ
                </span>
                <button
                  onClick={loadEntries}
                  className="flex items-center gap-1.5 text-[12.5px] sm:text-[13px] font-medium text-ink-soft border border-line-strong rounded-full px-3.5 py-1.5 hover:text-clay-deep hover:border-clay transition-colors group min-h-[38px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isRefreshing ? 'rotate-180' : 'group-hover:rotate-180'}`} />
                  <span>รีเฟรช</span>
                </button>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-16 px-6 bg-paper-raised border border-dashed border-line-strong rounded-xl mt-6">
                  <Inbox className="w-8 h-8 mx-auto text-line-strong mb-3" />
                  <p className="text-[14px] text-ink-faint m-0">
                    ยังไม่มีใครกรอกข้อมูล — เป็นคนแรกได้ที่แท็บ "กรอกข้อมูล"
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-6">
                  {/* Grid layout for cards on larger screens */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
                    {entries.map((entry, idx) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        index={idx}
                        onEdit={handleStartEdit}
                        onDelete={(e) => setDeletingEntry(e)}
                      />
                    ))}
                  </div>
                  
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleExportDoc}
                      className="flex-1 flex items-center justify-center gap-2 bg-clay hover:bg-clay-deep text-paper-raised font-semibold text-[13.5px] px-4 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 min-h-[44px]"
                    >
                      <FileText className="w-4 h-4" />
                      <span>ดาวน์โหลดเป็นไฟล์ Word (.doc)</span>
                    </button>
                    <button
                      onClick={handleExportText}
                      className="flex-none flex items-center justify-center gap-2 bg-moss-tint hover:bg-[#d8e0c8] text-[#31411f] border border-[#c7d3ae] font-medium text-[13px] px-4 py-3 rounded-lg transition-colors min-h-[44px]"
                    >
                      <Download className="w-4 h-4" />
                      <span>ดาวน์โหลด (.txt)</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}


