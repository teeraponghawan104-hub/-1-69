import { Entry, FormData, LABELS } from './types';

const GROUP_KEY = 'entries:mid-secondary';

export const storage = {
  getEntries: async (): Promise<Entry[]> => {
    // Attempt to use custom window.storage if available (per user's original HTML context)
    // @ts-ignore
    if (typeof window !== 'undefined' && window.storage) {
      try {
        // @ts-ignore
        const listResult = await window.storage.list(GROUP_KEY + ':', true);
        const keys = (listResult && listResult.keys) || [];
        const entries: Entry[] = [];
        for (const k of keys) {
          // @ts-ignore
          const r = await window.storage.get(k, true);
          if (r && r.value) entries.push(JSON.parse(r.value));
        }
        return entries.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
      } catch (e) {
        console.error("Window storage fetch error, falling back to localStorage", e);
      }
    }
    
    // Fallback to standard localStorage
    try {
      const data = localStorage.getItem(GROUP_KEY);
      return data ? JSON.parse(data).sort((a: Entry, b: Entry) => b.submittedAt.localeCompare(a.submittedAt)) : [];
    } catch (e) {
      return [];
    }
  },

  saveEntry: async (entryData: FormData): Promise<void> => {
    const newEntry: Entry = {
      ...entryData,
      id: 'e' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      submittedAt: new Date().toISOString(),
    };

    // @ts-ignore
    if (typeof window !== 'undefined' && window.storage) {
      try {
        // @ts-ignore
        await window.storage.set(GROUP_KEY + ':' + newEntry.id, JSON.stringify(newEntry), true);
        return;
      } catch (e) {
        console.error("Window storage save error, falling back to localStorage", e);
      }
    }

    // Fallback
    const current = await storage.getEntries();
    current.push(newEntry);
    localStorage.setItem(GROUP_KEY, JSON.stringify(current));
  },

  updateEntry: async (entry: Entry): Promise<void> => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.storage) {
      try {
        // @ts-ignore
        await window.storage.set(GROUP_KEY + ':' + entry.id, JSON.stringify(entry), true);
        return;
      } catch (e) {
        console.error("Window storage update error, falling back to localStorage", e);
      }
    }

    const current = await storage.getEntries();
    const idx = current.findIndex(e => e.id === entry.id);
    if (idx !== -1) {
      current[idx] = entry;
    } else {
      current.push(entry);
    }
    localStorage.setItem(GROUP_KEY, JSON.stringify(current));
  },

  deleteEntry: async (id: string): Promise<void> => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.storage) {
      try {
        // @ts-ignore
        if (typeof window.storage.delete === 'function') {
          // @ts-ignore
          await window.storage.delete(GROUP_KEY + ':' + id, true);
        } else {
          // @ts-ignore
          await window.storage.set(GROUP_KEY + ':' + id, '', true);
        }
        return;
      } catch (e) {
        console.error("Window storage delete error, falling back to localStorage", e);
      }
    }

    const current = await storage.getEntries();
    const filtered = current.filter(e => e.id !== id);
    localStorage.setItem(GROUP_KEY, JSON.stringify(filtered));
  }
};

const AVATAR_COLORS = ['var(--color-clay)', 'var(--color-moss)', 'var(--color-gold)', 'var(--color-clay-deep)'];

export function seededIndex(name: string, mod: number) {
  const s = name || '';
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
  return h % mod;
}

export function getAvatarColor(name: string) {
  return AVATAR_COLORS[seededIndex(name, AVATAR_COLORS.length)];
}

export function getInitials(name: string) {
  const t = (name || '').trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  return (parts[0] ? parts[0][0] : '?').toUpperCase();
}

