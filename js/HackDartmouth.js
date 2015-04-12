var camera, scene, nullObject;
var renderCanvas, renderer, vrrenderer;
var vrHMD, vrHMDSensor;
var currentRotation = goalRotation = 0.0;
var globes = [];
var selectedGlobe;
var selection = 0;
var originalMatrix;

window.addEventListener("load", function() {
    if (navigator.getVRDevices) {
        navigator.getVRDevices().then(vrDeviceCallback);
    } else if (navigator.mozGetVRDevices) {
        navigator.mozGetVRDevices(vrDeviceCallback);
    }
}, false);

window.addEventListener("keypress", function(e) {
    if (e.charCode == 'f'.charCodeAt(0)) {
        if (renderCanvas.mozRequestFullScreen) {
            renderCanvas.mozRequestFullScreen({
                vrDisplay: vrHMD
            });
        } else if (renderCanvas.webkitRequestFullscreen) {
            renderCanvas.webkitRequestFullscreen({
                vrDisplay: vrHMD,
            });
        }
        /*renderCanvas.requestPointerLock = renderCanvas.requestPointerLock ||
                            renderCanvas.mozRequestPointerLock ||
                            renderCanvas.webkitRequestPointerLock;

        renderCanvas.requestPointerLock()*/
    }
}, false);

window.onkeydown = function(e) {
    if (e.keyCode == 37) {
        goalRotation += Math.PI / 2;
        resetGlobeRotation(selectedGlobe, (0 - selectedGlobe.rotation.x)/10);
        selection -= 1;
        selection += globes.length;
        selection = selection % globes.length;
        selectedGlobe = globes[selection];
    } else if (e.keyCode == 39) {
        goalRotation -= Math.PI / 2;


        resetGlobeRotation(selectedGlobe, (0 - selectedGlobe.rotation.x)/10);
        selection +=1;
        selection = selection % globes.length;
        selectedGlobe = globes[selection];
    }
}

function resetGlobeRotation(globe, step) {
    
    if(Math.abs(globe.rotation.x) < 0.1){
        globe.rotation.x = 0;
        //globe.rotation.y = 0;
    } else{
        globe.rotation.x += step;
        requestAnimationFrame(function(){resetGlobeRotation(globe, step)});
    } 
}

var mouseX = 0.0;
var mouseY = 0.0;

window.onmousemove = function (evt) {
    evt.preventDefault();

    var deltaX = evt.clientX - mouseX;
    var deltaY = evt.clientY - mouseY;
    
    mouseX = evt.clientX;
    mouseY = evt.clientY;

    rotateGlobe(deltaX, deltaY);
    
    scene.updateMatrixWorld()
}

function rotateGlobe(deltaX, deltaY) {

    rotateAroundWorldAxis(selectedGlobe, new THREE.Vector3(0,1,0), deltaX/100);
    rotateAroundWorldAxis(selectedGlobe, new THREE.Vector3(1,0,0), deltaY/100);


   // selectedGlobe.rotation.y += deltaX/100;
 //   selectedGlobe.rotation.x += deltaY/100;
  /* if(selection%2 == 0) selectedGlobe.rotation.x += deltaY/100;
    else {
        console.log("z!");
        selectedGlobe.rotation.x += deltaY/100;
}*/
}

var rotWorldMatrix;

// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    /*
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrixWorld);        // pre-multiply
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
*/
    //axis = 
    var scale = object.scale
    object.scale = 1
    var pos = new THREE.Vector3()
    pos.copy(object.position)
    console.log(pos)
    object.position.set(0,0,0)
    object.updateMatrixWorld()
    object.worldToLocal(axis);
    object.rotateOnAxis(axis, radians)
    object.position.copy(pos)
    object.scale = scale
}

function vrDeviceCallback(vrdevs) {
    for (var i = 0; i < vrdevs.length; ++i) {
        if (vrdevs[i] instanceof HMDVRDevice) {
            vrHMD = vrdevs[i];
            break;
        }
    }
    for (var i = 0; i < vrdevs.length; ++i) {
        if (vrdevs[i] instanceof PositionSensorVRDevice &&
            vrdevs[i].hardwareUnitId == vrHMD.hardwareUnitId) {
            vrHMDSensor = vrdevs[i];
            break;
        }
    }
    initScene();
    initRenderer();
    render();
}

