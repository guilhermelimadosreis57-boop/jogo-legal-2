import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
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

        this.obstacles.push({ min: new THREE.Vector3(-50, 0, -50.5), max: new THREE.Vector3(50, 10, -49.5) });
        this.obstacles.push({ min: new THREE.Vector3(-50, 0, 49.5), max: new THREE.Vector3(50, 10, 50.5) });
        this.obstacles.push({ min: new THREE.Vector3(-50.5, 0, -50), max: new THREE.Vector3(-49.5, 10, 50) });
        this.obstacles.push({ min: new THREE.Vector3(49.5, 0, -50), max: new THREE.Vector3(50.5, 10, 50) });

        // Obstáculos (Caixas e Paredes internas)
        this.obstacles.push(this.createBox(10, 2, 10, 4, 4, 4));
        this.obstacles.push(this.createBox(-15, 2, 5, 6, 4, 3));
        this.obstacles.push(this.createBox(5, 1, -20, 3, 2, 8));
        this.obstacles.push(this.createBox(-20, 3, -15, 5, 6, 5));
        this.obstacles.push(this.createBox(20, 2, 20, 8, 4, 8));
        this.obstacles.push(this.createBox(-30, 2, 25, 4, 4, 6));
        this.obstacles.push(this.createBox(35, 1.5, -10, 5, 3, 5));
        this.obstacles.push(this.createBox(-10, 2, -35, 6, 4, 4));

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

        return {
            min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
            max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2)
        };
    }

    checkCollision(x, z, radius) {
        for (const ob of this.obstacles) {
            const cx = Math.max(ob.min.x, Math.min(x, ob.max.x));
            const cz = Math.max(ob.min.z, Math.min(z, ob.max.z));
            const dx = x - cx;
            const dz = z - cz;
            if (dx * dx + dz * dz < radius * radius) return true;
        }
        return false;
    }
}
