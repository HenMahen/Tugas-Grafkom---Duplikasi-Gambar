import { vertexShaderSource, fragmentShaderSource } from "./shaders.js";
import { Mat3 } from "./matrix3.js";

// Setup canvas & WebGL2 context
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL2 tidak tersedia");
}

// Helper compile shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("Shader compile error:\n" + info);
    }
    return shader;
}

// Helper link program
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("Program link error:\n" + info);
    }
    return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

gl.useProgram(program);

// Lokasi uniform
const colorLocation = gl.getUniformLocation(program, "u_color");
const matrixLocation = gl.getUniformLocation(program, "u_matrix");

// Derajat ke radian
function degToRad(degree) {
    return (degree * Math.PI) / 180;
}

// Matriks TRS: Translasi * Rotasi * Skala
function createTRSMatrix(x, y, rotationDeg = 0, scaleX = 1, scaleY = 1) {
    const t = Mat3.translation(x, y);
    const r = Mat3.rotation(degToRad(rotationDeg));
    const s = Mat3.scaling(scaleX, scaleY);

    let matrix = Mat3.multiply(t, r);
    matrix = Mat3.multiply(matrix, s);
    return matrix;
}

// Helper buffer & attribute
const positionBuffer = gl.createBuffer();
const positionLocation = gl.getAttribLocation(program, "a_position");

function upload_and_draw(vertices, drawMode, matrix, r, g, b, a = 1.0) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix3fv(matrixLocation, false, matrix);
    gl.uniform4f(colorLocation, r, g, b, a);

    gl.drawArrays(drawMode, 0, vertices.length / 2);
}

// Palet Warna 
const COLORS = {
    langit: [164 / 255, 221 / 255, 246 / 255, 1.0],      // Biru Langit Cerah
    matahari: [255 / 255, 223 / 255, 0 / 255, 1.0],      // Kuning Sinar
    gunung: [131 / 255, 102 / 255, 85 / 255, 1.0],       // Cokelat Gunung
    rumput: [196 / 255, 228 / 255, 153 / 255, 1.0],      // Hijau Muda Padang Rumput
    daunPohon: [49 / 255, 180 / 255, 52 / 255, 1.0],     // Hijau Daun Cerah
    batangPohon: [45 / 255, 75 / 255, 35 / 255, 1.0],    // Hijau Tua / Cokelat Batang
    atapRumah: [224 / 255, 52 / 255, 53 / 255, 1.0],     // Merah Atap
    dindingRumah: [248 / 255, 248 / 255, 242 / 255, 1.0],// Putih / Off-White
    pintuJendela: [255 / 255, 252 / 255, 180 / 255, 1.0],// Kuning Muda
    jalanRaya: [215 / 255, 223 / 255, 220 / 255, 1.0],   // Abu-Abu Jalan
    outlineHitam: [0 / 255, 0 / 255, 0 / 255, 1.0],      // Garis Outline Hitam
    awanPutih: [1.0, 1.0, 1.0, 0.95]                     // Putih Awan
};

// Geometri Dasar Local Space (Persegi, lingkaran, Segitiga) 
// Persegi 
const unitSquare = new Float32Array([
    -0.5, -0.5,
     0.5, -0.5,
     0.5,  0.5,
    -0.5, -0.5,
     0.5,  0.5,
    -0.5,  0.5
]);

// Lingkaran 
function createCircle(segments) {
    const verts = [0, 0];
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        verts.push(Math.cos(angle) * 0.5);
        verts.push(Math.sin(angle) * 0.5);
    }
    return new Float32Array(verts);
}

function createCircleOutline(segments) {
    const verts = [];
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        verts.push(Math.cos(angle) * 0.5);
        verts.push(Math.sin(angle) * 0.5);
    }
    return new Float32Array(verts);
}

const unitCircle = createCircle(48);
const unitCircleOutline = createCircleOutline(48);

// Geometri Objek 
// Gunung Kiri
const gunungKiri_geo = new Float32Array([
    -1.10, 0.18, // kiri bawah 
    -0.12, 0.18, // kanan bawah 
    -0.55, 0.72  // puncak segitiga tajam
]);

const gunungKiri_outline = new Float32Array([
    -1.10, 0.18,
    -0.55, 0.72,
    -0.12, 0.18
]);

//  Gunung Kanan
const gunungKanan_geo = new Float32Array([
    -0.12, 0.18, // kiri bawah 
     1.10, 0.18, // kanan bawah 
     0.42, 0.74  // puncak segitiga tajam
]);

