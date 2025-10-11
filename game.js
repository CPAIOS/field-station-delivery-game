import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

// Tree types with costs and profits
const treeTypes = {
    budget: { cost: 30, sellPrice: 60, name: 'Budget Saplings', emoji: '🌱' },
    standard: { cost: 50, sellPrice: 100, name: 'Standard Trees', emoji: '🌳' },
    premium: { cost: 75, sellPrice: 150, name: 'Premium Trees', emoji: '🎄' }
};

// Game state
const gameState = {
    isPlaying: false,
    level: 1,
    trees: 12,
    treesOnFire: 0,
    distance: 0,
    cash: 1000, // Starting cash
    investment: 0, // Amount spent on current load
    treeType: 'standard', // Current tree type selected
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
    antialias: true,
    powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Enhanced Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Main sun light
const directionalLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

// Hemisphere light for better sky/ground lighting
const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x6B8E23, 0.4);
scene.add(hemiLight);

// Add some atmospheric perspective with better fog
scene.fog = new THREE.Fog(0x87CEEB, 30, 150);

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

// Enhanced Trees on flatbed
const trees = [];
const createTree = (x, z) => {
    const treeGroup = new THREE.Group();

    // Use 3D model if loaded - select based on tree tier
    if (treeModelsLoaded && preloadedTreeModels[gameState.treeType]) {
        console.log('Creating tree with type:', gameState.treeType);
        const treeModel = preloadedTreeModels[gameState.treeType].clone(true);
        treeModel.scale.set(0.8, 0.8, 0.8);
        treeModel.position.set(0, 0, 0);

        // Enable shadows
        treeModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        treeGroup.add(treeModel);
    } else {
        // Fallback to procedural tree if model not loaded
        const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.22, 1.8, 12);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a2511,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.9;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5a2d,
            roughness: 0.8,
            metalness: 0.0
        });

        const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.2, 8), foliageMaterial);
        foliage1.position.y = 2.2;
        foliage1.castShadow = true;
        treeGroup.add(foliage1);

        const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.0, 8), foliageMaterial.clone());
        foliage2.material.color.setHex(0x3a6e3a);
        foliage2.position.y = 2.8;
        foliage2.castShadow = true;
        treeGroup.add(foliage2);

        const foliage3 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 8), foliageMaterial.clone());
        foliage3.material.color.setHex(0x228B22);
        foliage3.position.y = 3.4;
        foliage3.castShadow = true;
        treeGroup.add(foliage3);
    }

    treeGroup.position.set(x, 1.5, z);
    treeGroup.userData = {
        onFire: false,
        health: 100,
        fireParticles: null,
        smoldering: false,
        smolderingTime: 0
    };

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

// Enhanced Road with better details
const roadSegments = [];
const createRoadSegment = (zPos) => {
    const roadGroup = new THREE.Group();

    // Main road surface with better material
    const roadGeometry = new THREE.PlaneGeometry(12, 20);
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.9,
        metalness: 0.0
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    roadGroup.add(road);

    // Road edge lines (yellow/white)
    const edgeGeometry = new THREE.BoxGeometry(0.2, 0.12, 20);
    const yellowMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDD00,
        emissive: 0xFFDD00,
        emissiveIntensity: 0.2
    });

    const leftEdge = new THREE.Mesh(edgeGeometry, yellowMaterial);
    leftEdge.position.set(-6, 0.06, 0);
    roadGroup.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeometry, yellowMaterial);
    rightEdge.position.set(6, 0.06, 0);
    roadGroup.add(rightEdge);

    // Lane markings - dashed white lines
    for (let i = -8; i < 12; i += 4) {
        // Center lane dividers
        for (let lane = -2.5; lane <= 2.5; lane += 2.5) {
            if (lane !== 0) continue; // Only center line for now
            const lineGeometry = new THREE.BoxGeometry(0.25, 0.11, 2.5);
            const lineMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                emissive: 0xFFFFFF,
                emissiveIntensity: 0.1
            });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(lane, 0.055, i);
            roadGroup.add(line);
        }
    }

    // Enhanced grass with variation
    const grassGeometry = new THREE.PlaneGeometry(20, 20);
    const grassMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a7c3a,
        roughness: 1.0,
        metalness: 0.0
    });

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

    // Add some roadside details
    if (Math.random() < 0.3) {
        // Random rocks/debris on roadside
        for (let i = 0; i < 2; i++) {
            const rockSize = 0.3 + Math.random() * 0.4;
            const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                roughness: 0.9
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 8),
                rockSize / 2,
                (Math.random() - 0.5) * 18
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            roadGroup.add(rock);
        }
    }

    roadGroup.position.z = zPos;
    return roadGroup;
};

// 3D Tree Models - different models for each tier (Poly Pizza)
const treeModelsByTier = {
    budget: 'models/Birch Trees.glb',
    standard: 'models/Pine Trees.glb',
    premium: 'models/Maple Trees.glb'
};
let preloadedTreeModels = {};
let treeModelsLoaded = false;

// Traffic - 3D GLTF models
const trafficCars = [];
const lastCarSpawnTime = [0, 0, 0, 0]; // Track last spawn time per lane

// Preload car models - separated into normal and special vehicles
// Adding vehicles one at a time to test sizing
const normalCarModels = [
    'models/Car.glb',
    'models/SUV.glb',
    'models/Taxi.glb',
    'models/Police Car.glb',
    'models/CAR Model.glb',
    'models/Chevrolet Camaro.glb',
    'models/Convertible.glb',
    'models/Pickup Truck.glb',
    'models/Mitsubishi L200.glb'
    // 'models/Range Rover.glb' - Removed, positioning issues
    // 'models/Old Truck.glb' - Removed, doesn't work well
];

const specialVehicleModels = [
    // All commented out - will add back one at a time
    // 'models/Jeep.glb',
    // 'models/Jeep-2.glb',
    // 'models/M939 Truck.glb',
    // 'models/Bulldozer.glb',
    // 'models/Locomotive Front.glb'
];

const preloadedNormalCars = [];
const preloadedSpecialVehicles = [];
let modelsLoaded = false;

const loader = new GLTFLoader();
let normalCarsLoaded = 0;
let specialVehiclesLoaded = 0;

// Load normal cars
normalCarModels.forEach((modelPath, idx) => {
    loader.load(
        modelPath,
        (gltf) => {
            preloadedNormalCars.push({model: gltf.scene.clone(true), name: modelPath}); // Deep clone with name
            normalCarsLoaded++;
            checkAllModelsLoaded();
        },
        undefined,
        (error) => {
            console.error('Error loading car model:', modelPath, error);
        }
    );
});

// Load special vehicles
specialVehicleModels.forEach(modelPath => {
    loader.load(
        modelPath,
        (gltf) => {
            preloadedSpecialVehicles.push(gltf.scene.clone(true)); // Deep clone
            specialVehiclesLoaded++;
            checkAllModelsLoaded();
        },
        undefined,
        (error) => {
            console.error('Error loading special vehicle:', modelPath, error);
        }
    );
});

function checkAllModelsLoaded() {
    if (normalCarsLoaded === normalCarModels.length &&
        specialVehiclesLoaded === specialVehicleModels.length) {
        modelsLoaded = true;
        console.log('All vehicle models preloaded!');
    }
}

