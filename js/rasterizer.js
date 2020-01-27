// Author: Dominik Chodounsky
// CSC 385 Computer Graphics
// Version: Winter 2020

import {debugWrite} from './DebugConsole.js';

// All points are integer pixel coordinates


// Class to represent a pixel in the board with its x and y coordinates
class Pixel{
    constructor(newX, newY){
        this.x = newX;
        this.y = newY;
    }

    toString(){
        return "[" + this.x.toString() + ", " + this.y.toString() + "]";
    }

    equal(other){
        return this.x == other.x && this.y == other.y;
    }
}


// Concatenates two arrays into one without duplicate values
function uniqueConcat(arr1, arr2){
    if(arr1 == undefined || arr2 == undefined) return undefined;

    let newArr = [];
    for(let i = 0; i < arr1.length; ++i) newArr.push(arr1[i]);

    let unique = true;
    for(let i = 0; i < arr2.length; ++i){
        unique = true;
        for(let j = 0; j < arr1.length; ++j){
            if(arr2[i].equal(arr1[j])){
                unique = false;
                break;
            }
        }
        if(unique) newArr.push(arr2[i]);
    }
    return newArr;
}


// Takes a point given as vec2 in pixel coordinates and a color given
// as vec3.  Changes the pixel that the point lies in to the color.
export function rasterizePoint(board, point, color){
    board.writePixel(point[0], point[1], color);
    debugWrite("writePixel(" + point[0].toString() + ", " + point[1].toString() + ")");
}

// Takes two points given as vec2 in pixel coordinates and a color
// given as vec3.  Draws line between the points of the color.
// Implemented using Bresenham's Algorithm.
// Inspired by Bresenham's algorithm Wikipedia page (pseudocode) at: https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
export function rasterizeLine(board, point1, point2, color){
    debugWrite("rasterizeLine(" + point1.toString() + ", " + point2.toString() + ")");
    let x1 = point1[0];
    let x2 = point2[0];
    let y1 = point1[1];
    let y2 = point2[1];

    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);

    let xDirection, yDirection;
    if(x1 < x2) xDirection = 1;
    else xDirection = -1;
    if(y1 < y2) yDirection = 1;
    else yDirection = -1;
    
    let err = dx - dy;

    var filledPixels = []

    while(true) {
        board.writePixel(x1, y1, color);
        filledPixels.push(new Pixel(x1, y1));
        if((x1 === x2) && (y1 === y2)) break;
        let e2 = 2 * err;
        if (e2 > -dy){ 
            err -= dy; 
            x1  += xDirection; 
        }
        if (e2 < dx){ 
            err += dx; 
            y1  += yDirection; 
        }
   }
   return filledPixels;
}


// Takes three points given as vec2 in pixel coordinates and a color
// given as vec3.  Draws triangle between the points of the color.
export function rasterizeTriangle(board, point1, point2, point3, color){
    debugWrite("rasterizeTriangle(" + point1.toString() + ", " + point2.toString() + ", " + point3.toString() + ")");
    var filledPixels = rasterizeLine(board, point1, point2, color);
    filledPixels = uniqueConcat(filledPixels, rasterizeLine(board, point2, point3, color));
    filledPixels = uniqueConcat(filledPixels, rasterizeLine(board, point1, point3, color));
    return filledPixels;
}

// Get all valid and immediate (north, south, west, east) neighbours of a pixel.
function getNeighbours(pix, boardSize){
    let neighbours = [];
    let correctedNeighbours = [];
    let x = pix.x;
    let y = pix.y;

    neighbours.push(new Pixel(x - 1, y));
    neighbours.push(new Pixel(x + 1, y));
    neighbours.push(new Pixel(x, y - 1));
    neighbours.push(new Pixel(x, y + 1));
    
    for(let i = 0; i < 4; ++i){
        if(neighbours[i].x < 0 || neighbours[i].x > boardSize - 1 || neighbours[i].y < 0 || neighbours[i].y > boardSize - 1){
            continue;
        }
        else {correctedNeighbours.push(new Pixel(neighbours[i].x, neighbours[i].y));}
    }
    return correctedNeighbours;
}

// Determines if an element is in a given array.
function elementInArray(x, arr){
    for(let i = 0; i < arr.length; ++i){
        if(x.x == arr[i].x && x.y == arr[i].y) return true;
    }
    return false;
}

// Returns dot product of two vectors.
function dot(vector1, vector2) {
    var result = 0;
    for (var i = 0; i < 3; i++) {
      result += vector1[i] * vector2[i];
    }
    return result;
}

