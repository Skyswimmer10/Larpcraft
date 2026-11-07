export const CONVERSATION_ICON_OPTIONS = [
  ['user', 'Person'], ['users', 'People'], ['heart', 'Heart'], ['flag', 'Flag'],
  ['target', 'Target'], ['star', 'Star'], ['zap', 'Lightning'], ['alert', 'Warning'],
  ['book', 'Book'], ['pin', 'Location'], ['clock', 'Time'], ['link', 'Connection'],
  ['box', 'Object'], ['rules', 'Rules'], ['branches', 'Choices'], ['pulse', 'Progress'],
];

// Undefined inherits the normal icon/portrait. Null explicitly removes it.
export function resolveConversationIcon(value, fallback) {
  if (value === null) return null;
  if (value?.image?.dataUrl?.startsWith('data:image/')) return { image: value.image };
  if (CONVERSATION_ICON_OPTIONS.some(([id]) => id === value?.symbol)) return { symbol: value.symbol };
  return fallback;
}

export function participantIconFallback(profile = {}, name = '') {
  return profile.portrait ? { image: { dataUrl: profile.portrait } } : { initial: Array.from(name || '?')[0] };
}

export function conversationIconMetadata(conversation) {
  const icon = resolveConversationIcon(conversation.icon, { symbol: 'users' });
  return { icon: icon?.symbol || 'users', image: icon?.image || null, hideIcon: !icon };
}