// Load all tree models
let treeLoadCount = 0;
Object.keys(treeModelsByTier).forEach(tier => {
    console.log('Loading tree model for', tier, ':', treeModelsByTier[tier]);
    loader.load(
        treeModelsByTier[tier],
        (gltf) => {
            preloadedTreeModels[tier] = gltf.scene.clone(true);
            console.log('✓ Loaded', tier, 'tree model:', treeModelsByTier[tier], '- children:', gltf.scene.children.length);
            treeLoadCount++;
            if (treeLoadCount === Object.keys(treeModelsByTier).length) {
                treeModelsLoaded = true;
                console.log('All tree models loaded!');
            }
        },
        undefined,
        (error) => {
            console.error('Error loading tree model for tier', tier, error);
        }
    );
});

const createTrafficCar = (lane, zPos, isSpecial = false) => {
    // If models not loaded yet, return null
    if (!modelsLoaded || preloadedNormalCars.length === 0) {
        return null;
    }

    const carGroup = new THREE.Group();
    let carModel, scale, selectedCar;

    if (isSpecial && preloadedSpecialVehicles.length > 0) {
        // Special vehicles - spawn horizontally across road
        carModel = preloadedSpecialVehicles[Math.floor(Math.random() * preloadedSpecialVehicles.length)].clone(true);
        scale = 1.75; // Match normal car scale

        // Special vehicles move horizontally across the road
        carGroup.userData.isSpecial = true;
        carGroup.userData.horizontalSpeed = 0.1 + Math.random() * 0.1;
        carGroup.userData.direction = Math.random() < 0.5 ? 1 : -1; // Left or right

        // Position at edge of road, will cross horizontally
        carModel.rotation.set(0, Math.PI / 2 * carGroup.userData.direction, 0); // Face sideways
    } else {
        // Normal cars
        selectedCar = preloadedNormalCars[Math.floor(Math.random() * preloadedNormalCars.length)];
        carModel = selectedCar.model.clone(true);

        // Per-model scale adjustments
        if (selectedCar.name.includes('Convertible')) {
            scale = 0.6; // Convertible is much bigger than others
        } else if (selectedCar.name.includes('Pickup Truck')) {
            scale = 1.5; // Pickup Truck a bit smaller
        } else if (selectedCar.name.includes('Mitsubishi')) {
            scale = 2.5; // Mitsubishi is too small
        } else {
            scale = 1.75; // Default scale
        }

        carModel.rotation.set(0, Math.PI, 0); // Face away from camera
        carGroup.userData.isSpecial = false;
    }

    carModel.position.set(0, 0, 0);
    carModel.scale.set(scale, scale, scale);
    console.log('Car spawned with scale:', scale);

    // Enable shadows
    carModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    carGroup.add(carModel);

    const lanePositions = [-3.5, -1, 1, 3.5];
    carGroup.position.set(lanePositions[lane], 0, zPos);
    carGroup.rotation.y = 0;

    // Speed for normal cars (special vehicles use horizontal speed)
    if (!isSpecial) {
        const rand = Math.random();
        if (rand < 0.3) {
            carGroup.userData.speed = 0.1 + Math.random() * 0.1; // 0.1-0.2
        } else if (rand < 0.7) {
            carGroup.userData.speed = 0.2 + Math.random() * 0.15; // 0.2-0.35
        } else {
            carGroup.userData.speed = 0.4 + Math.random() * 0.3; // 0.4-0.7
        }
    }

    return carGroup;
};

// 3D Meteor Models
const meteors = [];
const meteorModels = ['models/Asteroid.glb', 'models/Comet.glb', 'models/Fire.glb'];
const preloadedMeteorModels = [];
let meteorModelsLoaded = false;

// Monster Models
const monsters = [];
const monsterModels = {
    dragon: 'models/Dragon.glb',
    demon: 'models/Demon.glb',
    monsterolophus: 'models/Monsterolophus.glb',
    biomech: 'models/Creature Bio-Mech - Base.1.glb'
};
const preloadedMonsters = {};
let monstersLoaded = false;

// Preload meteor models
meteorModels.forEach(modelPath => {
    loader.load(
        modelPath,
        (gltf) => {
            preloadedMeteorModels.push(gltf.scene.clone());
            if (preloadedMeteorModels.length === meteorModels.length) {
                meteorModelsLoaded = true;
                console.log('All meteor models preloaded!');
            }
        },
        undefined,
        (error) => {
            console.error('Error loading meteor model:', modelPath, error);
        }
    );
});

// Preload monster models
let monsterLoadCount = 0;
Object.keys(monsterModels).forEach(monsterType => {
    loader.load(
        monsterModels[monsterType],
        (gltf) => {
            preloadedMonsters[monsterType] = gltf.scene.clone(true);
            monsterLoadCount++;
            if (monsterLoadCount === Object.keys(monsterModels).length) {
                monstersLoaded = true;
                console.log('All monster models preloaded!');
            }
        },
        undefined,
        (error) => {
            console.error('Error loading monster:', monsterType, error);
        }
    );
});

const createMeteor = () => {
    const meteorGroup = new THREE.Group();

    // Use 3D model if loaded, otherwise skip
    if (meteorModelsLoaded && preloadedMeteorModels.length > 0) {
        const meteorModel = preloadedMeteorModels[Math.floor(Math.random() * preloadedMeteorModels.length)].clone(true);
        meteorModel.scale.set(0.5, 0.5, 0.5);
        meteorModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                // Add glowing emissive material to make it look like a fireball
                if (child.material) {
                    child.material = child.material.clone();
                    child.material.emissive = new THREE.Color(0xFF4500);
                    child.material.emissiveIntensity = 2;
                }
            }
        });
        meteorGroup.add(meteorModel);
    }

    // Add glowing sphere for fireball effect
    const fireballGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const fireballMat = new THREE.MeshBasicMaterial({
        color: 0xFF6600,
        transparent: true,
        opacity: 0.7
    });
    const fireball = new THREE.Mesh(fireballGeo, fireballMat);
    meteorGroup.add(fireball);

    // Add flame trail particles - will be positioned in animation loop
    for (let i = 0; i < 8; i++) {
        const size = 0.5 - i * 0.05;
        const trailGeo = new THREE.SphereGeometry(size, 8, 8);
        const colors = [0xFFFF00, 0xFFAA00, 0xFF6600, 0xFF4500];
        const trailMat = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(i / 2) % colors.length],
            transparent: true,
            opacity: 0.8 - i * 0.08
        });
        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.userData = { offset: i, isTrail: true };
        meteorGroup.add(trail);
    }

    // Add point light for dynamic lighting
    const meteorLight = new THREE.PointLight(0xFF6600, 4, 20);
    meteorLight.castShadow = true;
    meteorGroup.add(meteorLight);

    // Spawn meteors at 45 degree angle - high and ahead
    const startX = (Math.random() - 0.5) * 15;
    const startHeight = 20 + Math.random() * 10;
    const startZ = truck.position.z - 40 - Math.random() * 20;

    meteorGroup.position.set(startX, startHeight, startZ);

    // Target random spots on the road ahead of truck at 45-degree angle
    // 45 degrees means equal horizontal and vertical distance
    const targetX = (Math.random() - 0.5) * 8; // Somewhere on the road width
    const targetY = 1.5; // Tree/ground height
    const targetZ = truck.position.z - (20 + Math.random() * 40); // Random spot ahead of truck

    const dx = targetX - startX;
    const dy = targetY - startHeight;
    const dz = targetZ - startZ;

    // Normalize and set speed - slower for easier gameplay
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const speed = 0.25 + Math.random() * 0.15;

    meteorGroup.userData = {
        velocity: new THREE.Vector3(
            (dx / distance) * speed,
            (dy / distance) * speed,
            (dz / distance) * speed
        )
    };

    return meteorGroup;
};

