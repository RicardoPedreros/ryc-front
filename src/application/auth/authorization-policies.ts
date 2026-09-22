export interface Viewer {
  readonly id: string | null;
  readonly roleCode: string | null;
}

export function canModifyRecord(
  recordCreatorId: string | null,
  userId: string | null,
  roleCode: string | null,
): boolean {
  if (roleCode === 'admin') return true;
  if (!recordCreatorId) return false;
  return recordCreatorId === userId;
}

export function canViewRecord(
  recordCreatorId: string | null,
  viewer: Viewer,
): boolean {
  if (viewer.roleCode === 'admin') return true;
  if (!viewer.id) return false;
  return recordCreatorId === viewer.id;
}