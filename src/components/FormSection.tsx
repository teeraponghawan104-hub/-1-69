import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface FormSectionProps {
  num: number;
  part: string;
  title: string;
  subtitle?: string;
  isFilled: boolean;
  children: ReactNode;
  delay?: number;
}

export function FormSection({ num, part, title, subtitle, isFilled, children, delay = 0 }: FormSectionProps) {
  // Determine slight rotation based on original CSS
  const rotations = [-4, 3, -3, 5, -2, 4];
  const rot = rotations[(num - 1) % rotations.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.3, 1], delay }}
      className="bg-paper-raised border border-line rounded-xl shadow-[0_1px_2px_rgba(44,42,38,0.06),_0_2px_10px_rgba(44,42,38,0.05)] p-4 sm:p-6 mb-4 overflow-hidden"
    >
      <div className="flex items-start gap-2.5 sm:gap-3 mb-1">
        <div className="flex-none flex flex-col items-center gap-[2px]">
          <motion.span
            animate={{
              backgroundColor: isFilled ? 'var(--color-stamp)' : 'transparent',
              color: isFilled ? 'var(--color-paper-raised)' : 'var(--color-stamp)',
              opacity: isFilled ? 1 : 0.75,
            }}
            transition={{ duration: 0.3 }}
            style={{ rotate: rot }}
            className="font-serif font-bold text-xs sm:text-sm w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full border-[1.5px] border-stamp flex items-center justify-center"
          >
            {num}
          </motion.span>
          <span className="font-serif text-[10px] sm:text-[10.5px] text-ink-faint tracking-[0.03em]">{part}</span>
        </div>
        <span className="font-serif font-semibold text-[15.5px] sm:text-[17px] text-ink leading-[1.4] mt-[2px] flex-1 min-w-0 break-words">
          {title}
        </span>
      </div>
      
      {subtitle && (
        <p className="text-[12.5px] sm:text-[13px] text-ink-faint mt-1 mb-3.5 sm:ml-11 leading-[1.6] break-words">
          {subtitle}
        </p>
      )}
      
      <div className="space-y-4 sm:ml-11 mt-3 sm:mt-4">
        {children}
      </div>
    </motion.div>
  );
}

export function FormField({ 
  label, 
  id, 
  placeholder, 
  value, 
  onChange, 
  type = 'textarea' 
}: { 
  label: string; 
  id: string; 
  placeholder: string; 
  value: string; 
  onChange: (v: string) => void;
  type?: 'text' | 'textarea';
}) {
  const baseClasses = "w-full font-sans text-base sm:text-[14.5px] text-ink bg-paper border border-line-strong rounded-lg px-3.5 py-2.5 leading-[1.6] transition-all duration-200 focus:outline-none focus:border-clay focus:ring-[3px] focus:ring-clay-tint placeholder:text-ink-faint/60 min-h-[44px]";

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-[13px] sm:text-[13.5px] font-medium text-ink-soft mb-1.5 break-words">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClasses} min-h-[90px] sm:min-h-[80px] resize-y`}
        />
      ) : (
        <input
          type="text"
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
        />
      )}
    </div>
  );
}
