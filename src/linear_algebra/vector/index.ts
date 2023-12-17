import { Point } from "@/geometry/point";
import { radiansToDegrees } from "@/geometry/utils";

export class Vector {

    private _x: number;
    private _y: number;
    private _z: number;

    constructor(startpoint: Point, endpoint: Point) {
        this._x = endpoint.x - startpoint.x;
        this._y = endpoint.y - startpoint.y;
        this._z = endpoint.z - startpoint.z;
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


    get modulus() {
        return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z);
    }

    get angleToXAxis() {
        const offsetAngleByPi = (this._x / this.modulus) < 0;

        const rawAngleInRadians = Math.atan(this._y / this._x);
        const actualAngleInRadians = rawAngleInRadians + (offsetAngleByPi ? Math.PI : 0);

        return Math.round(radiansToDegrees(actualAngleInRadians) + 360) % 360;
    }

    dotProduct(vector: Vector) {
        return (this._x * vector.x + this._y * vector.y + this._z * vector._z);
    }

    crossProduct(vector: Vector) {
        return new Vector(
            new Point(this._y * vector.z, this._z * vector.x, this._x * vector.y),
            new Point(this._z * vector.y, this._z * vector.y, this._y * vector.x)
        )
    }

    toNormalized() {
        return new Vector(
            new Point(0, 0, 0),
            new Point(
                this._x / this.modulus,
                this._y / this.modulus,
                this._z / this.modulus,
                1,
                false
            )
        );
    }

    orthogonalVector() { // z stays the same
        return new Vector(
            new Point(0, 0, 0),
            new Point(
                this._y,
                -this._x,
                this._z
            )
        );
    }
}
