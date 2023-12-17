import { Point } from "@/geometry/point";
import { Vector } from "@/linear_algebra/vector";
import { LineSegment } from "../line";
import { getLineSegmentSetIntersectionPoints } from "../utils";
import { Stack } from "@/utils";

export class Polygon {
    _filledIn = false;
    _fillMethodId = 0;
    _filledFromPoint = null;

    private _vertices: Point[];
    constructor(vertices: Point[]) {
        this._vertices = vertices.map(vertex => new Point(vertex.x, vertex.y, vertex.z));
    }

    get vertices() { return this._vertices; }
    get filledIn() { return this._filledIn; }
    get fillMethodId() { return this._fillMethodId; }
    get filledFromPoint() { return this._filledFromPoint; }

    // This function essentially implements the Graham's scan algorithm for finding the convex hull of a set of points, 
    // and then constructs the line segments of the polygon from the vertices of the convex hull.
    get constituentLineSegments() {
        const constituentLineSegments: LineSegment[] = [];

        // sorts the vertices of the polygon in ascending order of their y-coordinates, and in case of a tie, by their x-coordinates.
        const sortedVertices = this._vertices.toSorted((p1, p2) => (p1.y - p2.y) || (p1.x - p2.x));
        // The sorted vertices are then divided into two groups: `extremeVertex` (the vertex with the smallest y-coordinate, 
        // and in case of a tie, the smallest x-coordinate) and `otherVertices` (all the remaining vertices)
        const [extremeVertex, otherVertices] = [sortedVertices[0], sortedVertices.slice(1)];
        // The `otherVertices` are then sorted based on the angle they make with the x-axis 
        // when connected to the `extremeVertex`, and in case of a tie, by their distance from the `extremeVertex`. 
        // This is done using the `Vector` class to represent the vectors from `extremeVertex` to each of the `otherVertices`.
        otherVertices.sort((p1, p2) => {
            const vectorToP1 = new Vector(extremeVertex, p1);
            const vectorToP2 = new Vector(extremeVertex, p2);
            return (vectorToP1.angleToXAxis - vectorToP2.angleToXAxis) || (vectorToP1.modulus - vectorToP2.modulus);
        });
        // A stack `verticesStack` is created and the `extremeVertex` and the first vertex from the sorted `otherVertices` are pushed onto the stack.
        const verticesStack = new Stack<Point>();
        verticesStack.push(extremeVertex);
        verticesStack.push(otherVertices[0]);
        otherVertices.forEach((vertex, index) => {
            if (index === 0) { // skip first point
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
    // TODO: methodId refactoring
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