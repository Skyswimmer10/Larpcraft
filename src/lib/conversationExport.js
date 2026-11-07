import { conversationDialogueName, conversationParticipant } from './conversations.js';

const clean = value => typeof value === 'string' ? value.trim() : '';
export function conversationFileName(title, extension) {
  const name = clean(title).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 100) || 'conversation';
  return `${name}.${extension}`;
}

function wrap(text, width, indent = 0) {
  const prefix = ' '.repeat(indent), result = [];
  for (const paragraph of String(text).replace(/\r\n?/g, '\n').split('\n')) {
    let line = '';
    for (let word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && line.length + word.length + 1 > width) { result.push(prefix + line); line = ''; }
      while (word.length > width) { result.push(prefix + word.slice(0, width)); word = word.slice(width); }
      if (word) line += (line ? ' ' : '') + word;
    }
    result.push(prefix + line);
  }
  return result.join('\n');
}

// Plain text deliberately omits portraits, analytical tags and author notes.
// Uppercase cues and narrower, indented dialogue remain useful in any editor.
export function conversationScreenplay(conversation, project = {}) {
  const people = (conversation.participants || []).map(row => conversationParticipant(row, project));
  const title = (clean(conversation.title) || 'Untitled conversation').toUpperCase();
  const scene = clean(conversation.context) || clean(conversation.location?.name);
  const lines = [wrap(title, 60), '', scene ? wrap(scene.toUpperCase(), 60) : '', ''];
  for (const passage of conversation.passages || []) {
    if (!clean(passage.text)) continue;
    if (passage.speakerId === 'narration') lines.push(wrap(passage.text, 60), '');
    else {
      const name = conversationDialogueName(people.find(row => row.id === passage.speakerId)).toUpperCase();
      lines.push(wrap(name, 32, 22), wrap(passage.text, 35, 10), '');
    }
  }
  return lines.join('\n').trimEnd() + '\n';
}

