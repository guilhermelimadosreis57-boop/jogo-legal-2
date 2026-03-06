import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';
import { Weapon } from './Weapon.js';
import { Enemy } from './Enemy.js';
import { Loot } from './Loot.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();

        this.world = null;
        this.player = null;
        this.weapon = null;
        this.enemies = [];
        this.loots = [];
        this.enemyProjectiles = [];

        this.currentWave = 1;
        this.maxWaves = 7;
        this.phase = 'WAITING';
        this.timer = 180;
        this.gameStarted = false;
        this.bossSpawned = false;

        this.init();
    }

    init() {
        // Renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Mundo + Jogador + Arma
        this.world = new World(this.scene);
        this.player = new Player(this.camera, this.renderer.domElement, this.world);
        this.weapon = new Weapon(this.camera, this.scene);
        this.scene.add(this.camera);

        // === INÍCIO DO JOGO: clique na tela de início ===
        const startScreen = document.getElementById('start-screen');
        startScreen.addEventListener('click', () => {
            // Requisição do Pointer Lock direto no gesto do usuário
            document.body.requestPointerLock();
        });

        // Quando o navegador concede o Pointer Lock
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) {
                // Lock concedido — esconde tela de início e inicia o jogo
                startScreen.style.display = 'none';
                this.player.controls.enabled = true;
                if (!this.gameStarted) {
                    this.gameStarted = true;
                    this.startPreparationPhase();
                }
            } else {
                // Lock perdido (ESC ou perda de foco)
                if (this.player.hp > 0) {
                    startScreen.style.display = 'flex';
                }
            }
        });

        // Tiro
        window.addEventListener('mousedown', (e) => {
            if (!document.pointerLockElement || e.button !== 0) return;
            if (this.weapon.shoot(this.player)) {
                this.checkShooting();
            }
        });

        // Coleta de loot
        window.addEventListener('loot-collected', (e) => {
            const t = e.detail.type;
            if (t === 'ammo') this.player.totalAmmo = Math.min(this.player.totalAmmo + 38, 999);
            if (t === 'medkit') this.player.hp = Math.min(100, this.player.hp + 25);
            if (t === 'grenade') this.player.grenades = Math.min(3, this.player.grenades + 1);
        });

        // Iniciar loop de animação
        this.animate();
    }

    checkShooting() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const meshes = this.enemies.filter(e => e.alive).map(e => e.mesh);
        const hits = raycaster.intersectObjects(meshes, true);
        if (hits.length > 0) {
            const enemy = this.enemies.find(en => {
                let obj = hits[0].object;
                while (obj) {
                    if (obj === en.mesh) return true;
                    obj = obj.parent;
                }
                return false;
            });
            if (enemy) enemy.takeDamage(20);
        }
    }

    startPreparationPhase() {
        this.phase = 'PREPARATION';
        this.timer = 30;
        document.getElementById('phase-label').innerText = 'FASE DE PREPARAÇÃO';
        document.getElementById('phase-label').style.color = '#00f2ff';
        this.spawnLoots();
        this.showMessage('PREPARAÇÃO', 'Recolha suprimentos. Sem inimigos.');
    }

    startHordePhase() {
        this.phase = 'HORDE';
        this.timer = 60;
        document.getElementById('phase-label').innerText = 'HORDA ' + this.currentWave;
        document.getElementById('phase-label').style.color = '#ff0055';
        this.showMessage('HORDA ' + this.currentWave + ' / ' + this.maxWaves, 'Sobreviva até o tempo acabar!');
    }

    spawnLoots() {
        this.loots.forEach(l => this.scene.remove(l.mesh));
        this.loots = [];
        const types = ['ammo', 'ammo', 'medkit', 'medkit', 'grenade'];
        for (let i = 0; i < 18; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const pos = new THREE.Vector3((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80);
            this.loots.push(new Loot(this.scene, type, pos));
        }
    }

    showMessage(title, desc) {
        const overlay = document.getElementById('message-overlay');
        document.getElementById('msg-title').innerText = title;
        document.getElementById('msg-desc').innerText = desc;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('hidden'), 4000);
    }

    updateTimer(delta) {
        if (!this.gameStarted || this.phase === 'WAITING') return;

        if (this.currentWave === 7 && this.phase === 'HORDE') {
            document.getElementById('timer').innerText = "INFINITO";
            return;
        }

        this.timer -= delta;
        if (this.timer <= 0) {
            if (this.phase === 'PREPARATION') {
                this.startHordePhase();
            } else {
                this.currentWave++;
                if (this.currentWave > this.maxWaves) {
                    this.win();
                } else {
                    this.startPreparationPhase();
                }
            }
        }
        const mins = Math.floor(Math.max(0, this.timer) / 60);
        const secs = Math.floor(Math.max(0, this.timer) % 60);
        document.getElementById('timer').innerText = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        document.getElementById('wave-counter').innerText = 'HORDA: ' + this.currentWave + ' / ' + this.maxWaves;
    }

    win() {
        document.exitPointerLock();
        document.getElementById('msg-title').innerText = 'VITÓRIA ABSOLUTA';
        document.getElementById('msg-title').style.color = '#00f2ff';
        document.getElementById('msg-desc').innerText = 'O Rei Sucata foi destruído. O Protocolo Sucata foi concluído!';
        document.getElementById('restart-btn').style.display = 'inline-block';
        document.getElementById('restart-btn').innerText = 'NOVA PARTIDA';
        document.getElementById('message-overlay').classList.remove('hidden');
        document.getElementById('message-overlay').style.pointerEvents = 'auto'; 
    }

    fireEnemyProjectile(pos, dir, dmg, pType = 'normal') {
        const mat = pType === 'bomb' ? new THREE.MeshBasicMaterial({ color: 0xff00ff }) : new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        const s = pType === 'bomb' ? 0.6 : 0.2;
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(s, 4, 4),
            mat
        );
        mesh.position.copy(pos);
        this.scene.add(mesh);
        const velocity = dir.clone().multiplyScalar(pType === 'bomb' ? 15 : 25);
        if (pType === 'bomb') velocity.y = 10;
        this.enemyProjectiles.push({ mesh, velocity, damage: dmg, timer: 3.0, pType });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        let delta = this.clock.getDelta();
        if (delta > 0.1) delta = 0.1; // Cap to prevent teleporting

        // Atualiza jogador apenas se pointer lock ativo
        if (document.pointerLockElement) {
            this.player.update(delta);
        }

        this.updateTimer(delta);

        const playerPos = this.camera.position;

        // Spawn de inimigos na horda
        if (this.phase === 'HORDE') {
            const alive = this.enemies.filter(e => e.alive).length;
            if (this.currentWave === 7) {
                if (alive === 0 && !this.bossSpawned) {
                    const sp = new THREE.Vector3(0, 0, 0);
                    this.enemies.push(new Enemy(this.scene, this.player, this.world, sp, this.currentWave, 'boss', this));
                    this.bossSpawned = true;
                }
            } else if (alive < 5 + this.currentWave) {
                const sp = new THREE.Vector3((Math.random() - 0.5) * 90, 0, (Math.random() - 0.5) * 90);
                if (sp.distanceTo(playerPos) > 20) {
                    let type = 'robot';
                    if (this.currentWave >= 5) {
                        const r = Math.random();
                        if (r < 0.25) type = 'dog';
                        else if (r < 0.55) type = 'drone';
                        else if (r < 0.75) type = 'duck';
                    } else if (this.currentWave >= 4) {
                        const r = Math.random();
                        if (r < 0.2) type = 'duck';
                        else if (r < 0.5) type = 'drone';
                    } else if (this.currentWave >= 2) {
                        if (Math.random() < 0.4) type = 'drone';
                    }
                    this.enemies.push(new Enemy(this.scene, this.player, this.world, sp, this.currentWave, type, this));
                }
            }
        }

        this.enemies.forEach(e => e.update(delta));
        this.loots.forEach(l => l.update(delta, playerPos));
        
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const p = this.enemyProjectiles[i];
            if (p.pType === 'bomb') p.velocity.y -= 25 * delta;

            p.mesh.position.addScaledVector(p.velocity, delta);
            p.timer -= delta;
            
            let remove = false;
            if (p.timer <= 0) remove = true;
            else if (p.mesh.position.distanceTo(this.camera.position) < (p.pType === 'bomb' ? 1.5 : 1.0)) {
                this.player.takeDamage(p.damage);
                remove = true;
            } else if (p.pType !== 'bomb' && this.world.checkCollision(p.mesh.position.x, p.mesh.position.z, 0.2)) {
                remove = true;
            } else if (p.pType === 'bomb' && p.mesh.position.y <= 0.3) {
                remove = true;
            }
            
            if (remove) {
                if (p.pType === 'bomb') {
                    for (let j=0; j<12; j++) {
                        const angle = (Math.PI / 6) * j;
                        const fragDir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
                        this.fireEnemyProjectile(p.mesh.position, fragDir, 5, 'normal');
                    }
                }
                this.scene.remove(p.mesh);
                this.enemyProjectiles.splice(i, 1);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
