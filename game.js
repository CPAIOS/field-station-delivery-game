import * as THREE from 'three';

// Game state
const gameState = {
    isPlaying: false,
    level: 1,
    trees: 12,
    treesOnFire: 0,
    distance: 0,
    earnings: 0,
    speed: 0,
    targetSpeed: 0.3,
    truckPosition: 0
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('gameCanvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
scene.add(directionalLight);

// Truck object
let truck;
const createTruck = () => {
    const truckGroup = new THREE.Group();

    const navyBlue = 0x1a3a52; // Field Station Farms color

    // Chassis/Frame
    const chassisGeometry = new THREE.BoxGeometry(3.5, 0.4, 12);
    const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassis.position.set(0, 0.6, 0);
    chassis.castShadow = true;
    truckGroup.add(chassis);

    // Cab (front driver section)
    const cabGeometry = new THREE.BoxGeometry(3.2, 2.2, 3.5);
    const cabMaterial = new THREE.MeshStandardMaterial({ color: navyBlue, metalness: 0.3 });
    const cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(0, 1.9, -4.5);
    cab.castShadow = true;
    truckGroup.add(cab);

    // Cab roof
    const roofGeometry = new THREE.BoxGeometry(3.2, 0.3, 3);
    const roof = new THREE.Mesh(roofGeometry, cabMaterial);
    roof.position.set(0, 3.2, -4.3);
    roof.castShadow = true;
    truckGroup.add(roof);

    // Windshield
    const windshieldGeometry = new THREE.BoxGeometry(2.8, 1.5, 0.1);
    const windshieldMaterial = new THREE.MeshStandardMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.7,
        metalness: 0.9
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.set(0, 2.2, -2.95);
    truckGroup.add(windshield);

    // Flatbed base
    const flatbedGeometry = new THREE.BoxGeometry(4.2, 0.3, 8);
    const flatbedMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const flatbed = new THREE.Mesh(flatbedGeometry, flatbedMaterial);
    flatbed.position.set(0, 1.2, 2);
    flatbed.castShadow = true;
    truckGroup.add(flatbed);

    // Flatbed sides
    const sideGeometry = new THREE.BoxGeometry(0.15, 1, 8);
    const sideMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

    const leftSide = new THREE.Mesh(sideGeometry, sideMaterial);
    leftSide.position.set(-2.1, 1.7, 2);
    leftSide.castShadow = true;
    truckGroup.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeometry, sideMaterial);
    rightSide.position.set(2.1, 1.7, 2);
    rightSide.castShadow = true;
    truckGroup.add(rightSide);

    // Flatbed back gate
    const gateGeometry = new THREE.BoxGeometry(4.2, 1, 0.15);
    const gate = new THREE.Mesh(gateGeometry, sideMaterial);
    gate.position.set(0, 1.7, 6);
    gate.castShadow = true;
    truckGroup.add(gate);

    // Front grille
    const grilleGeometry = new THREE.BoxGeometry(2.5, 0.6, 0.2);
    const grilleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
    grille.position.set(0, 1.2, -6.2);
    truckGroup.add(grille);

    // Headlights
    const headlightGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.2);
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFAA });

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-1, 1.2, -6.25);
    truckGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(1, 1.2, -6.25);
    truckGroup.add(rightHeadlight);

    // Wheels - bigger and more detailed
    const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.6, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const rimGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.65, 16);
    const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

    const wheelPositions = [
        [-1.8, 0.7, -4.5], [1.8, 0.7, -4.5],  // Front
        [-1.8, 0.7, 4], [1.8, 0.7, 4],         // Back left/right
        [-1.8, 0.7, 5], [1.8, 0.7, 5]          // Back rear (dual)
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        wheel.castShadow = true;
        truckGroup.add(wheel);

        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.rotation.z = Math.PI / 2;
        rim.position.set(...pos);
        truckGroup.add(rim);
    });

    truckGroup.position.set(0, 0, 0);
    truckGroup.rotation.y = 0;
    return truckGroup;
};

