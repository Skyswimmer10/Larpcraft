import React, { useState } from 'react';
import { useLibrary } from '../state/store.jsx';
import StoryLibraryBrowser from '../components/StoryLibraryBrowser.jsx';
import { ConversationBrowserDialog } from '../components/Conversations.jsx';

export default function CreatedContent({ onOpen }) {
  const library = useLibrary();
  const [conversationBrowser, setConversationBrowser] = useState(null);
  const pick = ({ coll, id, record }) => {
    if (coll === 'conversationTemplates') setConversationBrowser({ id });
    else onOpen({ type: coll, id, record });
  };
  return <div className="main created-content-page">
    <StoryLibraryBrowser library={library} mode="content" inline onPick={pick}
      headerAction={<div className="right"><span className="libbadge">Library · Master Database</span><button type="button" className="btn" onClick={() => setConversationBrowser({})}>Conversations</button></div>} />
    {conversationBrowser && <ConversationBrowserDialog mode="library" initialConversationId={conversationBrowser.id} onClose={() => setConversationBrowser(null)} />}
  </div>;
}
