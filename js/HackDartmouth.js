var camera, scene, nullObject;
var renderCanvas, renderer, vrrenderer;
var vrHMD, vrHMDSensor;
var currentRotation = goalRotation = 0.0;
var globes = [];
var selectedGlobe;
var selection = 0;
var originalMatrix;
var countries;
var ready = 0;
var readyCount = 3;

//var countryLL = {};

var textMeshes = [];

var chinaData, japanData, USData, franceData;

function begin() {

    console.log("begin!");

    initCountry();
    initScene();
    initRenderer();
    render();
}

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

Papa.parse("data/China_Imports_Exports.csv", {
    download: true,
    dynamicTyping: true,
    complete: function(results) {
        var dataArray = results.data;
        console.log(dataArray);
        var results = [];
        for (var i = 1; i < dataArray.length; i++) {
            var info = dataArray[i];
            var entry = {"country" : info[0], "partner" : info[1], "type" : info[3], 
                "value" : info[6]};
            results.push(entry);
        }
        chinaData = results;
        if(ready > readyCount) begin();
        else ready++;
    }
});

Papa.parse("data/Japan_Imports_Exports.csv", {
    download: true,
    dynamicTyping: true,
    complete: function(results) {
        var dataArray = results.data;
        var results = [];
        for (var i = 1; i < dataArray.length; i++) {
            var info = dataArray[i];
            var entry = {"country" : info[0], "partner" : info[1], "type" : info[3], 
                "value" : info[6]};
            results.push(entry);
        }
        japanData = results;
        if(ready > readyCount) begin();
        else ready++;
    }
});

Papa.parse("data/US_Imports_Exports.csv", {
    download: true,
    dynamicTyping: true,
    complete: function(results) {
        var dataArray = results.data;
        var results = [];
        for (var i = 1; i < dataArray.length; i++) {
            var info = dataArray[i];
            var entry = {"country" : info[0], "partner" : info[1], "type" : info[3], 
                "value" : info[6]};
            results.push(entry);
        }
        USData = results;
        console.log(USData);
        if(ready > readyCount) begin();
        else ready++;
    }
});

Papa.parse("data/france.csv", {
    download: true,
    dynamicTyping: true,
    complete: function(results) {
        var dataArray = results.data;
        var results = [];
        for (var i = 1; i < dataArray.length; i++) {
            var info = dataArray[i];
            var entry = {"country" : info[0], "partner" : info[1], "type" : info[3], 
                "value" : info[6]};
            results.push(entry);
        }
        franceData = results;
        if(ready > readyCount) begin();
        else ready++;
    }
});


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
}

var rotWorldMatrix;

// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
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

    if(ready > readyCount) begin();
    else {
        ready++;
    }
    
}

function initScene() {

    camera = new THREE.PerspectiveCamera(60, 1280 / 800, 0.001, 10);
    scene = new THREE.Scene();
    nullObject = new THREE.Object3D();
    scene.add(nullObject);

    var globe1 = new Globe(0);
    var globe2 = new Globe(Math.PI/2);
    var globe3 = new Globe(Math.PI);
    var globe4 = new Globe(Math.PI*1.5);

    var group1 = new THREE.Group();
    group1.position = globe1.position.clone();
    globe1.position = new THREE.Vector3(0,0,0);
    group1.add(globe1);
    console.log("globe1", globe1)
    console.log("group1", group1)

    var group2 = new THREE.Group();
    group2.position = globe2.position.clone();
    globe2.position = new THREE.Vector3(0,0,0);
    group2.add(globe2);

    var group3 = new THREE.Group();
    group3.position = globe3.position.clone();
    globe3.position = new THREE.Vector3(0,0,0);
    group3.add(globe3);

    var group4 = new THREE.Group();
    group4.position = globe4.position.clone();
    globe4.position = new THREE.Vector3(0,0,0);
    group4.add(globe4);

    /*maketext("World 2", scene, [0,3,5])
    maketext("World 1342", scene, [0,10,5])
    maketext("World JKLDF", scene, [0,1,0])*/

    nullObject.add(group1);
    nullObject.add(group2);
    nullObject.add(group3);
    nullObject.add(group4);


    maketext("U.S.A.", nullObject, [0.0,0.25,-0.5], true)
    maketext("Japan", nullObject, [0.5,.25,0.0], true)
    maketext("China", nullObject, [-0.5,.25,0.0], true)
    maketext("France", nullObject, [0.0, 0.25, 0.5], true)

    addCSVData(globe1, USData);
    addCSVData(globe2, chinaData);
    addCSVData(globe4, japanData);
    addCSVData(globe3, franceData);

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

    earthMesh.position.z = -2.25*Math.cos(angle);
    earthMesh.position.x = -2.25*Math.sin(angle);
    earthMesh.position.y = -0.5;

    globes.push(earthMesh);
    return earthMesh; 
}

