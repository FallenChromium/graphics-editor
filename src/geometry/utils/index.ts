import type { LineSegment } from "@/geometry/line";
import { Arc, Graph, GraphNode } from "@/graph_theory";
import { Polygon } from "@/geometry/polygon"

export function radiansToDegrees(radians: number) {
    return Math.round(radians * 180 / Math.PI);
}

export function degreesToRadians(degrees: number) {
    return degrees * Math.PI / 180;
}

export function getLineSegmentSetIntersectionPoints(lineSegments: LineSegment[]) {
    const intersectionPoints = [];

    for (let lineSegmentIndex = 0; lineSegmentIndex < lineSegments.length; lineSegmentIndex++) {
        const lineSegment = lineSegments[lineSegmentIndex];
        for (let otherLineSegmentIndex = lineSegmentIndex + 1; otherLineSegmentIndex < lineSegments.length; otherLineSegmentIndex++) {
            const otherLineSegment = lineSegments[otherLineSegmentIndex];
            const currIntersectionPoint = lineSegment.intersectionPoint(otherLineSegment);
            if (currIntersectionPoint !== null) {
                intersectionPoints.push(currIntersectionPoint);
            }
        }
    }

    return intersectionPoints;
}

export function lineSegmentSetIsConnectedAndClosed(lineSegments: LineSegment[]) {
    return lineSegments.every(lineSegment => {
        let intersectionsWithOtherLineSegments = 0;
        lineSegments.forEach((otherLineSegment) => {
            if (lineSegment === otherLineSegment) {
                return;
            }
            if (lineSegment.intersects(otherLineSegment)) {
                intersectionsWithOtherLineSegments++;
            }
        });
        return intersectionsWithOtherLineSegments === 2;
    });
}

export function lineSegmentSetGraphIsConnected(lineSegments: LineSegment[]) {
    const intersectionPoints = getLineSegmentSetIntersectionPoints(lineSegments);
    const graphNodes = intersectionPoints.map(point => new GraphNode(point));
    const graphArcs = [];
    for (const lineSegment of lineSegments) {
        for (let intersectionPointIndex = 0; intersectionPointIndex < intersectionPoints.length; intersectionPointIndex++) {
            const intersectionPoint = intersectionPoints[intersectionPointIndex];
            for (let otherIntersectionPointIndex = intersectionPointIndex + 1; otherIntersectionPointIndex < intersectionPoints.length; otherIntersectionPointIndex++) {
                const otherIntersectionPoint = intersectionPoints[otherIntersectionPointIndex];
                if (lineSegment.containsPoint(intersectionPoint) && lineSegment.containsPoint(otherIntersectionPoint)) {
                    graphArcs.push(new Arc(graphNodes[intersectionPointIndex], graphNodes[otherIntersectionPointIndex], false));
                }
            }
        }
    }
    return (new Graph(graphNodes, graphArcs)).isConnected();
}

export function lineSegmentSetIsAPolygon(lineSegments: LineSegment[]) {
    return lineSegmentSetIsConnectedAndClosed(lineSegments) && lineSegmentSetGraphIsConnected(lineSegments);
}

function arrayOfSubarrays<T>(array: T[]): T[][] {
    return Array.from({ length: Math.pow(2, array.length) }, (_, index) =>
      array.filter((_, i) => (index >> i) & 1)
    );
  }

export function getPolygons(lineSegments: LineSegment[]) {
    const polygons: Polygon[] = [];

    const allLineSegmentSets = arrayOfSubarrays(lineSegments);
    const polygonCandidates = allLineSegmentSets.filter((lineSegmentSet) => lineSegmentSet.length >= 3);
    polygonCandidates.forEach((lineSegmentSet) => {
        if (lineSegmentSetIsAPolygon(lineSegmentSet)) {
            polygons.push(new Polygon(getLineSegmentSetIntersectionPoints(lineSegmentSet)));
        }
    })

    return polygons;
}