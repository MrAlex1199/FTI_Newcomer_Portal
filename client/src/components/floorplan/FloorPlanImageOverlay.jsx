import React, { useEffect, useRef } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';

export default function FloorPlanImageOverlay({
  config = {},
  onChange,
  isSelected = false,
  onSelect,
}) {
  const {
    url,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    opacity = 0.5,
    locked = true,
    visible = true,
    rotation = 0,
  } = config;

  const [image, status] = useImage(url || '', 'anonymous');
  const imageRef = useRef(null);
  const trRef = useRef(null);

  // Auto-fit initial dimensions if width/height are not set yet
  useEffect(() => {
    if (image && (!width || !height || width === 0) && onChange) {
      const imgW = image.width || 800;
      const imgH = image.height || 600;
      // Proportional fit within 1800 x 1200
      const maxW = 1800;
      const maxH = 1200;
      const scale = Math.min(maxW / imgW, maxH / imgH, 1.2);
      onChange({
        ...config,
        width: Math.round(imgW * scale),
        height: Math.round(imgH * scale),
        x: x || 50,
        y: y || 50,
      });
    }
  }, [image, width, height]);

  // Connect transformer if selected and not locked
  useEffect(() => {
    if (isSelected && !locked && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, locked]);

  if (!url || !visible || status !== 'loaded' || !image) {
    return null;
  }

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={x}
        y={y}
        width={width || image.width}
        height={height || image.height}
        opacity={Math.max(0.05, Math.min(1, opacity))}
        rotation={rotation}
        draggable={!locked}
        onClick={(e) => {
          if (!locked) {
            e.cancelBubble = true;
            onSelect?.();
          }
        }}
        onTap={(e) => {
          if (!locked) {
            e.cancelBubble = true;
            onSelect?.();
          }
        }}
        onDragEnd={(e) => {
          if (locked) return;
          onChange?.({
            ...config,
            x: Math.round(e.target.x()),
            y: Math.round(e.target.y()),
          });
        }}
        onTransformEnd={() => {
          if (locked || !imageRef.current) return;
          const node = imageRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);

          onChange?.({
            ...config,
            x: Math.round(node.x()),
            y: Math.round(node.y()),
            width: Math.max(50, Math.round(node.width() * scaleX)),
            height: Math.max(50, Math.round(node.height() * scaleY)),
            rotation: Math.round(node.rotation()),
          });
        }}
      />
      {isSelected && !locked && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50 || newBox.height < 50) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
