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

        this.currentWave = 1;
        this.maxWaves = 7;
        this.phase = 'WAITING'; // Começa esperando o clique
        this.timer = 180; // 3 min preparação
        this.gameStarted = false;

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.world = new World(this.scene);
        this.player = new Player(this.camera, this.renderer.domElement);
        this.weapon = new Weapon(this.camera, this.scene);

        // Adiciona a câmera à cena para que objetos filhos (arma) sejam renderizados
        this.scene.add(this.camera);

        this.setupEvents();
        // Não inicia a fase aqui, espera o evento de lock do player
        this.animate();
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('mousedown', (e) => {
            if (this.player.controls.isLocked && e.button === 0) {
                if (this.weapon.shoot(this.player)) {
                    this.checkShooting();
                }
            }
        });

        window.addEventListener('loot-collected', (e) => {
            const type = e.detail.type;
            if (type === 'ammo') this.player.totalAmmo += 30;
            if (type === 'medkit') this.player.hp = Math.min(100, this.player.hp + 25);
            if (type === 'grenade') this.player.grenades = Math.min(3, this.player.grenades + 1);
        });

        // Evento customizado para saber quando o jogo realmente começou (após fechar o menu)
        this.player.controls.addEventListener('lock', () => {
            if (!this.gameStarted) {
                this.gameStarted = true;
                this.startPreparationPhase();
            }
        });
    }

    checkShooting() {
        // Raycaster para detectar acertos nos inimigos
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        const enemyMeshes = this.enemies.filter(e => e.alive).map(e => e.mesh);
        const intersects = raycaster.intersectObjects(enemyMeshes, true);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            // Encontrar qual inimigo foi atingido (subindo na hierarquia do grupo)
            const enemy = this.enemies.find(e => e.mesh === hitMesh || e.mesh.contains(hitMesh));
            if (enemy) enemy.takeDamage(20);
        }
    }

    startPreparationPhase() {
        this.phase = 'PREPARATION';
        this.timer = 180; // 3 min
        document.getElementById('phase-label').innerText = 'FASE DE PREPARAÇÃO';
        document.getElementById('phase-label').style.color = '#00f2ff';
        this.spawnLoots();
        this.showMessage("PREPARAÇÃO", "Recolha suprimentos. Ninguém te atacará agora.");
    }

    startHordePhase() {
        this.phase = 'HORDE';
        this.timer = 360; // 6 min
        document.getElementById('phase-label').innerText = 'FASE DE HORDA';
        document.getElementById('phase-label').style.color = '#ff0055';
        this.showMessage("HORDA " + this.currentWave, "Sobreviva até o tempo acabar!");
        this.spawnEnemies();
    }

    spawnLoots() {
        // Limpa loots antigos
        this.loots.forEach(l => this.scene.remove(l.mesh));
        this.loots = [];

        const types = ['ammo', 'medkit', 'grenade'];
        for (let i = 0; i < 15; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * 80,
                0,
                (Math.random() - 0.5) * 80
            );
            this.loots.push(new Loot(this.scene, type, pos));
        }
    }

    spawnEnemies() {
        // Spawn periódico durante a horda será feito no update
    }

    updateTimer(delta) {
        if (!this.gameStarted) return;

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

        const mins = Math.floor(this.timer / 60);
        const secs = Math.floor(this.timer % 60);
        document.getElementById('timer').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        document.getElementById('wave-counter').innerText = `HORDA: ${this.currentWave} / ${this.maxWaves}`;
    }

    showMessage(title, desc) {
        const overlay = document.getElementById('message-overlay');
        document.getElementById('msg-title').innerText = title;
        document.getElementById('msg-desc').innerText = desc;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('hidden'), 5000);
    }

    win() {
        this.player.controls.unlock();
        this.showMessage("VITÓRIA!", "Você sobreviveu ao Protocolo Sucata. Arena limpa.");
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();

        this.player.update(delta);
        this.updateTimer(delta);

        const playerPos = this.player.controls.getObject().position;

        // Update Inimigos
        if (this.phase === 'HORDE') {
            // Spawn inimigos se houver poucos (máximo 10 por vez)
            if (this.enemies.filter(e => e.alive).length < 5 + this.currentWave) {
                const spawnPos = new THREE.Vector3(
                    (Math.random() - 0.5) * 90,
                    0,
                    (Math.random() - 0.5) * 90
                );
                // Garante que não spawna na cara do player
                if (spawnPos.distanceTo(playerPos) > 20) {
                    this.enemies.push(new Enemy(this.scene, this.player, spawnPos, this.currentWave));
                }
            }
        }

        this.enemies.forEach(e => e.update(delta));
        this.loots.forEach(l => l.update(delta, playerPos));

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
