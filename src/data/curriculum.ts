export type SubjectId = 'all' | 'soil' | 'structural' | 'hydraulics' | 'math-programming';

export type UnitId =
  | 'geomechanics-continuum'
  | 'mohr-circle'
  | 'rankine-earth-pressure'
  | 'beam-sfd-bmd'
  | 'open-channel-flow'
  | 'lp-optimization'
  | 'nlp-optimization';

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
  exerciseCount: number;
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
  {
    id: 'math-programming',
    name: '数理計画',
    englishName: 'Mathematical Programming',
    description: '線形計画・シンプレックス法・双対理論・感度分析・非線形最適化の基盤単元',
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
    exerciseCount: 12,
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
    exerciseCount: 3,
  },
  {
    id: 'rankine-earth-pressure',
    subjectId: 'soil',
    title: 'ランキン土圧（主働・受働土圧）',
    subtitle: '擁壁背面の土圧係数 Ka・Kp、合力の作用位置、粘着力 c の影響',
    level: '応用',
    estimatedMinutes: 15,
    tags: ['擁壁設計', 'Ka / Kp', '土圧合力', '演習3問'],
    hasPracticeSet: true,
    exerciseCount: 3,
  },
  {
    id: 'beam-sfd-bmd',
    subjectId: 'structural',
    title: '単純梁の SFD・BMD 解析',
    subtitle: '集中荷重・等分布荷重を受ける静定ばりの支点反力と最大曲げモーメント',
    level: '基礎',
    estimatedMinutes: 15,
    tags: ['SFD', 'BMD', '支点反力', '演習3問'],
    hasPracticeSet: true,
    exerciseCount: 3,
  },
  {
    id: 'open-channel-flow',
    subjectId: 'hydraulics',
    title: '開水路等流・マニングの公式',
    subtitle: '台形・長方形断面の径深 R、平均流速 v、流量 Q、常流・射流の判定',
    level: '基礎',
    estimatedMinutes: 15,
    tags: ['マニング式', 'フルード数', '常流/射流', '演習3問'],
    hasPracticeSet: true,
    exerciseCount: 3,
  },
  {
    id: 'lp-optimization',
    subjectId: 'math-programming',
    title: '線形計画法（図解法〜シンプレックス・双対・輸送計画）',
    subtitle:
      '定式化・図解法・ピボット掃き出し法・シンプレックスタブロー・双対理論と相補性・感度分析・輸送/割当問題（全5章）',
    level: '重要単元',
    estimatedMinutes: 60,
    tags: ['図解法', 'シンプレックス法', '双対理論', '感度分析', '輸送/割当', '演習10問'],
    hasPracticeSet: true,
    exerciseCount: 10,
  },
  {
    id: 'nlp-optimization',
    subjectId: 'math-programming',
    title: '非線形計画法（最適性条件・狭義凸性・ニュートン法）',
    subtitle:
      '一階/二階最適性条件とヘッセ行列・狭義凸性とパラメータ感度分析・包絡線定理・多変数ニュートン法（全3章）',
    level: '応用',
    estimatedMinutes: 40,
    tags: ['ヘッセ行列', '狭義凸性', '包絡線定理', 'ニュートン法', '演習6問'],
    hasPracticeSet: true,
    exerciseCount: 6,
  },
];

export const UNIT_EXERCISE_IDS: Record<UnitId, readonly string[]> = {
  'geomechanics-continuum': [
    'ch1-q1',
    'ch1-q2',
    'ch2-q1',
    'ch2-q2',
    'ch3-q1',
    'ch3-q2',
    'ch4-q1',
    'ch4-q2',
    'ch5-q1',
    'ch5-q2',
    'ch6-q1',
    'ch6-q2',
  ],
  'mohr-circle': ['1', '2', '3'],
  'rankine-earth-pressure': ['rankine-q1', 'rankine-q2', 'rankine-q3'],
  'beam-sfd-bmd': ['beam-q1', 'beam-q2', 'beam-q3'],
  'open-channel-flow': ['channel-q1', 'channel-q2', 'channel-q3'],
  'lp-optimization': [
    'lp-ch1-q1',
    'lp-ch1-q2',
    'lp-ch2-q1',
    'lp-ch2-q2',
    'lp-ch3-q1',
    'lp-ch3-q2',
    'lp-ch4-q1',
    'lp-ch4-q2',
    'lp-ch5-q1',
    'lp-ch5-q2',
  ],
  'nlp-optimization': [
    'nlp-ch1-q1',
    'nlp-ch1-q2',
    'nlp-ch2-q1',
    'nlp-ch2-q2',
    'nlp-ch3-q1',
    'nlp-ch3-q2',
  ],
};

export interface ExerciseProgressSnapshot {
  completedProblemIds: number[];
  completedContinuumExerciseIds: string[];
  completedMathProgExerciseIds: string[];
  completedBasicExerciseIds: string[];
}

export function getUnitExerciseProgress(
  unitId: UnitId,
  progress: ExerciseProgressSnapshot
): { solved: number; total: number } {
  const expected = UNIT_EXERCISE_IDS[unitId];
  let solved = 0;
  if (unitId === 'mohr-circle') {
    solved = expected.filter((id) => progress.completedProblemIds.includes(Number(id))).length;
  } else if (unitId === 'geomechanics-continuum') {
    solved = expected.filter((id) => progress.completedContinuumExerciseIds.includes(id)).length;
  } else if (unitId === 'lp-optimization' || unitId === 'nlp-optimization') {
    solved = expected.filter((id) => progress.completedMathProgExerciseIds.includes(id)).length;
  } else {
    solved = expected.filter((id) => progress.completedBasicExerciseIds.includes(id)).length;
  }
  return { solved, total: expected.length };
}

export function getTotalExerciseProgress(
  progress: ExerciseProgressSnapshot
): { solved: number; total: number } {
  return LEARNING_UNITS.reduce(
    (acc, unit) => {
      const u = getUnitExerciseProgress(unit.id, progress);
      return { solved: acc.solved + u.solved, total: acc.total + u.total };
    },
    { solved: 0, total: 0 }
  );
}

export function getSubjectMeta(id: Exclude<SubjectId, 'all'>): SubjectMeta {
  return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
}

export function getUnitsBySubject(id: Exclude<SubjectId, 'all'>): LearningUnit[] {
  return LEARNING_UNITS.filter((u) => u.subjectId === id);
}
