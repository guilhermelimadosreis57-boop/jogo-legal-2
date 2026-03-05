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
        this.phase = 'WAITING';
        this.timer = 180;
        this.gameStarted = false;

        this._initRenderer();
        this._initWorld();
        this._initStartButton();
        this._animate();
    }

    _initRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    _initWorld() {
        this.world = new World(this.scene);
        this.player = new Player(this.camera, this.renderer.domElement);
        this.weapon = new Weapon(this.camera, this.scene);
        this.scene.add(this.camera);

        // Tiro com raycasting
        window.addEventListener('mousedown', (e) => {
            if (!this.player.controls.isLocked || e.button !== 0) return;
            if (this.weapon.shoot(this.player)) {
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
                const meshes = this.enemies.filter(e => e.alive).map(e => e.mesh);
                const hits = raycaster.intersectObjects(meshes, true);
                if (hits.length > 0) {
                    const hitMesh = hits[0].object;
                    const enemy = this.enemies.find(en => en.mesh === hitMesh || en.mesh.getObjectById(hitMesh.id));
                    if (enemy) enemy.takeDamage(20);
                }
            }
        });

        // Coleta de loot
        window.addEventListener('loot-collected', (e) => {
            const t = e.detail.type;
            if (t === 'ammo') this.player.totalAmmo = Math.min(this.player.totalAmmo + 30, 999);
            if (t === 'medkit') this.player.hp = Math.min(100, this.player.hp + 25);
            if (t === 'grenade') this.player.grenades = Math.min(3, this.player.grenades + 1);
        });

        // Volta ao menu ao desbloquear mouse (exceto morte)
        this.player.controls.addEventListener('unlock', () => {
            if (this.player.hp > 0) {
                document.getElementById('menu-overlay').classList.remove('hidden');
            }
        });
    }

    _initStartButton() {
        const btn = document.getElementById('start-btn');
        const menu = document.getElementById('menu-overlay');
        const cd = document.getElementById('countdown-display');

        btn.addEventListener('click', () => {
            // Pointer Lock DEVE ser chamado direto no click
            this.player.controls.lock();

            // Após o lock ser concedido, iniciamos a contagem
            this.player.controls.once
                ? this.player.controls.once('lock', () => this._startCountdown(btn, menu, cd))
                : this._onLockOnce(() => this._startCountdown(btn, menu, cd));
        });
    }

    _onLockOnce(callback) {
        const handler = () => {
            callback();
            this.player.controls.removeEventListener('lock', handler);
        };
        this.player.controls.addEventListener('lock', handler);
    }

    _startCountdown(btn, menu, cd) {
        let count = 3;
        btn.disabled = true;
        cd.innerText = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                cd.innerText = count;
            } else {
                clearInterval(interval);
                cd.innerText = '';
                menu.classList.add('hidden');
                this._beginGame();
            }
        }, 1000);
    }

    _beginGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this._startPreparation();
        }
    }

    _startPreparation() {
        this.phase = 'PREPARATION';
        this.timer = 180;
        document.getElementById('phase-label').innerText = 'FASE DE PREPARAÇÃO';
        document.getElementById('phase-label').style.color = '#00f2ff';
        this._spawnLoots();
        this._showMessage('PREPARAÇÃO', 'Recolha suprimentos. Nenhum inimigo por enquanto.');
    }

    _startHorde() {
        this.phase = 'HORDE';
        this.timer = 360;
        document.getElementById('phase-label').innerText = 'FASE DE HORDA ' + this.currentWave;
        document.getElementById('phase-label').style.color = '#ff0055';
        this._showMessage('HORDA ' + this.currentWave + ' / ' + this.maxWaves, 'Sobreviva até o tempo acabar!');
    }

    _spawnLoots() {
        this.loots.forEach(l => this.scene.remove(l.mesh));
        this.loots = [];
        const types = ['ammo', 'ammo', 'medkit', 'medkit', 'grenade'];
        for (let i = 0; i < 18; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const pos = new THREE.Vector3((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80);
            this.loots.push(new Loot(this.scene, type, pos));
        }
    }

    _showMessage(title, desc) {
        const overlay = document.getElementById('message-overlay');
        document.getElementById('msg-title').innerText = title;
        document.getElementById('msg-desc').innerText = desc;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('hidden'), 4000);
    }

    _updateTimer(delta) {
        if (!this.gameStarted || this.phase === 'WAITING') return;
        this.timer -= delta;

        if (this.timer <= 0) {
            if (this.phase === 'PREPARATION') {
                this._startHorde();
            } else {
                this.currentWave++;
                if (this.currentWave > this.maxWaves) {
                    this._win();
                } else {
                    this._startPreparation();
                }
            }
        }

        const mins = Math.floor(this.timer / 60);
        const secs = Math.floor(this.timer % 60);
        document.getElementById('timer').innerText =
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        document.getElementById('wave-counter').innerText =
            `HORDA: ${this.currentWave} / ${this.maxWaves}`;
    }

    _win() {
        this.player.controls.unlock();
        this._showMessage('VITÓRIA!', 'Você sobreviveu ao Protocolo Sucata. Arena limpa.');
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const delta = this.clock.getDelta();

        this.player.update(delta);
        this._updateTimer(delta);

        const playerPos = this.player.controls.getObject().position;

        // Spawn de inimigos durante horda
        if (this.phase === 'HORDE' && this.gameStarted) {
            const alive = this.enemies.filter(e => e.alive).length;
            const maxAlive = 5 + this.currentWave;
            if (alive < maxAlive) {
                const spawnPos = new THREE.Vector3(
                    (Math.random() - 0.5) * 90, 0, (Math.random() - 0.5) * 90
                );
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
