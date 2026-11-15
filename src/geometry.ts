import { SketcherError } from "./diagnostics.js";

export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface Rect extends Point {
  readonly width: number;
  readonly height: number;
}
export interface AffineTransform {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}
export const IDENTITY_TRANSFORM: AffineTransform = Object.freeze({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0,
});

export function transformPoint(point: Point, matrix: AffineTransform): Point {
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.e,
    y: matrix.b * point.x + matrix.d * point.y + matrix.f,
  };
}

export function distanceToSegment(
  point: Point,
  first: Point,
  second: Point,
): number {
  const dx = second.x - first.x,
    dy = second.y - first.y;
  const length2 = dx * dx + dy * dy;
  const t =
    length2 === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - first.x) * dx + (point.y - first.y) * dy) / length2,
          ),
        );
  return Math.hypot(point.x - first.x - t * dx, point.y - first.y - t * dy);
}

export function rectPoints(box: Rect): readonly Point[] {
  return [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];
}

export function insidePolygon(point: Point, points: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i]!,
      b = points[j]!;
    if (distanceToSegment(point, a, b) < 1e-7) return true;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

export function distanceToPolygon(
  point: Point,
  points: readonly Point[],
): number {
  if (insidePolygon(point, points)) return 0;
  return Math.min(
    ...points.map((p, i) =>
      distanceToSegment(point, p, points[(i + 1) % points.length]!),
    ),
  );
}

export function expandRect(box: Rect, padding: number): Rect {
  return {
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + 2 * padding,
    height: box.height + 2 * padding,
  };
}

export function unionRects(boxes: readonly Rect[]): Rect {
  if (!boxes.length) return { x: -12, y: -12, width: 24, height: 24 };
  const left = Math.min(...boxes.map((b) => b.x)),
    top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width)),
    bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

export function validateViewportTransform(matrix: AffineTransform): void {
  if (
    ![matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].every(
      Number.isFinite,
    ) ||
    matrix.a * matrix.d - matrix.b * matrix.c <= 0
  ) {
    throw new SketcherError(
      "unsupported-feature",
      "The viewport must have a finite, orientation-preserving transform.",
    );
  }
}
