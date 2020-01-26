// Author: Dominik Chodounsky
// CSC 385 Computer Graphics
// Version: Winter 2020

import {debugWrite} from './DebugConsole.js';

// All points are integer pixel coordinates

class Pixel{
    constructor(newX, newY){
        this.x = newX;
        this.y = newY;
    }
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

    let filledPixels = []

    while(true) {
        board.writePixel(x1, y1, color);
        filledPixels.push(new Pixel(x1, y1));

        if ((x1 === x2) && (y1 === y2)) break;
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
}


// Takes three points given as vec2 in pixel coordinates and a color
// given as vec3.  Draws triangle between the points of the color.
export function rasterizeTriangle(board, point1, point2, point3, color){
    debugWrite("rasterizeTriangle(" + point1.toString() + ", " + point2.toString() + ", " + point3.toString() + ")");
    let filledPixels = Array(rasterizeLine(board, point1, point2, color));
    filledPixels = filledPixels.concat(rasterizeLine(board, point2, point3, color));
    filledPixels = filledPixels.concat(rasterizeLine(board, point1, point3, color));
    print(filledPixels);
}

function floodFill(){

}

// Takes three points given as vec2 in pixel coordinates and a color
// as a vec3.  Draws a filled triangle between the points of the
// color. Implemented using flood fill.
export function rasterizeFilledTriangle(board, point1, point2, point3, color){  
    
}

// Takes an array of seven points given as vec2 in pixel coordinates
// and a color given as a vec3.  Draws a filled 7-gon between from the
// point of the color.  Implemented using inside-outside test.
export function rasterizeFilledSevengon(board, points, color){

    // Extra Credit: Implement me!

}


// Takes two points given as vec2 in pixel coordinates and a color
// given as vec3.  Draws an antialiased line between them of the
// color.
export function rasterizeAntialiasLine(board, point1, point2, color){

    // Extra Credit: Implement me!
    // Remember to cite any sources you reference.

}
