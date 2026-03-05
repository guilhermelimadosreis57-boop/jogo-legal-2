import * as THREE from 'three';

export class Loot {
    constructor(scene, type, position) {
        this.scene = scene;
        this.type = type; // 'ammo', 'medkit', 'grenade'
        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.mesh.position.y = 1;
        this.scene.add(this.mesh);
        this.collected = false;
    }

    createMesh() {
        let color, size;
        switch (this.type) {
            case 'ammo': color = 0xffff00; size = 0.4; break;
            case 'medkit': color = 0x00ff00; size = 0.5; break;
            case 'grenade': color = 0xff0000; size = 0.3; break;
        }

        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5
        });
        const mesh = new THREE.Mesh(geo, mat);

        // Brilho externo
        const light = new THREE.PointLight(color, 2, 3);
        mesh.add(light);

        return mesh;
    }

    update(delta, playerPos) {
        if (this.collected) return;

        // Rotação constante
        this.mesh.rotation.y += delta * 2;
        this.mesh.position.y = 1 + Math.sin(Date.now() * 0.005) * 0.2;

        // Detecção de proximidade
        const dist = this.mesh.position.distanceTo(playerPos);
        if (dist < 1.5) {
            this.collect();
        }
    }

    collect() {
        this.collected = true;
        this.scene.remove(this.mesh);
        window.dispatchEvent(new CustomEvent('loot-collected', { detail: { type: this.type } }));
    }
}
