// BUFFER A

//Based on https://www.shadertoy.com/view/4sK3WK by stb - thank you for your help!
//Simplified drawing only, no deleting cells, no moving cells. See original for that

const float Key_R = 82.5 / 256.;

#define t2D(o) texture(iChannel0, uv-o/res)
#define isKeyHeld(key) texture(iChannel3, vec2(key, .2)).r > 0.
//#define dataAt(x) texture(iChannel0, vec2(x+.5, .5)/res)
#define dataAt(x) texture(iChannel0, vec2(x, 0.)/res) // check if halfpoint is necessary


// hash without sine
// https://www.shadertoy.com/view/4djSRW
#define MOD3 vec3(443.8975,397.2973, 491.1871)
float hash12(vec2 p) {
	vec3 p3  = fract(vec3(p.xyx) * MOD3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 res = iResolution.xy;
    vec2 fc = fragCoord;
	vec2 uv = fc / res;
    vec3 o = vec3(1., -1., 0.);
    
    // set up neighborhood filter size 3
    vec2 dirs[8];
    dirs[0] = o.xz; dirs[1] = o.yz; dirs[2] = o.zx; dirs[3] = o.zy;
    dirs[4] = o.xx; dirs[5] = o.yx; dirs[6] = o.xy; dirs[7] = o.yy;
    
    // get current pixel position from last frame - (uv-(0.,0)/res)
    vec2 pos = t2D(o.zz).rg;  // current position, processed from last frame, stored in RG
    
    // get data about mouse from previous frame
    //vec2 sPos = dataAt(2.).ba;  // moving frame - if mouse hold BA - at (2.5, .5)/res;
    // savedPosition, this is used for 
    
    vec2 mOld = dataAt(0.).ba;  // mouseOld BA - at (0., 0.5)/res
    
    // is the mouse being held? - if so there would be data in z/b channel of previous frame
    float isMHeld;// = dataAt(1.).b;  
    
    // NEIGHBORHOOD PROCESSING
    for(int i=0; i<8; i++) {
        // neighbor's stored position
        vec2 iPos = t2D(dirs[i]).rg;
        
        // if circle produced by neighbor is less than the current one, take its position
        if(length(fc-iPos) < length(fc-pos))
            pos = iPos;
    }
    
    // If mouse is held
    bool mouseHeld = true; //iMouse.z>0.;
    
    if(mouseHeld) {
        // cell position under mouse
        // uses t-input as a way to map coordinate - not necessary!
        vec2 posUnderMouse = iMouse.xy/res;  //texture(iChannel0, iMouse.xy/res).rg; 
        
        
        // Do checks for all of the buttons
        // remove cell
        /*
        if (isKeyHeld(Key_X)) {       // ---------------- REPLACE WITH UNIFORM
			if(pos==posUnderMouse)
                pos = vec2(-10000.); // make black
        }
        */

            
        // add cell
          if(length(fc-iMouse.xy)<length(fc-pos)){
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
    if(iFrame ==0) {
        if(pow(length(fc/res.y-vec2(.5*res.x/res.y, 0.)), sphereShape) > hash12(uv)) {
            pos = fc;  // multiplying a scalar here is dope
        }
        else {
            pos = vec2(-10000.); }
        isMHeld = 0.;
    }
    
    
    // ------- CLEAR FRAMEBUFFER --------
    // clear stored positions when R is pressed    // ---------------- REPLACE WITH UNIFORM
	if(isKeyHeld(Key_R))
        pos = vec2(-10000.);
    // or could also be done on frame
    //if(iFrame == 100)
    //    pos = vec2(-10000.);
    
    
    
    
    // ------- STORE OUTPUTS --------
    
    // save cell position(s) - RG
    fragColor.rg = pos;
    
    
    // STORE MOUSE POS
    // save old mouse position - if current pixel (o.zz) is this fragcoord - put in BA
    if(floor(fc)==o.zz) {      // floor(fc) gives only integer coords, not #.5 coords
        fragColor.ba = mOld;   // store straight mouse.xy in BA
    }
    
    
    // STORE BUTTON STATES - NOT IN USE    
    /*
    else
        // save button held state in this coordinate, right of current - B
    	if(floor(fc)==o.xz)
            fragColor.b = isMHeld; // float, if mouse was held in this frame, in B
    */        
    
    
    // Sanity check -  remember straight reading of texture in image
    //fragColor = vec4(1.,0.,0.,1); 
    
    // DEBUG CHECKS
    //fragColor = vec4(vec3(isMHeld),1); // float check
    //fragColor = vec4(mOld,0.,1);  // yellow - straight mouse.xy
    //fragColor = vec4(sPos,0.,1);  // green
    //fragColor = vec4(floor(fc), 0., 1.); // yellow with green and red line at left and bottom
}



// IMAGE

//Based on https://www.shadertoy.com/view/4sK3WK by stb - thank you for your help!

#define t2D(o) texture(iChannel0, uv-o/res)

#define plane(p, n) 1. - abs(dot(p, n))*res.y

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	vec2 res = iResolution.xy;
    vec2 uv = fragCoord / res;
    vec2 p = fragCoord / res.y;
    vec3 o = vec3(1., -1., 0.);
    
    // cross neighborhood processing
    vec2 dirs[4];
    dirs[0] = o.xz; dirs[1] = o.yz; dirs[2] = o.zx; dirs[3] = o.zy;
    
    // current position from the buffer iChannel0
    vec2 pos = t2D(o.zz).rg;
    
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
    vec4 tc = texture(iChannel1, pos/res.xy);
    
    // Make cell walls
    for(int i=0; i<6; i++) {
        vec2 iPos = t2D(dirs[i]).rg; // sampling from iChannel0 - RG 
        if(pos!=iPos)
            w = max(w, plane(p-mix(pos, iPos, .5)/res.y, normalize(pos-iPos)));
            //w = 1.-w;
    }
    
    // SOME OTHER FUN EFFECTS TO TRY OUT WHEN BLENDING
    // original color with white walls and + colored base (r,g,b)
    // vec4 col = vec4(vec3(c) * vec3(.7, .6, .5) + w , 1.);
    
    // grayscale and white walls
    // vec4 col = vec4(vec3(c) + w , 1.);
    
    // grayscale
    // vec4 col = vec4(vec3(c), 1.);
    
    // gradient on individual tiles (bump mappy look) + texture sampling (uncomment both)
    // c = (p-pos/res.y).r; // gradient from left side, or try .g from below, or res.x
    // vec4 col = vec4(vec3(c) + w , 1.) + tc;
    
    // gradient + texture sampling
    vec4 col = vec4(vec3(c)*tc.rgb + w, 1.);
    
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
    
    // SANITY CHECK - Show whats in the buffer
    //fragColor = texture(iChannel0, uv);
    
}