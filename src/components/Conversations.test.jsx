import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import ConversationBrowser, { ConversationList, ConversationEditorContents, ConversationEditor } from './Conversations.jsx';
import DescriptionParagraphReview from './DescriptionParagraphReview.jsx';
import { characterReference, createConversation } from '../lib/conversations.js';
import { ConversationIconPicker } from './ConversationIcons.jsx';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });

const project = { nodes: { A: { id: 'A', kind: 'character', title: 'Moro' }, B: { id: 'B', kind: 'character', title: 'Uno' }, G: { id: 'G', kind: 'group', title: 'The guild' } } };
const conversation = { ...createConversation('talk', { id: 'speaker', name: 'Moro', characterRef: characterReference({}, 'A') }), title: 'A private warning', passages: [{ id: 'p', speakerId: 'speaker', text: 'The gate closes at sunset.' }] };

describe('conversation and description writing views', () => {
  it('offers add/change/remove icon controls and hides removed participant portraits throughout the exchange', () => {
    const script = { ...conversation, icon: null, participants: conversation.participants.map(row => ({ ...row, icon: null, goalIcons: { trust: null } })) };
    const html = renderToStaticMarkup(<ConversationEditorContents conversation={script} project={project} onPatch={() => {}} />);
    for (const label of ['Edit Conversation icon', 'Edit Moro icon', 'Edit Moro: Trust icon', 'Add icon']) expect(html).toContain(label);
    expect(html).not.toContain('aria-label="Portrait of Moro"');
    const picker = renderToStaticMarkup(<ConversationIconPicker label="Moro: Trust" value={null} fallback={{ symbol: 'heart' }} onChange={() => {}} onClose={() => {}} />);
    for (const label of ['Use Heart icon', 'Use Star icon', 'Upload icon image', 'Use default', 'Remove icon', 'No icon']) expect(picker).toContain(label);
  });

  it('lists shared conversations with participants and story status', () => {
    const html = renderToStaticMarkup(<ConversationList conversations={[conversation]} project={project} onOpen={() => {}} />);
    expect(html).toContain('A private warning'); expect(html).toContain('Moro'); expect(html).toContain('Planned script');
  });

  it('shows dense selectable lines, a speaker roster and editable goal columns with safe participant removal', () => {
    const html = renderToStaticMarkup(<ConversationEditorContents conversation={conversation} project={project} onPatch={() => {}} />);
    for (const text of ['Participants', 'Speaker', 'Narration / stage directions', 'Selected line', 'The gate closes at sunset.', 'Add stage directions', 'Character and relationship reference', 'Story relevance &amp; author goals', 'Conversation summary', 'Goals in this conversation', 'Survival', 'Trust', 'Mission', 'cw-goals', 'Edit line 1: Moro']) expect(html).toContain(text);
    expect(html).not.toContain('The guild');
    expect(html).not.toContain('Conversation title');
    expect(html).not.toContain('Story status');
    expect(html).toContain('title="Reassign or remove their passages first"');
    expect(html).toContain('disabled=""');
  });

  it('keeps narration centered, distinguishes left/right speakers and reads live portraits and traits', () => {
    const game = { nodes: { ...project.nodes, A: { ...project.nodes.A, image: { dataUrl: 'data:image/png;base64,portrait' }, body: 'A careful guide.', characterAttributes: { fields: [{ id: 'personality', kind: 'tags', values: ['Cautious'] }] } } } };
    const script = { ...conversation, summary: 'A warning is shared.', authorGoals: 'Plant the clue.', participants: [...conversation.participants, { id: 'uno', name: 'Uno', side: 'right' }], passages: [...conversation.passages, { id: 'reply', speakerId: 'uno', text: 'Then we must hurry.' }, { id: 'stage', speakerId: 'narration', text: 'A bell rings.' }] };
    const html = renderToStaticMarkup(<ConversationEditorContents conversation={script} project={game} onPatch={() => {}} />);
    for (const value of ['cw-message-row left', 'cw-message-row right', 'cw-message-row narration', 'Portrait of Moro', 'data:image/png;base64,portrait', 'Cautious', 'A careful guide.', 'Plant the clue.', 'A warning is shared.']) expect(html).toContain(value);
  });

  it('uses a dialogue alias without renaming the roster, inspector or speaker choices', () => {
    const script = { ...conversation, participants: [{ ...conversation.participants[0], sceneName: 'The stranger' }] };
    const html = renderToStaticMarkup(<ConversationEditorContents conversation={script} project={project} onPatch={() => {}} />);
    expect(html).toContain('Edit line 1: The stranger');
    expect(html).toContain('<b>Moro</b>');
    expect(html).not.toContain('<b>The stranger</b>');
    expect(html).toContain('<option value="speaker" selected="">Moro</option>');
    expect(html).toContain('value="The stranger"');
    const settings = html.slice(html.indexOf('<section class="cw-speaker-controls"'));
    for (const action of ['Move passage 1 up', 'Move passage 1 down', 'Remove passage', 'Add passage', 'Add stage directions']) {
      const ribbon = html.slice(html.indexOf('class="cw-message-tools"'), html.indexOf('<form class="cw-composer"'));
      expect(ribbon).toContain(action);
      expect(settings).not.toContain(action);
    }
    expect(html).not.toContain('cw-speaker-settings');
    expect(settings).toContain('cw-speaker-ribbon');
    expect(settings).toContain('Edit name in dialogue');
    expect(settings).toContain('Place Moro on left');
    expect(settings).toContain('Place Moro on right');
  });

  it('keeps passage tools available for stage directions without an active character', () => {
    const script = { ...conversation, passages: [{ id: 'stage', speakerId: 'narration', text: 'The door closes.' }] };
    const html = renderToStaticMarkup(<ConversationEditorContents conversation={script} project={project} onPatch={() => {}} />);
    const ribbon = html.slice(html.indexOf('class="cw-message-tools"'), html.indexOf('<form class="cw-composer"'));
    expect(ribbon).toContain('Remove passage');
    expect(ribbon).toContain('Add stage directions');
    expect(html).not.toContain('Name in dialogue');
  });

  it('centers only an explicitly placed message while the third speaker keeps a normal side', () => {
    const script = { ...conversation, participants: [...conversation.participants, { id: 'second', name: 'Uno' }, { id: 'third', name: 'The courier' }], passages: [
      ...conversation.passages,
      { id: 'second-line', speakerId: 'second', text: 'Who told you?' },
      { id: 'third-line', speakerId: 'third', text: 'I heard it at the gate.' },
      { id: 'address-both', speakerId: 'speaker', text: 'Listen, both of you.', position: 'center' },
      { id: 'stage', speakerId: 'narration', text: 'The gates begin to close.' },
    ] };
    const html = renderToStaticMarkup(<ConversationEditorContents conversation={script} project={project} onPatch={() => {}} />);
    expect(html.match(/class="cw-message-row left"/g)).toHaveLength(2);
    expect(html.match(/class="cw-message-row right"/g)).toHaveLength(1);
    expect(html.match(/class="cw-message-row center"/g)).toHaveLength(1);
    expect(html.match(/class="cw-message-row narration"/g)).toHaveLength(1);
    for (const label of ['Center line 1', 'Center line 2', 'Center line 3', 'Restore line 4 to left']) expect(html).toContain(label);
    expect(html).not.toContain('Center line 5');
    expect(new Set([...html.matchAll(/--speaker-from:([^;\"]+)/g)].map(match => match[1])).size).toBe(3);
  });

  it('shows optional tags inside spoken bubbles and offers visual and screenplay exports', () => {
    const script = { ...conversation, passages: [{ ...conversation.passages[0], tags: 'Suspicion · deflection' }, { id: 'plain', speakerId: 'speaker', text: 'A plain reply.', tags: '  ' }] };
    const html = renderToStaticMarkup(<ConversationEditorContents conversation={script} project={project} onPatch={() => {}} />);
    expect(html.match(/class="cw-message-tags"/g)).toHaveLength(1);
    expect(html).toContain('Suspicion · deflection</span>');
    expect(html).toContain('Export conversation');
    expect(html).toContain('Visual PDF · portraits &amp; bubbles');
    expect(html).toContain('Screenplay · text (.txt)');
  });

  it('shows both versions and lets the author keep, replace or edit just one affected paragraph', () => {
    const html = renderToStaticMarkup(<DescriptionParagraphReview paragraph={{ id: 'p', text: 'My exception.', pending: 'The new source wording.' }} sourceLabel="FATE" onResolve={() => {}} />);
    for (const text of ['Your current wording', 'Proposed revision', 'My exception.', 'The new source wording.', 'Use this revision', 'Keep my wording', 'Edit this paragraph', 'Save edited paragraph', 'FATE']) expect(html).toContain(text);
    expect(html).not.toContain('Use updated description');
  });

  it('offers a library browser and a template editor with named speakers and an explicit reuse action', () => {
    const browser = renderToStaticMarkup(<ConversationBrowser mode="library" />);
    expect(browser).toContain('Saved conversation templates');
    expect(browser).toContain('New conversation template');
    expect(browser).toContain('Conversation story status');
    expect(browser).toContain('All conversations');
    expect(browser).toContain('Search titles, participants and scenes');
    expect(browser).not.toContain('One shared script for all participants.');
    expect(browser).not.toContain('<h3>Conversations</h3>');
    const template = { ...conversation, participants: [{ id: 'speaker', name: 'Moro' }] };
    const html = renderToStaticMarkup(<ConversationEditor conversation={template} project={{}} libraryMode onPatch={() => {}} onUse={() => {}} onClose={() => {}} onDelete={() => {}} />);
    expect(html).toContain('Conversation template · saved in the Library');
    expect(html).toContain('Add copy to current game');
    expect(html).toContain('Name in dialogue');
    expect(html).not.toContain('Add an existing character');
    expect(html).not.toContain('Save conversation to library');
    const game = renderToStaticMarkup(<ConversationEditor conversation={conversation} project={project} onPatch={() => {}} onSaveToLibrary={() => {}} onClose={() => {}} onDelete={() => {}} />);
    expect(game).toContain('Save conversation to library');
    const header = game.slice(0, game.indexOf('</header>'));
    expect(header).toContain('Conversation title');
    expect(header).toContain('Story status');
    expect(header).toContain('value="A private warning"');
    expect(header).toContain('Planned script');
  });
});
