import * as THREE from '../extern/three.module.js';
import * as GUIVR from './GuiVR.js';
import * as RAS from './rasterizer.js';

// Constants for drawing mode
const Modes = {
    POINT_MODE: 0,
    LINE_MODE: 1,
    TRI_MODE: 2,
    FILL_MODE: 3,
    ANTI_MODE: 4,
    POLY_MODE: 5};

const MAX_POLY_SIDES = 7;

export class Board extends GUIVR.GuiVR {

    constructor(){
	super();
	this.n = 15;
	this.stride = 15;
	this.dim = this.n * this.stride + 1;

	this.ctx = document.createElement('canvas').getContext('2d');
	this.ctx.canvas.width = this.dim;
	this.ctx.canvas.height = this.dim;
	this.texture = new THREE.CanvasTexture(this.ctx.canvas);
	this.texture.magFilter = THREE.LinearFilter;
	this.texture.minFilter = THREE.LinearFilter;
	this.reset();

	var board_mat = new THREE.MeshBasicMaterial({map: this.texture});
	this.board = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), board_mat);
	this.collider = this.board;
	this.add(this.board);
	this.clicks = [];
	this.edit_mode = Modes.POINT_MODE;
	this.brush_color = [255, 0, 0];

	var guide_geo = new THREE.BufferGeometry(); // XXX - Local transform problem.
	var guide_pos = new Float32Array((MAX_POLY_SIDES + 1) * 3);
	guide_geo.setAttribute('position', new THREE.BufferAttribute(guide_pos, 3));
	guide_geo.setDrawRange(0,0);
	var guide_mat = new THREE.LineBasicMaterial({color: 0x0000FF});
	this.guide = new THREE.Line(guide_geo, guide_mat);
	this.add(this.guide);
    }

    getHeight(){
	return n;
    }
    
    getWidth(){
	return n;
    }

    setRed(r){
	this.brush_color[0] = r;
    }

    setGreen(g){
	this.brush_color[1] = g;
    }
    
    setBlue(b){
	this.brush_color[2] = b;
    }

    setMode(m){
	if (this.edit_mode != m){
	    this.edit_mode = m;
	    this.clicks = [];
	}
    }
	
    writePixel(x, y, c){
	this.ctx.fillStyle = "#" + (c[0] * 256 * 256 + c[1] * 256 + c[2]).toString(16);
	this.ctx.fillRect(y*this.stride + 1, (this.n - x - 1) * this.stride + 1, this.stride - 1, this.stride - 1);
	this.texture.needsUpdate = true;
    }

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
    

    collide(uv, pt){

	var pix = this._uvToPix(uv);
	if (this.clicks.length == 0){
	    this.guide.geometry.setDrawRange(0,0);
	    this.guide.geometry.attributes.position.needsUpdate = true;
	}
	
	var i = (this.clicks.length)*3;
	this.clicks.push(pix);
	var pos = this.guide.geometry.attributes.position.array;
	pos[i++] = pt.x; pos[i++] = pt.y - 1.6; pos[i++] = pt.z + 2.01;  // XXX - this is a hack.  Need to compute from board transform.
	pos[i++] = pos[0]; pos[i++] = pos[1]; pos[i++] = pos[2];
	this.remove(this.guide);
	var guide_geo = new THREE.BufferGeometry();
	guide_geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	guide_geo.setDrawRange(0,this.clicks.length+1);
	var guide_mat = new THREE.LineBasicMaterial({color: 0x0000FF});
	this.guide = new THREE.Line(guide_geo, guide_mat);
	this.add(this.guide);
	
	if (this.edit_mode == Modes.POINT_MODE) {
	    RAS.rasterizePoint(this, this.clicks[0], this.brush_color);
	    this.clicks = [];
	} else if ((this.edit_mode == Modes.LINE_MODE || this.edit_mode == Modes.ANTI_MODE) && this.clicks.length == 2){
	    if (this.edit_mode == Modes.LINE_MODE)
		RAS.rasterizeLine(this, this.clicks[0], this.clicks[1], this.brush_color);
	    else
		RAS.rasterizeAntialiasLine(this, this.clicks[0], this.clicks[1], this.brush_color);
	    this.clicks = [];
	} else if ((this.edit_mode == Modes.TRI_MODE || this.edit_mode == Modes.FILL_MODE) && this.clicks.length == 3){
	    if (this.edit_mode == Modes.TRI_MODE)
		RAS.rasterizeTriangle(this, this.clicks[0], this.clicks[1], this.clicks[2], this.brush_color);
	    else
		RAS.rasterizeFilledTriangle(this, this.clicks[0], this.clicks[1], this.clicks[2], this.brush_color);
	    this.clicks = [];
	} else if (this.edit_mode == Modes.POLY_MODE && this.clicks.length == 7){
	    RAS.rasterizeFilledSevengon(this, this.clicks, this.brush_color);
	    this.clicks = [];
	}
	
    }

    _uvToPix(uv){
	var r = Math.min(Math.max(Math.floor((uv.y * this.dim - 0.5) / this.stride),0), this.dim - 1);
	var c = Math.min(Math.max(Math.floor((uv.x * this.dim - 0.5) / this.stride),0), this.dim - 1);
	return [r, c];
    }
    
}
