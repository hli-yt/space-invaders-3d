// ============================================
// SPACE INVADERS 3D - MAIN GAME FILE
// Group 1 Project - Software Engineering
// ============================================

// GAME CONFIGURATION
const CONFIG = {
    playerSpeed: 0.15,
    bulletSpeed: 0.8,
    invaderSpeed: 0.03,
    invaderRows: 4,
    invaderCols: 8,
    waveSpeedIncrease: 0.005,
    maxLives: 3
};

// GLOBAL VARIABLES
let scene, camera, renderer, controls;
let player, bullets = [], invaders = [];
let score = 0, lives = CONFIG.maxLives, wave = 1, gameActive = false;
let keys = {};
let invaderDirection = 1;
let lastShotTime = 0;
let shootDelay = 300; // milliseconds

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000022, 10, 50);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 8, 15);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    // Setup controls
    setupControls();
    
    // Setup lights
    setupLights();
    
    // Create game objects
    createPlayer();
    createInvaders();
    createStars();
    createGround();
    
    // Event listeners
    setupEventListeners();
    
    // Start game loop
    animate();
    
    console.log("Game initialized successfully!");
}

// ============================================
// SETUP FUNCTIONS
// ============================================

function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 1.5;
}

function setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x333333, 0.6);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Point light (player glow)
    const pointLight = new THREE.PointLight(0x00ffff, 0.5, 20);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);
}

function setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        // Prevent arrow keys from scrolling page
        if(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start/Restart buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('next-wave-btn').addEventListener('click', nextWave);
    
    // Prevent right-click menu
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// GAME OBJECT CREATION
// ============================================

function createPlayer() {
    // Create a more detailed player ship
    const group = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        shininess: 100,
        emissive: 0x003300
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI; // Point forward
    body.castShadow = true;
    group.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.5);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x008800 });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.x = -0.8;
    rightWing.position.x = 0.8;
    leftWing.castShadow = true;
    rightWing.castShadow = true;
    group.add(leftWing);
    group.add(rightWing);
    
    // Engine glow
    const engineGlow = new THREE.PointLight(0x00ff00, 0.3, 5);
    engineGlow.position.set(0, -0.8, 0);
    group.add(engineGlow);
    
    group.position.y = 0.8;
    player = group;
    scene.add(player);
}

function createInvaders() {
    invaders = [];
    
    // Different invader types
    const colors = [0xff0000, 0xff9900, 0xffff00, 0x00ccff];
    const shapes = ['box', 'sphere', 'cylinder', 'cone'];
    
    for (let row = 0; row < CONFIG.invaderRows; row++) {
        for (let col = 0; col < CONFIG.invaderCols; col++) {
            let geometry, material;
            const type = row % 4;
            
            // Create different shapes for each row
            switch(shapes[type]) {
                case 'sphere':
                    geometry = new THREE.SphereGeometry(0.4, 8, 8);
                    break;
                case 'cylinder':
                    geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
                    break;
                case 'cone':
                    geometry = new THREE.ConeGeometry(0.4, 0.8, 8);
                    break;
                default: // box
                    geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            }
            
            material = new THREE.MeshPhongMaterial({ 
                color: colors[type],
                shininess: 30,
                emissive: colors[type],
                emissiveIntensity: 0.2
            });
            
            const invader = new THREE.Mesh(geometry, material);
            invader.castShadow = true;
            
            // Position in grid
            invader.position.set(
                (col - CONFIG.invaderCols/2 + 0.5) * 1.5,
                row * 1.5 + 8,
                0
            );
            
            // Add slight random offset for natural look
            invader.position.x += (Math.random() - 0.5) * 0.3;
            invader.position.z += (Math.random() - 0.5) * 0.3;
            
            scene.add(invader);
            
            invaders.push({
                mesh: invader,
                alive: true,
                row: row,
                col: col,
                type: type,
                speed: CONFIG.invaderSpeed + (row * 0.005)
            });
        }
    }
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        // Random positions
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 200;
        positions[i + 2] = (Math.random() - 0.5) * 200;
        
        // Random colors (mostly white with some blue/yellow)
        colors[i] = 0.8 + Math.random() * 0.2;     // R
        colors[i + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i + 2] = 0.9 + Math.random() * 0.1; // B
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createGround() {
    // Create a grid ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50, 20, 20);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x222233,
        side: THREE.DoubleSide,
        wireframe: false
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);
}