export function formatDate(isoString: string) {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

export function generateExportText(entries: Entry[]) {
  let out = 'สรุปข้อมูลการสัมมนาระหว่างฝึกปฏิบัติการสอน ๑ ภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙\n';
  out += 'สาขาวิชาวิทยาศาสตร์ทั่วไป คณะครุศาสตร์และการพัฒนามนุษย์ มหาวิทยาลัยราชภัฏศรีสะเกษ\n';
  out += 'กลุ่มที่ ๒ โรงเรียนมัธยมศึกษาขนาดกลาง\n';
  out += 'จำนวนผู้กรอก: ' + entries.length + ' รายการ\n';
  out += '='.repeat(60) + '\n\n';
  
  entries.forEach((e, i) => {
    out += (i + 1) + '. ' + (e.name || 'ไม่ระบุชื่อ') + ' — ' + (e.school || 'ไม่ระบุโรงเรียน') + '\n';
    out += '   บันทึกเมื่อ: ' + formatDate(e.submittedAt) + '\n';
    
    const fieldsToExport = Object.keys(LABELS) as Array<keyof typeof LABELS>;
    
    fieldsToExport.forEach(f => {
      const val = e[f];
      if (val) {
        out += '   [' + LABELS[f] + ']\n   ' + val.replace(/\n/g, '\n   ') + '\n';
      }
    });
    out += '\n' + '-'.repeat(60) + '\n\n';
  });
  return out;
}

export function generateExportDoc(entries: Entry[]): string {
  const fieldsToExport = Object.keys(LABELS) as Array<keyof typeof LABELS>;

  const escapeXml = (unsafe: string) => {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>สรุปข้อมูลกิจกรรมเตรียมความพร้อมก่อนออกฝึก</title>
<style>
  @page {
    size: A4 portrait;
    margin: 2.54cm 2.54cm 2.54cm 2.54cm;
  }
  body {
    font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Angsana New', 'Cordia New', 'Noto Sans Thai', sans-serif;
    font-size: 16pt;
    line-height: 1.5;
    color: #2c2a26;
  }
  h1 {
    font-size: 20pt;
    font-weight: bold;
    text-align: center;
    color: #8a441e;
    margin-bottom: 5px;
  }
  h2 {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    color: #5b564c;
    margin-top: 0;
    margin-bottom: 20px;
  }
  .meta-info {
    font-size: 14pt;
    color: #5b564c;
    text-align: right;
    margin-bottom: 20px;
    border-bottom: 2px solid #ddd4c2;
    padding-bottom: 10px;
  }
  .entry-card {
    border: 1px solid #c7bba1;
    background-color: #fffdf8;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
    page-break-inside: avoid;
  }
  .entry-header {
    background-color: #f1e0d1;
    border-left: 4px solid #b5602f;
    padding: 8px 12px;
    margin-bottom: 12px;
  }
  .person-name {
    font-size: 18pt;
    font-weight: bold;
    color: #2c2a26;
  }
  .school-name {
    font-size: 15pt;
    color: #8a441e;
    font-weight: bold;
  }
  .time-stamp {
    font-size: 13pt;
    color: #8c8577;
  }
  .field-title {
    font-size: 15pt;
    font-weight: bold;
    color: #a9822c;
    margin-top: 10px;
    margin-bottom: 3px;
  }
  .field-content {
    font-size: 15pt;
    color: #2c2a26;
    margin-bottom: 10px;
    white-space: pre-wrap;
    padding-left: 12px;
    border-left: 2px solid #ddd4c2;
  }
</style>
</head>
<body>
  <h1>สรุปข้อมูลการสัมมนาระหว่างฝึกปฏิบัติการสอน ๑ ภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙</h1>
  <h2>สาขาวิชาวิทยาศาสตร์ทั่วไป คณะครุศาสตร์และการพัฒนามนุษย์ มหาวิทยาลัยราชภัฏศรีสะเกษ</h2>
  <h3 style="text-align: center; color: #b5602f; margin-top: -10px; font-size: 15pt;">กลุ่มที่ ๒ โรงเรียนมัธยมศึกษาขนาดกลาง</h3>
  <div class="meta-info">
    จำนวนผู้กรอกทั้งหมด: <strong>${entries.length}</strong> รายการ | วันที่ดึงข้อมูล: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
  </div>

  ${entries.map((e, index) => `
    <div class="entry-card">
      <div class="entry-header">
        <div class="person-name">ลำดับที่ ${index + 1}: ${escapeXml(e.name || 'ไม่ระบุชื่อ')}</div>
        <div class="school-name">โรงเรียน: ${escapeXml(e.school || 'ไม่ระบุโรงเรียน')}</div>
        <div class="time-stamp">บันทึกเมื่อ: ${formatDate(e.submittedAt)}</div>
      </div>

      ${fieldsToExport.map(f => {
        if (!e[f]) return '';
        return `
          <div class="field-title">📌 ${LABELS[f]}</div>
          <div class="field-content">${escapeXml(e[f])}</div>
        `;
      }).join('')}
    </div>
  `).join('')}
</body>
</html>
  `;

  return htmlContent;
}