// Trees on flatbed
const trees = [];
const createTree = (x, z) => {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2511 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.75;
    treeGroup.add(trunk);

    // Foliage
    const foliageGeometry = new THREE.ConeGeometry(0.8, 2, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 2.5;
    treeGroup.add(foliage);

    treeGroup.position.set(x, 1.5, z);
    treeGroup.userData = { onFire: false, health: 100, fireParticles: null };

    return treeGroup;
};

const createTreesOnTruck = () => {
    const positions = [
        [-1.2, 0.5], [1.2, 0.5],
        [-1.2, 2], [1.2, 2],
        [-1.2, 3.5], [1.2, 3.5],
        [0, 0.5], [0, 2], [0, 3.5],
        [-0.6, 1.2], [0.6, 1.2], [0, 2.8]
    ];

    positions.forEach(([x, z]) => {
        const tree = createTree(x, z);
        trees.push(tree);
        truck.add(tree);
    });
};

// Road
const roadSegments = [];
const createRoadSegment = (zPos) => {
    const roadGroup = new THREE.Group();

    // Road surface
    const roadGeometry = new THREE.PlaneGeometry(12, 20);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    roadGroup.add(road);

    // Lane markings
    for (let i = -8; i < 12; i += 4) {
        const lineGeometry = new THREE.BoxGeometry(0.3, 0.1, 2);
        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.position.set(0, 0.05, i);
        roadGroup.add(line);
    }

    // Grass on sides
    const grassGeometry = new THREE.PlaneGeometry(20, 20);
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x3a7c3a });

    const grassLeft = new THREE.Mesh(grassGeometry, grassMaterial);
    grassLeft.rotation.x = -Math.PI / 2;
    grassLeft.position.set(-16, -0.1, 0);
    grassLeft.receiveShadow = true;
    roadGroup.add(grassLeft);

    const grassRight = new THREE.Mesh(grassGeometry, grassMaterial);
    grassRight.rotation.x = -Math.PI / 2;
    grassRight.position.set(16, -0.1, 0);
    grassRight.receiveShadow = true;
    roadGroup.add(grassRight);

    roadGroup.position.z = zPos;
    return roadGroup;
};

// Traffic - simple cars based on truck geometry
const trafficCars = [];
const createTrafficCar = (lane, zPos) => {
    const carGroup = new THREE.Group();

    // Just make a simple car that DEFINITELY points the right way
    // Front box at NEGATIVE Z (like truck cab)

    const colors = [0xDC143C, 0x4169E1, 0xFFD700, 0x32CD32, 0x8A2BE2, 0xFF1493, 0x00CED1, 0xFF6347, 0x9370DB];
    const carColor = colors[Math.floor(Math.random() * colors.length)];
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: carColor,
        metalness: 0.5,
        roughness: 0.4
    });

    // SINGLE SOLID LOWER BODY - no gaps!
    const bodyGeometry = new THREE.BoxGeometry(2, 0.9, 4.5);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.9, 0);
    body.castShadow = true;
    carGroup.add(body);

    // Cabin/roof section - centered
    const cabinGeometry = new THREE.BoxGeometry(1.8, 0.8, 2.5);
    const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
    cabin.position.set(0, 1.7, 0);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Roof
    const roofGeometry = new THREE.BoxGeometry(1.6, 0.2, 2.3);
    const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
    roof.position.set(0, 2.2, 0);
    roof.castShadow = true;
    carGroup.add(roof);

    // Windows
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        transparent: true,
        opacity: 0.7,
        metalness: 0.9
    });

    // Windshield at front (negative Z)
    const windshieldGeometry = new THREE.BoxGeometry(1.7, 0.7, 0.1);
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(0, 1.7, -1.2);
    carGroup.add(windshield);

    // Rear window at back (positive Z)
    const rearWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
    rearWindow.position.set(0, 1.7, 1.2);
    carGroup.add(rearWindow);

    // Headlights at NEGATIVE Z (front)
    const headlightGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.15);
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFDD });

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.7, 0.9, -3.1);  // NEGATIVE Z = front
    carGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.7, 0.9, -3.1);  // NEGATIVE Z = front
    carGroup.add(rightHeadlight);

    // Taillights at POSITIVE Z (back)
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    const leftTaillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
    leftTaillight.position.set(-0.7, 0.9, 3.1);  // POSITIVE Z = back
    carGroup.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
    rightTaillight.position.set(0.7, 0.9, 3.1);  // POSITIVE Z = back
    carGroup.add(rightTaillight);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.36, 8);
    const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });

    const wheelPositions = [
        [-1.1, 0.45, -1.5],  // Front left (negative Z = front)
        [1.1, 0.45, -1.5],   // Front right
        [-1.1, 0.45, 1.5],   // Back left (positive Z = back)
        [1.1, 0.45, 1.5]     // Back right
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        carGroup.add(wheel);
    });

    const lanePositions = [-3.5, -1, 1, 3.5];
    carGroup.position.set(lanePositions[lane], 0, zPos);
    carGroup.rotation.y = 0; // NO rotation - simple geometry
    carGroup.userData = { speed: 0.1 + Math.random() * 0.05 }; // Slower than truck

    return carGroup;
};

