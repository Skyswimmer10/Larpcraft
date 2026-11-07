import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import NarrativeSourceCard from './NarrativeSourceCard.jsx';
import FrameworkDetail from './FrameworkDetail.jsx';
import { narrativeSources } from '../lib/narrativeWizard.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';

const sources = narrativeSources({ concepts: { sample: { id: 'sample', name: 'A test concept', category: 'storyConcept' } } });
const buttonsOf = node => !React.isValidElement(node) ? [] : [...(node.type === 'button' ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(buttonsOf)];

describe('Story Wizard framework information', () => {
  it('opens each canonical Library framework without choosing it or starting a wizard', () => {
    const frameworks = sources.filter(item => item.type === 'framework');
    expect(frameworks).toHaveLength(Object.keys(FRAMEWORK_TYPES).length);
    for (const item of frameworks) {
      const onChoose = vi.fn(), onInformation = vi.fn();
      const card = NarrativeSourceCard({ item, onChoose, onInformation });
      const [choose, information] = buttonsOf(card);
      expect(information.props['aria-label']).toBe(`Information about ${item.label}`);
      expect(information.props['aria-haspopup']).toBe('dialog');
      information.props.onClick();
      expect(onInformation).toHaveBeenCalledWith(FRAMEWORK_TYPES[item.source.id]);
      expect(onChoose).not.toHaveBeenCalled();
      choose.props.onClick();
      expect(onChoose).toHaveBeenCalledWith(item);
      expect(onInformation).toHaveBeenCalledTimes(1);
    }
  });

  it('keeps wizard, direct insertion and information actions independent for concepts', () => {
    const concept = sources.find(item => item.type === 'concept');
    const onChoose = vi.fn(), onInsert = vi.fn(), onInformation = vi.fn();
    const card = NarrativeSourceCard({ item: concept, onChoose, onInsert, onInformation });
    const [wizard, insert, information] = buttonsOf(card);
    insert.props.onClick();
    expect(onInsert).toHaveBeenCalledWith(concept);
    expect(onChoose).not.toHaveBeenCalled();
    information.props.onClick();
    expect(onInformation).toHaveBeenCalledWith(concept.source);
    expect(onChoose).not.toHaveBeenCalled();
    wizard.props.onClick();
    expect(onChoose).toHaveBeenCalledWith(concept);
    const html = renderToStaticMarkup(card);
    expect(html.match(/<button /g)).toHaveLength(3);
    expect(html).toContain('Start wizard');
    expect(html).toContain('Add to canvas');
    expect(html).toContain('Information about');
  });

  it('offers direct insertion and information for structures and supporting templates without a fake wizard', () => {
    for (const type of ['structure', 'template']) {
      const item = { ...sources[0], type, canWizard: false };
      const onInsert = vi.fn();
      const card = NarrativeSourceCard({ item, onChoose: vi.fn(), onInsert, onInformation: vi.fn() });
      const buttons = buttonsOf(card);
      expect(buttons).toHaveLength(2);
      buttons[0].props.onClick();
      expect(onInsert).toHaveBeenCalledWith(item);
      expect(renderToStaticMarkup(card)).not.toContain('Start wizard');
    }
  });

  it('reuses full Library explanations for every framework without offering a second wizard', () => {
    for (const framework of Object.values(FRAMEWORK_TYPES)) {
      const html = renderToStaticMarkup(<FrameworkDetail framework={framework} showUseButton={false} onClose={() => {}} />);
      expect(html).toContain('framework-detail-dialog');
      expect(html).toContain('aria-label="Framework explanations"');
      expect(html).toContain('>Close</button>');
      expect(html).not.toContain('Use this framework');
    }
    expect(renderToStaticMarkup(<FrameworkDetail framework={FRAMEWORK_TYPES.fate} onClose={() => {}} />)).toContain('Use this framework');
  });
});