function initRenderer() {
    renderCanvas = document.getElementById("render-canvas");
    renderer = new THREE.WebGLRenderer({
        canvas: renderCanvas,
    });
    renderer.setClearColor(0xFFFFFF);//(0x555555);
    renderer.setSize(1280, 800, false);
    vrrenderer = new THREE.VRRenderer(renderer, vrHMD);

    renderCanvas.addEventListener('gesturechange', function(e){
        e.preventDefault();
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

    for (var i in textMeshes) {
        //textMeshes[i].lookAt(camera.position);
       // textMeshes[i].lookAt(textMeshes[i].worldToLocal(new THREE.Vector3(0,0,0)));


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
    return answer;
}

function calculateSpline1(origin, dest) {
    var p1 = new THREE.Vector3().fromArray(origin);
    var p2 = new THREE.Vector3().fromArray(dest);
    var p3 = new THREE.Vector3()
    p3.addVectors(p1, p2)
    p3.normalize()
    p3.multiplyScalar(2)
    return p3.toArray();
}

//reference points for countries
function initCountry() {
    //reference points for countries
    var countriesLL = [
        ["Canada", 65, -95 ],
        ["Mexico", 19, -102.4],
        ["China", 35, 103],
        ["Japan", 35, 136],
        ["UK", 54, -2],
        ["United Kingdom", 54, -2],
        ["Germany", 51.6, 10],
        ["Brazil", -10.7, -53],
        ["Netherlands", 52.2, 4.5],
        ["HK", 22.3, 114.2],
        ["Korea", 37.6, 127],
        ["Saudi", 24, 45],
        ["Saudi Arabia", 24, 45],
        ["France", 47, 2],
        ["India", 21, 78],
        ["US", 38.9, -90.01],
        ["United States", 38.9, -90.01],
        ["Korea, Rep.", 37.6, 127],

        ["South Asia", 21, 78],
        ["Sub-Saharan Africa", -30, 25],
        ["Russian Federation", 60, 90],
        ["North America", 38.9, -90.01],

        ["Hong Kong, China", 35, 103],

        ["Canada", 65, -95 ],
        ["Mexico", 19, -102.4],
        ["China", 35, 103],
        ["Japan", 35, 136],
        ["UK", 54, -2],
        ["Germany", 51.6, 10],
        ["Brazil", -10.7, -53],
        ["Netherlands", 52.2, 4.5],
        ["HK", 22.3, 114.2],
        ["Korea", 37.6, 127],
        ["Saudi", 24, 45],
        ["France", 47, 2],
        ["India", 21, 78],
        ["US", 38.9, -90.01],
        ["Russia", 60, 90],
        ["Vietnam", 21, 105.9],
        ["Australia", -35.3, 149.1],
        ["Malaysia", 3.13, 101.8],
        ["Switzerland", 46.8, 8.4],
        ["Thailand", 13.75, 100.49],
        ["Singapore", 1.3, 103.8],
        ["Thailand", 13.8, 100.5],
        ["Indonesia", 6.18, 106.8],
        ["Qatar", 25.3, 51.5],
        ["Belgium", 50.9, 4.35],
        ["Italy", 41.9, 12.5],
        ["Spain", 40.43, -3.7],

    
    ];
    
    countries = {};
    
    for (var i = 0; i < countriesLL.length; i++) {
        var key = countriesLL[i][0];
        var lat = countriesLL[i][1];
        var lon = countriesLL[i][2];
        //countryLL[key] = [lat, lon];
        var data = calculatePoint(lat, lon);
        countries[key] = data;
    };
    
    return countries;
}

function addCurve(arr1, arr2, arr3, object, geometry1, material1, colorHex) {
    var curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3( arr1[0], arr1[1], arr1[2]),
        new THREE.Vector3( arr2[0], arr2[1], arr2[2]),
        new THREE.Vector3( arr3[0], arr3[1], arr3[2])
    );

    var geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints( 500 );

    var material = new THREE.LineBasicMaterial( { color : colorHex} );
    material.linewidth = 2;
    material.opacity = 0.5;
    material.transparent = true;
    // Create the final Object3d to add to the scene
    var curveObject = new THREE.Line( geometry, material );

    object.add(curveObject);
    
    //adds dest city
    var city = new THREE.Mesh( geometry1, material1 );
    city.translateX(arr3[0]);
    city.translateY(arr3[1]);
    city.translateZ(arr3[2]);
    object.add(city);
}

function addCSVData (sphere, data) {

        var geometry1 = new THREE.SphereGeometry( 0.02, 32, 32 )
        var material1 = new THREE.MeshPhongMaterial({color: 0xFF0000});
        var material2 = new THREE.MeshPhongMaterial({color: 0x0000FF});

        //add data points to world
        var origin = countries[data[0].country];

        //creates a home city
        var us = new THREE.Mesh( geometry1, material1 );
        us.translateX(origin[0]);
        us.translateY(origin[1]);
        us.translateZ(origin[2]);
        sphere.add(us);
       

        maketext(data[0].country, sphere, origin, new THREE.Vector3(0, 0, 0), false);
        
        var alreadyDrawn = [];
        var drawName = true;


        var total = 0;
        for (var i in data) {
            if (data[i].value > total) total = data[i].value;
        }

        //exports
        var geometry2 = new THREE.SphereGeometry( 0.015, 32, 32 )
        for (var i = 0; i < data.length; i++) {
            var key = data[i].partner;
            var dest = countries[key];
            //add the line
            console.log(key);
            var mid = calculateSpline1(origin, dest);
            //add in curve
            if (data[i].type == "Import"){
                addCurve1(sphere, geometry2, material2, origin, dest, total, data[i].value, false);
                console.log("just added red curve");
            } 
            else addCurve1(sphere, geometry2, material2, origin, dest, total, data[i].value, true);

            
            for (var i in alreadyDrawn) {
                if(alreadyDrawn[i] == key) drawName = false;
            }
            if (drawName) maketext(key, sphere, dest, new THREE.Vector3(0, 0, 0), false);
            drawName = true;
        
        }
}

function maketext(string, parent, coords, title){
        var text = new THREE.TextGeometry(string, {
            height : 0.001,
            size : 0.03,
            hover : 0,

            //curveSegments : 4,
            font : 'droid sans', // helvetiker, optimer, gentilis, droid sans, droid serif
            weight : "normal", // normal bold
            style : "normal", // normal italic)
            
            //bevelThickness : 2,
            //bevelSize : 1.5,
            //bevelSegments : 3,
            //bevelEnabled : false,

            //material: 0,
            //extrudeMaterial: 1

        });
        var tmat = new THREE.MeshPhongMaterial( { color: 0xffd630, shading: THREE.FlatShading } );
        var textmesh = new THREE.Mesh( text, tmat );

        //helper code based on ammulder's example found at:
        //http://stackoverflow.com/questions/15492857/any-way-to-get-a-bounding-box-from-a-three-js-object3d
        var helper = new THREE.BoundingBoxHelper(textmesh, 0xff0000);
        helper.update();
        var diffx = helper.box.max.x - helper.box.min.x;
        var diffy = helper.box.max.y - helper.box.min.y;

        var group = new THREE.Group()
        group.position.x = coords[0]-(diffx/2);
        group.position.y = coords[1];
        group.position.z = coords[2];

        parent.add(group);
        group.add(textmesh);
        scene.updateMatrixWorld()

        if(title == true) {
            //scene.updateMatrixWorld()
            //parent.add(textmesh)
            //textmesh.position.x = coords[0]-(diffx/2);
            //textmesh.position.y = coords[1];
            //textmesh.position.z = coords[2];
            group.lookAt(group.worldToLocal(new THREE.Vector3(0,0,0)));
        } else { 
            textMeshes.push(textmesh);
            group.position.multiplyScalar(1.1)
            group.lookAt(group.position.clone().multiplyScalar(2.0));
        }
        return textmesh;
    }
























function addCurve1(object, geometry1, material1, start, end, total, value, isExport) {
    var vector1 = new THREE.Vector3().fromArray(start);
    var vector2 = new THREE.Vector3().fromArray(end);


    var mid = vector1.clone().add(vector2).divideScalar(2);
    
    var distance = vector1.clone().sub(vector2);
    var distanceBetweenCountryCenter = distance.length();
    

    mid.normalize();
    var midLength = mid.length();

    
    var firstQ = vector1.clone().add(mid).divideScalar(2);
    firstQ.normalize();


    var secondQ = mid.clone().add(vector2).divideScalar(2);
    secondQ.normalize();

    var scalar = 1+distanceBetweenCountryCenter/2;

    if (isExport) {
        firstQ.multiplyScalar(scalar + 0.25);
    
        secondQ.multiplyScalar(scalar + 0.25);
    }
    else 
    {
        firstQ.multiplyScalar(scalar - 0.25);
    
        secondQ.multiplyScalar(scalar - 0.25);
    }
    var curve = new THREE.CubicBezierCurve3(
        vector1, 
        firstQ,
        secondQ,
        vector2
    );

    var width = 0.005 + 0.04*value/total;

    var geometry = new THREE.TubeGeometry(curve, 20, width, 8, false);
    //geometry.vertices = curve.getPoints( 500 );

    var colorHex;
    if (isExport == true) colorHex = 0x0000FF;
    else colorHex = 0xFF0000;

    var material = new THREE.MeshPhongMaterial(
         { color : colorHex, 
            wireframe: false
         });
    //material.linewidth = 1;
    material.opacity = 0.3 + 1.4*value/total;
    material.transparent = true;

    
    // Create the final Object3d to add to the scene
    var curveObject = new THREE.Mesh( geometry, material );

    object.add(curveObject);

    //7 = huge; 14 is small
    function setGlow(obj, val, total){
        console.log(val);
        var glowMesh = new THREEx.GeometricGlowMesh(curveObject, 10+(10*(val/total)));
        obj.add(glowMesh.object3d);
    
        var color;
        if(isExport == true) color = "blue";
        else color = "red"

        var insideUniforms  = glowMesh.insideMesh.material.uniforms;
        insideUniforms.glowColor.value.set(color);
        var outsideUniforms = glowMesh.outsideMesh.material.uniforms;
        outsideUniforms.glowColor.value.set(color);
    }

    //setGlow(curveObject, value , total);
    var material2 = new THREE.MeshPhongMaterial({color: 0xFFFFFF});
    var city = new THREE.Mesh( geometry1, material2 );
    city.translateX(end[0]);
    city.translateY(end[1]);
    city.translateZ(end[2]);
    object.add(city);
}











/*
    //exports
    var total = 0;
    var geometry2 = new THREE.SphereGeometry( 0.015, 32, 32 )
    for (var i = 0; i < USEcondata[0].length; i++) {
        total += USEcondata[0][i][1];
    }
    console.log("total " + total);

    for (var i = 0; i < USEcondata[0].length; i++) {
        var key = USEcondata[0][i][0];
        var lat = countries[key];
        //console.log(key);
        //console.log(countries[key]);
        var dest = countries[key];
        
        var value = USEcondata[0][i][1];

        addCurve1(sphere1, geometry1, material1, origin, dest, total, value);
    }

    origin =  countries["test"];
    var dest = countries["test1"];
    //addCurve1(sphere1, geometry1, material1, origin, dest  );


*/