// Meteors
const meteors = [];
const createMeteor = () => {
    const meteorGroup = new THREE.Group();

    // Main meteor body - super bright and fiery
    const meteorGeometry = new THREE.SphereGeometry(0.7, 12, 12);
    const meteorMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF3300,
        emissive: 0xFF3300,
        emissiveIntensity: 2.0,
        roughness: 0.3
    });
    const meteor = new THREE.Mesh(meteorGeometry, meteorMaterial);
    meteor.castShadow = true;
    meteorGroup.add(meteor);

    // Bright glowing core
    const coreGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFAA,
        transparent: true,
        opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    meteorGroup.add(core);

    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(1, 12, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF6600,
        transparent: true,
        opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    meteorGroup.add(glow);

    // Fire trail particles
    for (let i = 0; i < 8; i++) {
        const trailGeometry = new THREE.SphereGeometry(0.2 - i * 0.02, 6, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0xFF4500 : 0xFFA500,
            transparent: true,
            opacity: 0.7 - i * 0.08
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.y = i * 0.5;
        trail.userData = { offset: i };
        meteorGroup.add(trail);
    }

    // Spawn meteors at 45 degree angle - high and ahead
    const startX = (Math.random() - 0.5) * 15;
    const startHeight = 20 + Math.random() * 10;
    const startZ = -40 - Math.random() * 20;

    meteorGroup.position.set(startX, startHeight, startZ);

    // Target the truck area (Z=0) on the road at 45-degree angle
    // 45 degrees means equal horizontal and vertical distance
    const targetX = (Math.random() - 0.5) * 8; // Somewhere on the road width
    const targetY = 1.5; // Tree/ground height
    const targetZ = 0; // Where the truck is

    const dx = targetX - startX;
    const dy = targetY - startHeight;
    const dz = targetZ - startZ;

    // Normalize and set speed
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const speed = 0.4 + Math.random() * 0.2;

    meteorGroup.userData = {
        velocity: new THREE.Vector3(
            (dx / distance) * speed,
            (dy / distance) * speed,
            (dz / distance) * speed
        )
    };

    return meteorGroup;
};

// Puddles
const puddles = [];
const createPuddle = (zPos) => {
    const puddleGroup = new THREE.Group();

    // Main puddle - much more visible
    const puddleGeometry = new THREE.CircleGeometry(2.5, 32);
    const puddleMaterial = new THREE.MeshStandardMaterial({
        color: 0x1E90FF,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9
    });
    const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.06;
    puddleGroup.add(puddle);

    // Bright blue glow effect
    const glowGeometry = new THREE.CircleGeometry(3, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00BFFF,
        transparent: true,
        opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.05;
    puddleGroup.add(glow);

    puddleGroup.position.set(
        (Math.random() - 0.5) * 8,
        0,
        zPos
    );

    puddleGroup.userData = { pulse: 0 };
    return puddleGroup;
};

// Fire effect - much more dramatic
const createFireParticles = () => {
    const particleCount = 25;
    const particles = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
        const size = 0.1 + Math.random() * 0.15;
        const particleGeometry = new THREE.SphereGeometry(size, 6, 6);
        const colorChoice = Math.random();
        let color;
        if (colorChoice < 0.3) color = 0xFF0000;      // Red
        else if (colorChoice < 0.6) color = 0xFF4500; // Orange-red
        else if (colorChoice < 0.85) color = 0xFFA500; // Orange
        else color = 0xFFFF00;                         // Yellow

        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        particle.position.set(
            (Math.random() - 0.5) * 0.6,
            0.8 + Math.random() * 0.4,
            (Math.random() - 0.5) * 0.6
        );

        particle.userData = {
            baseColor: color,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                0.04 + Math.random() * 0.03,
                (Math.random() - 0.5) * 0.02
            ),
            life: Math.random(),
            rotationSpeed: (Math.random() - 0.5) * 0.2
        };

        particles.add(particle);
    }

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF4500,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 1.5;
    glow.userData = { isGlow: true };
    particles.add(glow);

    return particles;
};

