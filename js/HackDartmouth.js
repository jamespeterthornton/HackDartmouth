var camera, scene, isoMesh, cubeMesh, nullObject;
var renderCanvas, renderer, vrrenderer;
var vrHMD, vrHMDSensor;
var rotation = 0;

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
    }
}, false);

window.onkeydown = function(e) {
    if (e.keyCode == 37) {
        rotation += 0.1;
    } else if (e.keyCode == 39) {
        rotation -= 0.1;
    }
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
    camera.position.z = 2;
    scene = new THREE.Scene();

    
    nullObject = new THREE.Object3D();
    nullObject.position.z = 2;
    scene.add(nullObject);



    var geometry = new THREE.IcosahedronGeometry(1, 1);
    var material = new THREE.MeshNormalMaterial();
    isoMesh = new THREE.Mesh(geometry, material);
    //isoMesh.position.y = 5;
    isoMesh.position.z = -2;
    nullObject.add(isoMesh);






    var cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );
    var cubeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    cubeMesh = new THREE.Mesh( cubeGeometry, cubeMaterial );
    cubeMesh.position.y = 5;
    scene.add( cubeMesh );


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

function render() {
    requestAnimationFrame(render);
    isoMesh.rotation.y += 0.01;
    cubeMesh.rotation.x += 0.1;
    cubeMesh.rotation.y += 0.1;

    nullObject.rotation.y = rotation;



    var state = vrHMDSensor.getState();
    camera.quaternion.set(state.orientation.x, state.orientation.y, state.orientation.z, state.orientation.w);
    vrrenderer.render(scene, camera);
}