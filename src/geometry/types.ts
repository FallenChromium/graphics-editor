export interface point {
    x: number;
    y: number;
}

export interface line {
    start: point;
    end: point;
    points: point[];
  }