const updateFireParticles = (fireGroup) => {
    fireGroup.children.forEach(particle => {
        if (particle.userData.isGlow) {
            // Pulse the glow
            particle.material.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.15;
            particle.scale.set(
                1 + Math.sin(Date.now() * 0.008) * 0.1,
                1 + Math.sin(Date.now() * 0.008) * 0.1,
                1 + Math.sin(Date.now() * 0.008) * 0.1
            );
            return;
        }

        particle.position.add(particle.userData.velocity);
        particle.userData.life += 0.04;
        particle.rotation.y += particle.userData.rotationSpeed;

        // Reset particle when it gets too high
        if (particle.userData.life > 1) {
            particle.position.set(
                (Math.random() - 0.5) * 0.6,
                0.8,
                (Math.random() - 0.5) * 0.6
            );
            particle.userData.life = 0;
        }

        // Fade and change color as it rises
        const life = particle.userData.life;
        particle.material.opacity = 0.9 * (1 - life);

        // Scale down as it rises
        const scale = 1 - life * 0.5;
        particle.scale.set(scale, scale, scale);
    });
};

// Input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// UI Elements
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');
const treeCountEl = document.getElementById('treeCount');
const distanceEl = document.getElementById('distance');
const earningsEl = document.getElementById('earnings');

// Initialize
const init = () => {
    truck = createTruck();
    scene.add(truck);
    createTreesOnTruck();

    // Create initial road segments - extending forward
    for (let i = -2; i < 10; i++) {
        const segment = createRoadSegment(i * 20);
        roadSegments.push(segment);
        scene.add(segment);
    }

    // Camera position - behind and above the truck looking forward
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, -20);
};

// Start game
const startGame = () => {
    gameState.isPlaying = true;
    gameState.trees = 12;
    gameState.distance = 0;
    gameState.earnings = 0;
    gameState.speed = gameState.targetSpeed;
    gameState.treesOnFire = 0;

    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');

    // Reset trees
    trees.forEach(tree => {
        tree.userData.onFire = false;
        tree.userData.health = 100;
        tree.userData.falling = false;
        tree.visible = true;

        // Reattach to truck if detached
        if (tree.parent !== truck) {
            scene.remove(tree);
            truck.add(tree);
            // Reset position relative to truck
            const positions = [
                [-1.2, 1.5, 0.5], [1.2, 1.5, 0.5],
                [-1.2, 1.5, 2], [1.2, 1.5, 2],
                [-1.2, 1.5, 3.5], [1.2, 1.5, 3.5],
                [0, 1.5, 0.5], [0, 1.5, 2], [0, 1.5, 3.5],
                [-0.6, 1.5, 1.2], [0.6, 1.5, 1.2], [0, 1.5, 2.8]
            ];
            const idx = trees.indexOf(tree);
            if (idx >= 0 && idx < positions.length) {
                tree.position.set(...positions[idx]);
                tree.rotation.set(0, 0, 0);
            }
        }

        // Remove any fire particles
        if (tree.userData.fireParticles) {
            tree.remove(tree.userData.fireParticles);
            tree.userData.fireParticles = null;
        }
        tree.children.forEach(child => {
            if (child.geometry.type === 'ConeGeometry') {
                child.material.color.setHex(0x228B22);
            }
        });
    });

    // Clear existing game objects
    meteors.forEach(m => scene.remove(m));
    meteors.length = 0;
    trafficCars.forEach(c => scene.remove(c));
    trafficCars.length = 0;
    puddles.forEach(p => scene.remove(p));
    puddles.length = 0;

    updateUI();
};

