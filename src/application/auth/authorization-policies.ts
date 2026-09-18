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
  adminIds: readonly string[],
): boolean {
  if (viewer.roleCode === 'admin') return true;
  if (!recordCreatorId) return true;
  if (recordCreatorId === viewer.id) return true;
  return adminIds.includes(recordCreatorId);
}