import * as THREE from 'three';

export class Weapon {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.mesh = null;
        this.init();
    }

    init() {
        // Modelo simples de arma (braços + cano)
        const group = new THREE.Group();

        // Cano da arma
        const barrelGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(0.2, -0.2, -0.5);
        group.add(barrel);

        // Corpo da arma
        const bodyGeo = new THREE.BoxGeometry(0.2, 0.3, 0.4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0.2, -0.25, -0.2);
        group.add(body);

        // Detalhe Neon
        const neonGeo = new THREE.BoxGeometry(0.05, 0.05, 0.4);
        const neonMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.set(0.2, -0.15, -0.5);
        group.add(neon);

        this.mesh = group;
        this.camera.add(group);
    }

    shoot(player) {
        if (player.ammo <= 0) return false;

        player.ammo--;

        // Efeito visual de tiro (flash)
        const muzzleFlash = new THREE.PointLight(0x00f2ff, 5, 2);
        muzzleFlash.position.set(0.2, -0.2, -1);
        this.mesh.add(muzzleFlash);

        // Recuo simples
        this.mesh.position.z += 0.05;

        setTimeout(() => {
            this.mesh.position.z -= 0.05;
            this.mesh.remove(muzzleFlash);
        }, 50);

        return true;
    }

    update() {
        // Animação de "balanço" (bobbing) ao andar pode ser adicionada aqui
    }
}
