import { describe, expect, it } from 'vitest';
import { conversationFileName, conversationPageSlices, conversationScreenplay } from './conversationExport.js';

describe('conversation exports', () => {
  it('uses live names and dialogue aliases in screenplay cues, with stage directions as action', () => {
    const script = { title: 'At the gate', context: 'EXT. NORTH GATE - NIGHT', authorGoals: 'Secret writer note', summary: 'Not screenplay dialogue', participants: [
      { id: 'a', name: 'Old name', characterRef: { coll: 'nodes', nodeId: 'A' } },
      { id: 'b', name: 'Māra', sceneName: 'The stranger', icon: { symbol: 'heart' } },
    ], passages: [
      { id: '1', speakerId: 'a', text: 'The gate is closed.', tags: 'Suspicion' },
      { id: '2', speakerId: 'narration', text: 'A lantern goes out.' },
      { id: '3', speakerId: 'b', text: 'Then we wait.' },
      { id: '4', speakerId: 'a', text: '  ' },
    ] };
    const text = conversationScreenplay(script, { nodes: { A: { id: 'A', kind: 'character', title: 'Līga' } } });
    expect(text).toContain('EXT. NORTH GATE - NIGHT');
    expect(text).toContain('                      LĪGA\n          The gate is closed.');
    expect(text).toContain('\nA lantern goes out.\n');
    expect(text).toContain('                      THE STRANGER\n          Then we wait.');
    for (const excluded of ['Old name', 'Suspicion', 'Secret writer note', 'Not screenplay dialogue', 'heart', 'Narration:']) expect(text).not.toContain(excluded);
    expect(script.participants[0].name).toBe('Old name');
  });

  it('wraps long dialogue and long words without losing characters or blank-paragraph structure', () => {
    const reply = 'We need to cross the river before the morning patrol arrives.\n\n' + 'x'.repeat(90);
    const output = conversationScreenplay({ participants: [{ id: 'a', name: 'Captain' }], passages: [{ speakerId: 'a', text: reply }] });
    const dialogue = output.split('\n').filter(line => line.startsWith('          ') && !line.startsWith('                      '));
    expect(dialogue.every(line => line.length <= 45)).toBe(true);
    expect(dialogue.join('').replace(/\s/g, '')).toBe(reply.replace(/\s/g, ''));
  });

  it('keeps bubbles together and preserves every pixel of oversized messages across bounded pages', () => {
    expect(conversationPageSlices([30, 50, 40], 100)).toEqual([
      [{ index: 0, offset: 0, height: 30 }, { index: 1, offset: 0, height: 50 }],
      [{ index: 2, offset: 0, height: 40 }],
    ]);
    const pages = conversationPageSlices([20, 260, 0, 40], 100);
    expect(pages.every(page => page.reduce((sum, row) => sum + row.height, 0) <= 100)).toBe(true);
    const slices = pages.flat().filter(row => row.index === 1);
    expect(slices).toEqual([{ index: 1, offset: 0, height: 80 }, { index: 1, offset: 80, height: 100 }, { index: 1, offset: 180, height: 80 }]);
    expect(pages.flat().reduce((sum, row) => sum + row.height, 0)).toBe(320);
    expect(conversationPageSlices([], 100)).toEqual([]);
    expect(() => conversationPageSlices([1], 0)).toThrow();
  });

  it('moves oversized-bubble page breaks before text lines and portraits instead of clipping them', () => {
    const pages = conversationPageSlices([260], 100, [[{ top: 90, bottom: 105 }, { top: 180, bottom: 213 }]]);
    expect(pages).toEqual([[{ index: 0, offset: 0, height: 90 }], [{ index: 0, offset: 90, height: 90 }], [{ index: 0, offset: 180, height: 80 }]]);
    expect(pages.flat().reduce((sum, row) => sum + row.height, 0)).toBe(260);
  });

  it('makes safe, recognizable filenames without dropping international character names', () => {
    expect(conversationFileName('Māra / The gate?', 'pdf')).toBe('Māra - The gate-.pdf');
    expect(conversationFileName(' ', 'txt')).toBe('conversation.txt');
    expect(conversationFileName('Ending. ', 'pdf')).toBe('Ending.pdf');
  });
});
