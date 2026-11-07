import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CharacterAttributes, { CharacterAttributesDialog, ManageCharacterAttributes } from './CharacterAttributes.jsx';
import CharacterNode, { CharacterDescription } from './CharacterNode.jsx';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });
const node = { kind: 'character', title: 'Uno', characterAttributes: { version: 1, fields: [
  { id: 'personality', label: 'Personality', category: 'personality', kind: 'tags', values: ['Curious', 'Patient', 'Generous', 'Reserved'] },
  { id: 'custom:mark', label: 'Mark', category: 'custom', kind: 'text', value: 'Silver hand' },
] } };

describe('quick attributes views', () => {
  it('uses one compact button with no disclosure, description or inline editor', () => {
    const html = renderToStaticMarkup(<CharacterAttributes node={{ kind: 'character' }} onPatch={() => {}} />);
    expect(html).toContain('Quick attributes');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain('<details');
    expect(html).not.toMatch(/<p(?:\s|>)/);
    expect(html).not.toContain('required=');
    expect(html).not.toContain('Curious');
  });

  it('shows selected tags with removal controls, custom text and optional suggestions', () => {
    const html = renderToStaticMarkup(<CharacterAttributesDialog node={node} onPatch={() => {}} onClose={() => {}} />);
    expect(html).toContain('Remove Personality: Curious');
    expect(html).toContain('aria-pressed="true">Patient');
    expect(html).toContain('Silver hand');
    expect(html).toContain('aria-label="Mark"');
    expect(html).toContain('Manage attributes');
  });

  it('offers category navigation and an explicit apply/cancel boundary for field removal', () => {
    const html = renderToStaticMarkup(<ManageCharacterAttributes fields={node.characterAttributes.fields} onApply={() => {}} onClose={() => {}} />);
    expect(html).toContain('Attribute categories');
    for (const label of ['Personality', 'Appearance', 'Skills &amp; interests', 'Custom', 'Search fields', 'Apply fields (2)', 'Cancel keeps everything']) expect(html).toContain(label);
    expect(html).toContain('type="checkbox" checked=""');
  });

  it('gives attributes-only characters a readable description and limits the canvas preview', () => {
    const card = renderToStaticMarkup(<CharacterNode node={node} />);
    expect(card).toContain('title="Personality: Curious"');
    expect(card).toContain('>+1</span>');
    expect(card).not.toContain('Silver hand');
    const description = renderToStaticMarkup(<CharacterDescription node={node} onClose={() => {}} />);
    expect(description).toContain('Personality: Curious, Patient, Generous, Reserved');
    expect(description).toContain('Mark: Silver hand');
    expect(description).toContain('A longer description is optional.');
    expect(description).not.toContain('No description yet.');
  });
});
