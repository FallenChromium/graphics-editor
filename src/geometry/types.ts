import type { Point } from "./point";

export interface point {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface line {
    start: Point;
    end: Point;
    points: point[];
  }