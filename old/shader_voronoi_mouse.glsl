// Author: @patriciogv
// Title: Simple Voronoi

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;
    vec3 color = vec3(.0);

    // Scale the grid
    float gridScale = 3.;
    st *= gridScale;

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    float m_dist = 10.;  // minimum distance
    vec2 m_point;        // minimum point
    
    /*
    // one big cell
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    // "Cell positions"
    vec2 point[5];
    point[0] = vec2(0.83,0.75);
    point[1] = vec2(0.60,0.07);
    point[2] = vec2(0.28,0.64);
    point[3] =  vec2(0.31,0.26);
    point[4] = u_mouse/u_resolution;

    float m_dist = 1.;  // minimum distance

    // Iterate through the points positions
    for (int i = 0; i < 5; i++) {
        float dist = distance(st, point[i]);

        // Keep the closer distance
        m_dist = min(m_dist, dist);
    }
    // Draw the min distance (distance field)
    color += m_dist;
    */

    // mouse in grid cell - not if mouse is in grid
    vec2 mousegrid = u_mouse/u_resolution *gridScale;
    vec2 mousep = fract(mousegrid);
    float mousedist = 1.;
    vec2 mousediff;

    //vec2 m_point;
    
    for (int j=-1; j<=1; j++ ) {
        for (int i=-1; i<=1; i++ ) {
            vec2 neighbor = vec2(float(i),float(j)); /// Neighbor place in the grid
            vec2 point = random2(i_st + neighbor);	// Random position from current + neighbor place in the grid
            point = 0.5 + 0.5*sin(u_time* + 6.2831*point); // Animate
            
            // distance to neighbor
            vec2 diff = neighbor + point - f_st;	// Vector between the pixel and the point
            float dist = length(diff); 				// Distance to the point
            
        	if( dist < m_dist ) {
                m_dist = dist;
                m_point = point;
            }
            
            mousediff = neighbor + mousep - f_st;
            mousedist = length(mousediff);

        	// show mouse id
    		vec2 mouseid = floor(mousegrid);
    		if (mouseid == i_st) {
        		color.gr += i_st;	// show id's
        		//color.gr += mouseid;
                // mouse distance to point

            }
            if( mousedist < m_dist ) {
                m_dist = mousedist;
                m_point = mousep;
            }
            
            // draw mouse 
    		//color.g += 1.-step(0.05, mousedist);
            
        }
    }

    // show id
    //color.gr += i_st;
    
    // Assign a color using the closest point position
    color += dot(m_point,vec2(0.490,0.480));
    //color += m_dist;	// color as distance field
    //color += vec3(m_point, 0);	// RG colored 0-1 space in cell
    

    // Add distance field to closest point center
    //color.g = m_dist;

    // Show isolines
    //color -= abs(sin(40.0*m_dist))*0.07;

    // Draw cell center
    color += 1.-step(0.05, m_dist);

    // Draw grid
    //color.r += step(.98, f_st.x) + step(.98, f_st.y);

    gl_FragColor = vec4(color,1.0);
}

