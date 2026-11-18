export type SubjectId = 'all' | 'soil' | 'structural' | 'hydraulics';

export type UnitId =
  | 'geomechanics-continuum'
  | 'mohr-circle'
  | 'rankine-earth-pressure'
  | 'beam-sfd-bmd'
  | 'open-channel-flow';

export interface SubjectMeta {
  id: Exclude<SubjectId, 'all'>;
  name: string;
  englishName: string;
  description: string;
}

export interface LearningUnit {
  id: UnitId;
  subjectId: Exclude<SubjectId, 'all'>;
  title: string;
  subtitle: string;
  level: '基礎' | '応用' | '重要単元';
  estimatedMinutes: number;
  tags: string[];
  hasPracticeSet: boolean;
}

export const SUBJECTS: SubjectMeta[] = [
  {
    id: 'structural',
    name: '構造力学',
    englishName: 'Structural Mechanics',
    description: '静定ばりの反力・せん断力図 (SFD)・曲げモーメント図 (BMD)',
  },
  {
    id: 'hydraulics',
    name: '水理学',
    englishName: 'Hydraulics',
    description: '開水路等流・マニングの公式・フルード数による流況判定',
  },
  {
    id: 'soil',
    name: '土質力学',
    englishName: 'Soil Mechanics',
    description: '応力状態・破壊規準・土圧・有効応力など地盤工学の基盤単元',
  },
];

export const LEARNING_UNITS: LearningUnit[] = [
  {
    id: 'geomechanics-continuum',
    subjectId: 'soil',
    title: '地盤の応力と変形（連続体力学〜弾性地盤）',
    subtitle:
      '多次元応力・コーシーの公式・主応力と不変量・モールの応力円と用極法・弾性地盤内の応力（Boussinesq/重ね合わせ）と変形（全6章）',
    level: '重要単元',
    estimatedMinutes: 60,
    tags: ['応力テンソル', 'コーシーの公式', '主応力・不変量', '用極法', 'Boussinesq', '演習12問'],
    hasPracticeSet: true,
  },
  {
    id: 'mohr-circle',
    subjectId: 'soil',
    title: 'モールの応力円・破壊規準',
    subtitle: '圧縮正規約、回転角 2θ、モール・クーロン破壊包絡線、有効応力と間隙水圧',
    level: '重要単元',
    estimatedMinutes: 20,
    tags: ['圧縮正', '破壊規準', '有効応力', '演習3問'],
    hasPracticeSet: true,
  },
  {
    id: 'rankine-earth-pressure',
    subjectId: 'soil',
    title: 'ランキン土圧（主働・受働土圧）',
    subtitle: '擁壁背面の土圧係数 Ka・Kp、合力の作用位置、粘着力 c の影響',
    level: '応用',
    estimatedMinutes: 12,
    tags: ['擁壁設計', 'Ka / Kp', '土圧合力'],
    hasPracticeSet: false,
  },
  {
    id: 'beam-sfd-bmd',
    subjectId: 'structural',
    title: '単純梁の SFD・BMD 解析',
    subtitle: '集中荷重・等分布荷重を受ける静定ばりの支点反力と最大曲げモーメント',
    level: '基礎',
    estimatedMinutes: 15,
    tags: ['SFD', 'BMD', '支点反力'],
    hasPracticeSet: false,
  },
  {
    id: 'open-channel-flow',
    subjectId: 'hydraulics',
    title: '開水路等流・マニングの公式',
    subtitle: '台形・長方形断面の径深 R、平均流速 v、流量 Q、常流・射流の判定',
    level: '基礎',
    estimatedMinutes: 12,
    tags: ['マニング式', 'フルード数', '常流/射流'],
    hasPracticeSet: false,
  },
];

export function getSubjectMeta(id: Exclude<SubjectId, 'all'>): SubjectMeta {
  return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
}

export function getUnitsBySubject(id: Exclude<SubjectId, 'all'>): LearningUnit[] {
  return LEARNING_UNITS.filter((u) => u.subjectId === id);
}
