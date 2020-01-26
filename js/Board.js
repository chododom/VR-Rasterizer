// Author: Matthew Anderson
// CSC 385 Computer Graphics
// Version: Winter 2020
// Project 1: Drawing board representation.

import * as THREE from '../extern/three.module.js';
import * as GUIVR from './GuiVR.js';
import * as RAS from './rasterizer.js';

// Constants for specifying drawing mode.
const Modes = {
    POINT_MODE: 0,
    LINE_MODE: 1,
    TRI_MODE: 2,
    FILL_MODE: 3,
    ANTI_MODE: 4,
    POLY_MODE: 5};
const MAX_POLY_SIDES = 7;

// Class for displaying and interacting with a drawing board in VR.
// Specialized THREE.Group.
export class Board extends GUIVR.GuiVR {

    // Creates a 15x15 drawing board with default settings.
    constructor(){
	super();

	this.n = 15; // Number of pixels in each dimension.
	this.stride = 15; // Size of each pixel in internal canvas.
	this.dim = this.n * this.stride + 1; // Size of internal canvas.
	
	// Create canvas that will display the output.
	this.ctx = document.createElement('canvas').getContext('2d');
	this.ctx.canvas.width = this.dim;
	this.ctx.canvas.height = this.dim;
	// Create texture from canvas.
	this.texture = new THREE.CanvasTexture(this.ctx.canvas);
	this.texture.magFilter = THREE.LinearFilter;
	this.texture.minFilter = THREE.LinearFilter;
	this.reset();
	// Create rectangular mesh textured with output that is displayed.
	var boardMaterial = new THREE.MeshBasicMaterial({map: this.texture});
	var c = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), boardMaterial);
	this.add(c);
	// Set the board's rectangle to collider as a gui element.
	this.collider = c;

	// Set the previously seen clicks, initial edit mode, and brush color.
	this.clicks = [];
	this.editMode = Modes.POINT_MODE;
	this.brushColor = new THREE.Vector3(255, 0, 0);

	// Set up the geometry to draw the tracer line.
	var guideGeometry = new THREE.BufferGeometry(); 
	var guidePositions = new Float32Array((MAX_POLY_SIDES + 1) * 3);
	guideGeometry.setAttribute('position', new THREE.BufferAttribute(guidePositions, 3));
	guideGeometry.setDrawRange(0,0);
	var guideMaterial = new THREE.LineBasicMaterial({color: 0x0000FF});
	this.guide = new THREE.Line(guideGeometry, guideMaterial);
	this.add(this.guide);

    	var loader = new THREE.FontLoader();
	var current = this;
	loader.load('../extern/fonts/helvetiker_bold.typeface.json', function (font){
	    var textGeo = new THREE.TextBufferGeometry("Chodounsky's Algorithm", {
		font: font,
		size: 0.15,
		height: 0.02,
		curveSegments: 3,
	    });
	    var textMaterial = new THREE.MeshPhongMaterial({color: 0x1C1D1D, specular: 0x000000});
	    var debug_mesh = new THREE.Mesh(textGeo, textMaterial);
	    debug_mesh.position.x = -1.15;
	    debug_mesh.position.y = 1.1;
	    debug_mesh.position.z = 0.01;
	    current.add(debug_mesh);
	});
	
    }

    // Getters and Setters.
    
    getHeight(){
	return n;
    }
    
    getWidth(){
	return n;
    }

    setRed(r){
	this.brushColor.x = r;
    }

    setGreen(g){
	this.brushColor.y = g;
    }
    
    setBlue(b){
	this.brushColor.z = b;
    }

    setMode(m){
	if (this.editMode != m){
	    this.editMode = m;
	    this.clicks = [];
	}
    }

    // Changes the color of the pixel at coordinates x, y to color c.
    // The parameters x and y are integers, and c is a THREE.Vector3
    // specifying a color.
    writePixel(x, y, c){
	this.ctx.fillStyle = "#" + (c.x * 256 * 256 + c.y * 256 + c.z).toString(16);
	this.ctx.fillRect(x * this.stride + 1, y * this.stride + 1, this.stride - 1, this.stride - 1);
	this.texture.needsUpdate = true;
    }

    // Resets the board to white in every pixel.
    reset(){
	var ctx = this.ctx;
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillStyle = '#FFFFFF';
	for (var r = 1; r < ctx.canvas.width; r += this.stride){
	    for (var c = 1; c < ctx.canvas.height; c += this.stride){
		ctx.fillRect(r, c, this.stride - 1, this.stride - 1);
	    }
	}
	this.texture.needsUpdate = true;
    }
    
    // Click hander.  
    collide(uv, pt){

	// Compute the pixel coordinate from uv texture coordinates.
	var pix = [Math.min(Math.max(Math.floor((uv.x * this.dim - 0.5) / this.stride),0), this.dim - 1),
		   this.n - 1 - Math.min(Math.max(Math.floor((uv.y * this.dim - 0.5) / this.stride),0), this.dim - 1)];
	
	// Reset the tracer if a new shape is being drawn.
	if (this.clicks.length == 0){
	    this.guide.geometry.setDrawRange(0,0);
	    this.guide.geometry.attributes.position.needsUpdate = true;
	}

	// Remember the current click.
	this.clicks.push(pix);
	
	// Update the tracer.
	var i = (this.clicks.length-1)*3;
	var pos = this.guide.geometry.attributes.position.array;
	var tempMatrix = new THREE.Matrix4();
	tempMatrix.getInverse(this.matrixWorld);
	pt.applyMatrix4(tempMatrix);
	pos[i++] = pt.x; pos[i++] = pt.y; pos[i++] = pt.z + 0.01;
	pos[i++] = pos[0]; pos[i++] = pos[1]; pos[i++] = pos[2];
	this.remove(this.guide);
	var guideGeometry = new THREE.BufferGeometry();
	guideGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	guideGeometry.setDrawRange(0,this.clicks.length+1);
	var guideMaterial = new THREE.LineBasicMaterial({color: 0x0000FF, linewidth: 4});
	this.guide = new THREE.Line(guideGeometry, guideMaterial);
	this.add(this.guide);

	// If enough clicks have been make for the current editing
	// mode call the appropriate function implemented in the
	// rasterizer.  If so, reset the clicks list back to empty for
	// the next drawing.
	if (this.editMode == Modes.POINT_MODE) {
	    RAS.rasterizePoint(this, this.clicks[0], this.brushColor);
	    this.clicks = [];
	    
	} else if ((this.editMode == Modes.LINE_MODE || this.editMode == Modes.ANTI_MODE)
		   && this.clicks.length == 2){
	    if (this.editMode == Modes.LINE_MODE)
		RAS.rasterizeLine(this, this.clicks[0], this.clicks[1], this.brushColor);
	    else
		RAS.rasterizeAntialiasLine(this, this.clicks[0], this.clicks[1], this.brushColor);
	    this.clicks = [];
	    
	} else if ((this.editMode == Modes.TRI_MODE || this.editMode == Modes.FILL_MODE)
		   && this.clicks.length == 3){
	    if (this.editMode == Modes.TRI_MODE)
		RAS.rasterizeTriangle(this, this.clicks[0], this.clicks[1], this.clicks[2], this.brushColor);
	    else
		RAS.rasterizeFilledTriangle(this, this.clicks[0], this.clicks[1], this.clicks[2], this.brushColor);
	    this.clicks = [];
	    
	} else if (this.editMode == Modes.POLY_MODE
		   && this.clicks.length == 7){
	    RAS.rasterizeFilledSevengon(this, this.clicks, this.brushColor);
	    this.clicks = [];
	}
	
    }

    
}
