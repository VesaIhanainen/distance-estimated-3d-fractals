#define GL_GLEXT_PROTOTYPES
#include <glm/gtc/matrix_transform.hpp>
#include <GLFW/glfw3.h>
#include <string>
#include <iostream>
#include <fstream>

#include <math.h>
#include "aids.hpp"

using namespace aids;

const int WINDOW_WIDTH = 800;
const int WINDOW_HEIGHT = 600;


const float EYE_DISTANCE = 50.0;
const float PIXEL_COLUMNS = 800;
const float PIXEL_ROWS = 600;
const float PIXEL_WIDTH  = 1.0;
const float PIXEL_HEIGHT  = 1.0;
const float SCREEN_WIDTH = (float(PIXEL_COLUMNS) * PIXEL_WIDTH);
const float SCREEN_HEIGHT = (float(PIXEL_ROWS) * PIXEL_HEIGHT);


std::string load_shader(std::string file_name){
    std::ifstream file_stream(file_name, std::ios::in | std::ios::binary);
    if(file_stream){
        std::string shader_code;
        file_stream.seekg(0,std::ios::end);
        shader_code.resize(file_stream.tellg());
        file_stream.seekg(0,std::ios::beg);
        file_stream.read(&shader_code[0], shader_code.size());
        file_stream.close();
        return(shader_code);
    }
    println(stderr,"Shader file: ",file_name.c_str()," not found");
    return NULL;
}

struct Shader
{
    GLuint unwrap;
};

Shader compile_shader(std::string source_code, GLenum shader_type)
{
    GLuint shader = {};
    const char* c_str_shader = source_code.c_str();
    shader = glCreateShader(shader_type);
    if (shader == 0) {
        println(stderr, "Could not create a shader");
        exit(1);
    }

    glShaderSource(shader, 1, &c_str_shader, 0);
    glCompileShader(shader);

    GLint compiled = 0;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);
    if (!compiled) {
        GLchar buffer[1024];
        int length = 0;
        glGetShaderInfoLog(shader, sizeof(buffer), &length, buffer);
        println(stderr, "Could not compile shader: ", buffer);
        exit(1);
    }

    return {shader};
}

struct Program
{
    GLuint unwrap;
};

Program link_program(Shader vertex_shader, Shader fragment_shader)
{
    GLuint program = glCreateProgram();

    if (program == 0) {
        println(stderr, "Could not create shader program");
        exit(1);
    }

    glAttachShader(program, vertex_shader.unwrap);
    glAttachShader(program, fragment_shader.unwrap);
    glLinkProgram(program);

    GLint linked = 0;
    glGetProgramiv(program, GL_LINK_STATUS, &linked);
    if (!linked) {
        GLchar buffer[1024];
        int length = 0;
        glGetProgramInfoLog(program, sizeof(buffer), &length, buffer);
        println(stdout, "Could not link the program: ", buffer);
        exit(1);
    }

    return {program};
}

int main(int argc, char *argv[])
{
    if (!glfwInit()) {
        println(stderr, "Could not initialize GLFW");
        exit(1);
    }
    defer(glfwTerminate());

    auto window = glfwCreateWindow(WINDOW_WIDTH, WINDOW_HEIGHT, "Vodus", NULL, NULL);
    if (!window) {
        println(stderr, "Could not create window");
        exit(1);
    }

    glfwMakeContextCurrent(window);
    std::string vertex_shader_source = load_shader("vertex.vert");
    std::string fragment_shader_source = load_shader("fragment.frag");

    println(stdout, "Compiling vertex shader...");
    Shader vertex_shader = compile_shader(vertex_shader_source, GL_VERTEX_SHADER);
    println(stdout, "Compiling fragment shader...");
    Shader fragment_shader = compile_shader(fragment_shader_source, GL_FRAGMENT_SHADER);
    println(stdout, "Linking the program...");
    Program program = link_program(vertex_shader, fragment_shader);

    glUseProgram(program.unwrap);

    GLint spreadLocation = glGetUniformLocation(program.unwrap, "spread");
    float a = 0.0f;

    while (!glfwWindowShouldClose(window)) {
        a = fmodf(a + 0.05f,  4 * M_PI);
        glUniform1f(spreadLocation, a);
        glDrawArrays(GL_QUADS, 0, 4);
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    return 0;
}
