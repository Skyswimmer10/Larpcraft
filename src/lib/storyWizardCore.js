// Shared, scope-aware primitives already exercised by the FATE wizard. Keep
// its existing public names working while other model editors reuse them.
export {
  copyFate as copyDraft, getFate as getPath, setFate as setPath,
  naturalList, fateScopeKey as wizardScopeKey, fateEntities as wizardEntities,
  rememberFateOption as rememberWizardOption, orderFateOptions as orderWizardOptions,
} from './fateWizard.js';

import { fateEntities } from './fateWizard.js';
export function savedWizardModels(game, sourceId) {
  const result = [];
  for (const entity of fateEntities(game)) {
    if (!['nodes', 'masterNodes'].includes(entity.ref.coll)) continue;
    let node = game[entity.ref.coll]?.[entity.ref.path[0]];
    for (const id of entity.ref.path.slice(1)) node = node?.sub?.nodes?.[id];
    const records = [...(node?.narrativeWizardHistory || []), ...(node?.narrativeWizard ? [node.narrativeWizard] : [])];
    for (const record of new Map(records.filter(record => record.sourceId === sourceId).map(record => [record.sessionId || record.title, record])).values()) result.push({ key: `${entity.key}:${record.sessionId || record.title}`, entity, node, record });
  }
  return result;
}

export function wizardSessionRecord(target, workspace, sourceId) {
  return [...(target?.narrativeWizardHistory || []), ...(target?.narrativeWizard ? [target.narrativeWizard] : [])].find(record => record.sourceId === sourceId && (
    workspace.sessionId ? record.sessionId === workspace.sessionId : !record.sessionId && workspace.sourceTitle && record.title === workspace.sourceTitle
  ));
}
