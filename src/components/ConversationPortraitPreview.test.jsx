import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ConversationPortraitPreview, { portraitPreviewPosition } from './ConversationPortraitPreview.jsx';

describe('floating conversation portraits', () => {
  const bounds = { left: 200, top: 100, width: 600, height: 700 };
  const size = { width: 210, height: 300 };
  it('places the preview beside the portrait and flips away from the right edge', () => {
    expect(portraitPreviewPosition({ left: 220, right: 253, top: 150 }, bounds, size)).toEqual({ left: 65, top: 30 });
    expect(portraitPreviewPosition({ left: 740, right: 773, top: 150 }, bounds, size)).toEqual({ left: 318, top: 30 });
  });
  it('keeps previews inside narrow panes and above the bottom boundary', () => {
    expect(portraitPreviewPosition({ left: 450, right: 483, top: 790 }, bounds, size)).toEqual({ left: 295, top: 392 });
    expect(portraitPreviewPosition({ left: 225, right: 258, top: 90 }, { ...bounds, width: 230, height: 320 }, size)).toEqual({ left: 8, top: 8 });
  });
  it('uses the conversation portrait override and provides pin and close controls', () => {
    const html = renderToStaticMarkup(<ConversationPortraitPreview preview={{ pinned: true, anchor: {} }} participant={{ icon: { image: { dataUrl: 'data:image/png;base64,override' } } }} person={{ name: 'Lira' }} profile={{ portrait: 'old', traits: ['Guarded', 'Loyal'] }} container={{ current: null }} />);
    expect(html).toContain('Enlarged portrait of Lira');
    expect(html).toContain('data:image/png;base64,override');
    expect(html).not.toContain('src="old"');
    expect(html).toContain('Unpin portrait preview');
    expect(html).toContain('Close portrait preview');
  });
});
