'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
    Pencil, Eraser, Circle, Minus, ArrowRight, Trash2, Undo2, Redo2,
    ChevronDown, ChevronUp, MousePointer2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type Tool = 'pen' | 'arrow' | 'line' | 'circle' | 'erase' | 'pointer';

interface DrawPath {
    id: string;
    tool: Tool;
    color: string;
    size: number;
    points: { x: number; y: number }[];
    /** Used for circle: { x: number; y: number } */
    center?: { x: number; y: number };
    radius?: number;
}

interface TacticsOverlayProps {
    /** When false the overlay shows nothing (and doesn't capture pointer events) */
    active: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COLORS = [
    '#ffffff', '#f87171', '#fb923c', '#facc15',
    '#4ade80', '#38bdf8', '#c084fc', '#f472b6',
];

const SIZES = [2, 4, 7, 12];

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

function relXY(e: React.PointerEvent, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
}

// ─── Drawing logic ────────────────────────────────────────────────────────────

function redrawAll(
    ctx: CanvasRenderingContext2D,
    paths: DrawPath[],
    current: DrawPath | null,
) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const p of [...paths, ...(current ? [current] : [])]) {
        drawPath(ctx, p);
    }
}

function drawPath(ctx: CanvasRenderingContext2D, p: DrawPath) {
    if (!p || !p.points || !p.points.length) return;
    ctx.save();
    ctx.strokeStyle = p.color;
    ctx.fillStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (p.tool === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = p.size * 6;
        ctx.beginPath();
        ctx.moveTo(p.points[0].x, p.points[0].y);
        for (const pt of p.points.slice(1)) ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
    } else if (p.tool === 'pen') {
        ctx.beginPath();
        ctx.moveTo(p.points[0].x, p.points[0].y);
        for (const pt of p.points.slice(1)) ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
    } else if (p.tool === 'line') {
        const last = p.points[p.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(p.points[0].x, p.points[0].y);
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
    } else if (p.tool === 'arrow') {
        const start = p.points[0];
        const end = p.points[p.points.length - 1];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = Math.min(24, p.size * 6);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - headLen * Math.cos(angle - Math.PI / 6),
            end.y - headLen * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
            end.x - headLen * Math.cos(angle + Math.PI / 6),
            end.y - headLen * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();
    } else if (p.tool === 'circle') {
        if (p.center && p.radius !== undefined) {
            ctx.beginPath();
            ctx.arc(p.center.x, p.center.y, p.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TacticsOverlay({ active }: TacticsOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState(COLORS[0]);
    const [size, setSize] = useState(SIZES[1]);
    const [paths, setPaths] = useState<DrawPath[]>([]);
    const [future, setFuture] = useState<DrawPath[][]>([]);
    const [toolbarOpen, setToolbarOpen] = useState(true);
    const [drawMode, setDrawMode] = useState(false); // pointer vs draw toggle

    const currentPath = useRef<DrawPath | null>(null);
    const isDrawing = useRef(false);

    // Resize canvas to fill container
    useEffect(() => {
        if (!active) return;
        const resizeObserver = new ResizeObserver(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            // Preserve drawings when resizing
            const backup = document.createElement('canvas');
            backup.width = canvas.width;
            backup.height = canvas.height;
            backup.getContext('2d')?.drawImage(canvas, 0, 0);

            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) redrawAll(ctx, paths, null);
        });
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [active, paths]);

    // Redraw when paths change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) redrawAll(ctx, paths, null);
    }, [paths]);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            if (!drawMode || tool === 'pointer') return;
            e.currentTarget.setPointerCapture(e.pointerId);
            isDrawing.current = true;

            const pos = relXY(e, e.currentTarget);
            const path: DrawPath = {
                id: uid(),
                tool,
                color,
                size,
                points: [pos],
                ...(tool === 'circle' ? { center: pos, radius: 0 } : {}),
            };
            currentPath.current = path;

            // Trigger live preview
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) redrawAll(ctx, paths, path);
        },
        [drawMode, tool, color, size, paths],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            if (!isDrawing.current || !currentPath.current) return;
            const pos = relXY(e, e.currentTarget);
            const p = currentPath.current;

            if (p.tool === 'circle') {
                const dx = pos.x - p.points[0].x;
                const dy = pos.y - p.points[0].y;
                currentPath.current = {
                    ...p,
                    center: p.points[0],
                    radius: Math.sqrt(dx * dx + dy * dy),
                    points: [p.points[0], pos],
                };
            } else if (p.tool === 'line' || p.tool === 'arrow') {
                currentPath.current = { ...p, points: [p.points[0], pos] };
            } else {
                currentPath.current = { ...p, points: [...p.points, pos] };
            }

            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) redrawAll(ctx, paths, currentPath.current);
        },
        [paths],
    );

    const onPointerUp = useCallback(() => {
        if (!isDrawing.current || !currentPath.current) return;
        isDrawing.current = false;

        // Capture before clearing — setPaths callback is asynchronous
        const completed = currentPath.current;
        currentPath.current = null;

        if (!completed || !completed.points.length) return;

        setPaths((prev) => {
            setFuture([]);
            return [...prev, completed];
        });
    }, []);

    const undo = useCallback(() => {
        setPaths((prev) => {
            if (!prev.length) return prev;
            const next = prev.slice(0, -1);
            setFuture((f) => [prev, ...f]);
            return next;
        });
    }, []);

    const redo = useCallback(() => {
        setFuture((f) => {
            if (!f.length) return f;
            const [next, ...rest] = f;
            setPaths(next);
            return rest;
        });
    }, []);

    const clear = useCallback(() => {
        setFuture((f) => [paths, ...f]);
        setPaths([]);
    }, [paths]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!active) return;
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if (e.key === 'Escape') setDrawMode(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [active, undo, redo]);

    if (!active) return null;

    return (
        <div ref={containerRef} className="absolute inset-0 z-10" style={{ pointerEvents: drawMode ? 'all' : 'none' }}>
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ cursor: drawMode && tool !== 'pointer' ? 'crosshair' : 'default', touchAction: 'none' }}
                width={containerRef.current?.offsetWidth ?? 800}
                height={containerRef.current?.offsetHeight ?? 600}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
            />

            {/* ── Toolbar ─────────────────────────────────────────────────────── */}
            <div
                className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 flex flex-col items-center gap-2"
                style={{ pointerEvents: 'all' }}
            >
                {/* Collapsed toggle */}
                <button
                    onClick={() => setToolbarOpen((v) => !v)}
                    className="bg-black/70 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg hover:bg-black/80 transition-colors"
                >
                    <Pencil className="w-3 h-3" />
                    Taktik Tahtası
                    {toolbarOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>

                {toolbarOpen && (
                    <div className="bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl flex flex-col gap-3 min-w-[280px]">

                        {/* Draw mode toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-white/60 text-xs font-medium">Çizim Modu</span>
                            <button
                                onClick={() => setDrawMode((v) => !v)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${drawMode ? 'bg-emerald-500' : 'bg-white/20'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${drawMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Tool row */}
                        <div className="flex items-center gap-1.5">
                            {[
                                { id: 'pointer' as Tool, icon: <MousePointer2 className="w-4 h-4" />, label: 'Seç' },
                                { id: 'pen' as Tool, icon: <Pencil className="w-4 h-4" />, label: 'Kalem' },
                                { id: 'line' as Tool, icon: <Minus className="w-4 h-4" />, label: 'Çizgi' },
                                { id: 'arrow' as Tool, icon: <ArrowRight className="w-4 h-4" />, label: 'Ok' },
                                { id: 'circle' as Tool, icon: <Circle className="w-4 h-4" />, label: 'Daire' },
                                { id: 'erase' as Tool, icon: <Eraser className="w-4 h-4" />, label: 'Sil' },
                            ].map(({ id, icon, label }) => (
                                <button
                                    key={id}
                                    title={label}
                                    onClick={() => { setTool(id); setDrawMode(true); }}
                                    className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${tool === id
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-110'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                        }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>

                        {/* Color row */}
                        <div className="flex items-center gap-1.5">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    title={c}
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-125' : 'border-white/30 hover:border-white/70'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        {/* Size row */}
                        <div className="flex items-center gap-2">
                            <span className="text-white/50 text-xs">Kalınlık</span>
                            <div className="flex items-center gap-2 flex-1">
                                {SIZES.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setSize(s)}
                                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${size === s ? 'bg-emerald-500' : 'bg-white/10 hover:bg-white/20'}`}
                                    >
                                        <div className="rounded-full bg-white" style={{ width: s + 2, height: s + 2 }} />
                                    </button>
                                ))}
                            </div>

                            {/* Undo / Redo / Clear */}
                            <div className="flex gap-1 ml-auto">
                                <button onClick={undo} disabled={!paths.length} title="Geri Al (Ctrl+Z)"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white disabled:opacity-30 transition-all">
                                    <Undo2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={redo} disabled={!future.length} title="Yeniden Yap (Ctrl+Y)"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white disabled:opacity-30 transition-all">
                                    <Redo2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={clear} disabled={!paths.length} title="Tümünü Temizle"
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 disabled:opacity-30 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Hint */}
                        {!drawMode && (
                            <p className="text-center text-white/40 text-xs">
                                Çizim modunu aç ya da bir araç seç
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
