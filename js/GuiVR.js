import * as THREE from '../extern/three.module.js';


const gui_elements = [];


export function intersectObjects(raycaster){


    var colliders = [];
    for (var i = 0; i < gui_elements.length; i++){
	colliders.push(gui_elements[i].collider);
    }
    
    var intersections = raycaster.intersectObjects(colliders);
        
    if (intersections.length > 0) {
	var intersection = intersections[0];
	var object = intersection.object;
	for (var i = 0; i < gui_elements.length; i++){ 
	    if (gui_elements[i].collider == object){
		gui_elements[i].collide(intersection.uv, intersection.point);
	    }
	}
    }
}

export class GuiVR extends THREE.Group {

    constructor(){
	super();
	if (new.target === GuiVR) {
	    throw new TypeError("GuiVR is abstract class and cannot be instantiated.");
	}
	gui_elements.push(this);
    }
    
}

const epsilon = 0.03;

export class GuiVRButton extends THREE.Group {

    constructor(label, init_val, min_val, max_val, is_int, update_callback){
	super();

	this.label = label;
	this.val = init_val;
	this.min_val = min_val;
	this.max_val = max_val;
	this.is_int = is_int;
	this.update_callback = update_callback;

	this.update_callback(this.val);
	
	this.w = 1;
	this.h = 0.2;
	this.ctx = document.createElement('canvas').getContext('2d');
	this.ctx.canvas.width = 512;
	this.ctx.canvas.height = Math.floor(this.ctx.canvas.width * this.h / this.w);
	this.texture = new THREE.CanvasTexture(this.ctx.canvas);
	this.texture.magFilter = THREE.LinearFilter;
	this.texture.minFilter = THREE.LinearFilter;
	this.update_texture();
	
	this.mesh_mat = new THREE.MeshBasicMaterial({color: 0xAAAAAA});
	this.mesh_mat.map = this.texture;
	this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(this.w, this.h), this.mesh_mat);
	this.add(this.mesh);
    }

    update_texture(){
	var ctx = this.ctx;
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillStyle = '#555753';
	ctx.fillRect(3, 3, ctx.canvas.width-6, ctx.canvas.height-6);
	ctx.font = "50px Arial";
	ctx.fillStyle = '#729FCF';
	ctx.textAlign = "left";
	ctx.strokeText(this.label, 15, ctx.canvas.height/1.5);
	ctx.fillText(this.label, 15, ctx.canvas.height/1.5);
	if (this.is_int){
	    var interval_width = 1 / (this.max_val - this.min_val);
	    var width = Math.floor(this.val * interval_width * Math.floor(ctx.canvas.width/2));
	    ctx.fillStyle = '#729FCF';
	    ctx.fillRect(Math.floor(ctx.canvas.width/2), 3, width - 3, ctx.canvas.height - 6);
	}
	ctx.fillStyle = '#FFFFFF';
	ctx.textAlign = "right"; 
	ctx.fillText(this.val, ctx.canvas.width - 15, ctx.canvas.height/1.5);
	this.texture.needsUpdate = true;

    }

    collide(uv, pt){
	val = 0;
	if (uv.x < 0.50 - epsilon)
	    return;
	if (uv.x < 0.5) {
	    val = this.min_val;
	} else if (uv.x > 1 - epsilon){
	    val = this.max_val;
	} else {
	
	    var alpha = Math.min((uv.x - 0.5)/(0.5 - epsilon/2), 1);
	    
	    var val = 0;
	    if (this.is_int){
		var interval_width = 1 / (this.max_val - this.min_val + 1);
		val = Math.floor(alpha / interval_width) + this.min_val;
	    } else {
		val = alpha * (this.max_val - this.min_val) + this.min_val;
	    }
	}
	    
	if (val != this.val){
	    this.val = val;
	    this.update_callback(this.val);
	    this.update_texture();
	}
    }
}

export class GuiVRMenu extends GuiVR {

    constructor(button_list){
	super();

	this.w = 0;
	this.h = 0;
	this.button_list = [];
	this.matrixRel = undefined;
	for (var i = 0; i < button_list.length; i++){
	    var button = button_list[i];
	    this.h += button.h;
	}

	var h = 0;
	for (var i = 0; i < button_list.length; i++){
	    var button = button_list[i]
	    this.add(button);
	    this.button_list.push(button);
	    button.position.y = this.h/2 - h - button.h/2;
	    button.position.z += 0.01;
	    this.w = Math.max(this.w, button.w);
	    h += button.h;
	}

	this.collider = new THREE.Mesh(new THREE.PlaneBufferGeometry(this.w, this.h),
				       new THREE.MeshBasicMaterial({color: 0x000000}));
	this.add(this.collider);
	
    }

    collide(uv, pt){

	var v = 1;

	for (var i = 0; i < this.button_list.length; i++){
	    var next_v = v - this.button_list[i].h / this.h;

	    if (uv.y > next_v) {
		var new_uv = {x: uv.x, y: (uv.y - next_v)/this.button_list[i].h}
		this.button_list[i].collide(new_uv, pt);
		return;
	    }
	    
	    v = next_v;
	}
	
    }

    follow_user(matrixWorld){
	if (this.matrixRel == undefined){
	    this.updateMatrixWorld();
	    this.matrixRel = this.matrixWorld.clone();
	}

	var tempMatrix = new THREE.Matrix4().identity();
	tempMatrix.multiplyMatrices(matrixWorld, this.matrixRel);
	
	var pos = new THREE.Vector3();
	var quat = new THREE.Quaternion();
	var scale = new THREE.Vector3();
	tempMatrix.decompose(pos, quat, scale);
	
	this.position.copy(pos);
	this.quaternion.copy(quat);
	this.updateMatrix();
	
    }

    
}