const gunungKanan_outline = new Float32Array([
    -0.12, 0.18,
     0.42, 0.74,
     1.10, 0.18
]);

// Padang Rumput 
const padangRumput_geo = new Float32Array([
    -1.10, -1.05,
     1.10, -1.05,
     1.10,  0.18,
    -1.10, -1.05,
     1.10,  0.18,
    -1.10,  0.18
]);

const horizon_line = new Float32Array([
    -1.10, 0.18,
     1.10, 0.18
]);

// Jalan 
const jalan_geo = new Float32Array([
    -0.13,  0.18, // atas kiri
     0.25, -1.05, // bawah kiri
     0.58, -1.05, // bawah kanan

    -0.13,  0.18, // atas kiri
     0.58, -1.05, // bawah kanan
    -0.11,  0.18  // atas kanan
]);

const jalan_outlineKiri = new Float32Array([
    -0.13,  0.18,
     0.25, -1.05
]);

const jalan_outlineKanan = new Float32Array([
    -0.11,  0.18,
     0.58, -1.05
]);

// Marka garis putus-putus tengah jalan
const markaJalan_lines = [];
const numDashes = 7;
for (let i = 0; i < numDashes; i++) {
    const t1 = 0.16 + (i / numDashes) * 0.75;
    const t2 = t1 + 0.055;
    const x1 = -0.12 + t1 * (0.415 - (-0.12));
    const y1 = 0.18 - t1 * (0.18 - (-1.05));
    const x2 = -0.12 + t2 * (0.415 - (-0.12));
    const y2 = 0.18 - t2 * (0.18 - (-1.05));
    markaJalan_lines.push(x1, y1, x2, y2);
}
const markaJalan_geo = new Float32Array(markaJalan_lines);

// Tanaman Padang Rumput (Padi)
function createPadiShape(x, y, w, h) {
    return new Float32Array([
        x - w * 0.5, y + h * 0.75, // ujung daun kiri
        x,           y,             // pangkal rumpun
        x + w * 0.5, y + h          // ujung daun kanan (lebih tinggi)
    ]);
}

const padiPositions = [
    { x:  0.5844, y: -0.0132, w: 0.052, h: 0.060 }, // 1 (dekat horizon)
    { x:  0.2229, y: -0.1060, w: 0.056, h: 0.099 }, // 2
    { x:  0.7294, y: -0.1258, w: 0.048, h: 0.060 }, // 3
    { x:  0.4329, y: -0.1854, w: 0.052, h: 0.086 }, // 4
    { x:  0.8680, y: -0.1589, w: 0.039, h: 0.040 }, // 5
    { x:  0.5801, y: -0.2252, w: 0.035, h: 0.066 }, // 6
    { x:  0.3636, y: -0.3245, w: 0.052, h: 0.080 }, // 7
    { x:  0.7835, y: -0.3179, w: 0.069, h: 0.053 }, // 8
    { x:  0.1234, y: -0.3510, w: 0.022, h: 0.073 }, // 9 (pinggir jalan atas)
    { x:  0.6277, y: -0.4106, w: 0.052, h: 0.080 }, // 10
    { x:  0.1948, y: -0.4967, w: 0.026, h: 0.066 }, // 11 (pinggir jalan tengah)
    { x:  0.4827, y: -0.5232, w: 0.074, h: 0.066 }, // 12
    { x:  0.8095, y: -0.5828, w: 0.043, h: 0.066 }, // 13
    { x:  0.6818, y: -0.5762, w: 0.048, h: 0.053 }, // 14
    { x:  0.2727, y: -0.6954, w: 0.035, h: 0.093 }, // 15 (pinggir jalan bawah)
    { x:  0.5628, y: -0.7219, w: 0.061, h: 0.066 }, // 16
    { x:  0.7035, y: -0.8079, w: 0.074, h: 0.053 }, // 17
    { x:  0.3658, y: -0.9007, w: 0.039, h: 0.086 }  // 18 (paling bawah dekat jalan)
];

// Rumah 
// Atap sisi depan 
const atapDepan_geo = new Float32Array([
    -0.472, -0.099, // kiri atas bubungan
    -0.576, -0.391, // kiri bawah teritisan
    -0.290, -0.437, // kanan bawah pertemuan atap
    -0.472, -0.099, // kiri atas bubungan
    -0.290, -0.437, // kanan bawah pertemuan atap
    -0.186, -0.113  // kanan atas bubungan
]);

