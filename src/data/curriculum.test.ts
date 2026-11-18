import { describe, expect, it } from 'vitest';
import {
  LEARNING_UNITS,
  SUBJECTS,
  getSubjectMeta,
  getUnitsBySubject,
} from './curriculum';

describe('curriculum', () => {
  it('orders top-bar subjects as 構造力学, 水理学, 土質力学', () => {
    expect(SUBJECTS.map((s) => s.id)).toEqual(['structural', 'hydraulics', 'soil']);
    expect(SUBJECTS.map((s) => s.name)).toEqual(['構造力学', '水理学', '土質力学']);
  });

  it('returns learning units grouped by subject without gaps', () => {
    const totalGrouped = SUBJECTS.reduce(
      (sum, subject) => sum + getUnitsBySubject(subject.id).length,
      0
    );
    expect(totalGrouped).toBe(LEARNING_UNITS.length);
    expect(getUnitsBySubject('structural').map((u) => u.id)).toEqual(['beam-sfd-bmd']);
    expect(getUnitsBySubject('hydraulics').map((u) => u.id)).toEqual(['open-channel-flow']);
    expect(getUnitsBySubject('soil').map((u) => u.id)).toEqual([
      'geomechanics-continuum',
      'mohr-circle',
      'rankine-earth-pressure',
    ]);
  });

  it('resolves subject metadata for every subject id', () => {
    for (const s of SUBJECTS) {
      expect(getSubjectMeta(s.id)).toEqual(s);
    }
  });
});
