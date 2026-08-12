import { motion } from 'motion/react';
import { Pencil, Trash2 } from 'lucide-react';
import { Entry, LABELS } from '../types';
import { formatDate, getAvatarColor, getInitials, seededIndex } from '../utils';

interface EntryCardProps {
  key?: string | number;
  entry: Entry;
  index: number;
  onEdit?: (entry: Entry) => void;
  onDelete?: (entry: Entry) => void;
}

export function EntryCard({ entry, index, onEdit, onDelete }: EntryCardProps) {
  const fields = Object.keys(LABELS) as Array<keyof typeof LABELS>;
  
  // Calculate tape properties deterministically based on name
  const tapeRotations = [-4, -2, 2, 4, -3, 3];
  const tapeRot = tapeRotations[seededIndex('r' + entry.name, tapeRotations.length)];
  const tapeColor = getAvatarColor('t' + entry.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.2, 0.7, 0.3, 1] }}
      className="bg-paper-raised border border-line rounded-r-xl rounded-bl-xl rounded-tl-[4px] p-5 sm:p-6 mb-4 relative shadow-[0_1px_2px_rgba(44,42,38,0.06),_0_2px_10px_rgba(44,42,38,0.05)] hover:shadow-[0_4px_14px_rgba(44,42,38,0.10),_0_1px_3px_rgba(44,42,38,0.08)] hover:-translate-y-[1px] transition-all duration-300"
    >
      {/* Decorative Tape */}
      <div 
        className="absolute -top-[10px] left-[22px] w-[52px] h-[17px] rounded-sm opacity-60 mix-blend-multiply shadow-[0_1px_2px_rgba(44,42,38,0.15)]"
        style={{ backgroundColor: tapeColor, rotate: `${tapeRot}deg` }}
      />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 pb-4 border-b border-line">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="flex-none w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] rounded-full flex items-center justify-center font-serif font-semibold text-[13px] text-paper-raised shadow-xs"
            style={{ backgroundColor: getAvatarColor(entry.name) }}
          >
            {getInitials(entry.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif font-semibold text-[15.5px] sm:text-[16.5px] text-ink m-0 truncate">
              {entry.name || 'ไม่ระบุชื่อ'}
            </p>
            <p className="text-[12.5px] sm:text-[13px] text-ink-faint truncate m-0 mt-0.5">
              {entry.school || 'ไม่ระบุโรงเรียน'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="text-[11px] sm:text-[11.5px] text-ink-faint whitespace-nowrap bg-paper border border-line rounded-full px-2.5 py-1">
            {formatDate(entry.submittedAt)}
          </div>
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                onClick={() => onEdit(entry)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-clay hover:text-clay-deep bg-clay-tint/50 hover:bg-clay-tint rounded-md px-2.5 py-1.5 transition-colors min-h-[36px]"
                title="แก้ไขข้อมูล"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>แก้ไข</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(entry)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-stamp hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md px-2.5 py-1.5 transition-colors min-h-[36px]"
                title="ลบข้อมูล"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((f) => {
          if (!entry[f]) return null;
          return (
            <div key={f} className="group">
              <div className="text-[12px] font-semibold text-gold tracking-[0.02em] mb-1">
                {LABELS[f]}
              </div>
              <div className="text-[14px] leading-[1.7] text-ink-soft whitespace-pre-wrap">
                {entry[f]}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