// ============================================
// GAME LOGIC
// ============================================

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameActive = true;
    resetGame();
    console.log("Game started!");
}

function restartGame() {
    document.getElementById('game-over-screen').style.display = 'none';
    gameActive = true;
    resetGame();
}

function nextWave() {
    document.getElementById('win-screen').style.display = 'none';
    gameActive = true;
    wave++;
    createInvaders();
    updateUI();
}

function resetGame() {
    // Reset game state
    score = 0;
    lives = CONFIG.maxLives;
    wave = 1;
    invaderDirection = 1;
    
    // Clear existing invaders
    invaders.forEach(inv => scene.remove(inv.mesh));
    invaders = [];
    
    // Clear bullets
    bullets.forEach(bullet => scene.remove(bullet));
    bullets = [];
    
    // Reset player position
    player.position.x = 0;
    
    // Create new invaders
    createInvaders();
    
    // Update UI
    updateUI();
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('wave').textContent = wave;
}

// ============================================
// SHOOTING SYSTEM
// ============================================

function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime < shootDelay) return;
    
    lastShotTime = currentTime;
    
    // Create bullet
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        emissive: 0x0088ff,
        emissiveIntensity: 0.5
    });
    const bullet = new THREE.Mesh(geometry, material);
    
    // Position at player with offset
    bullet.position.copy(player.position);
    bullet.position.y += 0.5;
    bullet.rotation.x = Math.PI / 2;
    
    bullet.castShadow = true;
    scene.add(bullet);
    bullets.push(bullet);
    
    // Add bullet light
    const bulletLight = new THREE.PointLight(0x00ffff, 0.5, 10);
    bullet.add(bulletLight);
    
    // Play shoot sound (if we had one)
    // playSound('shoot');
}

// ============================================
// COLLISION DETECTION
// ============================================

function checkCollisions() {
    // Check bullet-invader collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = invaders.length - 1; j >= 0; j--) {
            const invader = invaders[j];
            
            if (invader.alive) {
                const distance = bullet.position.distanceTo(invader.mesh.position);
                
                if (distance < 0.8) { // Collision!
                    // Remove bullet
                    scene.remove(bullet);
                    bullets.splice(i, 1);
                    
                    // Remove invader
                    scene.remove(invader.mesh);
                    invader.alive = false;
                    
                    // Create explosion effect
                    createExplosion(invader.mesh.position);
                    
                    // Update score (more points for higher rows)
                    score += 100 * (invader.row + 1);
                    updateUI();
                    
                    // Check win condition
                    checkWinCondition();
                    
                    break;
                }
            }
        }
    }
    
    // Check invader-player collisions
    for (let invader of invaders) {
        if (invader.alive) {
            const distance = player.position.distanceTo(invader.mesh.position);
            
            if (distance < 1.2) {
                // Player hit!
                lives--;
                updateUI();
                
                // Remove hit invader
                scene.remove(invader.mesh);
                invader.alive = false;
                
                createExplosion(invader.mesh.position);
                
                // Check game over
                if (lives <= 0) {
                    gameOver();
                }
                
                break;
            }
        }
    }
}

function checkWinCondition() {
    const aliveInvaders = invaders.filter(inv => inv.alive).length;
    
    if (aliveInvaders === 0) {
        win();
    }
}

// ============================================
// VISUAL EFFECTS
// ============================================

