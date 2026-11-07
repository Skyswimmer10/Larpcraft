export function wizardFieldsBody(node) {
  return [node.wizardFieldReferenceBody, ...Object.values(node.wizardFields || {}).filter(field => field.answer?.trim()).map(field => `${field.prompt}\n${field.answer.trim()}`)].filter(Boolean).join('\n\n');
}
export function wizardFieldPatch(node, key, answer) {
  const fields = { ...node.wizardFields, [key]: { ...node.wizardFields[key], answer } };
  const next = { ...node, wizardFields: fields };
  const body = wizardFieldsBody(next);
  // A separate authored body is retained; it is never parsed back into answers.
  return { wizardFields: fields, ...(node.body === node.wizardFieldGeneratedBody || !node.body ? { body, wizardFieldGeneratedBody: body } : {}) };
}
