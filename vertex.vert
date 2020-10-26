#version 130
#define EYE_DISTANCE 50.0
#define PIXEL_COLUMNS 800
#define PIXEL_ROWS 600
#define PIXEL_WIDTH 1.0
#define PIXEL_HEIGHT 1.0
#define SCREEN_WIDTH (float(PIXEL_COLUMNS) * PIXEL_WIDTH)
#define SCREEN_HEIGHT (float(PIXEL_ROWS) * PIXEL_HEIGHT)

void main(void)
{
    int gray = gl_VertexID ^ (gl_VertexID >> 1);
    vec4 gray_vec = vec4(
        2 * (gray / 2) - 1,
        2 * (gray % 2) - 1,
        0.0,
        1.0);
    gl_Position = gray_vec;
};