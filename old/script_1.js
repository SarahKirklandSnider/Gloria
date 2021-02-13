'use strict';
// Port from Shadertoy to THREE.js: https://www.shadertoy.com/view/4sG3WV
const VERTEX_SHADER = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
`;
const BUFFER_A_FRAG = `
uniform vec2 iResolution;	//The width and height of our screen
uniform sampler2D bufferTexture;	//Our input texture
uniform sampler2D imgTexture;
varying vec2 vUv;

vec4 fragColor;
uniform sampler2D iChannel0; // takes buffer of self
uniform float iTime;
uniform int iFrame;
uniform vec4 iMouse;


//Based on https://www.shadertoy.com/view/4sK3WK by stb - thank you for your help!
//Simplified drawing only, no deleting cells, no moving cells. See original for that.

#define t2D(o) texture2D(iChannel0, uv-o/res)               // in 0-1 range
//#define isKeyHeld(key) texture2D(iChannel3, vec2(key, .2)).r > 0.

#define dataAt(x) texture2D(iChannel0, vec2(x+.5, .5)/res)
//#define dataAt(x) texture2D(iChannel0, vec2(x, 0.)/res)     // check if halfpoint is necessary
//#define t2D(o) texture2D( iChannel0, uv- (0.5+o) / res, -0.0 )

