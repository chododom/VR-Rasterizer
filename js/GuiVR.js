import * as THREE from '../extern/three.module.js';


const gui_elements = [];


export function intersectObjects(controller){
    var line = controller.getObjectByName('line');

    var tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    var raycaster = new THREE.Raycaster();
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4(tempMatrix);

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
	console.log(gui_elements);
    }
    
}


export class GuiVRButton extends THREE.Group {

    constructor(){
	super();
	this.w = 1;
	this.h = 0.5;
	this.toggled = false;
	this.mesh_mat = new THREE.MeshBasicMaterial({color: 0xAAAAAA});
	this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(this.w, this.h), this.mesh_mat);
	this.add(this.mesh);
    }

    collide(uv, pt){
	console.log("Collide with");
	console.log(this);
	this.toggled = !this.toggled;
	if (this.toggled)
	    this.mesh_mat.color.set(0x222222);
	else
	    this.mesh_mat.color.set(0xAAAAAA);
    }
}

export class GuiVRMenu extends GuiVR {

    constructor(button_list){
	super();

	this.w = 0;
	this.h = 0;
	this.button_list = [];
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
    
}
