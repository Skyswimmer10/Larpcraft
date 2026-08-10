import React, { useEffect, useMemo, useRef, useState } from 'react';

const VIEW_W = 420;
const VIEW_H = 260;
const OUTPUT_W = 1260;
const OUTPUT_H = 780;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function ImageCropDialog({ source, onCancel, onKeepOriginal, onCrop }) {
  const [natural, setNatural] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  const geometry = useMemo(() => {
    const baseScale = Math.max(VIEW_W / natural.width, VIEW_H / natural.height);
    const scale = baseScale * zoom;
    const width = natural.width * scale;
    const height = natural.height * scale;
    const maxX = Math.max(0, (width - VIEW_W) / 2);
    const maxY = Math.max(0, (height - VIEW_H) / 2);
    return { scale, width, height, maxX, maxY };
  }, [natural, zoom]);

  useEffect(() => {
    setOffset((current) => ({
      x: clamp(current.x, -geometry.maxX, geometry.maxX),
      y: clamp(current.y, -geometry.maxY, geometry.maxY),
    }));
  }, [geometry.maxX, geometry.maxY]);

  const beginDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, offset };
  };

  const moveDrag = (event) => {
    if (!dragRef.current) return;
    const nextX = dragRef.current.offset.x + event.clientX - dragRef.current.x;
    const nextY = dragRef.current.offset.y + event.clientY - dragRef.current.y;
    setOffset({
      x: clamp(nextX, -geometry.maxX, geometry.maxX),
      y: clamp(nextY, -geometry.maxY, geometry.maxY),
    });
  };

  const endDrag = () => { dragRef.current = null; };

  const saveCrop = () => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_W;
      canvas.height = OUTPUT_H;
      const context = canvas.getContext('2d');
      const left = (VIEW_W - geometry.width) / 2 + offset.x;
      const top = (VIEW_H - geometry.height) / 2 + offset.y;
      const sourceX = clamp(-left / geometry.scale, 0, natural.width);
      const sourceY = clamp(-top / geometry.scale, 0, natural.height);
      const sourceWidth = Math.min(VIEW_W / geometry.scale, natural.width - sourceX);
      const sourceHeight = Math.min(VIEW_H / geometry.scale, natural.height - sourceY);
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, OUTPUT_W, OUTPUT_H);
      const baseName = source.name.replace(/\.[^.]+$/, '') || 'action-image';
      onCrop({
        kind: 'photo',
        name: `${baseName}-cropped.webp`,
        dataUrl: canvas.toDataURL('image/webp', 0.92),
        cropped: true,
        sourceName: source.name,
      });
    };
    image.src = source.dataUrl;
  };

  return (
    <div className="cropmodal" role="dialog" aria-modal="true" aria-label="Crop action image">
      <div className="cropdialog">
        <div className="crophead">
          <div><b>Crop Action image</b><span>Drag the image to choose what remains visible.</span></div>
          <button className="iconbtn" title="Cancel image crop" onClick={onCancel}>×</button>
        </div>
        <div
          className="cropviewport"
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            src={source.dataUrl}
            alt="Crop preview"
            draggable="false"
            onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth || 1, height: event.currentTarget.naturalHeight || 1 })}
            style={{
              width: geometry.width,
              height: geometry.height,
              left: (VIEW_W - geometry.width) / 2 + offset.x,
              top: (VIEW_H - geometry.height) / 2 + offset.y,
            }}
          />
          <div className="cropgrid" aria-hidden="true" />
        </div>
        <label className="cropslider">
          <span>Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
          <output>{Math.round(zoom * 100)}%</output>
        </label>
        <div className="cropactions">
          <button className="btn" onClick={() => onKeepOriginal({ kind: 'photo', name: source.name, dataUrl: source.dataUrl })}>Use original</button>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={saveCrop}>Use cropped image</button>
        </div>
      </div>
    </div>
  );
}
