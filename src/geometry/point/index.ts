import { Vector } from '@/linear_algebra/vector'
import type { Line } from '@/geometry/line';
import type { Matrix } from '@/linear_algebra/matrix';

export class Point {

    _x: number;
    _y: number;
    _z: number;
    _w: number;

    constructor(x: number, y: number, z = 0, w = 1, truncCoordinates = true) {
        [this._x, this._y, this._z, this._w] = [x, y, z, w].map(coord => truncCoordinates ? Math.trunc(coord) : coord);
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get z() {
        return this._z;
    }

    get w() {
        return this._w;
    }

    statucdistanceToPoint(point: Point) {
        return new Vector(this, point).modulus;
    }

    move(vector: Vector, scale = 1) {
        return new Point(
            this._x + vector.x * scale,
            this._y + vector.y * scale,
            this._z + vector.z * scale
        );
    }

    reflect(point: Point) {
        return this.move(new Vector(this, point), 2);
    }

    reflectAlongLine(line: Line) {
        return this.reflect(line.closestOwnPointToPoint(this));
    }

    distanceToPoint(point: Point) {
        return new Vector(this, point).modulus;
    }

    applyMatrix(matrix: Matrix) { // matrix has to be 4x4!
        return new Point(
            this._x * matrix.getElementAt(1, 1) + this._y * matrix.getElementAt(1, 2) + this._z * matrix.getElementAt(1, 3) + this._w * matrix.getElementAt(1, 4),
            this._x * matrix.getElementAt(2, 1) + this._y * matrix.getElementAt(2, 2) + this._z * matrix.getElementAt(2, 3) + this._w * matrix.getElementAt(2, 4),
            this._x * matrix.getElementAt(3, 1) + this._y * matrix.getElementAt(3, 2) + this._z * matrix.getElementAt(3, 3) + this._w * matrix.getElementAt(3, 4),
            this._x * matrix.getElementAt(4, 1) + this._y * matrix.getElementAt(4, 2) + this._z * matrix.getElementAt(4, 3) + this._w * matrix.getElementAt(4, 4)
        );
    }
}