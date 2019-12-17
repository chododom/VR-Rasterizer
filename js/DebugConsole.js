import * as THREE from '../extern/three.module.js';
import * as GUIVR from './GuiVR.js';

export class DebugConsole extends GUIVR.GuiVR {

    constructor(w, num_lines){
	super();
	this.w = w;
	this.num_lines = num_lines;
	this.h = 0.080 * num_lines + 0.08;
	var c = new THREE.Mesh(new THREE.PlaneBufferGeometry(this.w, this.h),
			       new THREE.MeshBasicMaterial({color: 0xAAAAAA}));
	this.add(c);
	c = new THREE.Mesh(new THREE.PlaneBufferGeometry(this.w+0.03, this.h+0.03),
			   new THREE.MeshBasicMaterial({color: 0x555555}));
	this.collider = c;
	c.position.z -= 0.01
	this.add(c);
    
	var loader = new THREE.FontLoader();
	var current = this;
	loader.load( '../extern/fonts/helvetiker_bold.typeface.json', function ( font ) {
	    var textGeo = new THREE.TextBufferGeometry( "Console", {
		font: font,
		size: 0.1,
		height: 0.02,
		curveSegments: 3,
	    } );
	    var textMaterial = new THREE.MeshPhongMaterial( { color: 0xAA0000, specular: 0xffffff } );
	    var debug_mesh = new THREE.Mesh( textGeo, textMaterial );
	    debug_mesh.position.x = -current.w / 2 + 0.02;
	    debug_mesh.position.y = current.h / 2 + 0.03;
	    debug_mesh.position.z = 0.01;
	    current.add(debug_mesh);
	    current.font = font;
	    current.debug_mesh = undefined;
	});

	this.output = "";
    }

    write(msg){
	if (this.font != undefined){
	    this.output += msg + "\n";
	    var lines = this.output.split('\n');
	    lines = lines.slice(-this.num_lines-1, -1);
	    this.output = lines.join("\n") + "\n";
	    
	    
	    this.remove(this.debug_mesh);
	    var textGeo = new THREE.TextBufferGeometry( this.output, {
		font: this.font,
		size: 0.05,
		height: 0.015,
		curveSegments: 1,
	    } );
	    var textMaterial = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0xffffff } );
	    var debug_mesh = new THREE.Mesh( textGeo, textMaterial );
	    debug_mesh.position.x = -this.w / 2 + 0.05;
	    debug_mesh.position.y = this.h / 2 - 0.1;
	    debug_mesh.position.z = 0.01;
	    this.debug_mesh = debug_mesh;
	    this.add(this.debug_mesh);

	}

    }

    collide(uv, pt){
	this.clear();
    }
    
    clear(){
	this.output = "";
	this.write("");
	this.output = "";
    }
    
}
