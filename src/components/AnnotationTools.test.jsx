import React, { Children } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AnnotationTools, { AnnotationButtons } from './AnnotationTools.jsx';

const handlers = () => Object.fromEntries(['onFrame', 'onCircle', 'onVisualMarker', 'onTitle', 'onArrow', 'onSpline'].map(key => [key, vi.fn()]));

describe('shared annotation tools', () => {
  it('does not pass click events into placement callbacks as canvas coordinates', () => {
    const callbacks = handlers();
    const buttons = Children.toArray(AnnotationButtons(callbacks).props.children);
    const click = { clientX: 42, clientY: 18, currentTarget: {} };
    click.nativeEvent = click;
    buttons.forEach(button => button.props.onClick(click));
    for (const key of ['onFrame', 'onCircle', 'onTitle', 'onArrow', 'onSpline']) expect(callbacks[key].mock.calls).toEqual([[]]);
    expect(callbacks.onVisualMarker.mock.calls).toEqual([['number'], ['letter']]);
  });

  it('offers all seven labeled tools with their visual symbols', () => {
    const html = renderToStaticMarkup(<AnnotationButtons {...handlers()} />);
    expect(html.match(/<button/g)).toHaveLength(7);
    for (const label of ['Frame', 'Circle', 'Number', 'Letter', 'Title', 'Arrow', 'Spline']) expect(html).toContain(`</span>${label}</button>`);
    expect(html).toContain('shapecircle');
    expect(html).toContain('arrowglyph');
    expect(html).toContain('splineglyph');
  });

  it('keeps the same collapsed Annotate control outside the refreshed appearance', () => {
    const html = renderToStaticMarkup(<AnnotationTools><AnnotationButtons {...handlers()} /></AnnotationTools>);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('>Annotate ▾</button>');
    expect(html).not.toContain('Add a visual grouping frame');
  });
});
