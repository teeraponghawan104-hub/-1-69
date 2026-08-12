export interface FormData {
  name: string;
  school: string;
  academicWork: string;
  academicIssue: string;
  support: string;
  conduct: string;
  obstacle: string;
  solution: string;
  impress: string;
  suggest: string;
  reflectWork: string;
  reflectScience: string;
  reflectImpress: string;
}

export interface Entry extends FormData {
  id: string;
  submittedAt: string;
}

export const LABELS: Record<keyof Omit<FormData, 'name' | 'school'>, string> = {
  academicWork: 'งานในหน้าที่ครูและแนวทางการแก้ปัญหา',
  academicIssue: 'ประเด็นปัญหาด้านการจัดการเรียนรู้',
  support: 'งานสนับสนุนและกิจกรรมพิเศษ',
  conduct: 'กฎระเบียบ การปฏิบัติตน และจรรยาบรรณ',
  obstacle: 'ปัญหา อุปสรรคที่พบ',
  solution: 'วิธีการรับมือ / คำแนะนำ',
  impress: 'ความประทับใจ',
  suggest: 'ข้อเสนอแนะเพื่อการพัฒนา',
  reflectWork: 'สัมมนาสะท้อนผล: งานในหน้าที่ครูและแนวทางการแก้ปัญหา',
  reflectScience: 'สัมมนาสะท้อนผล: ปัญหาด้านการจัดการเรียนรู้วิทยาศาสตร์',
  reflectImpress: 'สัมมนาสะท้อนผล: ความประทับใจและข้อเสนอแนะ',
};
