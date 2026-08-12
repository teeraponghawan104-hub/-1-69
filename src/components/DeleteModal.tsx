import { motion, AnimatePresence } from 'motion/react';
import { Lock, Trash2, X } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { Entry } from '../types';

interface DeleteModalProps {
  entry: Entry | null;
  onClose: () => void;
  onConfirm: (entryId: string) => void;
}

export function DeleteModal({ entry, onClose, onConfirm }: DeleteModalProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (!entry) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === '112003') {
      onConfirm(entry.id);
      setPasscode('');
      setError('');
    } else {
      setError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-paper-raised border border-line rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-ink-faint hover:text-ink transition-colors p-2 rounded-lg hover:bg-paper min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4 text-stamp pr-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-none">
              <Trash2 className="w-5 h-5 text-stamp" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-[17px] sm:text-[18px] text-ink m-0 truncate">ยืนยันการลบข้อมูล</h3>
              <p className="text-[12.5px] sm:text-[13px] text-ink-faint m-0 truncate">
                {entry.name} — {entry.school}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] sm:text-[13.5px] font-medium text-ink-soft mb-1.5 flex items-center gap-1.5 break-words">
                <Lock className="w-3.5 h-3.5 text-clay-deep flex-none" />
                <span>กรุณากรอกรหัสผ่านเพื่อยืนยันการลบ</span>
              </label>
              <input
                type="password"
                placeholder="กรอกรหัสผ่านผู้ดูแล"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError('');
                }}
                className="w-full font-sans text-base sm:text-[15px] text-ink bg-paper border border-line-strong rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-clay focus:ring-3 focus:ring-clay-tint min-h-[44px]"
                autoFocus
              />
              {error && (
                <p className="text-[13px] text-stamp font-medium mt-1.5 m-0">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-[14px] font-medium text-ink-soft hover:bg-paper rounded-lg transition-colors min-h-[44px]"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-[14px] font-semibold text-paper-raised bg-stamp hover:bg-red-800 rounded-lg transition-colors shadow-sm min-h-[44px]"
              >
                ยืนยันการลบ
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
