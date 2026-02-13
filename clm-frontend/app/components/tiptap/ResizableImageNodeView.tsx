'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

type ImageAlign = 'left' | 'center' | 'right';

type ResizeHandle =
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | 'n'
  | 's'
  | 'w'
  | 'e';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getAlignStyles(align: ImageAlign) {
  if (align === 'left') return { marginLeft: 0, marginRight: 'auto' } as const;
  if (align === 'right') return { marginLeft: 'auto', marginRight: 0 } as const;
  return { marginLeft: 'auto', marginRight: 'auto' } as const;
}

export default function ResizableImageNodeView(props: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const attrs = props.node.attrs as {
    src?: string;
    alt?: string;
    title?: string;
    width?: string | null;
    align?: ImageAlign;
  };

  const align: ImageAlign = (attrs.align as ImageAlign) || 'center';
  const width = typeof attrs.width === 'string' ? attrs.width : null;

  const wrapperStyle = useMemo(() => {
    const base: React.CSSProperties = {
      display: 'block',
      width: width || 'fit-content',
      maxWidth: '100%',
      ...getAlignStyles(align),
      marginTop: '0.75rem',
      marginBottom: '0.75rem',
    };
    return base;
  }, [align, width]);

  const imgStyle = useMemo(() => {
    const base: React.CSSProperties = {
      maxWidth: '100%',
      height: 'auto',
      display: 'block',
      ...(width ? { width: '100%' } : null),
    };
    return base;
  }, [width]);

  const startResize = useCallback(
    (handle: ResizeHandle) =>
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const wrapperEl = wrapperRef.current;
        const imgEl = imgRef.current;
        if (!wrapperEl || !imgEl) return;

        const containerEl = wrapperEl.parentElement;
        const containerWidthPx = containerEl?.getBoundingClientRect().width || wrapperEl.getBoundingClientRect().width;
        if (!containerWidthPx || containerWidthPx <= 0) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startRect = imgEl.getBoundingClientRect();
        const startWidthPx = startRect.width;
        const startHeightPx = startRect.height;

        const isLeft = handle === 'nw' || handle === 'sw' || handle === 'w';
        const isRight = handle === 'ne' || handle === 'se' || handle === 'e';
        const isTop = handle === 'nw' || handle === 'ne' || handle === 'n';
        const isBottom = handle === 'sw' || handle === 'se' || handle === 's';

        const onMove = (ev: MouseEvent) => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;

          // Width driven resizing (primary). For corner handles, keep aspect ratio.
          let nextWidthPx = startWidthPx;
          if (isRight) nextWidthPx = startWidthPx + dx;
          if (isLeft) nextWidthPx = startWidthPx - dx;

          const keepAspect = handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se';
          if (keepAspect) {
            // Estimate via whichever delta is larger.
            const ratio = startWidthPx / Math.max(1, startHeightPx);
            const heightDrivenWidthPx = startWidthPx + (isBottom ? dy : -dy) * ratio;
            if (Math.abs(dy) > Math.abs(dx)) nextWidthPx = heightDrivenWidthPx;
          }

          const pct = clamp((nextWidthPx / containerWidthPx) * 100, 10, 100);
          props.updateAttributes({ width: `${Math.round(pct)}%` });
        };

        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      },
    [props]
  );

  const Handle = ({ pos }: { pos: ResizeHandle }) => {
    const base =
      'absolute w-3 h-3 rounded-sm bg-white border border-slate-300 shadow-sm';

    const style: React.CSSProperties =
      pos === 'nw'
        ? { left: -6, top: -6, cursor: 'nwse-resize' }
        : pos === 'ne'
          ? { right: -6, top: -6, cursor: 'nesw-resize' }
          : pos === 'sw'
            ? { left: -6, bottom: -6, cursor: 'nesw-resize' }
            : pos === 'se'
              ? { right: -6, bottom: -6, cursor: 'nwse-resize' }
              : pos === 'n'
                ? { left: '50%', top: -6, transform: 'translateX(-50%)', cursor: 'ns-resize' }
                : pos === 's'
                  ? { left: '50%', bottom: -6, transform: 'translateX(-50%)', cursor: 'ns-resize' }
                  : pos === 'w'
                    ? { left: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' }
                    : { right: -6, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' };

    return <div className={base} style={style} onMouseDown={startResize(pos)} />;
  };

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className="relative"
      data-align={align}
      data-width={width || undefined}
      style={wrapperStyle}
    >
      {/* Drag handle: lets users move the image within the document flow */}
      {props.selected ? (
        <div
          data-drag-handle
          contentEditable={false}
          className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center cursor-grab"
          title="Drag to move"
        >
          <div className="w-3 h-3 rounded bg-slate-300" />
        </div>
      ) : null}

      <img
        ref={imgRef}
        src={attrs.src || ''}
        alt={attrs.alt || ''}
        title={attrs.title || ''}
        style={imgStyle}
        draggable={true}
      />

      {props.selected ? (
        <div
          className="pointer-events-none absolute inset-0 rounded"
          style={{ outline: '2px solid rgba(59, 130, 246, 0.65)', outlineOffset: 2 }}
        />
      ) : null}

      {props.selected ? (
        <>
          {/* Handles must receive pointer events */}
          <div className="absolute inset-0 pointer-events-none" />
          <div className="pointer-events-auto">
            <Handle pos="nw" />
            <Handle pos="ne" />
            <Handle pos="sw" />
            <Handle pos="se" />
            <Handle pos="n" />
            <Handle pos="s" />
            <Handle pos="w" />
            <Handle pos="e" />
          </div>
        </>
      ) : null}
    </NodeViewWrapper>
  );
}