// Enhanced Puddles with better reflective appearance and splash effects
const puddles = [];
const createPuddle = (zPos) => {
    const puddleGroup = new THREE.Group();

    // Main puddle - more realistic water with irregular shape
    const puddleGeometry = new THREE.CircleGeometry(2.8, 32);
    const puddleMaterial = new THREE.MeshStandardMaterial({
        color: 0x6699CC, // Darker, more realistic water
        metalness: 0.6,
        roughness: 0.2,
        transparent: true,
        opacity: 0.7,
        emissive: 0x002244,
        emissiveIntensity: 0.1
    });
    const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.02; // Lower, more on the ground
    puddleGroup.add(puddle);

    // Darker wet road edges around puddle
    const wetRoadGeometry = new THREE.CircleGeometry(3.5, 32);
    const wetRoadMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.4
    });
    const wetRoad = new THREE.Mesh(wetRoadGeometry, wetRoadMaterial);
    wetRoad.rotation.x = -Math.PI / 2;
    wetRoad.position.y = 0.01;
    puddleGroup.add(wetRoad);

    // Subtle shimmer layers
    for (let i = 0; i < 2; i++) {
        const shimmerGeometry = new THREE.CircleGeometry(2.5 + i * 0.3, 32);
        const shimmerMaterial = new THREE.MeshBasicMaterial({
            color: 0xAADDFF,
            transparent: true,
            opacity: 0.15 - i * 0.05
        });
        const shimmer = new THREE.Mesh(shimmerGeometry, shimmerMaterial);
        shimmer.rotation.x = -Math.PI / 2;
        shimmer.position.y = 0.03 + i * 0.01;
        puddleGroup.add(shimmer);
    }

    puddleGroup.position.set(
        (Math.random() - 0.5) * 8,
        0,
        zPos
    );

    puddleGroup.userData = {
        pulse: 0,
        splashing: false,
        splashParticles: [],
        hasHealed: false
    };
    return puddleGroup;
};

