import { motion } from 'motion/react';

interface SealProps {
  isReady: boolean;
}

export function Seal({ isReady }: SealProps) {
  return (
    <div className="relative flex-none w-[62px] h-[62px] sm:w-[76px] sm:h-[76px]">
      <motion.div
        initial={false}
        animate={
          isReady
            ? { opacity: 1, rotate: -8, scale: [1.4, 0.95, 1.05, 1] }
            : { opacity: 0.4, rotate: -8, scale: 1 }
        }
        transition={
          isReady
            ? { duration: 0.5, times: [0, 0.5, 0.75, 1], ease: [0.2, 0.7, 0.3, 1] }
            : { duration: 0.3, ease: 'easeOut' }
        }
        className="absolute inset-0 flex items-center justify-center text-stamp font-serif font-bold text-[10px] sm:text-[12px] leading-[1.3] text-center"
      >
        <div className="absolute inset-0 rounded-full border-[1.6px] border-stamp"></div>
        <div className="absolute inset-[7px] rounded-full border border-stamp"></div>
        
        {/* Procedural texture overlay for the stamp look */}
        <div 
          className="absolute inset-0 rounded-full opacity-50 mix-blend-multiply"
          style={{
            background: `
              radial-gradient(circle at 30% 25%, transparent 0 2px, rgba(163,64,31,0.5) 2.4px, transparent 3px) 0 0/6px 6px,
              radial-gradient(circle at 70% 60%, transparent 0 1.5px, rgba(163,64,31,0.4) 1.9px, transparent 2.5px) 0 0/5px 5px
            `
          }}
        ></div>
        
        <span className="relative z-10 tracking-[0.02em]">พี่สู่<br/>น้อง</span>
      </motion.div>
    </div>
  );
}
