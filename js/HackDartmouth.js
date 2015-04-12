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
        //left arrow pressed
        goalRotation += Math.PI / 2;
        resetGlobeRotation(selectedGlobe, (0 - selectedGlobe.rotation.x)/10);
        selection -= 1;
        selection += globes.length;
        selection = selection % globes.length;
        selectedGlobe = globes[selection];
    } else if (e.keyCode == 39) {
        //right arrow pressed
        goalRotation -= Math.PI / 2;
        resetGlobeRotation(selectedGlobe, (0 - selectedGlobe.rotation.x)/10);
        selection +=1;
        selection = selection % globes.length;
        selectedGlobe = globes[selection];
    } else if (e.keyCode == 82) {
        //r pressed
        rotateAroundWorldAxis(selectedGlobe, new THREE.Vector3(0,0,1), Math.PI/20);
    } else if (e.keyCode == 69) {
        //e pressed
        rotateAroundWorldAxis(selectedGlobe, new THREE.Vector3(0,0,1), -Math.PI/20);
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
    var scale = object.scale||1
    object.scale = 1
    var pos = new THREE.Vector3()
    pos.copy(object.position)
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

    globe1.arrayOfArrays = "array of arrays!";

    console.log(globe1.arrayOfArrays);


    originalMatrix = globe1.matrix;


    var translate3 = calculatePoint(-22.9, -43.1);
    var translate4 = calculatePoint(40.71, -74.01);
    var mid = calculateSpline(-22.9, -43.1, 40.71, -74.01, 1.5);
    addCurve(translate3, mid, translate4, globe1);




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

    var geometry    = new THREE.SphereGeometry(1.0, 32, 32);//(0.75, 32, 32);
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

    renderCanvas.addEventListener('gesturechange', function(e){
        e.preventDefault();
        console.log(e.scale);
    });
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
    } else if (goalRotation != currentRotation) {
        currentRotation = goalRotation;
        nullObject.rotation.y = currentRotation;
    }

    var state = vrHMDSensor.getState();
    camera.quaternion.set(state.orientation.x, state.orientation.y, state.orientation.z, state.orientation.w);
    vrrenderer.render(scene, camera);
}



function calculatePoint(lat, lon) {
    lon -= 9.1;
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;
 
    var x = - Math.cos(phi) * Math.cos(theta);
    var y =  Math.sin(phi);
    var z =  Math.cos(phi) * Math.sin(theta);
 

    answer = [x, y, z];
    console.log(answer);
    return answer;
}

function calculatePointM(lat, lon, offset) {
    lon -= 9.1;
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;
 
    var x = -offset * Math.cos(phi) * Math.cos(theta);
    var y =  offset * Math.sin(phi);
    var z =  offset * Math.cos(phi) * Math.sin(theta);
 

    answer = [x, y, z];
    console.log(answer);
    return answer;
}

function calculateSpline_old(slat, slon, elat, elon, offset) {
    var lat = (slat + elat)/2;
    var lon = (elon + elon)/2;

    lon -= 9.1;

    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;

    var x = - offset * Math.cos(phi) * Math.cos(theta);
    var y =  offset * Math.sin(phi);
    var z =  offset * Math.cos(phi) * Math.sin(theta);
 

    answer = [x, y, z];
    //console.log(answer);
    return answer;
}

function calculateSpline(slat, slon, elat, elon, offset) {
    var p1 = calculatePoint(slat, slon)
    var p2 = calculatePoint(elat, elon)
    p1 = new THREE.Vector3().fromArray(p1)
    p2 = new THREE.Vector3().fromArray(p2)
    var p3 = new THREE.Vector3()
    p3.copy(p1)
    p3.add(p2)
    p3.normalize()
    p3.multiplyScalar(1.4)
    console.log(p3)
    return p3.toArray();
}

function addCurve(arr1, arr2, arr3, object) {
    var curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3( arr1[0], arr1[1], arr1[2]),
        new THREE.Vector3( arr2[0], arr2[1], arr2[2]),
        new THREE.Vector3( arr3[0], arr3[1], arr3[2])
    );

    var geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints( 500 );

    var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    material.linewidth = 2;
    material.opacity = 1.0;
    material.transparent = true;
    console.log(material);
    // Create the final Object3d to add to the scene
    var curveObject = new THREE.Line( geometry, material );
    object.add(curveObject);

    var pts = []
    for (var i = 0; i < 16; i++) {
        var angle = Math.PI*2*i/16
        pts.push(new THREE.Vector2(Math.sin(angle), Math.cos(angle)).multiplyScalar(0.3))
    }

    /*var geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints( 500 );
    var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    material.linewidth = 5;
    material.opacity = 0.2;
    material.transparent = true;
    console.log(material);
    // Create the final Object3d to add to the scene
    var curveObject = new THREE.Line( geometry, material );
    object.add(curveObject);*/


    var customMaterial = new THREE.ShaderMaterial({
        uniforms: 
        { 
            "c":   { type: "f", value: 1.0 },
            "p":   { type: "f", value: 1.4 },
            glowColor: { type: "c", value: new THREE.Color(0xffff00) },
            viewVector: { type: "v3", value: camera.position }
        },
        vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });




    var extrudeSettings = {
        steps           : 50,
        //bevelEnabled    : false,
        extrudePath     : curve,
        bevelThickness : 1,
        bevelSize : 1,
    };

    var shape = new THREE.Shape( pts );
    var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
    
    //var material = new THREE.MeshPhongMaterial();
    var tubeObject = new THREE.Mesh(geometry, customMaterial);
    object.add(tubeObject);


}

