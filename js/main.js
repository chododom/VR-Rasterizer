import * as THREE from '../extern/three.module.js';
import { VRButton } from '../extern/VRButton.js';
import * as BOARD from './Board.js';
import {DebugConsole} from './DebugConsole.js';
import * as GUIVR from './GuiVR.js';

// Todo List:
// 1. Make a non-VR interface.
// 2. Clean up modules, do better encapsulation.
// 3. Update assignment description.
// 4. Improve room
// 5. Create selection buttons for color, mode -- Done.
// 6. Make text print debug module -- Done.
// 7. Documentation.

var camera, scene, renderer;
var controller1;
var oculus_double_click_skip = false; // XXX - Need to insert in less hacky way.
var debug_console;
var gui;

init();
animate();

function init_room(){

    var ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 512;
    ctx.canvas.height = 512;
    ctx.fillStyle = '#EDD400';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(3, 3, ctx.canvas.width-6, ctx.canvas.height-6);
    var wall_texture = new THREE.CanvasTexture(ctx.canvas);
    wall_texture.wrapS = THREE.RepeatWrapping;
    wall_texture.wrapT = THREE.RepeatWrapping;
    wall_texture.magFilter = THREE.LinearFilter;
    wall_texture.minFilter = THREE.LinearMipmapNearestFilter;
    wall_texture.repeat.set( 10, 10 );
    var wall_mat = new THREE.MeshBasicMaterial();
    wall_mat.map = wall_texture;

    for (var i = 0; i < 4; i++){
	var wall = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10), wall_mat);
	wall.geometry.translate(0,0,-5);
	wall.geometry.rotateY( - i * 90 * Math.PI / 180 );
	scene.add(wall);
    }
    
    var ground_mat = new THREE.MeshPhongMaterial()
    ground_mat.color.set(0x0000FF)
    var ground = new THREE.Mesh(new THREE.PlaneBufferGeometry( 10, 10 ), wall_mat);
    ground.geometry.rotateX( - 90 * Math.PI / 180 );
    ground.geometry.translate(0,0,0);
    scene.add(ground)
    var ceiling = new THREE.Mesh(new THREE.PlaneBufferGeometry( 10, 10 ), wall_mat);
    ceiling.geometry.rotateX( - 270 * Math.PI / 180 );
    ceiling.geometry.translate(0,5,0);
    scene.add(ceiling);

    var ceiling_light = new THREE.Mesh(new THREE.PlaneBufferGeometry( 2, 2 ), ground_mat);
    ceiling_light.geometry.rotateX( - 270 * Math.PI / 180 );
    ceiling_light.geometry.translate(0,4.96,0);
    scene.add(ceiling_light);

    var light = new THREE.PointLight(0xffffff, 0.5);
    light.position.y += 4.5
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.2));

    debug_console = new DebugConsole(1, 20);
    debug_console.rotateY(-45 * Math.PI / 180 );
    debug_console.position.x = 2;
    debug_console.position.y = 1.5;
    debug_console.position.z = -2;
    scene.add(debug_console);
    
    var board = new BOARD.Board();
    board.position.x = 0;
    board.position.y = 1.6;
    board.position.z = -2;
    scene.add(board);
    
    var button_list = [
	new GUIVR.GuiVRButton("Edit Mode", 0, 0, 5, true, function(x){board.setMode(x)}),
	new GUIVR.GuiVRButton("Red", 255, 0, 255, true, function(x){board.setRed(x)}),
	new GUIVR.GuiVRButton("Green", 0, 0, 255, true, function(x){board.setGreen(x)}),
	new GUIVR.GuiVRButton("Blue", 0, 0, 255, true, function(x){board.setBlue(x)})];
    gui = new GUIVR.GuiVRMenu(button_list);
    gui.rotation.x = -0.2;
    gui.scale.x = 0.45;
    gui.scale.y = 0.45;
    gui.position.y = -0.7;
    gui.position.z = -1.5;
    scene.add(gui);

}

function init() {

    // Set up scene
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 );
    camera.position.set( 0, 1.6, 1 );

    init_room();
    
    // Set up renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.xr.enabled = true;
    document.body.appendChild( renderer.domElement );

    // Add VR button.
    document.body.appendChild( VRButton.createButton( renderer ) );
    window.addEventListener( 'resize', onWindowResize, false );

    // Controllers.
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    scene.add(controller1);
    
    var con_geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0),
							    new THREE.Vector3(0, 0, -1)]);
    var con_mat = new THREE.LineBasicMaterial({color: 0xff0000,	linewidth: 4});
    var line = new THREE.Line(con_geo, con_mat);
    line.name = 'line';
    line.scale.z = 5;
    controller1.add(line.clone());

}

function debug_callback(x){
    debug_console.write(x.toString());
}

function onSelectStart( event ) {
    var controller = event.target;
    if (oculus_double_click_skip){
	oculus_double_click_skip = false;
	return;
    }
    oculus_double_click_skip = true;

    debug_console.write("hello");
    
    GUIVR.intersectObjects(controller);    
}

function onSelectEnd( event ) {
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    renderer.setAnimationLoop( render );
}


function render() {

    gui.follow_user(camera.matrixWorld);

    renderer.render(scene, camera);
}

