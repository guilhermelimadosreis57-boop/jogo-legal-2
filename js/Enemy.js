import * as THREE from 'three';

export class Enemy {
    constructor(scene, player, position, difficulty) {
        this.scene = scene;
        this.player = player;
        this.difficulty = difficulty;
        this.hp = 50 * difficulty;
        this.speed = 2 + (difficulty * 0.5);
        this.damage = 10 * difficulty;

        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.mesh.position.y = 1.5;
        this.scene.add(this.mesh);

        this.alive = true;
    }

    createMesh() {
        const group = new THREE.Group();

        const bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x550000 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
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

        return group;
    }

    update(delta) {
        if (!this.alive) return;

        // Usar a posição da câmera diretamente
        const playerPos = this.player.camera.position;
        const direction = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
        direction.y = 0;

        const distance = direction.length();
        direction.normalize();

        if (distance > 1.5) {
            this.mesh.position.add(direction.multiplyScalar(this.speed * delta));
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
        } else {
            this.player.takeDamage(this.damage * delta);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        this.mesh.children[0].material.emissive.setHex(0xff0000);
        setTimeout(() => {
            if (this.mesh && this.mesh.children[0]) this.mesh.children[0].material.emissive.setHex(0x000000);
        }, 100);

        if (this.hp <= 0 && this.alive) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.scene.remove(this.mesh);
    }
}
