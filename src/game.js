(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const gl = canvas.getContext('webgl', { antialias: true });
  if (!gl) {
    alert('WebGL не поддерживается в этом браузере. Откройте проект в Chrome/Edge/Firefox.');
    return;
  }

  const hudObjective = document.getElementById('objective');
  const statsEl = document.getElementById('stats');
  const promptEl = document.getElementById('prompt');
  const startScreen = document.getElementById('startScreen');
  const startBtn = document.getElementById('startBtn');
  const letterModal = document.getElementById('letterModal');
  const letterTitle = document.getElementById('letterTitle');
  const letterBody = document.getElementById('letterBody');
  const choicesEl = document.getElementById('choices');
  const memoryModal = document.getElementById('memoryModal');
  const memoryTitle = document.getElementById('memoryTitle');
  const memoryBody = document.getElementById('memoryBody');
  const memoryClose = document.getElementById('memoryClose');

  const state = {
    started: false,
    paused: true,
    love: 0,
    guilt: 0,
    madness: 0,
    letterIndex: 0,
    endingShown: false,
    camera: { x: 0, y: 1.65, z: 2.8, yaw: 0, pitch: 0 },
    keys: new Set(),
    mouseLocked: false,
    time: 0,
    currentInteract: null,
    seen: new Set(),
  };

  const letters = [
    {
      title: 'Письмо 1 — «Я вернулась»',
      body: 'Мой любимый,\n\nя вернулась. Помнишь дождь в тот день? Ты смеялся, а я пряталась под твоим пальто. Напиши мне... я так одинока здесь.',
      choices: [
        { text: 'Я тоже скучаю. Я всё ещё помню тепло твоих рук.', love: 2, guilt: 0, madness: 0, objective: 'Дом стал немного теплее. Осмотри гостиную, затем вернись к ящику.' },
        { text: 'Анна? Это невозможно. Ты умерла.', love: 0, guilt: 1, madness: 1, objective: 'В коридоре что-то скрипнуло. Осмотри фото и зеркало.' },
        { text: 'Оставь меня в покое.', love: -1, guilt: 2, madness: 1, objective: 'Фотография на стене перекосилась. Найди, что изменилось.' },
      ]
    },
    {
      title: 'Письмо 2 — «Наша ночь»',
      body: 'Ты обещал, что мы всегда будем вместе. Почему в тот вечер ты не ответил на мои звонки?\n\nТелефон лежал рядом. Я слышала, как он звонил.',
      choices: [
        { text: 'Я не слышал. Клянусь, я не хотел тебя бросать.', love: 1, guilt: 1, madness: 0, objective: 'На кухне появился телефон. Проверь его.' },
        { text: 'Что именно случилось в тот вечер?', love: 0, guilt: 2, madness: 1, objective: 'Ванная стала холоднее. Там есть следы воспоминания.' },
        { text: 'Ты опять обвиняешь меня даже после смерти?', love: -1, guilt: 1, madness: 2, objective: 'Стены начали шептать. Иди в спальню.' },
      ]
    },
    {
      title: 'Письмо 3 — «Правда»',
      body: 'Я звала тебя. Боль была невыносимой. А ты сказал, что я всё выдумываю.\n\nНапиши мне правду. Или я сама приду напомнить.',
      choices: [
        { text: 'Я виноват. Я должен был прийти.', love: 1, guilt: 3, madness: 0, objective: 'Зеркало потемнело. Посмотри в него.' },
        { text: 'Нет. Я не мог знать, что всё закончится так.', love: 0, guilt: 1, madness: 2, objective: 'Письма пахнут сыростью. Вернись к ящику.' },
        { text: 'Если ты хочешь правды — приходи сама.', love: -2, guilt: 1, madness: 3, objective: 'Где-то открылась дверь. Найди кабинет.' },
      ]
    },
    {
      title: 'Письмо 4 — «Дом помнит»',
      body: 'Дом помнит лучше тебя. Диван помнит твой запах. Пол помнит шаги. Бутылка помнит, как ты выбирал её вместо меня.',
      choices: [
        { text: 'Я выбрал слабость. Не тебя. Прости.', love: 1, guilt: 2, madness: 0, objective: 'Бутылка лежит на столе. Возьми воспоминание.' },
        { text: 'Я не хочу больше читать это.', love: -1, guilt: 1, madness: 1, objective: 'Письмо сжалось в руке. Но ящик снова скрипит.' },
        { text: 'Ты не прощения хочешь. Ты хочешь наказания.', love: 0, guilt: 0, madness: 3, objective: 'Коридор стал длиннее. Двигайся глубже в квартиру.' },
      ]
    },
    {
      title: 'Письмо 5 — «Ты пишешь сам»',
      body: 'Посмотри на почерк. Посмотри на чернила. Посмотри на свои пальцы.\n\nТы пишешь мне сам. Разве ты ещё не понял?',
      choices: [
        { text: 'Я принимаю это. Я писал, потому что не мог отпустить.', love: 1, guilt: 2, madness: -1, objective: 'Финал близко. Вернись к почтовому ящику.' },
        { text: 'Нет. Это ты. Ты здесь.', love: 0, guilt: 0, madness: 3, objective: 'Финал близко. Вернись к почтовому ящику.' },
        { text: 'Тогда я должен сжечь письма.', love: -1, guilt: 1, madness: -1, objective: 'Финал близко. Вернись к почтовому ящику.' },
      ]
    },
    {
      title: 'Финальное письмо — «Выбирай»',
      body: 'Любовь или наказание. Память или свобода.\n\nПочтовый ящик открыт. Внутри темно, как внутри тебя.',
      choices: [
        { text: 'Остаться и писать ей вечно.', ending: 'loop' },
        { text: 'Признать вину полностью.', ending: 'guilt' },
        { text: 'Сжечь письма и уйти.', ending: 'release' },
      ]
    }
  ];

  const vertexShaderSrc = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUV;
    uniform mat4 uProjection;
    uniform mat4 uView;
    uniform mat4 uModel;
    uniform float uTime;
    uniform float uMadness;
    varying vec3 vNormal;
    varying vec2 vUV;
    varying vec3 vWorld;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      float wobble = sin((world.x + world.z + uTime * 1.7) * 2.1) * 0.012 * uMadness;
      world.x += wobble;
      world.z += wobble * 0.7;
      vWorld = world.xyz;
      vNormal = mat3(uModel) * aNormal;
      vUV = aUV;
      gl_Position = uProjection * uView * world;
    }
  `;

  const fragmentShaderSrc = `
    precision mediump float;
    uniform sampler2D uTexture;
    uniform vec3 uTint;
    uniform vec3 uCamera;
    uniform float uGuilt;
    uniform float uMadness;
    varying vec3 vNormal;
    varying vec2 vUV;
    varying vec3 vWorld;
    void main() {
      vec3 tex = texture2D(uTexture, vUV).rgb;
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(vec3(-0.35, 0.75, 0.45));
      float diffuse = max(dot(normal, lightDir), 0.0);
      float ambient = 0.28 + 0.08 * (1.0 - uMadness);
      vec3 color = tex * uTint * (ambient + diffuse * 0.72);
      color.r += uGuilt * 0.028;
      color.g *= 1.0 - uGuilt * 0.018;
      color.b *= 1.0 - uMadness * 0.035;
      float dist = distance(vWorld, uCamera);
      float fog = smoothstep(8.0, 24.0 - uMadness * 1.2, dist);
      vec3 fogColor = mix(vec3(0.05, 0.043, 0.038), vec3(0.16, 0.035, 0.035), min(uGuilt * 0.08, 0.6));
      color = mix(color, fogColor, fog);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compileShader(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function createProgram(vsSrc, fsSrc) {
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }
    return program;
  }

  const program = createProgram(vertexShaderSrc, fragmentShaderSrc);
  gl.useProgram(program);

  const loc = {
    aPosition: gl.getAttribLocation(program, 'aPosition'),
    aNormal: gl.getAttribLocation(program, 'aNormal'),
    aUV: gl.getAttribLocation(program, 'aUV'),
    uProjection: gl.getUniformLocation(program, 'uProjection'),
    uView: gl.getUniformLocation(program, 'uView'),
    uModel: gl.getUniformLocation(program, 'uModel'),
    uTexture: gl.getUniformLocation(program, 'uTexture'),
    uTint: gl.getUniformLocation(program, 'uTint'),
    uCamera: gl.getUniformLocation(program, 'uCamera'),
    uTime: gl.getUniformLocation(program, 'uTime'),
    uGuilt: gl.getUniformLocation(program, 'uGuilt'),
    uMadness: gl.getUniformLocation(program, 'uMadness'),
  };

  const cubeData = createCubeData();
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData), gl.STATIC_DRAW);

  const stride = 8 * 4;
  gl.enableVertexAttribArray(loc.aPosition);
  gl.vertexAttribPointer(loc.aPosition, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(loc.aNormal);
  gl.vertexAttribPointer(loc.aNormal, 3, gl.FLOAT, false, stride, 3 * 4);
  gl.enableVertexAttribArray(loc.aUV);
  gl.vertexAttribPointer(loc.aUV, 2, gl.FLOAT, false, stride, 6 * 4);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.02, 0.018, 0.015, 1);

  const textures = {};
  const textureNames = [
    'wallpaper_clean', 'wallpaper_cracked', 'floor_wood', 'ceiling_dark', 'mailbox_metal',
    'letter_paper', 'photo_frame', 'sofa_fabric', 'bed_fabric', 'desk_wood', 'mirror_glass',
    'blood_ink', 'door_wood', 'kitchen_tile', 'bathroom_tile', 'black'
  ];
  textureNames.forEach(name => textures[name] = createProceduralTexture(name));
  textureNames.forEach(name => tryReplaceTextureFromFile(name));

  const objects = [];
  const interactables = [];

  function addBox(id, label, pos, scale, tex, tint = [1,1,1], interact = null, visible = null) {
    const obj = { id, label, pos, scale, tex, tint, interact, visible };
    objects.push(obj);
    if (interact) interactables.push(obj);
    return obj;
  }

  function buildWorld() {
    // Floors and ceilings
    addBox('floor_living', 'Пол гостиной', [0, -0.05, 0], [10, 0.1, 8], 'floor_wood');
    addBox('floor_hall', 'Пол коридора', [0, -0.05, -9], [4, 0.1, 10], 'floor_wood');
    addBox('floor_bedroom', 'Пол спальни', [-6.5, -0.05, -7], [7, 0.1, 6], 'floor_wood');
    addBox('floor_kitchen', 'Пол кухни', [6.5, -0.05, -7], [7, 0.1, 6], 'kitchen_tile');
    addBox('floor_study', 'Пол кабинета', [0, -0.05, -16], [7, 0.1, 6], 'floor_wood');
    addBox('floor_bath', 'Пол ванной', [6.5, -0.05, -16], [7, 0.1, 6], 'bathroom_tile');

    addBox('ceiling_living', 'Потолок гостиной', [0, 3.05, 0], [10, 0.1, 8], 'ceiling_dark');
    addBox('ceiling_hall', 'Потолок коридора', [0, 3.05, -9], [4, 0.1, 10], 'ceiling_dark');
    addBox('ceiling_bedroom', 'Потолок спальни', [-6.5, 3.05, -7], [7, 0.1, 6], 'ceiling_dark');
    addBox('ceiling_kitchen', 'Потолок кухни', [6.5, 3.05, -7], [7, 0.1, 6], 'ceiling_dark');
    addBox('ceiling_study', 'Потолок кабинета', [0, 3.05, -16], [7, 0.1, 6], 'ceiling_dark');
    addBox('ceiling_bath', 'Потолок ванной', [6.5, 3.05, -16], [7, 0.1, 6], 'ceiling_dark');

    // Walls: intentionally leave rough gaps for door passages.
    const wallTex = () => state.guilt + state.madness > 4 ? 'wallpaper_cracked' : 'wallpaper_clean';
    const w = (id, label, pos, scale) => addBox(id, label, pos, scale, 'wallpaper_clean', [1,1,1], null, null);

    w('wall_liv_back_left', 'Стена гостиной', [-3.6, 1.5, -4], [2.8, 3, 0.18]);
    w('wall_liv_back_right', 'Стена гостиной', [3.6, 1.5, -4], [2.8, 3, 0.18]);
    w('wall_liv_front', 'Передняя стена гостиной', [0, 1.5, 4], [10, 3, 0.18]);
    w('wall_liv_left', 'Левая стена гостиной', [-5, 1.5, 0], [0.18, 3, 8]);
    w('wall_liv_right', 'Правая стена гостиной', [5, 1.5, 0], [0.18, 3, 8]);

    w('wall_hall_left', 'Левая стена коридора', [-2, 1.5, -9], [0.18, 3, 10]);
    w('wall_hall_right', 'Правая стена коридора', [2, 1.5, -9], [0.18, 3, 10]);
    w('wall_hall_back_left', 'Дальняя стена коридора', [-1.3, 1.5, -14], [1.4, 3, 0.18]);
    w('wall_hall_back_right', 'Дальняя стена коридора', [1.3, 1.5, -14], [1.4, 3, 0.18]);

    w('wall_bed_left', 'Стена спальни', [-10, 1.5, -7], [0.18, 3, 6]);
    w('wall_bed_back', 'Стена спальни', [-6.5, 1.5, -10], [7, 3, 0.18]);
    w('wall_bed_front', 'Стена спальни', [-6.5, 1.5, -4], [7, 3, 0.18]);

    w('wall_kitchen_right', 'Стена кухни', [10, 1.5, -7], [0.18, 3, 6]);
    w('wall_kitchen_back', 'Стена кухни', [6.5, 1.5, -10], [7, 3, 0.18]);
    w('wall_kitchen_front', 'Стена кухни', [6.5, 1.5, -4], [7, 3, 0.18]);

    w('wall_study_left', 'Стена кабинета', [-3.5, 1.5, -16], [0.18, 3, 6]);
    w('wall_study_right', 'Стена кабинета', [3.5, 1.5, -16], [0.18, 3, 6]);
    w('wall_study_back', 'Стена кабинета', [0, 1.5, -19], [7, 3, 0.18]);

    w('wall_bath_right', 'Стена ванной', [10, 1.5, -16], [0.18, 3, 6]);
    w('wall_bath_back', 'Стена ванной', [6.5, 1.5, -19], [7, 3, 0.18]);
    w('wall_bath_front', 'Стена ванной', [6.5, 1.5, -13], [7, 3, 0.18]);

    // Furniture and important objects
    addBox('mailbox', 'Старый почтовый ящик', [-4.55, 1.0, 2.2], [0.55, 0.65, 0.28], 'mailbox_metal', [0.9,0.82,0.72], () => openNextLetter());
    addBox('sofa', 'Старый диван', [1.6, 0.45, 2.8], [2.8, 0.9, 0.95], 'sofa_fabric', [0.82,0.68,0.58]);
    addBox('coffee_table', 'Журнальный стол', [0, 0.35, 0.6], [1.8, 0.35, 1.1], 'desk_wood', [0.8,0.66,0.5]);
    addBox('photo', 'Фотография Анны', [-4.88, 1.75, -1.1], [0.08, 0.85, 1.05], 'photo_frame', [1, .86, .72], () => showMemory('Фотография', 'На фото Анна смеётся. Но чем дольше ты смотришь, тем сильнее кажется, что её улыбка просит о помощи.\n\n+1 вина'), () => true);
    addBox('door_hall', 'Дверь в коридор', [0, 1.4, -4.08], [1.35, 2.8, 0.12], 'door_wood', [0.72,0.58,0.45]);

    addBox('bed', 'Кровать Анны', [-7.2, 0.45, -8.2], [2.7, 0.7, 1.7], 'bed_fabric', [0.84,0.76,0.72]);
    addBox('dress', 'Платье на кровати', [-7.2, 0.9, -8.2], [1.3, 0.08, 1.05], 'letter_paper', [0.78,0.72,0.7], () => showMemory('Платье', 'Ткань холодная, будто её только что сняли. Ты вспоминаешь ссору перед последним вечером.\n\n+1 безумие'), () => state.letterIndex >= 1);
    addBox('mirror', 'Зеркало', [-9.88, 1.55, -6.5], [0.08, 1.6, 0.9], 'mirror_glass', [0.7,0.82,0.95], () => showMemory('Зеркало', state.guilt >= 3 ? 'В отражении Анна стоит за твоим плечом. Когда ты оборачиваешься — там пусто.\n\n+1 вина' : 'Зеркало мутное. Пока оно показывает только тебя.'), () => true);

    addBox('kitchen_counter', 'Кухонная тумба', [6.4, 0.55, -9.4], [3.2, 0.9, 0.7], 'desk_wood', [0.76,0.62,0.48]);
    addBox('phone', 'Старый телефон', [5.4, 1.15, -9.25], [0.65, 0.22, 0.42], 'black', [0.07,0.06,0.055], () => showMemory('Телефон', 'На экране шесть пропущенных звонков. Последний — 23:17. Ты был дома.\n\n+2 вина'), () => state.letterIndex >= 2);
    addBox('glass_shards', 'Осколки стакана', [7.9, 0.08, -5.2], [0.9, 0.04, 0.55], 'mirror_glass', [0.9,0.95,1], null, () => state.guilt >= 2);

    addBox('desk', 'Письменный стол', [0, 0.55, -17.4], [2.3, 0.85, 1.0], 'desk_wood', [0.76,0.60,0.44]);
    addBox('letter_stack', 'Стопка черновиков', [-0.45, 1.06, -17.25], [0.75, 0.08, 0.55], 'letter_paper', [1,0.92,0.78], () => showMemory('Черновики', 'На всех листах один и тот же почерк. Твой.\n\n+2 безумие'), () => state.letterIndex >= 4);
    addBox('bottle', 'Пустая бутылка', [0.72, 1.15, -17.2], [0.25, 0.55, 0.25], 'mirror_glass', [0.38,0.62,0.42], () => showMemory('Бутылка', 'Горлышко пахнет спиртом. Воспоминание возвращается рывком: ты слышал звонок, но не встал.\n\n+1 вина, +1 безумие'), () => state.letterIndex >= 3);

    addBox('bathtub', 'Ванна', [6.5, 0.45, -18.1], [2.4, 0.7, 1.1], 'bathroom_tile', [0.8,0.8,0.76]);
    addBox('blood_mark', 'Тёмное пятно', [6.5, 0.03, -17.3], [1.5, 0.035, 1.0], 'blood_ink', [0.8,0.15,0.12], null, () => state.guilt + state.madness >= 4);

    addBox('anna_shadow', 'Силуэт Анны', [0, 1.15, -18.75], [0.5, 2.1, 0.05], 'black', [0.03,0.025,0.025], null, () => state.madness >= 5 || state.guilt >= 7);
  }

  buildWorld();

  function createCubeData() {
    const p = [
      // face, normal, uv
      // front z+
      [-0.5,-0.5, 0.5, 0,0,1, 0,0], [ 0.5,-0.5, 0.5, 0,0,1, 1,0], [ 0.5, 0.5, 0.5, 0,0,1, 1,1],
      [-0.5,-0.5, 0.5, 0,0,1, 0,0], [ 0.5, 0.5, 0.5, 0,0,1, 1,1], [-0.5, 0.5, 0.5, 0,0,1, 0,1],
      // back z-
      [ 0.5,-0.5,-0.5, 0,0,-1, 0,0], [-0.5,-0.5,-0.5, 0,0,-1, 1,0], [-0.5, 0.5,-0.5, 0,0,-1, 1,1],
      [ 0.5,-0.5,-0.5, 0,0,-1, 0,0], [-0.5, 0.5,-0.5, 0,0,-1, 1,1], [ 0.5, 0.5,-0.5, 0,0,-1, 0,1],
      // right x+
      [ 0.5,-0.5, 0.5, 1,0,0, 0,0], [ 0.5,-0.5,-0.5, 1,0,0, 1,0], [ 0.5, 0.5,-0.5, 1,0,0, 1,1],
      [ 0.5,-0.5, 0.5, 1,0,0, 0,0], [ 0.5, 0.5,-0.5, 1,0,0, 1,1], [ 0.5, 0.5, 0.5, 1,0,0, 0,1],
      // left x-
      [-0.5,-0.5,-0.5, -1,0,0, 0,0], [-0.5,-0.5, 0.5, -1,0,0, 1,0], [-0.5, 0.5, 0.5, -1,0,0, 1,1],
      [-0.5,-0.5,-0.5, -1,0,0, 0,0], [-0.5, 0.5, 0.5, -1,0,0, 1,1], [-0.5, 0.5,-0.5, -1,0,0, 0,1],
      // top y+
      [-0.5, 0.5, 0.5, 0,1,0, 0,0], [ 0.5, 0.5, 0.5, 0,1,0, 1,0], [ 0.5, 0.5,-0.5, 0,1,0, 1,1],
      [-0.5, 0.5, 0.5, 0,1,0, 0,0], [ 0.5, 0.5,-0.5, 0,1,0, 1,1], [-0.5, 0.5,-0.5, 0,1,0, 0,1],
      // bottom y-
      [-0.5,-0.5,-0.5, 0,-1,0, 0,0], [ 0.5,-0.5,-0.5, 0,-1,0, 1,0], [ 0.5,-0.5, 0.5, 0,-1,0, 1,1],
      [-0.5,-0.5,-0.5, 0,-1,0, 0,0], [ 0.5,-0.5, 0.5, 0,-1,0, 1,1], [-0.5,-0.5, 0.5, 0,-1,0, 0,1],
    ];
    return p.flat();
  }

  function createProceduralTexture(name) {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, size, size);

    function noise(alpha = 0.12) {
      const img = ctx.getImageData(0, 0, size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        img.data[i] = img.data[i] * (1 - alpha) + v * alpha;
        img.data[i+1] = img.data[i+1] * (1 - alpha) + v * alpha;
        img.data[i+2] = img.data[i+2] * (1 - alpha) + v * alpha;
      }
      ctx.putImageData(img, 0, 0);
    }

    if (name === 'wallpaper_clean') {
      ctx.fillStyle = '#6f5d4f'; ctx.fillRect(0,0,size,size);
      ctx.strokeStyle = 'rgba(230,200,170,.18)';
      for (let x=0; x<size; x+=16) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+8,size); ctx.stroke(); }
      noise(.08);
    } else if (name === 'wallpaper_cracked') {
      ctx.fillStyle = '#5b4c43'; ctx.fillRect(0,0,size,size); noise(.12);
      ctx.strokeStyle = 'rgba(20,12,10,.75)'; ctx.lineWidth = 2;
      for (let i=0; i<9; i++) { ctx.beginPath(); let x=Math.random()*size, y=Math.random()*size; ctx.moveTo(x,y); for(let j=0;j<5;j++){x+=Math.random()*22-11; y+=Math.random()*22-2; ctx.lineTo(x,y);} ctx.stroke(); }
    } else if (name === 'floor_wood' || name === 'desk_wood' || name === 'door_wood') {
      ctx.fillStyle = name === 'floor_wood' ? '#4b3427' : '#5d3e2b'; ctx.fillRect(0,0,size,size);
      for (let x=0; x<size; x+=18) { ctx.fillStyle = x%36===0 ? 'rgba(255,210,150,.08)' : 'rgba(0,0,0,.12)'; ctx.fillRect(x,0,2,size); }
      ctx.strokeStyle='rgba(255,220,180,.12)'; for(let y=10;y<size;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size,y+Math.sin(y)*4);ctx.stroke();}
      noise(.1);
    } else if (name === 'ceiling_dark' || name === 'black') {
      ctx.fillStyle = name === 'black' ? '#080706' : '#211b19'; ctx.fillRect(0,0,size,size); noise(.07);
    } else if (name === 'mailbox_metal') {
      const grd=ctx.createLinearGradient(0,0,size,size); grd.addColorStop(0,'#8a8276'); grd.addColorStop(.5,'#453f39'); grd.addColorStop(1,'#b0a594'); ctx.fillStyle=grd; ctx.fillRect(0,0,size,size); noise(.11);
      ctx.strokeStyle='rgba(0,0,0,.35)'; for(let y=20;y<size;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size,y);ctx.stroke();}
    } else if (name === 'letter_paper') {
      ctx.fillStyle = '#d9c09a'; ctx.fillRect(0,0,size,size); noise(.08);
      ctx.strokeStyle='rgba(80,40,30,.28)'; ctx.lineWidth=1; for(let y=24;y<size;y+=14){ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(size-10,y+Math.sin(y)*2);ctx.stroke();}
    } else if (name === 'photo_frame') {
      ctx.fillStyle='#241915'; ctx.fillRect(0,0,size,size); ctx.fillStyle='#c9b28f'; ctx.fillRect(14,14,size-28,size-28); ctx.fillStyle='rgba(80,20,20,.45)'; ctx.fillRect(34,26,60,72); noise(.06);
    } else if (name === 'sofa_fabric' || name === 'bed_fabric') {
      ctx.fillStyle = name === 'sofa_fabric' ? '#68544e' : '#8a786d'; ctx.fillRect(0,0,size,size);
      ctx.strokeStyle='rgba(255,255,255,.08)'; for(let x=0;x<size;x+=6){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,size);ctx.stroke();} noise(.12);
    } else if (name === 'mirror_glass') {
      const grd=ctx.createLinearGradient(0,0,size,size); grd.addColorStop(0,'#c3d0d1'); grd.addColorStop(.5,'#5b6c73'); grd.addColorStop(1,'#e8e8df'); ctx.fillStyle=grd; ctx.fillRect(0,0,size,size); noise(.04);
      ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(0,60); ctx.stroke();
    } else if (name === 'blood_ink') {
      ctx.fillStyle = '#32100e'; ctx.fillRect(0,0,size,size); noise(.14);
      ctx.fillStyle = 'rgba(120,0,0,.7)'; for(let i=0;i<12;i++){ctx.beginPath();ctx.arc(Math.random()*size, Math.random()*size, 8+Math.random()*22, 0, Math.PI*2);ctx.fill();}
    } else if (name === 'kitchen_tile' || name === 'bathroom_tile') {
      ctx.fillStyle = name === 'kitchen_tile' ? '#665f53' : '#777a75'; ctx.fillRect(0,0,size,size);
      ctx.strokeStyle='rgba(20,20,20,.35)'; for(let x=0;x<size;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,size);ctx.stroke();} for(let y=0;y<size;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size,y);ctx.stroke();} noise(.08);
    }

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.generateMipmap(gl.TEXTURE_2D);
    return tex;
  }

  function tryReplaceTextureFromFile(name) {
    const img = new Image();
    img.onload = () => {
      const tex = textures[name];
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    img.onerror = () => {};
    img.src = `assets/textures/${name}.png`;
  }

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  window.addEventListener('resize', resize);

  startBtn.addEventListener('click', () => {
    state.started = true;
    state.paused = false;
    startScreen.classList.remove('visible');
    startScreen.classList.add('hidden');
    canvas.requestPointerLock?.();
  });

  document.addEventListener('pointerlockchange', () => {
    state.mouseLocked = document.pointerLockElement === canvas;
  });

  canvas.addEventListener('click', () => {
    if (state.started && !state.paused) canvas.requestPointerLock?.();
  });

  document.addEventListener('mousemove', (e) => {
    if (!state.mouseLocked || state.paused) return;
    state.camera.yaw -= e.movementX * 0.0022;
    state.camera.pitch -= e.movementY * 0.0022;
    state.camera.pitch = clamp(state.camera.pitch, -1.15, 1.15);
  });

  document.addEventListener('keydown', (e) => {
    state.keys.add(e.code);
    if (e.code === 'KeyE' && !state.paused && state.currentInteract) {
      state.currentInteract.interact();
    }
  });
  document.addEventListener('keyup', (e) => state.keys.delete(e.code));

  memoryClose.addEventListener('click', closeMemory);

  function openNextLetter() {
    if (state.endingShown) return;
    const l = letters[Math.min(state.letterIndex, letters.length - 1)];
    showLetter(l);
  }

  function showLetter(letter) {
    state.paused = true;
    document.exitPointerLock?.();
    letterTitle.textContent = letter.title;
    letterBody.textContent = letter.body;
    choicesEl.innerHTML = '';
    letter.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.addEventListener('click', () => chooseLetter(choice));
      choicesEl.appendChild(btn);
    });
    letterModal.classList.remove('hidden');
    letterModal.classList.add('visible');
  }

  function chooseLetter(choice) {
    if (choice.ending) {
      showEnding(choice.ending);
      return;
    }
    state.love += choice.love || 0;
    state.guilt += choice.guilt || 0;
    state.madness += choice.madness || 0;
    state.guilt = Math.max(0, state.guilt);
    state.madness = Math.max(0, state.madness);
    state.letterIndex += 1;
    hudObjective.textContent = 'Цель: ' + (choice.objective || 'Исследуй дом и вернись к ящику.');
    updateStats();
    letterModal.classList.add('hidden');
    letterModal.classList.remove('visible');
    state.paused = false;
    canvas.requestPointerLock?.();
  }

  function showEnding(type) {
    state.endingShown = true;
    let title = 'Концовка';
    let body = '';
    if (type === 'loop') {
      title = 'Концовка — Вечная переписка';
      body = 'Ты садишься у ящика. Письма приходят каждую минуту. Сначала нежные, потом пустые, потом написанные твоим голосом.\n\nАнна шепчет: «Навсегда».\n\nИгра окончена.';
    } else if (type === 'guilt') {
      title = 'Концовка — Саморазрушение';
      body = 'Ты произносишь правду вслух. Дом будто облегчённо вздыхает и гасит все лампы.\n\nПоследнее письмо приходит от твоего имени.\n\nИгра окончена.';
    } else {
      title = 'Концовка — Отпускание';
      body = 'Ты сжигаешь письма. Воспоминания исчезают вместе с дымом. Ты свободен, но больше не можешь вспомнить её лицо.\n\nИгра окончена.';
    }
    letterTitle.textContent = title;
    letterBody.textContent = body;
    choicesEl.innerHTML = '';
    const restart = document.createElement('button');
    restart.textContent = 'Начать заново';
    restart.addEventListener('click', () => location.reload());
    choicesEl.appendChild(restart);
  }

  function showMemory(title, body) {
    if (!state.seen.has(title)) {
      if (title === 'Фотография') state.guilt += 1;
      if (title === 'Платье') state.madness += 1;
      if (title === 'Зеркало' && state.guilt >= 3) state.guilt += 1;
      if (title === 'Телефон') state.guilt += 2;
      if (title === 'Черновики') state.madness += 2;
      if (title === 'Бутылка') { state.guilt += 1; state.madness += 1; }
      state.seen.add(title);
    }
    updateStats();
    state.paused = true;
    document.exitPointerLock?.();
    memoryTitle.textContent = title;
    memoryBody.textContent = body;
    memoryModal.classList.remove('hidden');
    memoryModal.classList.add('visible');
  }

  function closeMemory() {
    memoryModal.classList.add('hidden');
    memoryModal.classList.remove('visible');
    state.paused = false;
    canvas.requestPointerLock?.();
  }

  function updateStats() {
    statsEl.textContent = `Любовь: ${state.love} · Вина: ${state.guilt} · Безумие: ${state.madness}`;
  }

  function update(dt) {
    if (state.paused) return;
    const cam = state.camera;
    const speed = (state.keys.has('ShiftLeft') ? 4.2 : 2.6) * dt;
    const forward = [Math.sin(cam.yaw), 0, -Math.cos(cam.yaw)];
    const right = [Math.cos(cam.yaw), 0, Math.sin(cam.yaw)];
    let dx = 0, dz = 0;
    if (state.keys.has('KeyW')) { dx += forward[0]; dz += forward[2]; }
    if (state.keys.has('KeyS')) { dx -= forward[0]; dz -= forward[2]; }
    if (state.keys.has('KeyD')) { dx += right[0]; dz += right[2]; }
    if (state.keys.has('KeyA')) { dx -= right[0]; dz -= right[2]; }
    const len = Math.hypot(dx, dz);
    if (len > 0) {
      cam.x += (dx / len) * speed;
      cam.z += (dz / len) * speed;
      cam.x = clamp(cam.x, -11.3, 11.3);
      cam.z = clamp(cam.z, -20.8, 5.2);
    }
    findInteractable();
  }

  function findInteractable() {
    const cam = state.camera;
    const f = getForwardVector();
    let best = null;
    let bestScore = 999;
    for (const obj of interactables) {
      if (obj.visible && !obj.visible()) continue;
      const dx = obj.pos[0] - cam.x;
      const dy = obj.pos[1] - cam.y;
      const dz = obj.pos[2] - cam.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > 2.25) continue;
      const dot = (dx*f[0] + dy*f[1] + dz*f[2]) / Math.max(0.0001, dist);
      if (dot < 0.55) continue;
      const score = dist - dot;
      if (score < bestScore) { bestScore = score; best = obj; }
    }
    state.currentInteract = best;
    if (best) {
      promptEl.textContent = `E — ${best.label}`;
      promptEl.classList.add('visible');
    } else {
      promptEl.classList.remove('visible');
    }
  }

  function getForwardVector() {
    const cam = state.camera;
    return [
      Math.sin(cam.yaw) * Math.cos(cam.pitch),
      Math.sin(cam.pitch),
      -Math.cos(cam.yaw) * Math.cos(cam.pitch),
    ];
  }

  function render() {
    resize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    const aspect = canvas.width / canvas.height;
    const projection = mat4Perspective(Math.PI / 3, aspect, 0.05, 80);
    const cam = state.camera;
    const f = getForwardVector();
    const view = mat4LookAt([cam.x, cam.y, cam.z], [cam.x + f[0], cam.y + f[1], cam.z + f[2]], [0,1,0]);

    gl.uniformMatrix4fv(loc.uProjection, false, projection);
    gl.uniformMatrix4fv(loc.uView, false, view);
    gl.uniform3f(loc.uCamera, cam.x, cam.y, cam.z);
    gl.uniform1f(loc.uTime, state.time);
    gl.uniform1f(loc.uGuilt, state.guilt);
    gl.uniform1f(loc.uMadness, state.madness);
    gl.uniform1i(loc.uTexture, 0);

    for (const obj of objects) {
      if (obj.visible && !obj.visible()) continue;
      const texName = obj.id.startsWith('wall_') ? (state.guilt + state.madness > 4 ? 'wallpaper_cracked' : 'wallpaper_clean') : obj.tex;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[texName] || textures.black);
      gl.uniform3f(loc.uTint, obj.tint[0], obj.tint[1], obj.tint[2]);
      const m = mat4Model(obj.pos, obj.scale);
      gl.uniformMatrix4fv(loc.uModel, false, m);
      gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    state.time += dt;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function mat4Model(pos, scale) {
    return new Float32Array([
      scale[0],0,0,0,
      0,scale[1],0,0,
      0,0,scale[2],0,
      pos[0],pos[1],pos[2],1,
    ]);
  }

  function mat4Perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0,
    ]);
  }

  function mat4LookAt(eye, center, up) {
    let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    let len = Math.hypot(zx, zy, zz); zx/=len; zy/=len; zz/=len;
    let xx = up[1]*zz - up[2]*zy;
    let xy = up[2]*zx - up[0]*zz;
    let xz = up[0]*zy - up[1]*zx;
    len = Math.hypot(xx, xy, xz); xx/=len; xy/=len; xz/=len;
    const yx = zy*xz - zz*xy;
    const yy = zz*xx - zx*xz;
    const yz = zx*xy - zy*xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx*eye[0] + xy*eye[1] + xz*eye[2]),
      -(yx*eye[0] + yy*eye[1] + yz*eye[2]),
      -(zx*eye[0] + zy*eye[1] + zz*eye[2]),
      1,
    ]);
  }
})();
