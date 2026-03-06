import * as THREE from 'three';

export class Enemy {
    constructor(scene, player, world, position, difficulty, type = 'robot', game) {
        this.scene = scene;
        this.player = player;
        this.world = world;
        this.difficulty = difficulty;
        this.type = type;
        this.game = game; // to push projectiles
        
        this.fireTimer = 0;

        if (this.type === 'drone') {
            this.hp = 30 * difficulty;
            this.speed = 5 + difficulty;
            this.damage = 5 * difficulty;
        } else if (this.type === 'dog') {
            this.hp = 15 * difficulty;
            this.speed = 22 + difficulty * 1.5;
            this.damage = 15 * difficulty;
        } else {
            this.hp = 50 * difficulty;
            this.speed = 7 + difficulty * 2;
            this.damage = 10 * difficulty;
        }

        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.mesh.position.y = this.type === 'drone' ? 4 : (this.type === 'dog' ? 0.5 : 1.5);
        this.scene.add(this.mesh);

        this.alive = true;
    }

    createMesh() {
        const group = new THREE.Group();

        if (this.type === 'drone') {
            this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x0055ff, emissive: 0x001133 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), this.bodyMat);
            group.add(body);
        } else if (this.type === 'dog') {
            this.bodyMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x332200 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1.2), this.bodyMat);
            group.add(body);
        } else {
            this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x550000 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.8), this.bodyMat);
            group.add(body);

            const eyeGeo = new THREE.BoxGeometry(0.8, 0.2, 0.1);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(0, 0.4, 0.4);
            group.add(eye);

            const legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const leg1 = new THREE.Mesh(legGeo, legMat);
            leg1.position.set(-0.3, -1, 0);
            group.add(leg1);
            const leg2 = new THREE.Mesh(legGeo, legMat);
            leg2.position.set(0.3, -1, 0);
            group.add(leg2);
        }

        return group;
    }

    update(delta) {
        if (!this.alive) return;

        const playerPos = this.player.camera.position;
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
        
        if (this.type === 'drone') {
            const dist = direction.length();
            direction.normalize();
            if (dist > 12) {
                const stepX = direction.x * this.speed * delta;
                const stepZ = direction.z * this.speed * delta;
                if (!this.world.checkCollision(this.mesh.position.x + stepX, this.mesh.position.z, 0.6)) {
                    this.mesh.position.x += stepX;
                }
                if (!this.world.checkCollision(this.mesh.position.x, this.mesh.position.z + stepZ, 0.6)) {
                    this.mesh.position.z += stepZ;
                }
            }
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
            this.fireTimer += delta;
            
            if (this.fireTimer >= 5.0 && dist < 35 && this.game) {
                this.fireTimer = 0;
                this.game.fireEnemyProjectile(this.mesh.position, direction, this.damage);
            }
            return;
        }

        direction.y = 0;
        const distance = direction.length();
        direction.normalize();

        if (distance > 1.5) {
            const colRadius = this.type === 'dog' ? 0.3 : 0.5;
            const stepX = direction.x * this.speed * delta;
            const stepZ = direction.z * this.speed * delta;
            
            if (!this.world.checkCollision(this.mesh.position.x + stepX, this.mesh.position.z, colRadius)) {
                this.mesh.position.x += stepX;
            }
            if (!this.world.checkCollision(this.mesh.position.x, this.mesh.position.z + stepZ, colRadius)) {
                this.mesh.position.z += stepZ;
            }
            
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
        } else {
            this.player.takeDamage(this.damage * delta);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        if (this.bodyMat) {
            this.bodyMat.emissive.setHex(0xffffff);
            setTimeout(() => {
                if (this.bodyMat) {
                    this.bodyMat.emissive.setHex(this.type === 'robot' ? 0x000000 : this.bodyMat.color.getHex() * 0.2);
                }
            }, 100);
        }

        if (this.hp <= 0 && this.alive) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.scene.remove(this.mesh);
    }
}
