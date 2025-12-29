// ========================================
// PART 1: BASIC THREE.JS SETUP
// ========================================

// 1. Create the 3D world
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000022); // Dark blue space

// 2. Create camera (your eyes)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20); // Put camera up high

// 3. Create renderer (the painter)
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Add lights (so we can see stuff)
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 5);
scene.add(light);

// Add some ambient light everywhere
scene.add(new THREE.AmbientLight(0x333333));

// ========================================
// PART 2: CREATE GAME OBJECTS
// ========================================

// 5. Create PLAYER (green box at bottom)
const playerGeometry = new THREE.BoxGeometry(1, 0.5, 2);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.5; // Lift off ground
scene.add(player);

// 6. Create INVADERS (red boxes in grid)
const invaders = []; // Array to store all invaders
function createInvaders() {
    for (let row = 0; row < 3; row++) {        // 3 rows
        for (let col = 0; col < 5; col++) {    // 5 columns
            const invader = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.8, 0.8),
                new THREE.MeshPhongMaterial({ color: 0xff0000 })
            );
            invader.position.set(
                (col - 2) * 2,  // X position (-4, -2, 0, 2, 4)
                row * 2 + 8,    // Y position (higher up)
                0               // Z position
            );
            scene.add(invader);
            invaders.push({
                mesh: invader,
                alive: true,
                speed: 0.02 * (row + 1)  // Lower rows move faster
            });
        }
    }
}
createInvaders();

// 7. Create BULLETS array
const bullets = [];

// ========================================
// PART 3: GAME VARIABLES
// ========================================

let score = 0;
let lives = 3;
let gameOver = false;
let invaderDirection = 1; // 1 = right, -1 = left

// Keyboard controls
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// ========================================
// PART 4: SHOOTING FUNCTION
// ========================================

function shoot() {
    // Create bullet (blue cylinder)
    const bullet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    bullet.position.copy(player.position);
    bullet.position.y += 1; // Start above player
    scene.add(bullet);
    bullets.push(bullet);
}

// Spacebar to shoot
window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !gameOver) {
        shoot();
    }
});

// ========================================
// PART 5: COLLISION CHECK (SIMPLE!)
// ========================================

function checkCollision(obj1, obj2, distance = 1) {
    // Simple distance check (not perfect but works!)
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const dz = obj1.position.z - obj2.position.z;
    
    return Math.sqrt(dx*dx + dy*dy + dz*dz) < distance;
}

// ========================================
// PART 6: MAIN GAME LOOP (MAGIC HAPPENS HERE!)
// ========================================

function gameLoop() {
    if (gameOver) return;
    
    requestAnimationFrame(gameLoop);
    
    // ===== PLAYER MOVEMENT =====
    if (keys['ArrowLeft']) player.position.x -= 0.1;
    if (keys['ArrowRight']) player.position.x += 0.1;
    if (keys['a']) player.position.x -= 0.1;  // A key
    if (keys['d']) player.position.x += 0.1;  // D key
    
    // Keep player in bounds
    if (player.position.x < -8) player.position.x = -8;
    if (player.position.x > 8) player.position.x = 8;
    
    // ===== MOVE BULLETS UP =====
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].position.y += 0.5;
        
        // Remove bullet if off screen
        if (bullets[i].position.y > 20) {
            scene.remove(bullets[i]);
            bullets.splice(i, 1);
        }
    }
    
    // ===== MOVE INVADERS SIDE-TO-SIDE =====
    let changeDirection = false;
    for (let invader of invaders) {
        if (!invader.alive) continue;
        
        invader.mesh.position.x += invader.speed * invaderDirection;
        
        // Check if hit edge
        if (invader.mesh.position.x > 6 || invader.mesh.position.x < -6) {
            changeDirection = true;
        }
        
        // ===== CHECK BULLET COLLISIONS =====
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[j], invader.mesh, 0.8)) {
                // HIT! Remove both
                scene.remove(bullets[j]);
                bullets.splice(j, 1);
                
                scene.remove(invader.mesh);
                invader.alive = false;
                
                // Update score
                score += 100;
                document.getElementById('score').textContent = `Score: ${score}`;
                
                break;
            }
        }
        
        // ===== CHECK IF INVADER HIT PLAYER =====
        if (checkCollision(invader.mesh, player, 1.5)) {
            lives--;
            document.getElementById('lives').textContent = `Lives: ${lives}`;
            
            if (lives <= 0) {
                gameOver = true;
                alert("GAME OVER! Final Score: " + score);
            }
        }
    }
    
    // Change direction if needed
    if (changeDirection) {
        invaderDirection *= -1; // Reverse direction
        // Move all invaders down
        for (let invader of invaders) {
            if (invader.alive) {
                invader.mesh.position.y -= 0.5;
            }
        }
    }
    
    // ===== WIN CONDITION =====
    const aliveInvaders = invaders.filter(inv => inv.alive).length;
    if (aliveInvaders === 0) {
        gameOver = true;
        alert("YOU WIN! Score: " + score);
    }
    
    // ===== RENDER EVERYTHING =====
    renderer.render(scene, camera);
}

// ========================================
// PART 7: START THE GAME!
// ========================================

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// START GAME LOOP
gameLoop();

// ========================================
// BONUS: ADD SOME STARS IN BACKGROUND
// ========================================

function addStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 100;     // X
        positions[i + 1] = (Math.random() - 0.5) * 100; // Y
        positions[i + 2] = (Math.random() - 0.5) * 100; // Z
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}
addStars();