const atapDepan_outline = new Float32Array([
    -0.472, -0.099,
    -0.576, -0.391,
    -0.290, -0.437,
    -0.186, -0.113
]);

// Atap sisi samping 
const atapSamping_geo = new Float32Array([
    -0.186, -0.113, // puncak segitiga atap
    -0.290, -0.437, // kiri bawah (menyatu dengan atap depan)
    -0.035, -0.437  // kanan bawah teritisan samping
]);

const atapSamping_outline = new Float32Array([
    -0.186, -0.113,
    -0.290, -0.437,
    -0.035, -0.437
]);

// Dinding depan rumah 
const dindingDepan_geo = new Float32Array([
    -0.576, -0.391, // kiri atas
    -0.576, -0.623, // kiri bawah
    -0.299, -0.682, // kanan bawah
    -0.576, -0.391, // kiri atas
    -0.299, -0.682, // kanan bawah
    -0.299, -0.437  // kanan atas
]);

const dindingDepan_outline = new Float32Array([
    -0.576, -0.391,
    -0.576, -0.623,
    -0.299, -0.682,
    -0.299, -0.437
]);

// Dinding samping rumah 
const dindingSamping_geo = new Float32Array([
    -0.299, -0.437, // kiri atas
    -0.299, -0.682, // kiri bawah
    -0.069, -0.682, // kanan bawah
    -0.299, -0.437, // kiri atas
    -0.069, -0.682, // kanan bawah
    -0.069, -0.437  // kanan atas
]);

const dindingSamping_outline = new Float32Array([
    -0.299, -0.437,
    -0.299, -0.682,
    -0.069, -0.682,
    -0.069, -0.437
]);
    
// Pintu rumah
const pintu_geo = new Float32Array([
    -0.152, -0.484, // kiri atas
    -0.152, -0.682, // kiri bawah
    -0.100, -0.682, // kanan bawah
    -0.152, -0.484, // kiri atas
    -0.100, -0.682, // kanan bawah
    -0.100, -0.484  // kanan atas
]);

const pintu_outline = new Float32Array([
    -0.152, -0.484,
    -0.152, -0.682,
    -0.100, -0.682,
    -0.100, -0.484
]);

// Jendela di dinding depan
const jendelaDepan = [
    { cx: -0.515, cy: -0.510, w: 0.050, h: 0.080 },
    { cx: -0.437, cy: -0.523, w: 0.050, h: 0.080 },
    { cx: -0.359, cy: -0.536, w: 0.050, h: 0.080 }
];

// Jendela di dinding samping
const jendelaSamping = { cx: -0.216, cy: -0.546, w: 0.055, h: 0.075 };

// Batang Pohon
const batangPohon_geo = new Float32Array([
    -0.77, -0.42, // kiri atas
    -0.79, -0.76, // kiri bawah (melebar)
    -0.69, -0.76, // kanan bawah
    -0.77, -0.42, // kiri atas
    -0.69, -0.76, // kanan bawah
    -0.71, -0.42  // kanan atas
]);

// Burung 
function createBirdShape(cx, cy, halfW, drop, rise, segments = 12) {
    const quad = (p0, p1, p2, t) => {
        const u = 1 - t;
        return [
            u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
        ];
    };

    // Sayap yang melengkung 
    const p0 = [cx - halfW, cy - drop];           // ujung sayap kiri (melengkung ke bawah)
    const p1 = [cx - halfW * 0.52, cy + rise * 1.6]; // puncak busur sayap kiri
    const p2 = [cx, cy];                          // badan tengah
    const p3 = [cx, cy];                          // badan tengah
    const p4 = [cx + halfW * 0.52, cy + rise * 1.4]; // puncak busur sayap kanan
    const p5 = [cx + halfW, cy - drop * 1.2];     // ujung sayap kanan (melengkung ke bawah)

    const verts = [];
    for (let i = 0; i <= segments; i++) {
        verts.push(...quad(p0, p1, p2, i / segments));
    }
    for (let i = 1; i <= segments; i++) {
        verts.push(...quad(p3, p4, p5, i / segments));
    }
    return new Float32Array(verts);
}

// Sinar matahari lokal 
const sunRayLines = [];
const numRays = 12;
for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    const r1 = 0.30;
    const r2 = 0.50;
    sunRayLines.push(
        Math.cos(angle) * r1, Math.sin(angle) * r1,
        Math.cos(angle) * r2, Math.sin(angle) * r2
    );
}
const localSunRays_geo = new Float32Array(sunRayLines);

