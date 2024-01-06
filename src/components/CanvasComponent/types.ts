import { Point } from "@/geometry/point";
import { degreesToRadians, getLineSegmentSetIntersectionPoints } from "@/geometry/utils";
import { Matrix } from "@/linear_algebra/matrix";
import { Vector } from "@/linear_algebra/vector";
import { Stack } from "@/utils";
import { LineSegment } from "@/geometry/line"
export interface CanvasCallback { event: string; callback: (((event: MouseEvent) => void) | ((event: KeyboardEvent) => void)) }

export class HermiteCurve {
    _referencePoints: Point[];
    _R1: Vector;
    _R4: Vector;
    constructor(referencePoints: Point[], R1: Point, R4: Point) {
        this._referencePoints = [...referencePoints];
        this._R1 = new Vector(new Point(0, 0, 0), new Point(R1.x, R1.y, R1.z));
        this._R4 = new Vector(new Point(0, 0, 0), new Point(R4.x, R4.y, R4.z));
    }

    get P1() { return this._referencePoints[0]; }
    get P4() { return this._referencePoints[1]; }
    get R1() { return new Vector(new Point(0, 0, 0), new Point(this._R1.x, this._R1.y, this._R1.z)); }
    get R4() { return new Vector(new Point(0, 0, 0), new Point(this._R4.x, this._R4.y, this._R4.z)); }
    get referencePoints() { return [...this._referencePoints]; }
    get endpoints() { return [this.referencePoints[0], this.referencePoints[1]]; }

    setReferencePoint(point: Point, index: number) {
        this._referencePoints.splice(index, 1, new Point(point.x, point.y, point.z));
    }
}

export class BezierCurve {
    _referencePoints: Point[];
    constructor(referencePoints: Point[]) {
        this._referencePoints = [...referencePoints];
    }

    get P1() { return this._referencePoints[0]; }
    get P2() { return this._referencePoints[1]; }
    get P3() { return this._referencePoints[2]; }
    get P4() { return this._referencePoints[3]; }
    get referencePoints() { return [...this._referencePoints]; }
    get endpoints() { return [this._referencePoints[0], this._referencePoints[3]]; }

    setReferencePoint(point: Point, index: number) {
        this._referencePoints.splice(index, 1, new Point(point.x, point.y, point.z));
    }
}

export class BSpline {
    _referencePoints: Point[];
    constructor(points: Point[]) {
        this._referencePoints = points.map(point => new Point(point.x, point.y, point.z));
    }

    get referencePoints() { return this._referencePoints; }
    get endpoints() { return [this._referencePoints[0], this._referencePoints[3]]; }

    setReferencePoint(point: Point, index: number) {
        this._referencePoints.splice(index, 1, new Point(point.x, point.y, point.z));
    }
}

export class Polygon {
    _filledIn = false;
    _fillMethodId = 0;
    _filledFromPoint = null;
    _vertices: Point[];

    constructor(vertices: Point[]) {
        this._vertices = vertices.map(vertex => new Point(vertex.x, vertex.y, vertex.z));
    }

    get vertices() { return this._vertices; }
    get filledIn() { return this._filledIn; }
    get fillMethodId() { return this._fillMethodId; }
    get filledFromPoint() { return this._filledFromPoint; }
    get constituentLineSegments() {
        const constituentLineSegments: LineSegment[] = [];

        const sortedVertices = this._vertices.toSorted((p1, p2) => (p1.y - p2.y) || (p1.x - p2.x));
        const [extremeVertex, otherVertices] = [sortedVertices[0], sortedVertices.slice(1)];
        otherVertices.sort((p1, p2) => {
            const vectorToP1 = new Vector(extremeVertex, p1);
            const vectorToP2 = new Vector(extremeVertex, p2);
            return (vectorToP1.angleToXAxis - vectorToP2.angleToXAxis) || (vectorToP1.modulus - vectorToP2.modulus);
        });

        const verticesStack = new Stack<Point>();
        verticesStack.push(extremeVertex);
        verticesStack.push(otherVertices[0]);
        otherVertices.forEach((vertex, index) => {
            if (index === 0) { // already in stack
                return;
            }
            const lastPoint = verticesStack.pop()!;
            const secondToLastPoint = verticesStack.pop()!;
            verticesStack.push(vertex);
            const vector1 = new Vector(secondToLastPoint, lastPoint);
            const vector2 = new Vector(lastPoint, vertex);
            if (vector1.angleToXAxis > vector2.angleToXAxis) {
                verticesStack.pop();
            }
        });

        const verticesArray: Point[] = [];
        while (!verticesStack.empty) verticesArray.push(verticesStack.pop()!);
        verticesArray.forEach((vertex, index) => {
            if (index === verticesArray.length - 1) {
                constituentLineSegments.push(new LineSegment(vertex, verticesArray[0]));
            } else {
                constituentLineSegments.push(new LineSegment(vertex, verticesArray[index + 1]));
            }
        });

        return constituentLineSegments;
    }

    fill(methodId: number, point = null) {
        this._filledIn = true;
        this._fillMethodId = methodId;
        this._filledFromPoint = point;
    }

    containsPoint(point: Point) {
        const helperLineSegment = new LineSegment(new Point(0, 10000), point);
        return getLineSegmentSetIntersectionPoints([
            helperLineSegment,
            ...this.constituentLineSegments
        ]).length % 2 === 1; 
    }

    get highestY() {
        return this.vertices.reduce((highestY, vertex) => vertex.y > highestY ? vertex.y : highestY, -Infinity);
    }