// hash without sine
// https://www.shadertoy.com/view/4djSRW
#define MOD3 vec3(443.8975,397.2973, 491.1871)
float hash12(vec2 p) {
    vec3 p3  = fract(vec3(p.xyx) * MOD3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

//void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
void main() {
    vec2 res = iResolution.xy;
    vec2 fc = gl_FragCoord.xy;
    vec2 uv = fc / res;
    vec3 o = vec3(1., -1., 0.);
    
    // set up neighborhood filter size 3
    vec2 dirs[8];
    dirs[0] = o.xz; dirs[1] = o.yz; dirs[2] = o.zx; dirs[3] = o.zy;
    dirs[4] = o.xx; dirs[5] = o.yx; dirs[6] = o.xy; dirs[7] = o.yy;
    
    // get current pixel position from last frame - (uv-(0.,0)/res)
    vec2 pos = t2D(o.zz).rg;  // current position, processed from last frame, stored in RG
    


    // get data about mouse from previous frame - savedPosition
    //vec2 sPos = dataAt(2.).ba;  // moving frame - if mouse hold BA - at (2.5, .5)/res;
    vec2 mOld = dataAt(0.).ba;  // mouseOld BA - at (0., 0.5)/res
    
    // is the mouse being held? - if so there would be data in z/b channel of previous frame
    float isMHeld;  // = dataAt(1.).b;  
    
    // NEIGHBORHOOD PROCESSING
    for(int i=0; i<8; i++) {
        // neighbor's stored position
        vec2 iPos = t2D(dirs[i]).rg;
        //vec2 iPos = t2DNEW(dirs[i]).rg;
        
        // if circle produced by neighbor is less than the current one, take its position
        if(length(fc-iPos) < length(fc-pos))
            pos = iPos;
    }
    
    // If mouse is held
    bool mouseHeld = true;
    mouseHeld = iMouse.z>0.;
    
    if(mouseHeld) {
        // cell position under mouse
        // uses t-input as a way to map coordinate - not necessary!
        //vec2 posUnderMouse = iMouse.xy/res;  //texture(iChannel0, iMouse.xy/res).rg; 
        

        // add cell
        if(length(fc.xy-iMouse.xy) < length(fc.xy-pos.xy) ){
            pos = iMouse.xy;
        }        
        isMHeld = 1.; // mouse was held this frame - will get stored and passed to next frame        
    }
    
    else {
    isMHeld = 0.; // mouse was not held this frame 
    }
    

    mOld = iMouse.xy;  // mouse on screen - not normalized
    


        
    // initialize values first frame
    // this is where it makes a sphere at first 
    float sphereShape = 64.;
    if(iFrame == 0) {
        if(pow(length(fc/res.y-vec2(.5*res.x/res.y, 0.)), sphereShape) > hash12(uv)) {
            //pos = fc;  // multiplying a scalar here is dope
        }
        else {
            //pos = vec2(-10000.); 
        }
        isMHeld = 0.;
    }
    
    // ------- CLEAR FRAMEBUFFER --------
    // clear stored positions when R is pressed    // ---------------- REPLACE WITH EXTERNAL UNIFORM
    //if(isKeyHeld(Key_R))
    //  pos = vec2(-10000.);
    // or could also be done on frame
    //if(iFrame == 100)
    //    pos = vec2(-10000.);
    
    
    
    
    // ------- STORE OUTPUTS --------
    
    // save cell position(s) - RG
    fragColor.rg = floor(pos);                  // IS CORRECT
    
    
    // STORE MOUSE POS
    // save old mouse position - if current pixel (o.zz) is this fragcoord - put in BA
    if(floor(fc)==o.zz) {      // floor(fc) gives only integer coords, not #.5 coords
        //fragColor.ba = mOld;   // store straight mouse.xy in BA
    }

    

    // STORE BUTTON STATES - NOT IN USE    
    /*
    else
        // save button held state in this coordinate, right of current - B
        if(floor(fc)==o.xz)
            fragColor.b = isMHeld; // float, if mouse was held in this frame, in B
    */        
    

    // SANITY CHECKS

    // Sanity check -  remember straight reading of texture in image
    //fragColor = vec4(1.,0.,0.,1); 
    
    // DEBUG CHECKS
    //fragColor = vec4(vec3(isMHeld),1); // float check
    //fragColor = vec4(mOld,0.,1);  // yellow - straight mouse.xy
    //fragColor = vec4(sPos,0.,1);  // green
    //fragColor = vec4(floor(fc), 0., 1.); // yellow with green and red line at left and bottom

    //fragColor = vec4(texture2D(imgTexture, vUv));
    //fragColor = vec4(texture2D(bufferTexture, vUv));

    // check that my storing works
    if(floor(fc) == vec2(10.,10.)) {  // make a red pixel at this coordinate
        fragColor = vec4(1.,0.,0.,1);
    }
    // Does mouse get read?
    //fragColor.rg = mOld/res; 

    gl_FragColor = fragColor;
}


`;
const BUFFER_B_FRAG = `
uniform vec2 iResolution;	//The width and height of our screen
uniform sampler2D bufferTexture;	//Our input texture
uniform sampler2D imgTexture;
varying vec2 vUv;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;

uniform float iTime;
uniform int iFrame;
uniform vec4 iMouse;
vec4 fragColor;

//Based on https://www.shadertoy.com/view/4sK3WK by stb - thank you for your help!
// hit R to remove clear buffer and remove all voronoi, then resample by drawing with mouse.

#define t2D(o) texture2D(iChannel0, uv-(o/res))
#define plane(p, n) 1. - abs(dot(p, n))*res.y
#define dataAt(x,y) texture2D(iChannel0, vec2(x+.5, y+.5)/res)
//#define dataAt(x,y) texture2D(iChannel0, vec2(x, y)/res)
//#define t2D(o) texture2D( iChannel0, (0.5+o) / res, -0.0 )

//void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
void main() {
    vec2 res = iResolution.xy;
    vec2 uv = gl_FragCoord.xy / res;
    vec2 p = gl_FragCoord.xy / res.y;
    vec3 o = vec3(1., -1., 0.);
    
    // cross neighborhood processing
    vec2 dirs[4];
    dirs[0] = o.xz; dirs[1] = o.yz; dirs[2] = o.zx; dirs[3] = o.zy;
    
    // current position from the buffer iChannel0
    vec2 pos = t2D(o.zz).rg;    // mouse coordinate mouse.xy
    
    // cell and wall
    float c, w = 0.; 
    
    // distance from center of cell to walls
    float dist = length(p-pos/res.y);
    
    
    // COLOR SETTINGS
    
    // overall cell gradients - these will have different effects
    // depending on the color effects used below
    c = pos.y*0.003;  // overall gradient
    c = pos.y*0.0023;  // overall gradient
    c = pos.y*0.003;  // overall gradient
    
    // helpfull other cell based gradients
    // c = 10. * dist; // gradient from center
    // c += 1.-step(0.005, dist); // draw cell centers
    
    
    
    // Get texture color
    vec4 tc = texture2D(iChannel1, pos/res.xy); // sample from under mouse
    //vec4 tc = texture2D(iChannel1, uv); // for debugging


    
    // Make cell walls
    for(int i=0; i<6; i++) {
        vec2 iPos = t2D(dirs[i]).rg; // sampling from iChannel0 - RG 
        if(pos!=iPos)
            w = max(w, plane(p-mix(pos, iPos, .5)/res.y, normalize(pos-iPos)));
            //w = 1.-w;
    }
    
    // SOME OTHER FUN EFFECTS TO TRY OUT WHEN BLENDING
    // original color with white walls and + colored base (r,g,b)
     //vec4 col = vec4(vec3(c) * vec3(.7, .6, .5) + w , 1.);
    
    // grayscale and white walls
    // vec4 col = vec4(vec3(c) + w , 1.);
    
    // grayscale
    //vec4 col = vec4(vec3(c), 1.);
    
    // gradient on individual tiles (bump mappy look) + texture sampling (uncomment both)
    // c = (p-pos/res.y).r; // gradient from left side, or try .g from below, or res.x
    // vec4 col = vec4(vec3(c) + w , 1.) + tc;
    
    // gradient + texture sampling
    //vec4 col = vec4(vec3(c)*tc.rgb + w, 1.);
    
    // gradient + texture sampling + colored base (r,g,b)
   vec4 col = vec4(vec3(c)*tc.rgb * vec3(.7, .6, .5) + w, 1.);
    
    
    /*
    // turn to alpha in case of layering
    float threshold = 0.99;
    if (col.r > threshold && col.g > threshold && col.b > threshold) {
        //col.rgb= vec3(0.);
        col.a = 0.; 
    }    
    */
    

    fragColor = col;



    



    //  ------- SANITY CHECKS - Show whats in the buffer ------- 
    //fragColor = texture2D(iChannel0, uv);
    //fragColor = texture2D(iChannel0, vUv);

                
    //fragColor = tc; // show texture sampler
    //fragColor = vec4(texture2D(iChannel0, pos/res.xy).ba, 0, 1); // show texture sampler
    //fragColor = vec4(pos.rg, 0, 1); // show texture sampler

    // IF THESE CHECKS DON'T WORK, DATA PASSING DOESN'T WORK
    // get that red pixel at coordinate vec2(10.,10.))
    // - color half the image
    if (uv.x > 0.5) {
        //fragColor = texture2D(iChannel0, vec2(10,10.)/res);    // get red pixel 1,0,0,1 at coordinate.
        //fragColor = vec4( texture2D(iChannel0, vec2(10,10.)/res).ba,  0., 1.); // get the ba component - draws green
        //fragColor = vec4(dataAt(10.,10.));
    }
    // test position data storing
    if (uv.x > 0.5) {
        // fragColor = vec4( texture2D(iChannel0, uv/res).rgb, 1.); // base color
        //fragColor = texture2D(iChannel0, pos.xy);        // get color in position
    }
    // test mouse data storing 
    if (uv.x > 0.5) {
        //fragColor = vec4( texture2D(iChannel0, iMouse.xy).rg,  0., 1.); // 0->res Yellow
        //fragColor = vec4( texture2D(iChannel0, iMouse.xy/res)); // 0->1 sample mouse straight from texture
    }

    gl_FragColor = fragColor;
}
`;
const BUFFER_FINAL_FRAG = `
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    varying vec2 vUv;
    
    void main() {
        vec2 uv = vUv;
        //vec2 a = texture2D(iChannel1,uv).xy;
        //gl_FragColor = vec4(texture2D(iChannel0,a).rgb,1.0);
        gl_FragColor = texture2D(iChannel0, vUv);
        
    }
`;


class App {
  constructor() {
    this.width = 1280;
    this.height = 720;
    this.renderer = new THREE.WebGLRenderer();
    this.loader = new THREE.TextureLoader();
    this.mousePosition = new THREE.Vector4();
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.counter = 0;

    // SOUND
		this.analyser;
		this.data;
		this.fftSize = 32;
    this.startButton = document.getElementById('startButton');  // there must be a button for sound
		this.startButton.addEventListener('click', this.init);
    this.gloriaSound();

    // RENDER BUFFERS
    this.targetA = new BufferManager(this.renderer, {
      width: this.width,
      height: this.height
    });
    this.targetB = new BufferManager(this.renderer, {
      width: this.width,
      height: this.height
    });
    this.targetC = new BufferManager(this.renderer, {
      width: this.width,
      height: this.height
    });
    // MOUSE
    this.renderer.setSize(this.width, this.height);
    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener('mousedown', () => {
      this.mousePosition.setZ(1);
      this.counter = 0;
    });
    this.renderer.domElement.addEventListener('mouseup', () => {
      this.mousePosition.setZ(0);
    });
    this.renderer.domElement.addEventListener('mousemove', event => {
      this.mousePosition.setX(event.clientX);
      this.mousePosition.setY(this.height - event.clientY);
    });
  }

  //----- FUNCTIONS

  init(){
    //Hide button
	  this.overlay = document.getElementById('overlay');
		overlay.remove();
    console.log('initialized');
    this.gloriaSound();
  }

  gloriaSound(){
    /*
    const listener = new THREE.AudioListener();
    const audio = new THREE.Audio(listener);
    const file = './Audio/Mass_Gloria_1-31-21SOUND_HARP ONLY.mp3';
    console.log(file);

    //if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
    const loader = new THREE.AudioLoader();
    loader.load(file, function (buffer) {
      audio.setBuffer(buffer);
      audio.play();
    });
    //}
    //else {
    const mediaElement = new Audio(file);
    mediaElement.loop = true;
    mediaElement.play();
    audio.setMediaElementSource(mediaElement);
    //}

    analyser = new THREE.AudioAnalyser(audio, fftSize);
    console.log(analyser);
    */
    console.log('Sound');
  }

  updateAudio() {
    data = analyser.getFrequencyData();

    // find highest energy frequency
    var highestf = 0;
    var highesti = 0;

    for (i = 0; i < data.length; i++) {
      if (highestf < data[i]) {
        highestf = data[i];
        highesti = i;
      }
    }

    if (highesti == 0) sColor = c1;
    if (highesti == 1) sColor = c2;
    if (highesti == 2) sColor = c3;
    if (highesti == 3) sColor = c4;
    else if (highesti > 3) sColor = c5;

    if (last_highesti != highesti) {
      var min = 1;
      var max = 40;
      id.x = Math.floor((Math.random() * max) + min);
      id.y = Math.floor((Math.random() * max) + min);
    }
    //console.log(id);
    //console.log (sColor);

    // get the average frequency of the sound
    //console.log(analyser.getAverageFrequency ());

    //console.log(audio.isPlaying);
    //console.log(data);

    // store so we can check if it changed
    last_highesti = highesti;
  }

  start() {
    const resolution = new THREE.Vector3(this.width, this.height, window.devicePixelRatio);
    //const inputIMAGE = this.loader.load('https://res.cloudinary.com/di4jisedp/image/upload/v1523722553/wallpaper.jpg');
    const inputIMAGE = this.loader.load('textures/butterfly.png');
    this.loader.setCrossOrigin('');
    this.bufferA = new BufferShader(BUFFER_A_FRAG, {
      iFrame: {
        value: 0
      },
      iResolution: {
        value: resolution
      },
      iMouse: {
        value: this.mousePosition
      },
      iChannel0: {
        value: null
      },
      iChannel1: {
        value: null
      }
    });
    this.bufferB = new BufferShader(BUFFER_B_FRAG, {
      iFrame: {
        value: 0
      },
      iResolution: {
        value: resolution
      },
      iMouse: {
        value: this.mousePosition
      },
      iChannel0: {
        value: null
      },
      iChannel1: {
        value: inputIMAGE
      },
    });
    this.bufferImage = new BufferShader(BUFFER_FINAL_FRAG, {
      iResolution: {
        value: resolution
      },
      iMouse: {
        value: this.mousePosition
      },
      iChannel0: {
        value: null
      },
      iChannel1: {
        value: null
      }
    });
    this.animate();
  }

  //----- RUN

  animate() {
    requestAnimationFrame(() => {
      this.bufferA.uniforms['iFrame'].value = this.counter++;
      this.bufferA.uniforms['iChannel0'].value = this.targetA.readBuffer.texture;
      //this.bufferA.uniforms['iChannel1'].value = this.targetB.readBuffer.texture;
      this.targetA.render(this.bufferA.scene, this.orthoCamera);
      this.bufferB.uniforms['iChannel0'].value = this.targetA.readBuffer.texture;
      this.targetB.render(this.bufferB.scene, this.orthoCamera);
      this.bufferImage.uniforms['iChannel0'].value = this.targetB.readBuffer.texture;
      this.bufferImage.uniforms['iChannel1'].value = this.targetA.readBuffer.texture;
      this.targetC.render(this.bufferImage.scene, this.orthoCamera, true);
      this.animate();
    });
  }
}


//----- SHADER HANDLING

class BufferShader {
  constructor(fragmentShader, uniforms = {}) {
    this.uniforms = uniforms;
    this.material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader: VERTEX_SHADER,
      uniforms
    });
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.material));
  }
}
class BufferManager {
  constructor(renderer, {
    width,
    height
  }) {
    this.renderer = renderer;
    this.readBuffer = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false
    });
    this.writeBuffer = this.readBuffer.clone();
  }
  swap() {
    const temp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = temp;
  }
  render(scene, camera, toScreen = false) {
    if (toScreen) {
      this.renderer.render(scene, camera);
    } else {
      this.renderer.render(scene, camera, this.writeBuffer, true);
    }
    this.swap();
  }
}
document.addEventListener('DOMContentLoaded', () => {
  (new App()).start();
});