export function downloadConversationFile(title, content, extension = 'txt', type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = conversationFileName(title, extension); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Keep ordinary bubbles together. A single oversized block is split into
// bounded slices, so very long exchanges never require one giant canvas.
export function conversationPageSlices(heights, capacity, protectedAreas = []) {
  if (!(capacity > 0) || !Number.isFinite(capacity)) throw Error('Invalid PDF page height');
  const pages = []; let page = [], used = 0;
  const flush = () => { if (page.length) pages.push(page); page = []; used = 0; };
  heights.forEach((value, index) => {
    const height = Math.max(0, Number(value) || 0);
    if (!height) return;
    if (height <= capacity && used + height > capacity) flush();
    let offset = 0;
    while (offset < height) {
      if (capacity - used < 1) flush();
      let amount = Math.min(height - offset, capacity - used);
      if (offset + amount < height) {
        let end = offset + amount;
        // Never cut through a text line or portrait when continuing a long bubble.
        for (;;) {
          const crossing = (protectedAreas[index] || []).filter(area => area.top < end && area.bottom > end);
          if (!crossing.length) break;
          const previous = Math.floor(Math.min(...crossing.map(area => area.top)));
          if (previous >= end) break;
          end = previous;
        }
        if (end > offset) amount = end - offset;
        else if (used) { flush(); continue; }
      }
      page.push({ index, offset, height: amount }); used += amount; offset += amount;
      if (offset < height) flush();
    }
  });
  flush(); return pages;
}

export async function exportConversationPdf(center, conversation) {
  if (!center?.isConnected) throw Error('Open the conversation before exporting.');
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
  if (!center?.isConnected) throw Error('Open the conversation before exporting.');
  const width = Math.round(Math.max(600, center.clientWidth));
  const host = document.createElement('div');
  host.className = 'cw-pdf-export'; host.style.width = `${width}px`;
  host.style.fontFamily = getComputedStyle(center).fontFamily;
  host.setAttribute('aria-hidden', 'true'); host.inert = true;
  const blocks = [], textBlock = (className, text) => {
    const el = document.createElement('div'); el.className = className; el.textContent = text; return el;
  };
  const heading = textBlock('cw-pdf-title', conversation.title || 'Untitled conversation');
  const conversationIcon = center.querySelector('.cw-conversation-heading .cw-custom-icon');
  if (conversationIcon) heading.prepend(conversationIcon.cloneNode(true));
  blocks.push(heading);
  if (clean(conversation.context)) blocks.push(textBlock('cw-pdf-context', conversation.context));
  for (const row of center.querySelectorAll('.cw-message-row')) {
    const clone = row.cloneNode(true);
    clone.querySelectorAll('.cw-center-toggle,.cw-message-tools').forEach(el => el.remove());
    clone.querySelectorAll('[aria-pressed]').forEach(el => el.removeAttribute('aria-pressed'));
    blocks.push(clone);
  }
  if (!conversation.passages?.length) blocks.push(textBlock('cw-pdf-context', 'No dialogue lines yet.'));
  if (clean(conversation.summary)) blocks.push(textBlock('cw-pdf-summary', 'Conversation summary\n' + conversation.summary));
  const measure = document.createElement('div'); measure.className = 'cw-pdf-content';
  const wrappers = blocks.map(block => { const wrap = document.createElement('div'); wrap.className = 'cw-pdf-block'; wrap.appendChild(block); measure.appendChild(wrap); return wrap; });
  host.appendChild(measure); document.body.appendChild(host);
  try {
    await document.fonts?.ready;
    await Promise.all([...host.querySelectorAll('img')].map(img => img.decode()));
    const heights = wrappers.map(el => Math.ceil(el.getBoundingClientRect().height));
    const contentWidth = width - 32, capacity = Math.floor(contentWidth * 273 / 186) - 32;
    const protectedAreas = wrappers.map(wrap => {
      const top = wrap.getBoundingClientRect().top, rects = [];
      const texts = wrap.querySelectorAll('.cw-message-text,.cw-message-meta,.cw-message-tags');
      for (const el of texts.length ? texts : [wrap]) {
        const range = document.createRange(); range.selectNodeContents(el);
        for (const rect of range.getClientRects()) rects.push({ top: rect.top - top, bottom: rect.bottom - top });
      }
      for (const el of wrap.querySelectorAll('.cw-avatar')) {
        const rect = el.getBoundingClientRect(); rects.push({ top: rect.top - top, bottom: rect.bottom - top });
      }
      return rects;
    });
    const pages = conversationPageSlices(heights, capacity, protectedAreas);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    pdf.setProperties({ title: conversation.title || 'Conversation', creator: 'LARPCraft' });
    const page = document.createElement('div'); page.className = 'cw-pdf-content'; host.appendChild(page);
    for (let index = 0; index < pages.length; index++) {
      page.replaceChildren();
      for (const part of pages[index]) {
        const clip = document.createElement('div'); clip.className = 'cw-pdf-slice'; clip.style.height = `${part.height}px`;
        const block = wrappers[part.index].cloneNode(true); block.style.transform = `translateY(-${part.offset}px)`;
        clip.appendChild(block); page.appendChild(clip);
      }
      const canvas = await toCanvas(page, { pixelRatio: 2, backgroundColor: '#102226', fontEmbedCSS: '' });
      if (index) pdf.addPage();
      pdf.setFillColor('#102226'); pdf.rect(0, 0, 210, 297, 'F');
      pdf.addImage(canvas, 'PNG', 12, 12, 186, canvas.height * 186 / canvas.width, undefined, 'FAST');
      pdf.setTextColor('#a8c8bd'); pdf.setFontSize(8); pdf.text(`${index + 1} / ${pages.length}`, 198, 291, { align: 'right' });
      canvas.width = 0; canvas.height = 0;
    }
    downloadConversationFile(conversation.title, pdf.output('arraybuffer'), 'pdf', 'application/pdf');
    return pages.length;
  } finally { host.remove(); }
}