function createExplosion(position) {
    // Create particle explosion
    const particleCount = 30;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        const material = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.5 ? 0xff9900 : 0xffff00 
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(position);
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        particle.userData.life = 1.0;
        
        particles.add(particle);
    }
    
    scene.add(particles);
    
    // Animate particles
    function animateParticles() {
        let allDead = true;
        
        particles.children.forEach(particle => {
            particle.position.add(particle.userData.velocity);
            particle.userData.life -= 0.03;
            particle.material.opacity = particle.userData.life;
            
            if (particle.userData.life > 0) {
                allDead = false;
            }
        });
        
        if (!allDead) {
            requestAnimationFrame(animateParticles);
        } else {
            scene.remove(particles);
        }
    }
    
    animateParticles();
}

// ============================================
// GAME STATES
// ============================================

function gameOver() {
    gameActive = false;
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-wave').textContent = wave;
    document.getElementById('game-over-screen').style.display = 'block';
}

function win() {
    gameActive = false;
    document.getElementById('win-score').textContent = score;
    document.getElementById('win-screen').style.display = 'block';
}

// ============================================
// UPDATE FUNCTIONS
// ============================================

function updatePlayer() {
    if (!gameActive) return;
    
    // Left/Right movement
    if (keys['arrowleft'] || keys['a']) {
        player.position.x -= CONFIG.playerSpeed;
    }
    if (keys['arrowright'] || keys['d']) {
        player.position.x += CONFIG.playerSpeed;
    }
    
    // Up/Down movement (optional)
    if (keys['arrowup'] || keys['w']) {
        player.position.z -= CONFIG.playerSpeed;
    }
    if (keys['arrowdown'] || keys['s']) {
        player.position.z += CONFIG.playerSpeed;
    }
    
    // Shooting
    if (keys[' ']) { // Spacebar
        shoot();
    }
    
    // Keep player in bounds
    player.position.x = Math.max(-8, Math.min(8, player.position.x));
    player.position.z = Math.max(-4, Math.min(4, player.position.z));
    
    // Add slight floating animation
    player.position.y = 0.8 + Math.sin(Date.now() * 0.003) * 0.1;
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.y += CONFIG.bulletSpeed;
        
        // Remove if off screen
        if (bullet.position.y > 25) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

function updateInvaders() {
    if (!gameActive) return;
    
    let changeDirection = false;
    const currentSpeed = CONFIG.invaderSpeed + ((wave - 1) * CONFIG.waveSpeedIncrease);
    
    for (let invader of invaders) {
        if (!invader.alive) continue;
        
        // Move invader
        invader.mesh.position.x += currentSpeed * invaderDirection;
        
        // Add bobbing animation
        invader.mesh.position.y += Math.sin(Date.now() * 0.002 + invader.col) * 0.02;
        
        // Check if at edge
        if (invader.mesh.position.x > 7 || invader.mesh.position.x < -7) {
            changeDirection = true;
        }
        
        // Move downward over time
        invader.mesh.position.y -= 0.0005 * wave;
    }
    
    // Change direction if needed
    if (changeDirection) {
        invaderDirection *= -1;
        
        // Move all invaders down
        for (let invader of invaders) {
            if (invader.alive) {
                invader.mesh.position.y -= 0.3;
                
                // Check if invader reached bottom
                if (invader.mesh.position.y < 1) {
                    gameOver();
                    return;
                }
            }
        }
    }
}

// ============================================
// ANIMATION LOOP
// ============================================

function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    if (gameActive) {
        // Update game objects
        updatePlayer();
        updateBullets();
        updateInvaders();
        
        // Check collisions
        checkCollisions();
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// ============================================
// START THE GAME
// ============================================

// Initialize when page loads
window.addEventListener('load', init);

// Log game start
console.log("Space Invaders 3D - Group 1 Project");
console.log("Requirements Met:");
console.log("✓ 5+ Unique 3D Objects");
console.log("✓ OrbitControls Camera");
console.log("✓ Lighting System");
console.log("✓ User Interaction");
console.log("✓ Texture/Procedural Materials");
console.log("✓ Animation System");