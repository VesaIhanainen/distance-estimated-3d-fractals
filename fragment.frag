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
#define EPSILON 0.001
struct Light
{
    vec3 diffuse;
    vec3 specular;
};
struct pointLight
{
    vec3 position;
    vec3 diffuse_color;
    float diffuse_power;
    vec3 specular_color;
    float specular_power;
    float specular_hardness;
};


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
vec3 estimate_normal(vec3 p){
    return normalize(vec3(
    DE(vec3(p.x+EPSILON,p.y,p.z) - vec3(p.x-EPSILON,p.y,p.z)), 
    DE(vec3(p.x,p.y+EPSILON,p.z) - vec3(p.x,p.y-EPSILON,p.z)),
    DE(vec3(p.x,p.y,p.z+EPSILON) - vec3(p.x,p.y,p.z-EPSILON))));
}

Light blinn_phong(pointLight light, vec3 pos, vec3 view_dir, vec3 normal){
    Light light_out;
    float distance = length(light.position - pos);
    vec3 light_dir = normalize(light.position - pos);
    distance = distance * distance;
    float NdotL = dot(normal, light_dir);
    float intensity = clamp(NdotL,0.0,1.0);
    light_out.diffuse = intensity * light.diffuse_color * light.diffuse_power/ distance;
    vec3 H = normalize(light_dir + view_dir);
    float NdotH = dot(normal, H);
    intensity = pow(clamp(NdotH,0.0,1.0),light.specular_hardness);
    light_out.specular = intensity * light.specular_color * light.specular_power / distance;
    
    return light_out;
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
    pointLight light;
    light.position = vec3(0,0,50.0);
    light.diffuse_color = vec3(0.9,0.9,0.9);
    light.diffuse_power = 200;
    light.specular_color = vec3(0.9,0.9,0.9);
    light.specular_power = 160;
    light.specular_hardness = 16.0;
    Light light_out = blinn_phong(light, eye, look_at, estimate_normal((ca*view_dir).xyz));
    //if(t > 0.1)
    //    t = pow(0.25,t);
    vec3 diffuse = light_out.diffuse;
    vec3 specular = light_out.specular;
    vec3 ambient = vec3(t) + diffuse + specular;
    vec3 color_gamma_corr = pow(ambient,vec3(1.0/2.2));
    color = vec4(ambient, 1.0);
};
