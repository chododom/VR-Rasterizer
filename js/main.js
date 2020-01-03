// Author: Matthew Anderson
// CSC 385 Computer Graphics
// Version: Winter 2020
// Project 1: Main program.
// Initializes scene, VR system, and event handlers.

import * as THREE from '../extern/three.module.js';
import { VRButton } from '../extern/VRButton.js';
import * as BOARD from './Board.js';
import {DebugConsole, debugWrite} from './DebugConsole.js';
import * as DEBUG from './DebugHelper.js';
import * as GUIVR from './GuiVR.js';

// Global variables for high-level program state.
var camera, scene, renderer, gui;

var oculus_double_click_skip = false; // Bug workaround, Oculus Go browser doubles event onSelectStart.

var tempMatrix = new THREE.Matrix4();

// Initialize THREE objects in the scene.
function initRoom(){

    // Use canvas to create texture for holodeck-inspired walls.
    var ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 512;
    ctx.canvas.height = 512;
    ctx.fillStyle = '#EDD400';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(3, 3, ctx.canvas.width-6, ctx.canvas.height-6);
    var wallTexture = new THREE.CanvasTexture(ctx.canvas);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.magFilter = THREE.LinearFilter;
    wallTexture.minFilter = THREE.LinearMipmapNearestFilter;
    wallTexture.repeat.set(10, 10);
    var wallMaterial = new THREE.MeshPhongMaterial();
    wallMaterial.map = wallTexture;

    // Create the floor and ceiling.
    var floor = new THREE.Mesh(new THREE.PlaneBufferGeometry( 10, 10 ), wallMaterial);
    floor.geometry.rotateX(THREE.Math.degToRad(-90));
    floor.geometry.translate(0,0,0);
    scene.add(floor)
    var ceiling = new THREE.Mesh(new THREE.PlaneBufferGeometry( 10, 10 ), wallMaterial);
    ceiling.geometry.rotateX(THREE.Math.degToRad(-270));
    ceiling.geometry.translate(0,5,0);
    scene.add(ceiling);
    
    // Create the four side walls.
    for (var i = 0; i < 4; i++){
	var wall = new THREE.Mesh(new THREE.PlaneBufferGeometry(10, 10), wallMaterial);
	wall.geometry.translate(0,0,-5);
	wall.geometry.rotateY(THREE.Math.degToRad(-i * 90));
	scene.add(wall);
    }

    // Create a light in the roomm.
    var light = new THREE.PointLight(0xffffff, 0.5);
    light.position.y += 4.5;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.2));

    // Create four drawing boards.
    var boards = [];
    for (var i = 0; i < 4; i++){
	var board = new BOARD.Board();
	board.position.x = 0;
	board.position.y = 1.6;
	board.position.z = -2;
	tempMatrix.makeRotationY(THREE.Math.degToRad(-i * 90));
	board.applyMatrix(tempMatrix);
	scene.add(board);
	boards.push(board);
    }
        
    // Create debug console to right of board.
    var debugConsole = new DebugConsole(2.5);
    debugConsole.rotateY(THREE.Math.degToRad(-45));
    debugConsole.position.x = 3;
    debugConsole.position.y = 1.6;
    debugConsole.position.z = -3;
    scene.add(debugConsole);
    
    // Create menu buttons to attach to heads up display.
    var buttonList = [
	new GUIVR.GuiVRButton("Edit Mode", 0, 0, 5, true, function(x){boards.map(b => b.setMode(x));}),
	new GUIVR.GuiVRButton("Red", 255, 0, 255, true, function(x){boards.map(b => b.setRed(x));}),
	new GUIVR.GuiVRButton("Green", 0, 0, 255, true, function(x){boards.map(b => b.setGreen(x));}),
	new GUIVR.GuiVRButton("Blue", 0, 0, 255, true, function(x){boards.map(b => b.setBlue(x));})];
    gui = new GUIVR.GuiVRMenu(buttonList);
    gui.rotation.y = -0.2;
    gui.scale.x = 0.45;
    gui.scale.y = 0.45;
    gui.position.x = 0.45;
    gui.position.y = -0.45;
    gui.position.z = -1.5;
    scene.add(gui);
}

function init() {

    // Create a scene
    scene = new THREE.Scene();

    // Create the contents of the room.
    initRoom();
    
    // Create the main camera pointing at the board.
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1.6, 1);

    // Set up renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Add VR button.
    document.body.appendChild(VRButton.createButton(renderer));
    window.addEventListener('resize', onWindowResize, false);

    // Set up the controller to be represented as a line.
    var controller = renderer.xr.getController(0);
    controller.addEventListener('selectstart', onSelectStart);
    scene.add(controller);
    var controllerPointer = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0),
										  new THREE.Vector3(0, 0, -1)]),
					   new THREE.LineBasicMaterial({color: 0xff0000,	linewidth: 4}));
    controllerPointer.name = 'pointer';
    controllerPointer.scale.z = 5;
    controller.add(controllerPointer.clone());

    // Set handler for mouse clicks.
    window.onclick = onSelectStart;
    
}

// Event handler for controller clicks when in VR mode, and for mouse
// clicks outside of VR mode.
function onSelectStart(event){

    if (event instanceof MouseEvent && !renderer.xr.isPresenting()){
	// Handle mouse click outside of VR.
	
	// Determine screen coordinates of click.
	var mouse = new THREE.Vector2();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	// Create raycaster from the camera through the click into the scene.
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);

	// Register the click into the GUI.
	GUIVR.intersectObjects(raycaster);
	
    } else if (!(event instanceof MouseEvent) && renderer.xr.isPresenting()){
	// Handle controller click in VR.

	// Bug workaround, Oculus Go browser doubles onSelectStart
	// event.
	if (navigator.platform == "Linux armv8l"){
	    if (oculus_double_click_skip){
		console.log("SKIPPING");
		oculus_double_click_skip = false;
		return;
	    } 
	    oculus_double_click_skip = true;
	}
	    
	// Retrieve the pointer object.
	var controller = event.target;
	var controllerPointer = controller.getObjectByName('pointer');

	// Create raycaster from the controller position along the
	// pointer line.
	var tempMatrix = new THREE.Matrix4();
	tempMatrix.identity().extractRotation(controller.matrixWorld);
	var raycaster = new THREE.Raycaster();
	raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
	raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

	// Register the click into the GUI.
	GUIVR.intersectObjects(raycaster);

	//DEBUG.displaySession(renderer.xr);
	//DEBUG.displaySources(renderer.xr);
	//DEBUG.displayNavigator(navigator);

     }
}


// Update the camera aspect ratio when the window size changes.
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Updates world and renders one frame.
// Is repeatedly called by main rendering loop.
function render() {

    // Force the gui to appear as heads up display tracking headset
    // position.
    gui.follow(camera.matrixWorld);
    
    renderer.render(scene, camera);
}

// Main program.
// Sets up everything.
init();

// Starts main rendering loop.
renderer.setAnimationLoop(render);