// Create Monster
const createMonster = (type) => {
    if (!monstersLoaded) return null;

    const monsterGroup = new THREE.Group();

    // Load the appropriate monster model
    if (!preloadedMonsters[type]) {
        console.error('Monster model not loaded for type:', type);
        return null;
    }
    const monsterModel = preloadedMonsters[type].clone(true);
    console.log('Creating monster:', type, 'Model has', monsterModel.children.length, 'children');

    // Set scale based on monster type
    let scale = 5; // Default larger scale
    if (type === 'dragon') {
        scale = 0.08; // Dragon model is huge, needs small scale
    } else if (type === 'demon') {
        scale = 100; // TESTING: GIGANTIC scale to see it
    } else if (type === 'monsterolophus') {
        scale = 10; // Bigger
    } else if (type === 'biomech') {
        scale = 15; // Bigger charging roadblock
    }

    monsterModel.scale.set(scale, scale, scale);
    console.log('⚠️ TESTING DEMON - Monster type:', type, 'scaled to:', scale, 'at position:', monsterGroup.position.x, monsterGroup.position.y, monsterGroup.position.z);

    let meshCount = 0;
    let hasMaterial = false;
    monsterModel.traverse((child) => {
        if (child.isMesh) {
            meshCount++;
            console.log('Mesh found:', child.name, 'Geometry:', child.geometry.type, 'Material:', child.material ? child.material.type : 'none');

            // For dragon, center the geometry and offset position
            if (type === 'dragon') {
                // Center the geometry at origin
                child.geometry.center();
                // Move the mesh forward since dragon was facing backward
                child.position.z = 0;
                child.position.y = 0;
                child.position.x = 0;
                console.log('Dragon geometry centered and positioned at origin');
            }
            // DON'T center demon - leave it as-is from the model file

            child.castShadow = true;
            child.receiveShadow = true;

            // Fix material issues
            if (child.material) {
                hasMaterial = true;
                child.material.visible = true;
                // Make demon glow bright red so we can see it
                if (type === 'demon') {
                    child.material.emissive = new THREE.Color(0xFF0000);
                    child.material.emissiveIntensity = 1;
                    console.log('🔴 Made demon glow RED!');
                }
            }
        }
    });
    console.log('Monster has', meshCount, 'meshes, hasMaterial:', hasMaterial);

    monsterGroup.add(monsterModel);

    // For dragon, create a head marker to attach fire to
    if (type === 'dragon') {
        const headMarker = new THREE.Object3D();
        // Initial position - will be adjusted based on flight direction
        headMarker.position.set(0, 0, 0);
        monsterGroup.add(headMarker);
        monsterGroup.userData.headMarker = headMarker;
        console.log('Dragon head marker created at:', headMarker.position);
    }

    // Set type-specific properties
    monsterGroup.userData.type = type;
    monsterGroup.userData.health = 3;

    if (type === 'dragon') {
        // Dragon flies overhead and across the road
        const side = Math.random() < 0.5 ? -1 : 1; // Which side to start from
        monsterGroup.position.set(
            side * 25, // Start much further from road
            10, // Flying high above road
            truck.position.z - 30 - Math.random() * 20
        );
        monsterGroup.userData.swooping = false;
        monsterGroup.userData.fireBreathing = false;
        monsterGroup.userData.crossDirection = -side; // Fly across to opposite side
        monsterGroup.userData.crossSpeed = 0.15;

        // Update head marker to point in direction of flight
        const headMarker = monsterGroup.userData.headMarker;
        if (headMarker) {
            // Head is in front along the direction the dragon is flying
            headMarker.position.set(-side * 20, 0, 0); // Negative side because crossDirection = -side
            console.log('Dragon head marker adjusted for flight direction:', headMarker.position);
        }
    } else if (type === 'demon') {
        // Demon spawns ahead on the road and chases
        // Truck moves backward (negative Z), so ahead = MORE negative
        monsterGroup.position.set(
            (Math.random() - 0.5) * 8,
            0.5, // ON THE GROUND - low Y position
            truck.position.z - 20 - Math.random() * 10 // AHEAD of truck (more negative Z)
        );
        monsterGroup.userData.chasing = true;
        console.log('🔴 DEMON spawned ahead of truck. Demon Z:', monsterGroup.position.z, 'Truck Z:', truck.position.z);
    } else if (type === 'monsterolophus') {
        // Crosses the road - starts from the side
        const direction = Math.random() < 0.5 ? 1 : -1;
        monsterGroup.position.set(
            direction * 12, // Start closer to road edge
            1,
            truck.position.z - 20 - Math.random() * 30
        );
        monsterGroup.userData.crossingSpeed = 0.08; // SLOWER crossing - unstoppable beast
        monsterGroup.userData.direction = -direction; // Negative so it moves toward opposite side
    } else if (type === 'biomech') {
        // Charging roadblock - barrels down a lane
        const lane = Math.floor(Math.random() * 4);
        const lanePositions = [-3.5, -1, 1, 3.5];
        monsterGroup.position.set(
            lanePositions[lane],
            1,
            truck.position.z - 60 - Math.random() * 20 // Spawn further ahead
        );
        monsterGroup.userData.chargeSpeed = 0.4; // Fast charge down the road
        console.log('🤖 BIOMECH charging down lane at X:', lanePositions[lane]);
    }

    return monsterGroup;
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

// UI Elements - will be initialized after DOM loads
let purchaseScreen, startBtn, restartBtn, startScreen, endScreen;
let treeCountEl, distanceEl, earningsEl, levelDisplayEl, budgetAmountEl;
let budgetOption, standardOption, premiumOption;

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

// Purchase trees
const purchaseTrees = (type) => {
    const treeInfo = treeTypes[type];
    const totalCost = treeInfo.cost * 12;

    if (gameState.cash < totalCost) {
        alert('Not enough cash!');
        return;
    }

    gameState.treeType = type;
    gameState.investment = totalCost;
    gameState.cash -= totalCost;

    purchaseScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
};

// Start game
const startGame = () => {
    gameState.isPlaying = true;
    gameState.trees = 12;
    gameState.distance = 0;
    gameState.speed = gameState.targetSpeed;
    gameState.treesOnFire = 0;

    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');

    // Reset trees
    trees.forEach(tree => {
        tree.userData.onFire = false;
        tree.userData.health = 100;
        tree.userData.falling = false;
        tree.userData.smoldering = false;
        tree.userData.smolderingTime = 0;
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

        // Reset procedural tree colors only (don't touch 3D models)
        tree.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'ConeGeometry') {
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
    const treeInfo = treeTypes[gameState.treeType];
    const revenue = treesDelivered * treeInfo.sellPrice;
    const profit = revenue - gameState.investment;
    const perfectBonus = treesDelivered === 12 ? 200 : 0;
    const totalEarnings = profit + perfectBonus;

    gameState.cash += revenue + perfectBonus;

    // Level up if profitable
    if (profit > 0) {
        gameState.level++;
        // Increase difficulty
        gameState.targetSpeed = Math.min(0.5, 0.3 + (gameState.level - 1) * 0.03);
    }

    document.getElementById('resultText').textContent =
        `Level ${gameState.level} Complete! You delivered ${treesDelivered} out of 12 ${treeInfo.name}!`;
    document.getElementById('earningsText').textContent =
        `Investment: $${gameState.investment} | Revenue: $${revenue}${perfectBonus > 0 ? ' + $200 bonus' : ''}\n` +
        `Profit: ${profit >= 0 ? '+' : ''}$${totalEarnings} | Total Cash: $${gameState.cash}`;

    endScreen.classList.remove('hidden');
    updateUI();
};

const updateUI = () => {
    if (!treeCountEl) return; // Wait for DOM to be ready
    treeCountEl.textContent = gameState.trees;
    distanceEl.textContent = Math.floor(gameState.distance);
    earningsEl.textContent = gameState.cash;
    levelDisplayEl.textContent = gameState.level;
    budgetAmountEl.textContent = gameState.cash;
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

    // Speed controls - gas and brake (can go in reverse)
    if (keys['arrowup'] || keys['w']) {
        gameState.speed = Math.min(0.8, gameState.speed + 0.01); // Gas - accelerate
    } else if (keys['arrowdown'] || keys['s']) {
        gameState.speed = Math.max(-0.2, gameState.speed - 0.02); // Brake - can go into reverse
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

    // Track distance traveled
    gameState.distance += gameState.speed;

    // Move truck forward (or backward if speed is negative)
    truck.position.z -= gameState.speed;

    // Camera follows truck
    camera.position.z = truck.position.z + 15;

    // Move road segments to create infinite road
    roadSegments.forEach(segment => {
        // When a segment is too far behind camera, move it ahead
        if (segment.position.z - camera.position.z > 20) {
            segment.position.z -= 240; // 12 segments * 20 units = 240
        }
        // When a segment is too far ahead, move it behind
        if (camera.position.z - segment.position.z > 100) {
            segment.position.z += 240;
        }
    });

    // Spawn traffic with increasing density per level
    const trafficChance = 0.03 + (gameState.level - 1) * 0.01; // Doubled spawn rate
    const maxTraffic = 8 + Math.floor(gameState.level / 2); // More cars on road at once
    if (Math.random() < trafficChance && trafficCars.length < maxTraffic) {
        const lane = Math.floor(Math.random() * 4);
        const currentTime = Date.now();

        // Only spawn if lane hasn't had a car in last 3 seconds AND no car currently in lane near spawn point
        const laneIsClear = !trafficCars.some(car => {
            const carLane = Math.round((car.position.x + 4.5) / 2.5); // Calculate which lane car is in
            const relativeZ = car.position.z - camera.position.z;
            return carLane === lane && relativeZ < -10 && relativeZ > -60;
        });

        if (laneIsClear && (currentTime - lastCarSpawnTime[lane] > 3000)) {
            // 2% chance of special vehicle, 98% normal car
            const isSpecial = Math.random() < 0.02;
            const car = createTrafficCar(lane, camera.position.z - 40 - Math.random() * 20, isSpecial);
            if (car) { // Only add if models are loaded
                trafficCars.push(car);
                scene.add(car);
                lastCarSpawnTime[lane] = currentTime;
            }
        }
    }

    // DEBUG: Log traffic cars array
    if (Math.random() < 0.01) {
        console.log('Traffic cars count:', trafficCars.length);
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
            // Check if special vehicle moving horizontally
            if (car.userData.isSpecial) {
                // Move horizontally across the road
                car.position.x += car.userData.horizontalSpeed * car.userData.direction;

                // Remove when off the road
                if (Math.abs(car.position.x) > 15) {
                    scene.remove(car);
                    trafficCars.splice(index, 1);
                    return;
                }
            } else {
                // Normal traffic movement - cars move at their own random speed
                car.position.z -= car.userData.speed;
            }
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

            // Check if demon is attacking - knock it off!
            let demonKnockedOff = false;
            monsters.forEach(monster => {
                if (monster.userData.type === 'demon') {
                    const demonDist = monster.position.distanceTo(truck.position);
                    if (demonDist < 8) {
                        console.log('💥 CAR HIT KNOCKED OFF DEMON!');
                        scene.remove(monster);
                        monsters.splice(monsters.indexOf(monster), 1);
                        demonKnockedOff = true;
                    }
                }
            });

            // Damage random trees (only if no demon was knocked off, or 50% chance if demon was knocked off)
            if (!demonKnockedOff || Math.random() < 0.5) {
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
                    console.log(demonKnockedOff ? '💥 Knocked off demon BUT still lost a tree!' : '💥 Hit car, lost a tree');
                }
            } else {
                console.log('💥 Knocked off demon, saved the trees!');
            }
        }

        // Apply hit velocity
        if (car.userData.hitVelocity) {
            car.position.x += car.userData.hitVelocity;
            car.userData.hitVelocity *= 0.95; // Decay
        }

        // Remove cars that have passed far behind the camera
        // Camera starts at z=15 and moves backward (negative Z)
        // So remove cars that are significantly ahead of camera in positive Z
        if (car.position.z - camera.position.z > 30) {
            scene.remove(car);
            trafficCars.splice(index, 1);
        }
    });

    // Spawn meteors with increasing frequency per level
    const meteorChance = 0.02; // TESTING: Moderate meteor spawn rate
    const maxMeteors = 3; // TESTING: Moderate meteors
    if (Math.random() < meteorChance && meteors.length < maxMeteors) {
        const meteor = createMeteor();
        meteors.push(meteor);
        scene.add(meteor);
    }

    // Spawn monsters with normal frequency
    const monsterChance = 0; // TESTING: Disable monsters
    const maxMonsters = 3;
    if (Math.random() < monsterChance && monsters.length < maxMonsters && monstersLoaded) {
        const monsterTypes = ['dragon', 'monsterolophus', 'biomech']; // All working monsters (demon broken)
        const randomType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        const monster = createMonster(randomType);
        if (monster) {
            console.log('Spawning monster:', randomType, 'at position', monster.position.x, monster.position.y, monster.position.z, 'Truck at:', truck.position.z);
            monsters.push(monster);
            scene.add(monster);
        }
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

        // Animate trail - position particles behind the meteor in direction of travel
        const normalizedVel = velocity.clone().normalize();
        meteor.children.forEach((child, i) => {
            if (child.userData.isTrail) {
                const offset = child.userData.offset;
                // Position trail particles opposite to velocity direction (behind the meteor)
                const trailDist = offset * 0.5;
                child.position.set(
                    -normalizedVel.x * trailDist,
                    -normalizedVel.y * trailDist + Math.sin(Date.now() * 0.01 + offset) * 0.1,
                    -normalizedVel.z * trailDist
                );
            }
        });

        // Check collision with cars first - OBLITERATE them!
        trafficCars.forEach(car => {
            if (car.userData.destroyed) return;

            const carDist = meteor.position.distanceTo(car.position);
            if (carDist < 5 && meteor.position.y < 6) { // Larger hitbox for better collision
                car.userData.destroyed = true;
                car.userData.spinning = true;

                // MASSIVE impact velocity - meteor hits at 45 degrees!
                const impactDirection = meteor.userData.velocity.clone().normalize();
                car.userData.spinVelocity = new THREE.Vector3(
                    impactDirection.x * 0.8 + (Math.random() - 0.5) * 0.3,
                    0.6 + Math.random() * 0.3, // Big upward bounce
                    impactDirection.z * 0.8 + (Math.random() - 0.5) * 0.3
                );

                // Dramatic tumbling rotation
                car.userData.rotationVelocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                );

                // Add fire effects to the car
                for (let i = 0; i < 5; i++) {
                    const fireGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8);
                    const fireMat = new THREE.MeshBasicMaterial({
                        color: i % 2 === 0 ? 0xFF4500 : 0xFF6600,
                        transparent: true,
                        opacity: 0.8
                    });
                    const fire = new THREE.Mesh(fireGeo, fireMat);
                    fire.position.set(
                        (Math.random() - 0.5) * 2,
                        Math.random() * 2,
                        (Math.random() - 0.5) * 2
                    );
                    car.add(fire);
                }

                // Add point light for fire glow
                const fireLight = new THREE.PointLight(0xFF4500, 2, 10);
                car.add(fireLight);
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
                        // Graze - damage and start smoldering (not full fire yet)
                        tree.userData.health -= 30;

                        if (tree.userData.health <= 0 && !tree.userData.falling) {
                            gameState.trees--;
                            tree.userData.falling = true;
                            tree.userData.fallVelocity = new THREE.Vector3(
                                (Math.random() - 0.5) * 0.3,
                                0.2,
                                (Math.random() - 0.5) * 0.15
                            );
                        } else if (tree.userData.health > 0 && !tree.userData.smoldering && !tree.userData.onFire) {
                            // Start smoldering (orange tree)
                            tree.userData.smoldering = true;
                            tree.userData.smolderingTime = 0;
                            console.log('🔶 Tree started smoldering! Has', tree.userData.health, 'health');

                            // Make tree orange
                            tree.traverse(child => {
                                if (child.isMesh && child.material) {
                                    child.material.emissive = new THREE.Color(0xFF4500);
                                    child.material.emissiveIntensity = 0.3;
                                }
                            });
                        }
                    }
                }
            });
        }

        // Remove when hits ground, goes too far past camera, or too far behind camera
        const relativeZ = meteor.position.z - camera.position.z;
        if (meteor.position.y < -2 || relativeZ > 30 || relativeZ < -100) {
            scene.remove(meteor);
            meteors.splice(index, 1);
        }
    });

    // Spawn and check puddles - very close ahead of truck for testing
    if (Math.random() < 0.05 && puddles.length < 5) {
        const puddle = createPuddle(truck.position.z - 15 - Math.random() * 10);
        puddles.push(puddle);
        scene.add(puddle);
    }

    // Update monsters
    monsters.forEach((monster, index) => {
        const type = monster.userData.type;

        if (type === 'dragon') {
            // Fly across the road horizontally/diagonally
            monster.position.x += monster.userData.crossSpeed * monster.userData.crossDirection;

            // Start swooping early (dragon spawns at X=±25)
            // crossDirection = -side, so if side=1 (spawns at X=25), crossDirection=-1 (flies left)
            // if side=-1 (spawns at X=-25), crossDirection=1 (flies right)
            const approachingRoad = monster.userData.crossDirection > 0 ?
                (monster.position.x < 15) :  // Flying right from X=-25, swoop when X<15
                (monster.position.x > -15);  // Flying left from X=25, swoop when X>-15

            if (!monster.userData.swooping && !monster.userData.fireBreathing && approachingRoad) {
                monster.userData.swooping = true;
                monster.userData.targetY = 6; // Swoop down but stay above road
                console.log('Dragon swooping! Current X:', monster.position.x, 'Direction:', monster.userData.crossDirection);
            }
            if (monster.userData.swooping) {
                monster.position.y += (monster.userData.targetY - monster.position.y) * 0.08; // Faster swoop
                if (Math.abs(monster.position.y - monster.userData.targetY) < 0.5) {
                    monster.userData.swooping = false;
                    monster.userData.targetY = 10; // Return to cruising height
                    monster.userData.fireBreathing = true;
                    console.log('Dragon starting EPIC fire breath at X:', monster.position.x);
                }
            }

            // Face the direction of flight
            monster.rotation.y = monster.userData.crossDirection > 0 ? Math.PI / 4 : -Math.PI / 4;
            if (monster.userData.fireBreathing && !monster.userData.fireCreated) {
                console.log('Dragon breathing EPIC fire at position:', monster.position.x, monster.position.y, monster.position.z);

                // Get world position of head marker
                const headMarker = monster.userData.headMarker;
                const headWorldPos = new THREE.Vector3();
                headMarker.getWorldPosition(headWorldPos);
                console.log('Head marker world position:', headWorldPos);

                const angle = monster.userData.crossDirection > 0 ? Math.PI / 4 : -Math.PI / 4;
                const flames = [];

                // MASSIVE TORRENT OF FLAMES - Game of Thrones style!
                for (let i = 0; i < 80; i++) {
                    setTimeout(() => {
                        // Create HUGE elongated flame shapes
                        const flameHeight = 3 + Math.random() * 3;
                        const flameWidth = 0.8 + Math.random() * 0.6;
                        const flameGeo = new THREE.ConeGeometry(flameWidth, flameHeight, 8);

                        // More variety in fire colors
                        const colorChoice = Math.random();
                        const flameColor = colorChoice < 0.2 ? 0xFF0000 :  // Deep red
                                          colorChoice < 0.4 ? 0xFF4500 :  // Orange-red
                                          colorChoice < 0.6 ? 0xFF6600 :  // Orange
                                          colorChoice < 0.8 ? 0xFFAA00 :  // Yellow-orange
                                          0xFFFF00;                       // Bright yellow

                        const flameMat = new THREE.MeshBasicMaterial({
                            color: flameColor,
                            transparent: true,
                            opacity: 0.85 + Math.random() * 0.15,
                            side: THREE.DoubleSide,
                            emissive: flameColor,
                            emissiveIntensity: 0.8
                        });
                        const flame = new THREE.Mesh(flameGeo, flameMat);

                        // Get current head position when flame spawns
                        const currentHeadPos = new THREE.Vector3();
                        headMarker.getWorldPosition(currentHeadPos);

                        // Wider spread for massive torrent
                        const spreadX = (Math.random() - 0.5) * 2;
                        const spreadY = (Math.random() - 0.5) * 1.5;
                        const spreadZ = (Math.random() - 0.5) * 2;

                        flame.position.set(
                            currentHeadPos.x + spreadX,
                            currentHeadPos.y + spreadY,
                            currentHeadPos.z + spreadZ
                        );

                        // Orient flame in direction of breath
                        flame.rotation.x = Math.PI / 3 + (Math.random() - 0.5) * 0.3;
                        flame.rotation.y = angle;
                        flame.rotation.z = (Math.random() - 0.5) * 0.4;

                        // FAST moving flames - TORRENT!
                        flame.userData.velocityX = Math.sin(angle) * (0.6 + Math.random() * 0.4);
                        flame.userData.velocityY = -0.2 + (Math.random() - 0.5) * 0.2;
                        flame.userData.velocityZ = -Math.cos(angle) * (0.6 + Math.random() * 0.4);
                        flame.userData.life = 1.0;
                        flame.userData.flickerSpeed = 0.8 + Math.random() * 0.8;
                        flame.userData.rotationSpeed = (Math.random() - 0.5) * 0.15;

                        scene.add(flame);
                        flames.push(flame);
                    }, i * 15); // Faster spawn rate for continuous torrent
                }

                // Animate MASSIVE flame torrent
                const flameInterval = setInterval(() => {
                    flames.forEach((flame, idx) => {
                        if (!flame.parent) return;

                        // Move flame FAST
                        flame.position.x += flame.userData.velocityX;
                        flame.position.y += flame.userData.velocityY;
                        flame.position.z += flame.userData.velocityZ;

                        // Apply gravity
                        flame.userData.velocityY -= 0.025;

                        // Violent rotation
                        flame.rotation.z += flame.userData.rotationSpeed;
                        flame.rotation.x += flame.userData.rotationSpeed * 0.5;

                        // Flame flicker and fade
                        flame.userData.life -= 0.018;
                        flame.material.opacity = flame.userData.life * 0.9;

                        // AGGRESSIVE flickering
                        const flicker = Math.sin(Date.now() * flame.userData.flickerSpeed * 0.02);
                        flame.scale.set(
                            1 + flicker * 0.5,
                            1 + Math.cos(Date.now() * flame.userData.flickerSpeed * 0.025) * 0.6,
                            1 + flicker * 0.3
                        );

                        // Color shift from yellow to deep red as it dies
                        if (flame.userData.life < 0.6) {
                            flame.material.color.setHex(0xFF4500);
                        }
                        if (flame.userData.life < 0.3) {
                            flame.material.color.setHex(0xFF0000);
                        }

                        // Check collision with trees - MASSIVE TORRENT INCINERATES EVERYTHING
                        trees.forEach(tree => {
                            const dx = Math.abs(tree.position.x - flame.position.x);
                            const dz = Math.abs(tree.position.z - flame.position.z);
                            const dy = Math.abs(tree.position.y - flame.position.y);
                            // HUGE hitbox for torrent - it OBLITERATES everything
                            if (dx < 6 && dz < 6 && dy < 5 && tree.userData.health > 0) {
                                if (!tree.userData.onFire) {
                                    tree.userData.onFire = true;
                                    gameState.treesOnFire++;
                                    console.log('🔥 DRAGON TORRENT IGNITED TREE! Trees on fire:', gameState.treesOnFire);
                                }
                                // Direct torrent hit does MASSIVE damage
                                if (dx < 3 && dz < 3 && dy < 3) {
                                    tree.userData.health -= 5; // MASSIVE damage
                                }
                            }
                        });

                        // INCINERATE CARS - Game of Thrones style!
                        trafficCars.forEach(car => {
                            if (car.userData.destroyed) return;

                            const carDx = Math.abs(car.position.x - flame.position.x);
                            const carDz = Math.abs(car.position.z - flame.position.z);
                            const carDy = Math.abs(car.position.y - flame.position.y);

                            // OBLITERATE cars caught in the torrent
                            if (carDx < 5 && carDz < 5 && carDy < 4) {
                                console.log('🔥🚗 DRAGON INCINERATES CAR!');
                                car.userData.destroyed = true;
                                car.userData.spinning = true;

                                // VIOLENT explosion from dragon fire
                                car.userData.spinVelocity = new THREE.Vector3(
                                    (Math.random() - 0.5) * 1.2,
                                    0.8 + Math.random() * 0.5, // Launch upward
                                    (Math.random() - 0.5) * 1.2
                                );

                                car.userData.rotationVelocity = new THREE.Vector3(
                                    (Math.random() - 0.5) * 0.6,
                                    (Math.random() - 0.5) * 0.6,
                                    (Math.random() - 0.5) * 0.6
                                );

                                // Add MASSIVE fire effects
                                for (let i = 0; i < 8; i++) {
                                    const fireGeo = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 8, 8);
                                    const fireMat = new THREE.MeshBasicMaterial({
                                        color: i % 3 === 0 ? 0xFF0000 : i % 3 === 1 ? 0xFF4500 : 0xFFAA00,
                                        transparent: true,
                                        opacity: 0.9
                                    });
                                    const fire = new THREE.Mesh(fireGeo, fireMat);
                                    fire.position.set(
                                        (Math.random() - 0.5) * 2.5,
                                        Math.random() * 2.5,
                                        (Math.random() - 0.5) * 2.5
                                    );
                                    car.add(fire);
                                }

                                // Bright fire glow
                                const fireLight = new THREE.PointLight(0xFF4500, 4, 15);
                                car.add(fireLight);
                            }
                        });

                        // Remove dead flames
                        if (flame.userData.life <= 0 || flame.position.y < 0) {
                            scene.remove(flame);
                            flames.splice(idx, 1);
                        }
                    });

                    // Clean up when all flames are gone
                    if (flames.length === 0) {
                        clearInterval(flameInterval);
                    }
                }, 30);

                // Safety cleanup - longer for epic torrent
                setTimeout(() => {
                    clearInterval(flameInterval);
                    flames.forEach(f => scene.remove(f));
                }, 4000);

                monster.userData.fireCreated = true;
                setTimeout(() => {
                    monster.userData.fireBreathing = false;
                    monster.userData.fireCreated = false;
                }, 3500); // Longer breath duration
            }
            // Dragon moves with road but also slightly forward (slower than truck)
            monster.position.z -= gameState.speed * 0.8; // Moves slower so you can catch up to it
        } else if (type === 'demon') {
            // Demon chases the player
            const dx = truck.position.x - monster.position.x;
            const dz = truck.position.z - monster.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 1) {
                monster.position.x += (dx / dist) * 0.2;
                monster.position.z += (dz / dist) * 0.2;
            }
            // Also move with road
            monster.position.z -= gameState.speed;
            // Face the player
            monster.lookAt(truck.position);
        } else if (type === 'monsterolophus') {
            // Move in the direction of crossing (positive direction = left to right)
            monster.position.x += monster.userData.crossingSpeed * monster.userData.direction;
            // Move SLOWER than road so truck catches up to it
            monster.position.z -= gameState.speed * 0.5; // Half speed - truck will catch up
            // Rotate to face the direction of movement (flipped 180 degrees)
            monster.rotation.y = monster.userData.direction > 0 ? Math.PI : 0;

            // CRUSH CARS AND TREES IN PATH!
            trafficCars.forEach((car, carIndex) => {
                if (car.userData.destroyed) return;

                const carDx = Math.abs(car.position.x - monster.position.x);
                const carDz = Math.abs(car.position.z - monster.position.z);

                if (carDx < 5 && carDz < 8) {
                    console.log('🦖 MONSTEROLOPHUS CRUSHES CAR!');
                    car.userData.destroyed = true;
                    car.userData.spinning = true;

                    // MASSIVE VIOLENT LAUNCH
                    car.userData.spinVelocity = new THREE.Vector3(
                        monster.userData.direction * 2, // Launch in direction monster is moving
                        1.5 + Math.random() * 0.5, // HIGH launch
                        (Math.random() - 0.5) * 1.5
                    );

                    car.userData.rotationVelocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.8,
                        (Math.random() - 0.5) * 0.8,
                        (Math.random() - 0.5) * 0.8
                    );
                }
            });

            // KNOCK OFF TREES IT HITS!
            trees.forEach((tree, treeIndex) => {
                if (tree.userData.health <= 0 || tree.parent !== truck) return;

                // Get world positions
                const treeWorldPos = new THREE.Vector3();
                tree.getWorldPosition(treeWorldPos);

                const treeDx = Math.abs(treeWorldPos.x - monster.position.x);
                const treeDz = Math.abs(treeWorldPos.z - monster.position.z);

                if (treeDx < 4 && treeDz < 8) {
                    console.log('🦖 MONSTEROLOPHUS KNOCKED OFF TREE! Tree at:', treeWorldPos.x, treeWorldPos.z, 'Monster at:', monster.position.x, monster.position.z);
                    tree.userData.health = 0;
                    tree.userData.falling = true;
                    tree.userData.fallVelocity = new THREE.Vector3(
                        monster.userData.direction * 0.3, // Knock in direction monster is moving
                        0.2,
                        (Math.random() - 0.5) * 0.2
                    );
                    gameState.trees--;
                }
            });

            if (Math.abs(monster.position.x) > 20) {
                scene.remove(monster);
                monsters.splice(index, 1);
                return;
            }
        } else if (type === 'biomech') {
            // Charge straight down the road!
            monster.position.z += monster.userData.chargeSpeed; // Move toward camera (positive Z)

            // DEMOLISH CARS IN PATH!
            trafficCars.forEach((car) => {
                if (car.userData.destroyed) return;

                const carDx = Math.abs(car.position.x - monster.position.x);
                const carDz = Math.abs(car.position.z - monster.position.z);

                if (carDx < 2 && carDz < 6) {
                    console.log('🤖 BIOMECH DEMOLISHES CAR!');
                    car.userData.destroyed = true;
                    car.userData.spinning = true;

                    // VIOLENT LAUNCH
                    car.userData.spinVelocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        1 + Math.random() * 0.5,
                        (Math.random() - 0.5) * 2
                    );

                    car.userData.rotationVelocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 1,
                        (Math.random() - 0.5) * 1,
                        (Math.random() - 0.5) * 1
                    );
                }
            });

            // KNOCK OFF TREES IN PATH!
            trees.forEach((tree) => {
                if (tree.userData.health <= 0 || tree.parent !== truck) return;

                const treeWorldPos = new THREE.Vector3();
                tree.getWorldPosition(treeWorldPos);

                const treeDx = Math.abs(treeWorldPos.x - monster.position.x);
                const treeDz = Math.abs(treeWorldPos.z - monster.position.z);

                if (treeDx < 2 && treeDz < 6) {
                    console.log('🤖 BIOMECH KNOCKED OFF TREE!');
                    tree.userData.health = 0;
                    tree.userData.falling = true;
                    tree.userData.fallVelocity = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.4,
                        0.25,
                        0.3 // Knock forward
                    );
                    gameState.trees--;
                }
            });
        }

        const distToPlayer = monster.position.distanceTo(truck.position);

        // Demon damage
        if (type === 'demon' && distToPlayer < 8) {
            console.log('👹 DEMON ATTACKING! Distance:', distToPlayer.toFixed(2));
            // Demon continuously damages trees while close
            if (Math.random() < 0.05 && gameState.trees > 0) { // 5% chance per frame
                const healthyTrees = trees.filter(t => t.userData.health > 0);
                if (healthyTrees.length > 0) {
                    const tree = healthyTrees[Math.floor(Math.random() * healthyTrees.length)];
                    tree.userData.health -= 10;
                    console.log('👹 DEMON DAMAGED TREE! Health now:', tree.userData.health);
                    if (tree.userData.health <= 0 && !tree.userData.falling) {
                        gameState.trees--;
                        tree.userData.falling = true;
                        tree.userData.fallVelocity = new THREE.Vector3(
                            (Math.random() - 0.5) * 0.2,
                            0.15,
                            (Math.random() - 0.5) * 0.1
                        );
                        console.log('👹 DEMON DESTROYED A TREE! Trees left:', gameState.trees);
                    }
                }
            }
        }

        if (monster.position.z > truck.position.z + 50) {
            scene.remove(monster);
            monsters.splice(index, 1);
        }
    });

    puddles.forEach((puddle, index) => {
        // Puddles are stationary on the road - don't move them
        // The camera moving forward creates the illusion of approaching them

        // Subtle shimmer animation
        puddle.userData.pulse += 0.05;
        if (puddle.children[3]) { // Shimmer layer
            puddle.children[3].material.opacity = 0.15 + Math.sin(puddle.userData.pulse) * 0.05;
        }

        // Update splash particles
        if (puddle.userData.splashParticles.length > 0) {
            puddle.userData.splashParticles.forEach((splash, idx) => {
                splash.position.add(splash.userData.velocity);
                splash.userData.velocity.y -= 0.03; // Gravity
                splash.material.opacity -= 0.02;
                splash.scale.multiplyScalar(0.98);

                // Remove dead splashes
                if (splash.material.opacity <= 0 || splash.position.y < 0) {
                    puddle.remove(splash);
                    puddle.userData.splashParticles.splice(idx, 1);
                }
            });
        }

        // Check if truck is over puddle
        const dx = Math.abs(truck.position.x - puddle.position.x);
        const dz = Math.abs(truck.position.z - puddle.position.z);

        if (dx < 3.5 && dz < 6) {
            // Only process healing once per puddle
            if (puddle.userData.hasHealed) {
                return; // Already healed from this puddle, skip
            }
            puddle.userData.hasHealed = true;

            // Create splash effect when truck drives through
            if (!puddle.userData.splashing) {
                puddle.userData.splashing = true;

                // Create water splash particles
                for (let i = 0; i < 30; i++) {
                    const splashGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 4, 4);
                    const splashMat = new THREE.MeshBasicMaterial({
                        color: 0x88BBFF,
                        transparent: true,
                        opacity: 0.8
                    });
                    const splash = new THREE.Mesh(splashGeo, splashMat);

                    // Position near truck wheels
                    const side = Math.random() < 0.5 ? -1 : 1;
                    splash.position.set(
                        side * (1.5 + Math.random() * 0.5),
                        0.2,
                        (Math.random() - 0.5) * 2
                    );

                    // Velocity - splash outward and upward
                    splash.userData.velocity = new THREE.Vector3(
                        side * (0.15 + Math.random() * 0.15), // Outward
                        0.2 + Math.random() * 0.3, // Upward
                        (Math.random() - 0.5) * 0.1 // Forward/back variation
                    );

                    puddle.add(splash);
                    puddle.userData.splashParticles.push(splash);
                }

                // Reset splashing flag after a delay
                setTimeout(() => {
                    puddle.userData.splashing = false;
                }, 200);
            }

            const burningTrees = trees.filter(t => t.userData.onFire);
            const damagedTrees = trees.filter(t => t.userData.health < 100 && t.userData.health > 0);
            const smolderingTrees = trees.filter(t => t.userData.smoldering);

            if (burningTrees.length > 0 || damagedTrees.length > 0 || smolderingTrees.length > 0) {
                console.log('🌊 TRUCK OVER PUDDLE! Trees on fire:', burningTrees.length, 'Smoldering:', smolderingTrees.length, 'Damaged:', damagedTrees.length);
            }

            let extinguished = 0;
            trees.forEach(tree => {
                const treeInTruck = tree.parent === truck;

                if (!treeInTruck || tree.userData.health <= 0) {
                    return;
                }

                const needsHealing = tree.userData.onFire || tree.userData.smoldering || tree.userData.health < 100;

                if (needsHealing) {
                    if (tree.userData.onFire) {
                        console.log('✓ Extinguishing tree fire!');
                        tree.userData.onFire = false;
                        gameState.treesOnFire = Math.max(0, gameState.treesOnFire - 1);

                        // Remove fire particles
                        if (tree.userData.fireParticles) {
                            tree.remove(tree.userData.fireParticles);
                            tree.userData.fireParticles = null;
                        }
                    }

                    if (tree.userData.smoldering) {
                        console.log('✓ Extinguishing smoldering tree!');
                        tree.userData.smoldering = false;
                        tree.userData.smolderingTime = 0;
                    }

                    // Heal tree back to full health
                    tree.userData.health = 100;
                    console.log('✓ Healing tree! Health restored to 100');
                    extinguished++;

                    // COMPLETELY reset tree appearance - remove ALL emissive glow
                    tree.traverse(child => {
                        if (child.isMesh && child.material) {
                            // Reset emissive to black (no glow)
                            child.material.emissive = new THREE.Color(0x000000);
                            child.material.emissiveIntensity = 0;

                            // For procedural trees, reset color back to green
                            if (child.geometry && child.geometry.type === 'ConeGeometry') {
                                // Reset foliage colors
                                if (child.material.color.getHex() !== 0x2d5a2d) {
                                    child.material.color.setHex(0x228B22); // Green
                                }
                            }
                        }
                    });
                }
            });

            if (extinguished > 0) {
                console.log('Extinguished', extinguished, 'tree fires!');
            }
        }

        // Remove puddles that have passed far behind camera
        if (puddle.position.z - camera.position.z > 100) {
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
                            if (child.geometry && child.geometry.type === 'ConeGeometry') {
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
        // Smoldering trees progress to fire if not extinguished
        if (tree.userData.smoldering && !tree.userData.onFire && tree.userData.health > 0) {
            tree.userData.smolderingTime += 1/60; // Increment by frame time (assuming 60fps)

            // After 8 seconds of smoldering, ignite!
            if (tree.userData.smolderingTime > 8) {
                console.log('🔥 Smoldering tree IGNITED!');
                tree.userData.smoldering = false;
                tree.userData.onFire = true;
                gameState.treesOnFire++;

                // Add fire particles
                const fire = createFireParticles();
                tree.userData.fireParticles = fire;
                tree.add(fire);
            }
        }

        // Burning trees take continuous damage
        if (tree.userData.onFire && tree.userData.health > 0) {
            tree.userData.health -= 0.1; // Slower burn damage - more time to reach puddle

            // Tree dies from fire
            if (tree.userData.health <= 0 && !tree.userData.falling) {
                tree.userData.falling = true;
                tree.userData.fallVelocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    0.2,
                    (Math.random() - 0.5) * 0.15
                );
                gameState.trees--;
                gameState.treesOnFire = Math.max(0, gameState.treesOnFire - 1);
                console.log('Tree died from fire! Remaining trees:', gameState.trees);
            }
        }

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

// Start
init();
animate();

// Event listeners - wait for DOM to be fully loaded
window.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements
    purchaseScreen = document.getElementById('purchaseScreen');
    startBtn = document.getElementById('startBtn');
    restartBtn = document.getElementById('restartBtn');
    startScreen = document.getElementById('startScreen');
    endScreen = document.getElementById('endScreen');
    treeCountEl = document.getElementById('treeCount');
    distanceEl = document.getElementById('distance');
    earningsEl = document.getElementById('earnings');
    levelDisplayEl = document.getElementById('levelDisplay');
    budgetAmountEl = document.getElementById('budgetAmount');
    budgetOption = document.getElementById('budgetOption');
    standardOption = document.getElementById('standardOption');
    premiumOption = document.getElementById('premiumOption');

    // Add event listeners
    budgetOption.addEventListener('click', () => purchaseTrees('budget'));
    standardOption.addEventListener('click', () => purchaseTrees('standard'));
    premiumOption.addEventListener('click', () => purchaseTrees('premium'));

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', () => {
        endScreen.classList.add('hidden');
        purchaseScreen.classList.remove('hidden');
        updateUI();
    });

    // Initial UI update
    updateUI();
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