// State Objek & Animasi 
const state = {
    // 1. Sinar matahari berputar
    matahari: {
        x: -0.12,
        y: 0.18,
        rotasi: 0,
        kecepatanRotasi: 8 // derajat per detik
    },

    // 2. Awan melayang
    awan: [
        { x: -0.20, y: 0.82, speed: 0.00008, scale: 0.95 },
        { x: -1.10, y: 0.88, speed: 0.00005, scale: 0.70 }
    ],

    // Pohon 
    pohon: {
        centerX: -0.74,
        centerY: -0.32
    },

    // Burung 
    burung: [
        { x: 0.643, y: 0.838, halfW: 0.078, drop: 0.025, rise: 0.030 },
        { x: 0.820, y: 0.613, halfW: 0.082, drop: 0.030, rise: 0.035 }
    ]
};

let lastTimestamp = 0;

// Fungsi Update Animasi 
function update(dt) {
    const dtSeconds = dt / 1000;

    // 1. Update rotasi sinar matahari
    state.matahari.rotasi = (state.matahari.rotasi + state.matahari.kecepatanRotasi * dtSeconds) % 360;

    // 2. Update pergerakan awan melayang
    for (const a of state.awan) {
        a.x += a.speed * dt;
        if (a.x > 1.4) {
            a.x = -1.4;
        }
    }
}

