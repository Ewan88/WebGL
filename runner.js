var cubeRotation = 0.0;

main();

function main() {
  const canvas = document.getElementById('glCanvas');
  const gl = canvas.getContext("webgl");

  if (!gl) {
    alert("Unable to initialize WebGL");
    return;
  }

  /*
  vertex shader transforms input vertex to clipspace coordinate system
  each axis has a range from -1.0 to 1.0
  */
  const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vColor;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
  `;

  // fragment shader determines the color of each pixel
  const fsSource = `
  varying lowp vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
  `;

  // initialize shader program
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // collect attributes and uniforms used in shader program
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  // build object buffers
  const buffers = initBuffers(gl);

  // track time of last animation
  var then = 0;

  // repeatedly draw scene
  function render(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, deltaTime);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// initialize buffers for a single 3D cube
function initBuffers(gl) {
  // create buffer to store objects' position
  const positionBuffer = gl.createBuffer();
  // select it to perform operations
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // create array of positions
  const positions = [
    // front face
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,
    // back face
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,
    // top face
    -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,
    // bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,
    // right face
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,
    // left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0,
  ];
  // pass array of positions to WebGL as a Float32Array and fill the current buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // set up colors for each face
  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // front face: white
    [1.0, 0.0, 0.0, 1.0], // back face: red
    [0.0, 1.0, 0.0, 1.0], // top face: green
    [0.0, 0.0, 1.0, 1.0], // bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // right face: yellow
    [1.0, 0.0, 1.0, 1.0], // left face: purple
  ];
  // convert array of colors into table for all vertices
  var colors = [];
  for (var j = 0; j < faceColors.length; j++) {
    const c = faceColors[j];
    // repeat each color for each vertex on the face
    colors = colors.concat(c, c, c, c);
  }
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // build element array buffer
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  // define each face as two triangles
  const indices = [
    0, 1, 2,      0, 2, 3, // front
    0, 5, 6,      4, 6, 7, // back
    8, 9, 10,     8, 10, 11, // top
    12, 13, 14,   12, 14, 15, // bottom
    16, 17, 18,   16, 18, 19, // right
    20, 21, 22,   20, 22, 23, // left
  ];
  // send to GL
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

function drawScene(gl, programInfo, buffers, deltaTime) {
  // clear canvas
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // define field and distance of view
  const fieldOfView = 45 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // set center of screen
  const modelViewMatrix = mat4.create();

  // move drawing position
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
  // rotate around Z axis
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1]);
  // rotate around X axis
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 7, [0, 1, 0]);

  // create data from position buffer
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // create data from color buffer
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexColor);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);

  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  cubeRotation += deltaTime;
};

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initalize shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('Error occured while compiling shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
