import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.init();
    }

    init() {
        // Chão industrial
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Grade/Grid no chão para estilo sci-fi
        const grid = new THREE.GridHelper(100, 50, 0x00f2ff, 0x222222);
        grid.position.y = 0.01;
        this.scene.add(grid);

        // Paredes Limites
        this.createWall(0, 5, -50, 100, 10, 1); // Norte
        this.createWall(0, 5, 50, 100, 10, 1);  // Sul
        this.createWall(-50, 5, 0, 1, 10, 100); // Oeste
        this.createWall(50, 5, 0, 1, 10, 100);  // Leste

        // Obstáculos (Caixas e Paredes internas)
        this.createBox(10, 2, 10, 4, 4, 4);
        this.createBox(-15, 2, 5, 6, 4, 3);
        this.createBox(5, 1, -20, 3, 2, 8);
        this.createBox(-20, 3, -15, 5, 6, 5);
        this.createBox(20, 2, 20, 8, 4, 8);

        // Iluminação
        const ambLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambLight);

        const dirLight = new THREE.DirectionalLight(0x00f2ff, 1);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // Fog para atmosfera tensa
        this.scene.fog = new THREE.FogExp2(0x050510, 0.02);
    }

    createWall(x, y, z, w, h, d) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const wall = new THREE.Mesh(geo, mat);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
    }

    createBox(x, y, z, w, h, d) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.8
        });
        const box = new THREE.Mesh(geo, mat);
        box.position.set(x, y, z);
        box.castShadow = true;
        box.receiveShadow = true;
        this.scene.add(box);

        // Adicionar detalhes neon nas caixas
        const edges = new THREE.EdgesGeometry(geo);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00f2ff });
        const wireframe = new THREE.LineSegments(edges, lineMat);
        box.add(wireframe);
    }
}
