import * as THREE from 'three';

export class Player {
    constructor(camera, domElement) {
        this.camera = camera;

        // Atributos
        this.hp = 100;
        this.maxHp = 100;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.totalAmmo = 90;
        this.grenades = 3;

        // Movimento
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.isRunning = false;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Sensibilidade do mouse
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.sensitivity = 0.002;

        this._initKeyboard();
        this._initMouse();

        // Pointer Lock controls — usando PointerLockControls é redundante,
        // então controlamos o mouse manualmente pelo pointerlockchange
        this.controls = {
            enabled: false,
            isLocked: false
        };

        // Observar mudanças de pointer lock
        document.addEventListener('pointerlockchange', () => {
            this.controls.isLocked = !!document.pointerLockElement;
        });
    }

    _initKeyboard() {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
                case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
                case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
                case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
                case 'Space':
                    if (this.canJump) { this.velocity.y += 15; this.canJump = false; }
                    break;
                case 'ShiftLeft': this.isRunning = true; break;
                case 'KeyR': this.reload(); break;
                case 'KeyG': this.throwGrenade(); break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
                case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
                case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
                case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
                case 'ShiftLeft': this.isRunning = false; break;
            }
        });
    }

    _initMouse() {
        document.addEventListener('mousemove', (e) => {
            if (!document.pointerLockElement) return;

            this.euler.setFromQuaternion(this.camera.quaternion);
            this.euler.y -= e.movementX * this.sensitivity;
            this.euler.x -= e.movementY * this.sensitivity;
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            this.camera.quaternion.setFromEuler(this.euler);
        });
    }

    update(delta) {
        if (!document.pointerLockElement) return;

        // Gravidade e atrito
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 4.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const speed = this.isRunning ? 400.0 : 200.0;

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * speed * delta;

        // Mover na direção que a câmera aponta
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        this.camera.position.addScaledVector(forward, -this.velocity.z * delta);
        this.camera.position.addScaledVector(right, -this.velocity.x * delta);
        this.camera.position.y += this.velocity.y * delta;

        // Chão
        if (this.camera.position.y < 2) {
            this.velocity.y = 0;
            this.camera.position.y = 2;
            this.canJump = true;
        }

        // Limites do mapa
        this.camera.position.x = Math.max(-48, Math.min(48, this.camera.position.x));
        this.camera.position.z = Math.max(-48, Math.min(48, this.camera.position.z));

        this.updateUI();
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) this.die();
    }

    reload() {
        if (this.ammo < this.maxAmmo && this.totalAmmo > 0) {
            const needed = this.maxAmmo - this.ammo;
            const toReload = Math.min(needed, this.totalAmmo);
            this.ammo += toReload;
            this.totalAmmo -= toReload;
        }
    }

    throwGrenade() {
        if (this.grenades > 0) this.grenades--;
    }

    updateUI() {
        document.getElementById('hp-bar').style.width = this.hp + '%';
        document.getElementById('hp-text').innerText = Math.ceil(this.hp) + ' HP';
        document.getElementById('ammo-count').innerText = this.ammo;
        document.getElementById('total-ammo').innerText = '/ ' + this.totalAmmo;
        document.getElementById('grenade-count').innerText = this.grenades + ' / 3';
    }

    die() {
        document.exitPointerLock();
        document.getElementById('msg-title').innerText = 'VOCÊ FOI DESMANTELADO';
        document.getElementById('msg-desc').innerText = 'O Protocolo Sucata falhou.';
        document.getElementById('message-overlay').classList.remove('hidden');
        setTimeout(() => location.reload(), 3000);
    }
}