// Fungsi Draw Scene 
function drawScene(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    update(dt);

    // Background Langit Biru Cerah
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...COLORS.langit);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const identity = Mat3.identity();

    // Awan melayang 
    for (const a of state.awan) {
        const cloudLobes = [
            { ox:  0.00, oy:  0.00, sx: 0.26, sy: 0.16 },
            { ox: -0.12, oy: -0.02, sx: 0.18, sy: 0.13 },
            { ox:  0.12, oy: -0.02, sx: 0.18, sy: 0.13 },
            { ox: -0.03, oy:  0.05, sx: 0.16, sy: 0.12 }
        ];

        for (const cl of cloudLobes) {
            upload_and_draw(
                unitCircle,
                gl.TRIANGLE_FAN,
                createTRSMatrix(a.x + cl.ox * a.scale, a.y + cl.oy * a.scale, 0, cl.sx * a.scale, cl.sy * a.scale),
                ...COLORS.awanPutih
            );
        }
    }

    // Matahari & Sinar 
    upload_and_draw(
        localSunRays_geo,
        gl.LINES,
        createTRSMatrix(state.matahari.x, state.matahari.y, state.matahari.rotasi, 1.0, 1.0),
        ...COLORS.outlineHitam
    );

    // Lingkaran matahari kuning
    upload_and_draw(
        unitCircle,
        gl.TRIANGLE_FAN,
        createTRSMatrix(state.matahari.x, state.matahari.y, 0, 0.58, 0.58),
        ...COLORS.matahari
    );
    // Outline matahari
    upload_and_draw(
        unitCircleOutline,
        gl.LINE_LOOP,
        createTRSMatrix(state.matahari.x, state.matahari.y, 0, 0.58, 0.58),
        ...COLORS.outlineHitam
    );

    // Gunung
    upload_and_draw(gunungKiri_geo, gl.TRIANGLES, identity, ...COLORS.gunung);
    upload_and_draw(gunungKiri_outline, gl.LINE_STRIP, identity, ...COLORS.outlineHitam);

    upload_and_draw(gunungKanan_geo, gl.TRIANGLES, identity, ...COLORS.gunung);
    upload_and_draw(gunungKanan_outline, gl.LINE_STRIP, identity, ...COLORS.outlineHitam);

    // Padang Rumput 
    upload_and_draw(padangRumput_geo, gl.TRIANGLES, identity, ...COLORS.rumput);
    upload_and_draw(horizon_line, gl.LINES, identity, ...COLORS.outlineHitam);

    // Detail Ladang / Sawah
    for (const p of padiPositions) {
        const padi = createPadiShape(p.x, p.y, p.w, p.h);
        upload_and_draw(padi, gl.LINE_STRIP, identity, ...COLORS.outlineHitam);
    }

    // Jalan Raya
    upload_and_draw(jalan_geo, gl.TRIANGLES, identity, ...COLORS.jalanRaya);
    upload_and_draw(jalan_outlineKiri, gl.LINES, identity, ...COLORS.outlineHitam);
    upload_and_draw(jalan_outlineKanan, gl.LINES, identity, ...COLORS.outlineHitam);
    upload_and_draw(markaJalan_geo, gl.LINES, identity, ...COLORS.outlineHitam);

    // Rumah 
    upload_and_draw(dindingDepan_geo, gl.TRIANGLES, identity, ...COLORS.dindingRumah);
    upload_and_draw(dindingDepan_outline, gl.LINE_LOOP, identity, ...COLORS.outlineHitam);

    // Dinding samping rumah 
    upload_and_draw(dindingSamping_geo, gl.TRIANGLES, identity, ...COLORS.dindingRumah);
    upload_and_draw(dindingSamping_outline, gl.LINE_LOOP, identity, ...COLORS.outlineHitam);

    // Jendela depan 
    for (const j of jendelaDepan) {
        upload_and_draw(unitSquare, gl.TRIANGLES, createTRSMatrix(j.cx, j.cy, 0, j.w + 0.014, j.h + 0.014), ...COLORS.outlineHitam);
        upload_and_draw(unitSquare, gl.TRIANGLES, createTRSMatrix(j.cx, j.cy, 0, j.w, j.h), ...COLORS.pintuJendela);
    }

    // Jendela di dinding samping
    upload_and_draw(unitSquare, gl.TRIANGLES, createTRSMatrix(jendelaSamping.cx, jendelaSamping.cy, 0, jendelaSamping.w + 0.014, jendelaSamping.h + 0.014), ...COLORS.outlineHitam);
    upload_and_draw(unitSquare, gl.TRIANGLES, createTRSMatrix(jendelaSamping.cx, jendelaSamping.cy, 0, jendelaSamping.w, jendelaSamping.h), ...COLORS.pintuJendela);

    // Pintu di dinding samping
    upload_and_draw(pintu_geo, gl.TRIANGLES, identity, ...COLORS.pintuJendela);
    upload_and_draw(pintu_outline, gl.LINE_LOOP, identity, ...COLORS.outlineHitam);
    
    // Gagang pintu bulat hitam
    upload_and_draw(unitCircle, gl.TRIANGLE_FAN, createTRSMatrix(-0.110, -0.585, 0, 0.014, 0.014), ...COLORS.outlineHitam);

    // Atap depan (Merah) & outline hitam
    upload_and_draw(atapDepan_geo, gl.TRIANGLES, identity, ...COLORS.atapRumah);
    upload_and_draw(atapDepan_outline, gl.LINE_LOOP, identity, ...COLORS.outlineHitam);

    // Atap samping (Merah) & outline hitam - menyatu sempurna pada rusuk bersama
    upload_and_draw(atapSamping_geo, gl.TRIANGLES, identity, ...COLORS.atapRumah);
    upload_and_draw(atapSamping_outline, gl.LINE_LOOP, identity, ...COLORS.outlineHitam);

    // Pohon 
    // Batang pohon
    upload_and_draw(batangPohon_geo, gl.TRIANGLES, identity, ...COLORS.batangPohon);

    // Dedaunan pohon 
    const lobes = [
        { ox:  0.00, oy:  0.00, sx: 0.24, sy: 0.26 }, // pusat kanopi
        { ox: -0.09, oy: -0.06, sx: 0.18, sy: 0.20 }, // kiri bawah
        { ox:  0.09, oy: -0.06, sx: 0.18, sy: 0.20 }, // kanan bawah
        { ox: -0.11, oy:  0.05, sx: 0.17, sy: 0.19 }, // kiri tengah
        { ox:  0.11, oy:  0.05, sx: 0.17, sy: 0.19 }, // kanan tengah
        { ox:  0.00, oy:  0.15, sx: 0.20, sy: 0.22 }  // atas
    ];

    for (const lobe of lobes) {
        upload_and_draw(
            unitCircle,
            gl.TRIANGLE_FAN,
            createTRSMatrix(state.pohon.centerX + lobe.ox, state.pohon.centerY + lobe.oy, 0, lobe.sx, lobe.sy),
            ...COLORS.daunPohon
        );
    }

    // Burung  
    for (const b of state.burung) {
        const bird_geo = createBirdShape(b.x, b.y, b.halfW, b.drop, b.rise);
        upload_and_draw(bird_geo, gl.LINE_STRIP, identity, ...COLORS.outlineHitam);
        upload_and_draw(bird_geo, gl.LINE_STRIP, createTRSMatrix(0, -0.003), ...COLORS.outlineHitam);
    }

    // Render loop
    requestAnimationFrame(drawScene);
}

// Mulai animasi
requestAnimationFrame(drawScene);
console.log('WebGL2 scene dirender dengan palet warna spesifik dan konfigurasi geometrik baru');
