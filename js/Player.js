import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, domElement);

        this.hp = 100;
        this.maxHp = 100;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.totalAmmo = 90;
        this.grenades = 3;

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.isRunning = false;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this._initKeyboard();
    }

    _initKeyboard() {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = true; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = true; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = true; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = true; break;
                case 'Space':
                    if (this.canJump) this.velocity.y += 15;
                    this.canJump = false;
                    break;
                case 'ShiftLeft': this.isRunning = true; break;
                case 'KeyR': this.reload(); break;
                case 'KeyG': this.throwGrenade(); break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = false; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = false; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = false; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = false; break;
                case 'ShiftLeft': this.isRunning = false; break;
            }
        });
    }

    update(delta) {
        if (!this.controls.isLocked) return;

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 4.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const speed = this.isRunning ? 400.0 : 200.0;

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * speed * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        this.controls.getObject().position.y += this.velocity.y * delta;

        if (this.controls.getObject().position.y < 2) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = 2;
            this.canJump = true;
        }

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
        this.controls.unlock();
        document.getElementById('msg-title').innerText = 'VOCÊ FOI DESMANTELADO';
        document.getElementById('msg-desc').innerText = 'O Protocolo Sucata falhou.';
        const msg = document.getElementById('message-overlay');
        msg.classList.remove('hidden');
        setTimeout(() => location.reload(), 3000);
    }
}
