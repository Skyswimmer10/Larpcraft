import React, { useEffect, useRef, useState } from 'react';

// Decode one original at a time, rather than every catalogue image together.
let previewQueue = Promise.resolve();

export default function MechanismPreviewImage({ source, maxSize = 480, style }) {
  const element = useRef(null);
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      root: element.current.closest('.mechanism-browser-main, .mechanism-browser-editor'),
      rootMargin: '240px',
    });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let url;
    setPreview(null);
    setFailed(false);
    if (!visible || !source) return;
    const generate = async () => {
      if (cancelled) return;
      let original;
      try {
        const blobSource = await (await fetch(source)).blob();
        if (cancelled) return;
        if (blobSource.type === 'image/svg+xml') {
          original = new Image();
          original.src = source;
          await original.decode();
        } else {
          original = await createImageBitmap(blobSource);
        }
        if (cancelled) return;
        const width = original.naturalWidth || original.width;
        const height = original.naturalHeight || original.height;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        canvas.getContext('2d').drawImage(original, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
        canvas.width = canvas.height = 0;
        if (cancelled) return;
        if (!blob) throw new Error('Preview encoding failed');
        url = URL.createObjectURL(blob);
        setPreview({ source, url });
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (original instanceof ImageBitmap) original.close();
        else if (original) original.src = '';
      }
    };
    previewQueue = previewQueue.then(generate, generate);
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [source, maxSize, visible]);

  return <span ref={element} className="mechanism-preview-image">
    {visible && preview?.source === source
      ? <img src={preview.url} alt="" draggable={false} decoding="async" style={style} />
      : <span className="dim">{failed ? 'Preview unavailable' : 'Loading preview…'}</span>}
  </span>;
}
