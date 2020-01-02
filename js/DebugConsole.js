// Author: Matthew Anderson
// CSC 385 Computer Graphics
// Version: Winter 2020
// Project 1: DebugConsole.
// Debug tool, displays text outputs as GuiVR object.

import * as THREE from '../extern/three.module.js';
import * as GUIVR from './GuiVR.js';

// Constants determining size of text and window.
const NUM_LINES = 13;
const FONT_SIZE = 30;

const debugConsoles = [];
var debugOutput = "";

// Writes msg to all active DebugConsoles.  Scrolls if lines more than
// NUM_LINES.  Overlong lines are cropped when displayed.
export function debugWrite(msg){
    debugOutput += msg + "\n";
    
    // Determine the lines of text that appear.
    var lines = debugOutput.split('\n');
    lines = lines.slice(-NUM_LINES-1, -1);
    debugOutput = lines.join("\n") + "\n";

    // Update the display of all DebugConsoles.
    for (var i = 0; i < debugConsoles.length; i++){
	debugConsoles[i].updateTexture();
    }
}

// Class for displaying debug text in VR.  Specialized THREE.Group.
export class DebugConsole extends GUIVR.GuiVR {

    // Creates a new instance with the specified width in world units.
    constructor(w){
	super();

	// Determine world dimensions of consoles.
	this.w = w;
	this.h = 0.14 * NUM_LINES;

	// Create canvas that will display the output.
	this.ctx = document.createElement('canvas').getContext('2d');
	this.ctx.canvas.width = 512;
	this.ctx.canvas.height = 512;
	// Create texture from canvas.
	this.texture = new THREE.CanvasTexture(this.ctx.canvas);
	this.texture.magFilter = THREE.LinearFilter;
	this.texture.minFilter = THREE.LinearFilter;
	this.updateTexture();
	// Create rectangular mesh textured with output that is displayed.
	var c = new THREE.Mesh(new THREE.PlaneBufferGeometry(this.w, this.h),
			       new THREE.MeshBasicMaterial({map: this.texture}));
	this.add(c);
	// Set the console's rectangle to collider as a gui element.
	this.collider = c;

	// Make a fancy 3D label "Console" at the top.
    	var loader = new THREE.FontLoader();
	var current = this;
	loader.load( '../extern/fonts/helvetiker_bold.typeface.json', function ( font ) {
	    var textGeo = new THREE.TextBufferGeometry( "Console", {
		font: font,
		size: 0.1,
		height: 0.02,
		curveSegments: 3,
	    } );
	    var textMaterial = new THREE.MeshPhongMaterial( { color: 0xad7fa8, specular: 0x111111 } );
	    var debug_mesh = new THREE.Mesh( textGeo, textMaterial );
	    debug_mesh.position.x = -current.w / 2 + 0.02;
	    debug_mesh.position.y = current.h / 2 + 0.03;
	    debug_mesh.position.z = 0.01;
	    current.add(debug_mesh);
	});

	// Register in a list of all the debugConsoles created so that
	// new output can be mirrored to all.
	debugConsoles.push(this);
    }

    // Update the texture of this board to match the current debugOutput.
    updateTexture(){
	var ctx = this.ctx;
	// Clear the canvas.
	ctx.fillStyle = '#AA00AA';
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillStyle = '#AAAAAA';
	ctx.fillRect(2, 2, ctx.canvas.width-4, ctx.canvas.height-4);
	// Display the output.
	ctx.fillStyle = '#000000';
	ctx.font = "bold " + FONT_SIZE.toString() + "px Courier";
	var lines = debugOutput.split('\n');
	for (var i = 0; i < lines.length; i++){
	    ctx.fillText(lines[i], 15, FONT_SIZE + FONT_SIZE * 1.25 * i);
	}
	// Force the renderer to update the texture.
	this.texture.needsUpdate = true;
    }

    // Click handler, resets all DebugConsoles.
    collide(uv, pt){
	this.clear();
    }

    // Resets all DebugConsoles.
    clear(){
	// Empty debugOutput.
	debugOutput = "";
	// Update the display of all DebugConsoles.
	for (var i = 0; i < debugConsoles.length; i++){
	    debugConsoles[i].updateTexture();
	}

    }
    
}
