#version 130
out vec4 color;
uniform float spread;

#define FOW float(90.0)
#define R float(4.0)
#define Pi 3.1415926
#define MINIMUM_DISTANCE 0.1
#define MAXIMUM_RAY_STEPS 1000
#define SCREEN_WIDTH 600
#define SCREEN_HEIGHT 800
float DE(vec3 p) {
    return min(
        length(p-vec3(2*sin(spread),0.0,0.0)) - R,
        length(p+vec3(2*sin(spread),0.0,0.0)) - R);
}
float displacement(vec3 p){
    float dsp = sin(20*p.x)*sin(20*p.y)*sin(20*p.z);
    return dsp;
}
float opBend(vec3 p){
    const float k = 1.0;
    float c = cos(k*p.x);
    float s = sin(k*p.x);
    mat2 m = mat2(c,-s,s,c);
    vec3 q = vec3(m*p.xy,p.z);
    return DE(p);
}
float opDisplace(vec3 p){
    float d1 = DE(p);
    float d2 = displacement(p);
    return d1+ 0.25*d2;
}
float trace(vec4 from, vec4 direction)
{
    float totalDistance = 0.0;
    
    int steps;
    for (steps = 0; steps < MAXIMUM_RAY_STEPS; ++steps) {
        vec3 p = from.xyz + totalDistance * direction.xyz;
        float distance = opDisplace(p);
        totalDistance += distance;
        if (distance < MINIMUM_DISTANCE) break;
    }

    return 1.0 - min(float(steps) / 20.0, 1.0);
}
mat4 set_camera(vec3 eye, vec3 look_at, vec3 up)
{
    vec3 f = normalize(look_at-eye);
    vec3 s = normalize(cross(f,up));
    vec3 u = cross(s,f);
    return mat4(
        vec4(s,0.0),
        vec4(u,0.0),
        vec4(-f,0.0),
        vec4(0.0,0.0,0.0,1));
}

vec3 rayDir(float FoW, vec2 size, vec2 fragCoord){
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(FoW)/2.0);
    return normalize(vec3(xy,-z));
}

void main(void) {
    vec4 view_dir = vec4(rayDir(FOW,vec2(SCREEN_WIDTH, SCREEN_HEIGHT),gl_FragCoord.xy),1.0);
    vec3 eye = vec3(0.0+10*sin(0.5*spread),0.0+10*cos(0.5*spread),25);
    vec3 look_at = vec3(0,0,0);
    vec3 up = vec3(0,0.0,1.0);
    mat4 ca = set_camera(eye,look_at,up);
    float t = trace(vec4(eye,1.0), ca*view_dir);
    if(t > 0)
        t = pow(0.25,t);
    color = vec4(t, t, t, 1.0);
};
