/**
 * Created by David John on 9/24/2020
 * Modified by David John on 10/3/2020:
 *      included perspective projection, modelview matrics
 *
 * Program to illustrate the basic ideas of rendering a 3d image
 * using index vertices (element array buffer)
 */
"use strict";

var canvas;
var webgl;

// variables to enable CPU manipulation of GPU uniform "theta"
var theta =0;
var thetaLoc;
var deltatheta = 0.01;

// frustum information
var near = 3.0;
var far = 5.0;
var  fovy = 40.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect; // Viewport aspect ratio (setup once canvas is known)


// uniform matrices for modelview and projection
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

// eye information
var eye = vec3(0.0,1.0,4.0);  // eye position
const at = vec3(0.0, 0.0, 0.0);  //  direction of view
const up = vec3(0.0, 1.0, 0.0);  // up direction



// Four colors associated with the 4 vertices that
// build my pyramid
var vertexColors = [
    vec4(1.0, 0.0, 0.0, 1.0),    // vertex #0 color
    vec4(0.0, 1.0, 0.0, 1.0),    // vertex #1 color
    vec4(0.0, 0.0, 1.0, 1.0),    // vertex #2 color
    vec4(1.0, 0.5, 0.0, 1.0)     // vertex #3 color
];

// Four vertices that define the geometry of my pyramid
// (all in viewing volume coordinates as homogeneous coordinates)
var vertexPositions = [
    vec4(0.0,0.0,0.4,1.0),        // vertex #0 position
    vec4(0.25, 0.0, -0.3, 1.0),   // vertex #1 position
    vec4(0.0, 0.8, 0.0, 1.0),    //  vertex #2 position
    vec4(-0.5, 0.0, 0.0, 1.0)    //  vertex #3 position
];

// vertex indices for the 4 triangles that
// constitute my pyramind.  these are entered in
// right hand order (normal vectors point to the outside).
var attrIndices = [
    3, 1, 0,       // triangular faces of 3d object
    0, 1, 2,       //   indexing vertexColors and vertexPositions
    3, 2, 1,
    2, 3, 0
];


// **************


// define and register callback function to start things off once the html data loads
window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    webgl = WebGLUtils.setupWebGL( canvas );
    if ( !webgl ) { alert( "WebGL isn't available" ); }

    // set up aspect ratio for frustum
    aspect = canvas.width / canvas.height;

    webgl.viewport( 0, 0, canvas.width, canvas.height );
    webgl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // enable hidden surface removal (by default uses LESS)
    webgl.enable(webgl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //  Set webgl context to "program"
    //
    var program = initShaders( webgl, "vertex-shader", "fragment-shader" );
    webgl.useProgram( program );

    // get GPU location of uniforms in <program>
    thetaLoc = webgl.getUniformLocation(program,"theta");
    projectionMatrixLoc = webgl.getUniformLocation(program,"projectionMatrix");
    modelViewMatrixLoc = webgl.getUniformLocation(program,"modelViewMatrix");


    // ******

    // attribute buffers

    // element array buffer (indices for vertices and colors)
    //     each is an 8-bit unsigned integer (0, 1, ..., 255)
    //     each is an index for the attributes
    var iBuffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, iBuffer);
    webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER,
        new Uint8Array(attrIndices), webgl.STATIC_DRAW);

    // color array attribute buffer  (indexed by iBuffer)
    //     4 floats, corresponding to rgba

    var cBuffer = webgl.createBuffer();
    webgl.bindBuffer( webgl.ARRAY_BUFFER, cBuffer );
    webgl.bufferData( webgl.ARRAY_BUFFER, flatten(vertexColors), webgl.STATIC_DRAW );

    var vColorLOC = webgl.getAttribLocation( program, "vColor" );
    webgl.vertexAttribPointer( vColorLOC, 4, webgl.FLOAT, false, 0, 0 );
    webgl.enableVertexAttribArray( vColorLOC );

    // vertex array attribute buffer (indexed by iBuffer)
    //      4 floats corresponding to homogeneous vertex coordinates

    var vBuffer = webgl.createBuffer();
    webgl.bindBuffer( webgl.ARRAY_BUFFER, vBuffer );
    webgl.bufferData( webgl.ARRAY_BUFFER, flatten(vertexPositions), webgl.STATIC_DRAW );

    var vPositionLOC = webgl.getAttribLocation( program, "vPosition" );
    webgl.vertexAttribPointer( vPositionLOC, 4, webgl.FLOAT, false, 0, 0 );
    webgl.enableVertexAttribArray( vPositionLOC );

    alert("line 127");

    render();
};

// **************

// recursive render function -- recursive call is synchronized
// with the screen refresh
function render()
{
    // clear the color buffer and the depth buffer
    webgl.clear( webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);

    // compute angle of rotation and pass along to vertex shader
    theta = IncrementClamp(theta,deltatheta, 2.0*Math.PI);
    webgl.uniform1f(thetaLoc,theta);

    // compute modelView and projection matrices
    // and them pass along to vertex shader
    modelViewMatrix =  lookAt(eye,at,up);
    projectionMatrix = perspective(fovy, aspect, near, far);
    webgl.uniformMatrix4fv( modelViewMatrixLoc, false,
        flatten(modelViewMatrix) );
    webgl.uniformMatrix4fv( projectionMatrixLoc, false,
        flatten(projectionMatrix) );


    // drawElements draws the "elements" (based on indices)
    webgl.drawElements( webgl.TRIANGLES, attrIndices.length,
        webgl.UNSIGNED_BYTE, 0 );


    requestAnimFrame( render );
}

// Utility function to increment a variable and clamp
function IncrementClamp(x, dx, upper){
    var newX = x+dx;
    if (newX > upper){
        return newX-upper;
    }
    return newX;
}