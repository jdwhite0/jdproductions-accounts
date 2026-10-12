import { readFileSync } from 'node:fs';

const roles = JSON.parse(readFileSync(new URL('./scope-roles.json', import.meta.url), 'utf8'));
export const CAREERS_SCOPE_REVISION = 'careers_scope_2026_10_12';
const FIELDS = ['summary', 'description', 'responsibilities', 'qualifications', 'learningOutcomes'];

/** Runs inside the catalog transaction. Never changes questions, identities, statuses or applications. */
export async function applyCareersScopeRevision(store, organizationId, now, uuid) {
  const rows = await store.listRequisitions(organizationId);
  for (const specification of roles.filter(item => item.action === 'revise')) {
    const row = rows.find(item => item.slug === specification.slug && item.id === specification.id);
    if (!row || await store.hasCatalogRevision(organizationId, row.id, CAREERS_SCOPE_REVISION)) continue;
    const before = Object.fromEntries(FIELDS.map(key => [key, row[key]]));
    const patch = Object.fromEntries(FIELDS.map(key => [key, specification[key] || '']));
    const version = await store.countPostingVersions(row.id);
    await store.insertPostingVersion({
      id: uuid(), requisitionId: row.id, version: version + 1,
      snapshot: { revision: CAREERS_SCOPE_REVISION, slug: row.slug, before, after: patch },
      createdBy: 'catalog', createdAt: now().toISOString()
    });
    await store.updateRequisition(row.id, patch);
    await store.insertAudit({
      id: uuid(), organizationId, actorId: 'catalog', action: CAREERS_SCOPE_REVISION,
      entityType: 'requisition', entityId: row.id,
      detail: { slug: row.slug, changedFields: FIELDS }, createdAt: now().toISOString()
    });
  }
}
