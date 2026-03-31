import type { Parent } from '@/types';

export type StudentParentAccessRow = {
  student: { id: string; firstName: string; lastName: string };
  mother: Parent | null;
  father: Parent | null;
  /** When there is no mother, a single guardian may be shown in the mother column */
  guardianInMotherSlot: Parent | null;
  /** Parent account used for app login (single credential per family/student) */
  credentialParent: Parent;
};

function normType(t: Parent['parentType']): string {
  return String(t).toLowerCase();
}

/** Prefer parent with existing username; else father; else mother; else first linked parent */
export function pickCredentialParent(parents: Parent[]): Parent {
  if (parents.length === 0) {
    throw new Error('No parent records');
  }
  const withUser = parents.find((p) => p.username?.trim());
  if (withUser) return withUser;
  const father = parents.find((p) => normType(p.parentType) === 'father');
  if (father) return father;
  const mother = parents.find((p) => normType(p.parentType) === 'mother');
  if (mother) return mother;
  return parents[0]!;
}

/** One row per student; mother and father columns from linked parent records */
export function groupParentsByStudent(parents: Parent[]): StudentParentAccessRow[] {
  const map = new Map<
    string,
    { student: { id: string; firstName: string; lastName: string }; parents: Parent[] }
  >();

  for (const parent of parents) {
    for (const st of parent.students ?? []) {
      let entry = map.get(st.id);
      if (!entry) {
        entry = { student: st, parents: [] };
        map.set(st.id, entry);
      }
      if (!entry.parents.some((p) => p.id === parent.id)) {
        entry.parents.push(parent);
      }
    }
  }

  const rows: StudentParentAccessRow[] = [];

  for (const { student, parents: plist } of map.values()) {
    const mother = plist.find((p) => normType(p.parentType) === 'mother') ?? null;
    const father = plist.find((p) => normType(p.parentType) === 'father') ?? null;
    const guardians = plist.filter((p) => normType(p.parentType) === 'guardian');
    const guardianInMotherSlot =
      !mother && !father && guardians.length === 1 ? guardians[0]! : null;

    rows.push({
      student,
      mother,
      father,
      guardianInMotherSlot,
      credentialParent: pickCredentialParent(plist),
    });
  }

  rows.sort((a, b) =>
    `${a.student.firstName} ${a.student.lastName}`.localeCompare(
      `${b.student.firstName} ${b.student.lastName}`,
      undefined,
      { sensitivity: 'base' },
    ),
  );

  return rows;
}
