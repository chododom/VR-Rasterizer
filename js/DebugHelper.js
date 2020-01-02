import {debugWrite} from './DebugConsole.js';




export function displaySession(xr){

    var session = xr.getSession();

    console.log(session);
    debugWrite("Session:");
    debugWrite("  baseLayer: " + session.baseLayer);
    try{ // Not implemented in emulator.
	debugWrite("  depthFar: " + session.depthFar);
    } catch (e){
	debugWrite("  depthFar: " + undefined);
    }
    try{
	debugWrite("  depthNear: " + session.depthNear);
    } catch (e) {
	debugWrite("  depthNear: " + undefined);
	
    }

    debugWrite("  environmentBlendMode: " + session.environmentBlendMode);
    debugWrite("  immersive: " + session.immersive);
    debugWrite("  inputSources: " + session.inputSources);
    debugWrite("  outputContext: " + session.outputContext);
    debugWrite("  renderState: " + session.renderState);

}

export function displaySources(xr){

    var sources = xr.getSession().inputSources;
    debugWrite("# Sources: " + sources.length);
    for (var i = 0; i < sources.length; i++){
	console.table(sources[i]);
	debugWrite("Source " + i + ": ");
	debugWrite("  gamepad: " + sources[i].gamepad);
	debugWrite("  gripSpace: " + sources[i].gripSpace);
	debugWrite("  handedness: " + sources[i].handedness);
	debugWrite("  profiles: " + sources[i].profiles);
	debugWrite("  targetRayMode: " + sources[i].targetRayMode);
	debugWrite("  targetRaySpace: " + sources[i].targetRaySpace);
    }
    
}

export function displayNavigator(nav){

    console.log(navigator);
    debugWrite("Navigator:");
    debugWrite("  platform: " + navigator.platform + "|");
    debugWrite("  appCodeName: " + navigator.appCodeName);
    debugWrite("  appName: " + navigator.appName);
    debugWrite("  appVersion: " + navigator.appVersion);
    debugWrite("  vendor: " + navigator.vendor);




}
