let scene, camera, renderer;
let galaxy;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {
    scene = new THREE.Scene();
    
    // Камера тепер дивиться прямо зверху
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 15000);
    camera.position.set(0, 2000, 0);
    camera.up.set(0, 0, -1); // Змінюємо орієнтацію камери
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('galaxyCanvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1);

    // Покращене освітлення
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    const centerLight = new THREE.PointLight(0xffaa00, 3, 1500);
    centerLight.position.set(0, 0, 0);
    scene.add(centerLight);

    createGalaxy();
    addBackgroundStars();
    
    document.addEventListener('mousemove', onDocumentMouseMove);
    window.addEventListener('resize', onWindowResize);
}

function createGalaxy() {
    const particles = 200000; // Збільшуємо кількість частинок
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particles * 3);
    const colors = new Float32Array(particles * 3);
    
    const arms = 5; // Збільшуємо кількість рукавів
    const armWidth = 0.15;
    const spiralFactor = 0.3; // Збільшуємо закрученість спіралі
    const rotation = 2.0; // Додатковий коефіцієнт обертання

    for (let i = 0; i < positions.length; i += 3) {
        // Використовуємо логарифмічну спіраль для більш реалістичного вигляду
        const radius = Math.pow(Math.random(), 0.5) * 1000;
        const armAngle = (Math.floor(Math.random() * arms)) / arms * Math.PI * 2;
        const spinAngle = Math.log(radius) * spiralFactor + armAngle;
        
        // Додаємо випадкове відхилення для створення об'єму
        const deviation = (Math.random() - 0.5) * armWidth * radius;
        const angle = spinAngle + deviation + rotation;
        
        // Створюємо більш щільне ядро
        const scale = radius < 100 ? 0.3 : 1.0;
        
        positions[i] = Math.cos(angle) * radius * scale;
        positions[i + 1] = (Math.random() - 0.5) * (radius * 0.05); // Зменшуємо товщину диску
        positions[i + 2] = Math.sin(angle) * radius * scale;

        const distanceFromCenter = Math.sqrt(
            positions[i] * positions[i] + 
            positions[i + 2] * positions[i + 2]
        );

        // Покращена кольорова схема
        if (distanceFromCenter < 100) {
            // Яскраве жовте ядро
            colors[i] = 1.0;
            colors[i + 1] = 0.9;
            colors[i + 2] = 0.4;
        } else if (distanceFromCenter < 300) {
            // Внутрішня область - більш блакитна
            if (Math.random() > 0.6) {
                colors[i] = 0.8;
                colors[i + 1] = 0.9;
                colors[i + 2] = 1.0;
            } else {
                colors[i] = 1.0;
                colors[i + 1] = 1.0;
                colors[i + 2] = 0.8;
            }
        } else if (distanceFromCenter < 600) {
            // Середня область - змішані кольори
            if (Math.random() > 0.5) {
                colors[i] = 0.9;
                colors[i + 1] = 0.6;
                colors[i + 2] = 1.0;
            } else {
                colors[i] = 0.6;
                colors[i + 1] = 0.8;
                colors[i + 2] = 1.0;
            }
        } else {
            // Зовнішні рукави - більше червоного
            if (Math.random() > 0.7) {
                colors[i] = 1.0;
                colors[i + 1] = 0.4;
                colors[i + 2] = 0.4;
            } else {
                colors[i] = 0.8;
                colors[i + 1] = 0.7;
                colors[i + 2] = 1.0;
            }
        }

        // Додаємо мерехтіння зірок
        const brightness = (Math.random() * 0.3 + 0.7) * (1 - distanceFromCenter / 1500);
        colors[i] *= brightness;
        colors[i + 1] *= brightness;
        colors[i + 2] *= brightness;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 2.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    galaxy = new THREE.Points(geometry, material);
    scene.add(galaxy);

    // Створюємо яскраве ядро
    const coreGeometry = new THREE.SphereGeometry(20, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);
}

function addBackgroundStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(20000 * 3);
    const starColors = new Float32Array(20000 * 3);

    for (let i = 0; i < starPositions.length; i += 3) {
        const radius = Math.random() * 3000 + 1500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = radius * Math.cos(phi);

        const colorType = Math.random();
        if (colorType < 0.2) {
            // Червоні гіганти
            starColors[i] = 1.0;
            starColors[i + 1] = 0.4 + Math.random() * 0.2;
            starColors[i + 2] = 0.4 + Math.random() * 0.2;
        } else if (colorType < 0.4) {
            // Блакитні гіганти
            starColors[i] = 0.4 + Math.random() * 0.2;
            starColors[i + 1] = 0.4 + Math.random() * 0.2;
            starColors[i + 2] = 1.0;
        } else if (colorType < 0.6) {
            // Жовті зорі
            starColors[i] = 1.0;
            starColors[i + 1] = 0.9;
            starColors[i + 2] = 0.5;
        } else if (colorType < 0.8) {
            // Білі зорі
            starColors[i] = 0.9;
            starColors[i + 1] = 0.9;
            starColors[i + 2] = 1.0;
        } else {
            // Помаранчеві зорі
            starColors[i] = 1.0;
            starColors[i + 1] = 0.7;
            starColors[i + 2] = 0.3;
        }

        const brightness = Math.random() * 0.3 + 0.7;
        starColors[i] *= brightness;
        starColors[i + 1] *= brightness;
        starColors[i + 2] *= brightness;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starsMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.05;
    mouseY = (event.clientY - windowHalfY) * 0.05;
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Зменшуємо чутливість руху
    targetRotationY += (mouseX * 0.00002 - targetRotationY) * 0.01;
    targetRotationX += (mouseY * 0.00002 - targetRotationX) * 0.01;

    if (galaxy) {
        galaxy.rotation.y += 0.0003; // Повільніше обертання
        galaxy.rotation.x = targetRotationX * 0.5;
        galaxy.rotation.y += targetRotationY;
    }

    // Обмежений рух камери
    const maxOffset = 100;
    camera.position.x += (mouseX - camera.position.x) * 0.01;
    camera.position.z += (-mouseY - camera.position.z) * 0.01;
    
    camera.position.x = Math.max(Math.min(camera.position.x, maxOffset), -maxOffset);
    camera.position.z = Math.max(Math.min(camera.position.z, maxOffset), -maxOffset);
    
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}