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
// 5. Create selection buttons for color, mode.
// 6. Make text print debug module. -- Done.
// 7. Documentation.

var camera, scene, renderer;
var controller1, controller2;
var oculus_double_click_skip = false; // XXX - Need to insert in less hacky way.
var debug_console;

init();
animate();

function init() {

    // Set up scene
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 );
    camera.position.set( 0, 1.6, 1 );

    var wall_mat = new THREE.MeshPhongMaterial();
    wall_mat.color.set(0xFF33FF);
    for (var i = 0; i < 4; i++){
	var wall = new THREE.Mesh(new THREE.PlaneBufferGeometry( 10, 5 ),wall_mat);
	wall.geometry.translate(0,2.5,-5);
	wall.geometry.rotateY( - i * 90 * Math.PI / 180 );
	scene.add(wall);
    }
    
    var ground_mat = new THREE.MeshPhongMaterial()
    ground_mat.color.set(0x0000FF)
    var ground = new THREE.Mesh(new THREE.PlaneBufferGeometry( 10, 10 ),ground_mat);
    ground.geometry.rotateX( - 90 * Math.PI / 180 );
    ground.geometry.translate(0,0,0);
    scene.add(ground)
    var ceiling = new THREE.Mesh(new THREE.PlaneBufferGeometry( 10, 10 ),ground_mat);
    ceiling.geometry.rotateX( - 270 * Math.PI / 180 );
    ceiling.geometry.translate(0,5,0);
    scene.add(ceiling);

    var ceiling_light = new THREE.Mesh(new THREE.PlaneBufferGeometry( 2, 2 ), wall_mat);
    ceiling_light.geometry.rotateX( - 270 * Math.PI / 180 );
    ceiling_light.geometry.translate(0,4.96,0);
    scene.add(ceiling_light);

    var light = new THREE.PointLight(0xffffff, 0.5);
    light.position.y += 4.5
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.2));

    var board = new BOARD.Board();
    board.position.x = 0;
    board.position.y = 1.6;
    board.position.z = -2;
    scene.add(board);

    var board2 = new BOARD.Board();
    board2.rotateY( 90 * Math.PI / 180 );
    board2.position.x = -2;
    board2.position.y = 1.6;
    board2.position.z = 0;
    scene.add(board2);

    
    
    debug_console = new DebugConsole(1, 20);
    debug_console.rotateY(-45 * Math.PI / 180 );
    debug_console.position.x = 2;
    debug_console.position.y = 2;
    debug_console.position.z = -2;
    scene.add(debug_console);

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

    var button_list = [new GUIVR.GuiVRButton(), new GUIVR.GuiVRButton()];
    var gui = new GUIVR.GuiVRMenu(button_list);
    gui.position.y = 2;
    gui.position.z = -1.5;
    
    scene.add(gui);
    
    
    
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
    renderer.render(scene, camera);
}

