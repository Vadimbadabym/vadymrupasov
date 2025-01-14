let scene, camera, renderer, planets = {}, followedPlanet = 'overview';
const textureLoader = new THREE.TextureLoader();

function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 200, 0);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        logarithmicDepthBuffer: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas').appendChild(renderer.domElement);

    const sunLight = new THREE.PointLight(0xfff4e5, 3, 1000, 1);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.5);
    scene.add(hemisphereLight);

    createStars();
    createPlanets();
    addPlanetControls();
    
    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.15,
        transparent: true,
        opacity: 0.8
    });
    
    const starsVertices = [];
    for(let i = 0; i < 20000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

function createPlanets() {
    // Створюємо сонце спочатку без текстури
    const sunGeometry = new THREE.SphereGeometry(15, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa33,
        emissive: 0xffaa33,
    });
    planets.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(planets.sun);

    // Завантажуємо текстуру сонця
    textureLoader.load('textures/sun.jpg', (texture) => {
        sunMaterial.map = texture;
        sunMaterial.needsUpdate = true;
    });

    const planetData = [
        { name: 'mercury', size: 0.8, distance: 40, color: 0x808080, texturePath: 'textures/mercury.jpg', speed: 1.607 },
        { name: 'venus', size: 1.5, distance: 60, color: 0xffd700, texturePath: 'textures/venus.jpg', speed: 1.174 },
        { name: 'earth', size: 1.6, distance: 80, color: 0x0077be, texturePath: 'textures/earth.jpg', speed: 1 },
        { name: 'mars', size: 1.2, distance: 100, color: 0xff4500, texturePath: 'textures/mars.jpg', speed: 0.802 },
        { name: 'jupiter', size: 4.5, distance: 150, color: 0xffa500, texturePath: 'textures/jupiter.jpg', speed: 0.434 },
        { name: 'saturn', size: 4, distance: 200, color: 0xffd700, texturePath: 'textures/saturn.jpg', speed: 0.323 },
        { name: 'uranus', size: 2.5, distance: 250, color: 0x40e0d0, texturePath: 'textures/uranus.jpg', speed: 0.228 },
        { name: 'neptune', size: 2.3, distance: 300, color: 0x0000ff, texturePath: 'textures/neptune.png', speed: 0.182 }
    ];

    planetData.forEach(data => {
        // Створюємо планету з базовим кольором
        const geometry = new THREE.SphereGeometry(data.size, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: data.color,
            shininess: 25,
            specular: 0x333333,
        });

        planets[data.name] = new THREE.Mesh(geometry, material);
        planets[data.name].userData.distance = data.distance;
        planets[data.name].userData.speed = data.speed;
        planets[data.name].userData.orbitOffset = Math.random() * Math.PI * 2;
        planets[data.name].castShadow = true;
        planets[data.name].receiveShadow = true;

        // Створюємо орбіту
        const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 128);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        scene.add(orbit);

        // Додаємо атмосферу для деяких планет
        if (['earth', 'venus', 'mars'].includes(data.name)) {
            const atmosphereGeometry = new THREE.SphereGeometry(data.size + 0.15, 32, 32);
            const atmosphereMaterial = new THREE.MeshPhongMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.2,
                blending: THREE.AdditiveBlending
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            planets[data.name].add(atmosphere);
        }

        scene.add(planets[data.name]);

        // Завантажуємо текстуру після створення планети
        textureLoader.load(data.texturePath, (texture) => {
            material.map = texture;
            material.needsUpdate = true;
        });
    });

    // Додаємо кільця Сатурна
    const ringGeometry = new THREE.RingGeometry(6, 10, 64);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0xc0c0c0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 3;
    planets.saturn.add(rings);

    // Завантажуємо текстуру для кілець
    textureLoader.load('textures/saturn-rings.jpg', (texture) => {
        ringMaterial.map = texture;
        ringMaterial.needsUpdate = true;
    });
}

function updateCamera() {
    if (followedPlanet === 'overview') {
        const radius = 300;
        const time = Date.now() * 0.0001;
        const targetX = radius * Math.cos(time);
        const targetZ = radius * Math.sin(time);
        
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.z += (targetZ - camera.position.z) * 0.02;
        camera.position.y += (200 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
    } else if (planets[followedPlanet]) {
        const planet = planets[followedPlanet];
        const offset = followedPlanet === 'sun' ? 40 : planet.geometry.parameters.radius * 4;
        
        const planetPos = new THREE.Vector3();
        planet.getWorldPosition(planetPos);
        
        const targetX = planetPos.x + offset * Math.cos(Date.now() * 0.0002);
        const targetZ = planetPos.z + offset * Math.sin(Date.now() * 0.0002);
        const targetY = offset * 0.3;
        
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (targetY - camera.position.y) * 0.02;
        camera.position.z += (targetZ - camera.position.z) * 0.02;
        
        camera.lookAt(planetPos);
    }
}
function animate() {
    requestAnimationFrame(animate);

    Object.keys(planets).forEach((planet) => {
        if (planet !== 'sun' && planets[planet]) {
            const time = Date.now() * 0.001;
            const distance = planets[planet].userData.distance;
            const speed = planets[planet].userData.speed * 0.1;
            const offset = planets[planet].userData.orbitOffset;

            planets[planet].position.x = Math.cos(time * speed + offset) * distance;
            planets[planet].position.z = Math.sin(time * speed + offset) * distance;
            planets[planet].rotation.y += 0.01;
        }
    });

    if (planets.sun) {
        planets.sun.rotation.y += 0.001;
    }

    updateCamera();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function addPlanetControls() {
    document.querySelectorAll('.planet-btn').forEach(button => {
        button.addEventListener('click', () => {
            followedPlanet = button.dataset.planet;
        });
    });
}

init();