const endGame = () => {
    gameState.isPlaying = false;

    const treesDelivered = gameState.trees;
    const earnings = treesDelivered * 50 + (treesDelivered === 12 ? 200 : 0);
    gameState.earnings = earnings;

    document.getElementById('resultText').textContent =
        `You delivered ${treesDelivered} out of 12 trees!`;
    document.getElementById('earningsText').textContent =
        `Earned: $${earnings}${treesDelivered === 12 ? ' (Perfect Delivery Bonus!)' : ''}`;

    endScreen.classList.remove('hidden');
};

const updateUI = () => {
    treeCountEl.textContent = gameState.trees;
    distanceEl.textContent = Math.floor(gameState.distance);
    earningsEl.textContent = gameState.earnings;
};

// Game loop
const animate = () => {
    requestAnimationFrame(animate);

    if (!gameState.isPlaying) {
        renderer.render(scene, camera);
        return;
    }

    // Truck controls
    if (keys['arrowleft'] || keys['a']) {
        gameState.truckPosition -= 0.15;
    }
    if (keys['arrowright'] || keys['d']) {
        gameState.truckPosition += 0.15;
    }

    // Speed controls - gas and brake
    if (keys['arrowup'] || keys['w']) {
        gameState.speed = Math.min(0.5, gameState.speed + 0.01); // Gas - accelerate
    } else if (keys['arrowdown'] || keys['s']) {
        gameState.speed = Math.max(0.1, gameState.speed - 0.02); // Brake - decelerate
    } else {
        // Gradually return to target speed
        if (gameState.speed < gameState.targetSpeed) {
            gameState.speed = Math.min(gameState.targetSpeed, gameState.speed + 0.005);
        } else if (gameState.speed > gameState.targetSpeed) {
            gameState.speed = Math.max(gameState.targetSpeed, gameState.speed - 0.005);
        }
    }

    // Clamp truck position to road
    gameState.truckPosition = Math.max(-4.5, Math.min(4.5, gameState.truckPosition));
    truck.position.x = gameState.truckPosition;

    // Move road - scrolling AWAY from camera (toward horizon) to simulate forward movement
    gameState.distance += gameState.speed;
    roadSegments.forEach(segment => {
        segment.position.z += gameState.speed;

        if (segment.position.z > 40) {
            segment.position.z -= roadSegments.length * 20;
        }
    });

    // Spawn traffic AHEAD on the road - very close so you can see them immediately
    if (Math.random() < 0.02 && trafficCars.length < 6) {
        const car = createTrafficCar(Math.floor(Math.random() * 4), -20);  // Right in view
        trafficCars.push(car);
        scene.add(car);
        console.log('Car spawned at Z:', car.position.z, 'Truck at Z:', truck.position.z, 'Camera at:', camera.position.z);
    }

    trafficCars.forEach((car, index) => {
        // If car is destroyed, make it spin off dramatically
        if (car.userData.spinning) {
            car.position.add(car.userData.spinVelocity);
            car.userData.spinVelocity.y -= 0.02; // Gravity
            car.rotation.x += car.userData.rotationVelocity.x;
            car.rotation.y += car.userData.rotationVelocity.y;
            car.rotation.z += car.userData.rotationVelocity.z;

            // Remove when off screen
            if (car.position.y < -10 || Math.abs(car.position.x) > 30) {
                scene.remove(car);
                trafficCars.splice(index, 1);
                return;
            }
        } else {
            // Normal traffic movement - slower than road so you gradually pass them
            car.position.z += gameState.speed * 0.6;
        }

        // Check collision with truck
        const dx = Math.abs(truck.position.x - car.position.x);
        const dz = Math.abs(truck.position.z - car.position.z);

        if (dx < 2.5 && dz < 6 && !car.userData.hit) {
            car.userData.hit = true;

            // Bumper car physics - push truck sideways
            if (truck.position.x < car.position.x) {
                gameState.truckPosition -= 1.5;
            } else {
                gameState.truckPosition += 1.5;
            }

            // Push car away
            car.userData.hitVelocity = (truck.position.x - car.position.x) * 0.1;

            // Damage random trees
            const healthyTrees = trees.filter(t => t.userData.health > 0);
            if (healthyTrees.length > 0) {
                const randomTree = healthyTrees[Math.floor(Math.random() * healthyTrees.length)];
                randomTree.userData.health = 0;
                randomTree.userData.falling = true;
                randomTree.userData.fallVelocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    0.15,
                    (Math.random() - 0.5) * 0.1
                );
                gameState.trees--;
            }
        }

        // Apply hit velocity
        if (car.userData.hitVelocity) {
            car.position.x += car.userData.hitVelocity;
            car.userData.hitVelocity *= 0.95; // Decay
        }

        if (car.position.z > 30) {
            scene.remove(car);
            trafficCars.splice(index, 1);
        }
    });

    // Spawn meteors rarely - dramatic events (scales with level)
    const meteorChance = 0.008 + (gameState.level - 1) * 0.003;
    if (Math.random() < meteorChance && meteors.length < 5) {
        const meteor = createMeteor();
        meteors.push(meteor);
        scene.add(meteor);
    }

    meteors.forEach((meteor, index) => {
        meteor.position.add(meteor.userData.velocity);
        // Meteors fall from sky - no road movement needed

        // Orient meteor to point in direction of travel (like a comet)
        const velocity = meteor.userData.velocity;
        meteor.lookAt(
            meteor.position.x + velocity.x,
            meteor.position.y + velocity.y,
            meteor.position.z + velocity.z
        );

        // Animate trail
        meteor.children.forEach((child, i) => {
            if (child.userData.offset !== undefined) {
                const offset = child.userData.offset;
                child.position.y = offset * 0.5 + Math.sin(Date.now() * 0.01 + offset) * 0.1;
            }
        });

        // Check collision with cars first - OBLITERATE them!
        trafficCars.forEach(car => {
            if (car.userData.destroyed) return;

            const carDist = meteor.position.distanceTo(car.position);
            if (carDist < 3 && meteor.position.y < 4) {
                car.userData.destroyed = true;
                car.userData.spinning = true;
                car.userData.spinVelocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    0.3,
                    (Math.random() - 0.5) * 0.3
                );
                car.userData.rotationVelocity = new THREE.Vector3(
                    Math.random() * 0.3,
                    Math.random() * 0.3,
                    Math.random() * 0.3
                );
            }
        });

        // Check collision with trees - even bigger hitbox
        if (meteor.position.y < 5 && meteor.position.y > -1) {
            trees.forEach(tree => {
                if (tree.userData.health <= 0 || tree.userData.falling) return;

                const treeWorldPos = new THREE.Vector3();
                tree.getWorldPosition(treeWorldPos);

                const distance = meteor.position.distanceTo(treeWorldPos);
                if (distance < 3) {  // Much larger hitbox
                    // Direct hit - destroy tree immediately
                    if (distance < 1.5) {
                        tree.userData.health = 0;
                        if (!tree.userData.falling) {
                            gameState.trees--;
                            tree.userData.falling = true;
                            tree.userData.fallVelocity = new THREE.Vector3(
                                (Math.random() - 0.5) * 0.4,
                                0.25,
                                (Math.random() - 0.5) * 0.2
                            );
                            // Add fire before it falls
                            if (!tree.userData.onFire) {
                                const fire = createFireParticles();
                                tree.userData.fireParticles = fire;
                                tree.add(fire);
                            }
                        }
                    } else {
                        // Graze - start fire and damage
                        if (!tree.userData.onFire) {
                            tree.userData.onFire = true;
                            const fire = createFireParticles();
                            tree.userData.fireParticles = fire;
                            tree.add(fire);
                        }

                        tree.userData.health -= 30;

                        if (tree.userData.health <= 0 && !tree.userData.falling) {
                            gameState.trees--;
                            tree.userData.falling = true;
                            tree.userData.fallVelocity = new THREE.Vector3(
                                (Math.random() - 0.5) * 0.3,
                                0.2,
                                (Math.random() - 0.5) * 0.15
                            );
                        } else if (tree.userData.health > 0) {
                            tree.children.forEach(child => {
                                if (child.geometry.type === 'ConeGeometry') {
                                    child.material.color.setHex(0xFF4500);
                                }
                            });
                        }
                    }
                }
            });
        }

        // Remove when hits ground, goes too far past, or too far behind
        if (meteor.position.y < -2 || meteor.position.z > 30 || meteor.position.z < -100) {
            scene.remove(meteor);
            meteors.splice(index, 1);
        }
    });

    // Spawn and check puddles - ahead of truck
    if (Math.random() < 0.01 && puddles.length < 3) {
        const puddle = createPuddle(-50 - Math.random() * 30);
        puddles.push(puddle);
        scene.add(puddle);
    }

    puddles.forEach((puddle, index) => {
        // Puddles move with road
        puddle.position.z += gameState.speed;

        // Pulse animation for puddles
        puddle.userData.pulse += 0.05;
        puddle.children[1].material.opacity = 0.4 + Math.sin(puddle.userData.pulse) * 0.2;

        // Check if truck is over puddle
        const dx = Math.abs(truck.position.x - puddle.position.x);
        const dz = Math.abs(truck.position.z - puddle.position.z);

        if (dx < 3.5 && dz < 6) {
            trees.forEach(tree => {
                if (tree.userData.onFire && tree.userData.health > 0) {
                    tree.userData.onFire = false;
                    tree.userData.health = 100;
                    // Remove fire particles
                    if (tree.userData.fireParticles) {
                        tree.remove(tree.userData.fireParticles);
                        tree.userData.fireParticles = null;
                    }
                    tree.children.forEach(child => {
                        if (child.geometry.type === 'ConeGeometry') {
                            child.material.color.setHex(0x228B22);
                        }
                    });
                }
            });
        }

        if (puddle.position.z > 100) {
            scene.remove(puddle);
            puddles.splice(index, 1);
        }
    });

    // Spread fire
    if (Math.random() < 0.01) {
        trees.forEach(tree1 => {
            if (!tree1.userData.onFire || tree1.userData.health <= 0) return;

            trees.forEach(tree2 => {
                if (tree1 === tree2 || tree2.userData.health <= 0) return;

                const pos1 = new THREE.Vector3();
                const pos2 = new THREE.Vector3();
                tree1.getWorldPosition(pos1);
                tree2.getWorldPosition(pos2);

                if (pos1.distanceTo(pos2) < 2 && Math.random() < 0.3) {
                    if (!tree2.userData.onFire) {
                        tree2.userData.onFire = true;
                        // Add fire particles
                        const fire = createFireParticles();
                        tree2.userData.fireParticles = fire;
                        tree2.add(fire);
                    }
                    tree2.userData.health -= 20;

                    if (tree2.userData.health <= 50) {
                        tree2.children.forEach(child => {
                            if (child.geometry.type === 'ConeGeometry') {
                                child.material.color.setHex(0xFF4500);
                            }
                        });
                    }
                }
            });
        });
    }

    // Update fire particles on burning trees and falling trees
    trees.forEach(tree => {
        if (tree.userData.fireParticles) {
            updateFireParticles(tree.userData.fireParticles);
        }

        // Update falling trees
        if (tree.userData.falling) {
            // Detach from truck
            if (tree.parent === truck) {
                const worldPos = new THREE.Vector3();
                const worldRot = new THREE.Euler();
                tree.getWorldPosition(worldPos);
                tree.getWorldQuaternion(new THREE.Quaternion().setFromEuler(worldRot));

                truck.remove(tree);
                scene.add(tree);
                tree.position.copy(worldPos);
            }

            // Apply physics
            tree.position.add(tree.userData.fallVelocity);
            tree.userData.fallVelocity.y -= 0.02; // Gravity
            tree.rotation.x += 0.1;
            tree.rotation.z += 0.15;

            // Remove when off screen
            if (tree.position.y < -5 || tree.position.z > 50) {
                scene.remove(tree);
                tree.visible = false;
            }
        }
    });

    updateUI();

    // Check end condition
    if (gameState.distance > 500 || gameState.trees <= 0) {
        endGame();
    }

    renderer.render(scene, camera);
};

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start
init();
animate();
