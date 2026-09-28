// vertex shader: buat mengolah posisi setiap titik/vertex 
export const vertexShaderSource = `#version 300 es
    in vec2 a_position; // titik awal
    uniform mat3 u_matrix; // matrix transformasi
    
    void main() {
        vec3 p = u_matrix * vec3(a_position, 1.0); // posisi akhir berdasarkan transformasi matrix 
        gl_Position = vec4(p.xy, 0.0, 1.0); // ubah ke vec4 & kirim ke pipeline
        gl_PointSize = 8.0; // mengatur ukuran titik 
    }
`;

// fragment shader: buat mewarnai setiap piksel
export const fragmentShaderSource = `#version 300 es
    precision highp float;
    out vec4 outColor;
    uniform vec4 u_color;

    void main() {
        outColor = u_color;
    }
`;