    get lowestY() {
        return this.vertices.reduce((lowestY, vertex) => vertex.y < lowestY ? vertex.y : lowestY, Infinity);
    }

    get leftmostX() {
        return this.vertices.reduce((leftmostX, vertex) => vertex.x < leftmostX ? vertex.x : leftmostX, Infinity);
    }

    get rightmostX() {
        return this.vertices.reduce((rightmostX, vertex) => vertex.x > rightmostX ? vertex.x : rightmostX, -Infinity);
    }
}

export class Cube {
    _sideLength: number;
    _rotX: number;
    _rotY: number;
    _rotZ: number;
    constructor(sideLength: number, rotX = 0, rotY = 0, rotZ = 0) {
        this._sideLength = sideLength;
        this._rotX = rotX;
        this._rotY = rotY;
        this._rotZ = rotZ;
    }

    _getXRotationMatrix(negatedSine = false) {
        const rotationMatrix = new Matrix(4, 4);
        const rotationInRadians = degreesToRadians(-this._rotX);
        const sin = Math.sin(rotationInRadians);
        const cos = Math.cos(rotationInRadians);
        const sineCoef = negatedSine ? -1 : 1;
        rotationMatrix.setElements([
            [1, 0, 0, 0],
            [0, cos, sin * sineCoef, 0],
            [0, -sin * sineCoef, cos, 0],
            [0, 0, 0, 1]
        ]);
        return rotationMatrix;
    }

    _getYRotationMatrix(negatedSine = false) {
        const rotationMatrix = new Matrix(4, 4);
        const rotationInRadians = degreesToRadians(-this._rotY);
        const sin = Math.sin(rotationInRadians);
        const cos = Math.cos(rotationInRadians);
        const sineCoef = negatedSine ? -1 : 1;
        rotationMatrix.setElements([
            [cos, 0, sin * sineCoef, 0],
            [0, 1, 0, 0],
            [-sin * sineCoef, 0, cos, 0],
            [0, 0, 0, 1]
        ]);
        return rotationMatrix;
    }

    _getZRotationMatrix(negatedSine = false) {
        const rotationMatrix = new Matrix(4, 4);
        const rotationInRadians = degreesToRadians(-this._rotZ);
        const sin = Math.sin(rotationInRadians);
        const cos = Math.cos(rotationInRadians);
        const sineCoef = negatedSine ? -1 : 1;
        rotationMatrix.setElements([
            [cos, sin * sineCoef, 0, 0],
            [-sin * sineCoef, cos, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ]);
        return rotationMatrix;
    }

    _getCombinedRotationMatrix(negated = false) {
        return this._getXRotationMatrix(negated)
            .multiply(this._getYRotationMatrix(negated))
            .multiply(this._getZRotationMatrix(negated));
    }

    get _bodyMatrix() {
        const rawBodyMatrix = new Matrix(6, 4);
        const neg = -1 * this._sideLength / 2;
        rawBodyMatrix.setElements([
            [-1, 0, 0, -neg],
            [1, 0, 0, -neg],
            [0, -1, 0, -neg],
            [0, 1, 0, -neg],
            [0, 0, -1, -neg],
            [0, 0, 1, -neg]
        ]);
        return rawBodyMatrix.multiply(this._getCombinedRotationMatrix());
    }

    get _rawVertices() {
        const originOffset = this._sideLength / 2;
        return [
            new Point(originOffset, originOffset, originOffset),
            new Point(originOffset, originOffset, -originOffset),
            new Point(originOffset, -originOffset, originOffset),
            new Point(originOffset, -originOffset, -originOffset),
            new Point(-originOffset, originOffset, originOffset),
            new Point(-originOffset, originOffset, -originOffset),
            new Point(-originOffset, -originOffset, originOffset),
            new Point(-originOffset, -originOffset, -originOffset)
        ]
    }

    get _faces() {
        const rawVertices = this._rawVertices;
        return [
            new Polygon(rawVertices.filter(vertex => vertex.x > 0).map(point => point.applyMatrix(this._getCombinedRotationMatrix(true)))),
            new Polygon(rawVertices.filter(vertex => vertex.x < 0).map(point => point.applyMatrix(this._getCombinedRotationMatrix(true)))),
            new Polygon(rawVertices.filter(vertex => vertex.y > 0).map(point => point.applyMatrix(this._getCombinedRotationMatrix(true)))),
            new Polygon(rawVertices.filter(vertex => vertex.y < 0).map(point => point.applyMatrix(this._getCombinedRotationMatrix(true)))),
            new Polygon(rawVertices.filter(vertex => vertex.z > 0).map(point => point.applyMatrix(this._getCombinedRotationMatrix(true)))),
            new Polygon(rawVertices.filter(vertex => vertex.z < 0).map(point => point.applyMatrix(this._getCombinedRotationMatrix(true))))
        ];
    }

    getFaces(hideInvisible = false, spectatorViewDirection = new Vector(new Point(0, 0, 0), new Point(0, 0, -1))) {
        if (!hideInvisible) {
            return this._faces;
        }
        return this._faces
            .filter((face, index) => {
                const currFace = this._bodyMatrix.getRowAt(index + 1);
                const currFaceNormalVector = new Vector(
                    new Point(0, 0, 0),
                    new Point(
                        currFace[0],
                        currFace[1],
                        currFace[2],
                        1,
                        false
                    ));
                return currFaceNormalVector.dotProduct(spectatorViewDirection) > 0;
            });
    }
}

export { LineSegment };