function initScene() {

    camera = new THREE.PerspectiveCamera(60, 1280 / 800, 0.001, 10);
    //camera.position.z = 2;
    scene = new THREE.Scene();

    
    nullObject = new THREE.Object3D();
    //nullObject.position.z = 2;
    scene.add(nullObject);

    
    var globe1 = new Globe(0);


    originalMatrix = globe1.matrix;


    var globe2 = new Globe(Math.PI/2);


    globe1.lookAt(new THREE.Vector3(100,0,-10));


    var globe3 = new Globe(Math.PI);
    var globe4 = new Globe(Math.PI*1.5);


    //currentRotation = goalRotation = Math.PI / 2;
    

    nullObject.add(globe1);
    
    //nullObject.rotation.y = currentRotation;

    nullObject.add(globe2);
    

    nullObject.add(globe3);
    nullObject.add(globe4);

    selectedGlobe = globes[0];

    var light = new THREE.DirectionalLight(0x555555);
    light.position.set(0, 1, 0).normalize();
    scene.add(light);

    var bottomLight = new THREE.DirectionalLight(0x555555);
    bottomLight.position.set(0, -1, 0).normalize();
    scene.add(bottomLight);


    var spotlightTarget = new THREE.Object3D();
    spotlightTarget.position.copy(globe1.position);
    scene.add(spotlightTarget);

    var spotLight = new THREE.SpotLight(0xFFFFFF);
    spotLight.target = spotlightTarget;
    scene.add(spotLight);

    var ambientLight = new THREE.AmbientLight(0x444444);
   scene.add(ambientLight)

}

function Globe (angle) {

    var geometry    = new THREE.SphereGeometry(0.75, 32, 32);
    var material    = new THREE.MeshPhongMaterial();
    material.map = THREE.ImageUtils.loadTexture('images/map_outline.jpg');
    material.map.minFilter = THREE.NearestFilter;
    var earthMesh    = new THREE.Mesh(geometry, material);


    console.log("Before position, local transform: ", earthMesh.matrix);

    //earthMesh.position.z = -2;

    earthMesh.position.z = -2*Math.cos(angle);
    earthMesh.position.x = -2*Math.sin(angle);
    earthMesh.position.y = -0.5;

    console.log("After position, local transform: ", earthMesh.matrix);

    globes.push(earthMesh);

    return earthMesh;

}

function initRenderer() {
    renderCanvas = document.getElementById("render-canvas");
    renderer = new THREE.WebGLRenderer({
        canvas: renderCanvas,
    });
    renderer.setClearColor(0x555555);
    renderer.setSize(1280, 800, false);
    vrrenderer = new THREE.VRRenderer(renderer, vrHMD);
}

var dateLast = Date.now();
var dateCurrent;
var elapsed;
var stepSize = Math.PI / 45;




function render() {
    requestAnimationFrame(render);

    for (var i in globes) {
        if(globes[i] != selectedGlobe) globes[i].rotation.y += 0.01;    
    }


    //selectedGlobe.matrix = originalMatrix;

    
    dateCurrent = Date.now();
    elapsed = dateCurrent - dateLast;
    dateLast = dateCurrent;

    if (!(Math.abs(goalRotation - currentRotation) < stepSize/2)) {
        if (goalRotation > currentRotation) {
            currentRotation += stepSize * elapsed/50;
            nullObject.rotation.y = currentRotation;
        } else if (goalRotation < currentRotation) {
            currentRotation -= stepSize * elapsed/50;
            nullObject.rotation.y = currentRotation;
        }
    }

    var state = vrHMDSensor.getState();
    camera.quaternion.set(state.orientation.x, state.orientation.y, state.orientation.z, state.orientation.w);
    vrrenderer.render(scene, camera);
}