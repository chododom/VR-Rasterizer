import * as THREE from '../extern/three.module.js';
import * as GUIVR from './GuiVR.js';
import * as RAS from './rasterizer.js';

// Constants for drawing more
const POINT_MODE = 0;
const LINE_MODE = 1;
const TRI_MODE = 2;
const FILL_MODE = 3;
const ANTI_MODE = 4;
const POLY_MODE = 5;

const MAX_POLY_SIDES = 7;

export class Board extends GUIVR.GuiVR {

    constructor(){
	super();
	this.n = 20;
	this.stride = 20;
	this.dim = this.n * this.stride + 1;
	
	this._makeBoard();
	var board_tex = this._makeBoardTexture();
	board_tex.magFilter = THREE.LinearFilter;
	var board_mat = new THREE.MeshBasicMaterial({map: board_tex});
	this.board = new THREE.Mesh(new THREE.PlaneBufferGeometry( 2.5, 2.5 ), board_mat);
	this.collider = this.board;
	this.add(this.board);
	this.clicks = [];
	this.edit_mode = POINT_MODE;
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

    writePixel(x, y, c){
	var i = (x * this.n + y) * 3;
	this.board_data[i] = c[0];
	this.board_data[i + 1] = c[1];
	this.board_data[i + 2] = c[2];
	this._updateBoardTexture();
    }

    reset(){
	this._makeBoard();
	this._updateBoardTexture();
    }

    collide(uv, pt){

	var pix = this._uvToPix(uv);
	console.log("board clicked");
	if (this.clicks.length == 0){
	    this.guide.geometry.setDrawRange(0,0);
	    this.guide.geometry.attributes.position.needsUpdate = true;
	}
	
	var i = (this.clicks.length)*3;
	this.clicks.push(pix);
	var pos = this.guide.geometry.attributes.position.array;
	pos[i++] = pt.x; pos[i++] = pt.y - 1.6; pos[i++] = pt.z + 2.01;  // XXX - this is a hack.  Need to compute from board transform.
	pos[i++] = pos[0]; pos[i++] = pos[1]; pos[i++] = pos[2];
	console.log(pos);
	this.remove(this.guide);
	var guide_geo = new THREE.BufferGeometry();
	guide_geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	guide_geo.setDrawRange(0,this.clicks.length+1);
	var guide_mat = new THREE.LineBasicMaterial({color: 0x0000FF});
	this.guide = new THREE.Line(guide_geo, guide_mat);
	this.add(this.guide);
	
	if (this.edit_mode == POINT_MODE) {
	    RAS.rasterizePoint(this, this.clicks[0], this.brush_color);
	    this._updateBoardTexture();
	    this.clicks = [];
	} else if ((this.edit_mode == LINE_MODE || this.edit_mode == ANTI_MODE) && this.clicks.length == 2){
	    if (this.edit_mode == LINE_MODE)
		RAS.rasterizeLine(this, this.clicks[0], this.clicks[1], this.brush_color);
	    else
		RAS.rasterizeAntialiasLine(this, this.clicks[0], this.clicks[1], this.brush_color);
	    this._updateBoardTexture();
	    this.clicks = [];
	} else if ((this.edit_mode == TRI_MODE || this.edit_mode == FILL_MODE) && this.clicks.length == 3){
	    if (this.edit_mode == TRI_MODE)
		RAS.rasterizeTriangle(this, this.clicks[0], this.clicks[1], this.clicks[2], this.brush_color);
	    else
		RAS.rasterizeFilledTriangle(this, this.clicks[0], this.clicks[1], this.clicks[2], this.brush_color);
	    this._updateBoardTexture();
	    this.clicks = [];
	} else if (this.edit_mode == POLY_MODE && this.clicks.length == 7){
	    RAS.rasterizeFilledSevengon(this, this.clicks, this.brush_color);
	    this._updateBoardTexture();
	    this.clicks = [];
	}
	
    }

    _uvToPix(uv){
	var r = Math.min(Math.max(Math.floor((uv.y * this.dim - 0.5) / this.stride),0), this.dim - 1);
	var c = Math.min(Math.max(Math.floor((uv.x * this.dim - 0.5) / this.stride),0), this.dim - 1);
	return [r, c];
    }
    
    _makeBoard(){
	var board_size = this.n * this.n;
	this.board_data = new Uint8Array(3 * board_size);
	for (var r = 0; r < this.n; r++){
	    for (var c = 0; c < this.n; c++){
	    var i = (r * this.n + c)*3;
		this.board_data[i] = 255;
		this.board_data[i+1] = 255;
		this.board_data[i+2] = 255;
		//base_data[i] = Math.random()*255;
		//base_data[i+1] = Math.random()*255;
		//base_data[i+2] = Math.random()*255;
	    }
	}
    }
    
    _makeBoardTexture(){
	
	var dim = this.n * this.stride + 1;
	var size = dim * dim;
	var data = new Uint8Array(3 * size);
	for (var r = 0; r < dim; r++){
	    for (var c = 0; c < dim; c++){
		var i = (r * dim + c) * 3;
		if (r % this.stride == 0 || c % this.stride == 0) {
		    data[i] = 0;
		    data[i + 1] = 0;
		    data[i + 2] = 0;
		} else {
		    var j = (Math.floor(r / this.stride) * this.n + Math.floor(c / this.stride)) * 3;
		    data[i] = this.board_data[j];
		    data[i + 1] = this.board_data[j + 1];
		    data[i + 2] = this.board_data[j + 2];
		}
	    }
	}
	return new THREE.DataTexture(data, dim, dim, THREE.RGBFormat);
    }
    
    _updateBoardTexture(){
	var board_tex = this._makeBoardTexture();
	board_tex.magFilter = THREE.LinearFilter;
	this.board.material.map = board_tex;
	this.board.material.update = true;
    }
    
}