// Returns cross product of two vectors.
function cross(a, b){
    return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
}

// Finds min of two numbers.
function min(a, b){
    return a >= b ? b : a;
}

// Finds max of two numbers.
function max(a, b){
    return a < b ? b : a;
}

// Odd even test to find out if a point is inside or outside of given polygon of n vertices.
// Algortihm inspired by source: http://www.eecs.umich.edu/courses/eecs380/HANDOUTS/PROJ2/InsidePoly.html
function oddEven(polygon, n, p){
    let cnt = 0;

    let p1 = polygon[0];
    for(let i = 0; i <= n; ++i){
        let p2 = polygon[i % n];
        if(p.y > min(p1[1], p2[1])){
            if(p.y <= max(p1[1], p2[1])){
                if(p.x <= max(p1[0], p2[0])){
                    if(p1[1] != p2[1]){
                        let xIntersect = (p.y - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]) + p1[0];
                        if(p1[0] == p2[0] || p.x <= xIntersect) ++cnt;
                    }
                }
            }
        }
        p1 = p2;
    }

    if(cnt % 2 == 0) return 0;
    else return 1;
}

// Recursive BFS style algorithm to fill inside of polygon given by its vertices.
function floodFill(a, color, board, vertices, first){
    if(/*insideTriangle(a, vertices)*/ oddEven(vertices, vertices.length, a)){
        if(!elementInArray(a, flooded) || first){
            if(!first) {
                board.writePixel(a.x, a.y, color);
                flooded.push(new Pixel(a.x, a.y));
            }

            let neighbours = getNeighbours(a, board.n);
            for(let i = 0; i < neighbours.length; ++i){
                floodFill(neighbours[i], color, board, vertices, false);
            }
        }
    }
}

// Finds out if points are on the same side of a line.
function sameSide(p1, p2, a, b){
    // vectors
    let ab = [b[0] - a[0], b[1] - a[1], 0];
    let ap1 = [p1.x - a[0], p1.y - a[1], 0];
    let ap2 = [p2[0] - a[0], p2[1] - a[1], 0];

    // normal vectors
    let cp1 = cross(ab, ap1);
    let cp2 = cross(ab, ap2);
    if(dot(cp1, cp2) >= 0) return true;
    else return false;
}

// Determines wheather or not a point is inside a given triangle.
function insideTriangle(p, vertices){
    if(sameSide(p, vertices[0], vertices[1], vertices[2]) && sameSide(p, vertices[1], vertices[0], vertices[2]) && sameSide(p, vertices[2], vertices[0], vertices[1])) return true;
    else return false;
}

var flooded = [];

// Takes three points given as vec2 in pixel coordinates and a color
// as a vec3. Draws a filled triangle between the points of the
// color. Implemented using flood fill.
export function rasterizeFilledTriangle(board, point1, point2, point3, color){ 
    debugWrite("rasterizeFilledTriangle(" + point1.toString() + ", " + point2.toString() + ", " + point3.toString() + ")");
 
    let filledPixels = rasterizeTriangle(board, point1, point2, point3, color);
    flooded = [];
    for(let i = 0; i < filledPixels.length; ++i){
        flooded.push(new Pixel(filledPixels[i].x, filledPixels[i].y));
    }

    for(let i = 0; i < filledPixels.length; ++i){
        floodFill(filledPixels[i], color, board, [point1, point2, point3], true);
    }
}


// Takes two points given as vec2 in pixel coordinates and a color
// given as vec3.  Draws an antialiased line between them of the
// color.
export function rasterizeAntialiasLine(board, point1, point2, color){

    // Extra Credit: Implement me!
    // Remember to cite any sources you reference.

}

// Takes an array of seven points given as vec2 in pixel coordinates
// and a color given as a vec3.  Draws a filled 7-gon between from the
// point of the color.  Implemented using inside-outside test.
export function rasterizeFilledSevengon(board, points, color){
    debugWrite("rasterizeFilledSevengon(" + points.toString() +")");

    var filledPixels = rasterizeLine(board, points[points.length - 1], points[0], color);
    for(let i = 0; i < points.length - 1; ++i){
        filledPixels = uniqueConcat(filledPixels, rasterizeLine(board, points[i], points[i + 1], color));
    }

    for(let i = 0; i < filledPixels.length; ++i){
        floodFill(filledPixels[i], color, board, points, true);
    }
}

