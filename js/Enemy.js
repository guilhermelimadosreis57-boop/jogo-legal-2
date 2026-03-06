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

        if (this.type === 'boss') {
            this.hp = 10000;
            this.speed = 3;
            this.damage = 30;
        } else if (this.type === 'drone') {
            this.hp = 30 * difficulty;
            this.speed = 5;
            this.damage = 5 * difficulty;
        } else if (this.type === 'duck') {
            this.hp = 150 * difficulty;
            this.speed = 2;
            this.damage = 25 * difficulty;
        } else if (this.type === 'dog') {
            this.hp = 15 * difficulty;
            this.speed = 22;
            this.damage = 5 * difficulty;
        } else {
            this.hp = 50 + difficulty;
            this.speed = 7;
            this.damage = 10 * difficulty;
        }

        this.mesh = this.createMesh();
        this.mesh.position.copy(position);
        this.mesh.position.y = this.type === 'drone' ? 4 : (this.type === 'duck' ? 0.75 : (this.type === 'dog' ? 0.5 : (this.type === 'boss' ? 1.5 : 1.5)));
        if (this.type === 'boss') this.mesh.sniperTimer = 0;
        this.scene.add(this.mesh);

        this.alive = true;
    }

    createMesh() {
        const group = new THREE.Group();

        if (this.type === 'boss') {
            this.bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0x330011, metalness: 0.5 });
            const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 1), this.bodyMat);
            group.add(core);

            const ringMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });
            const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.4, 16, 64), ringMat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
            
            const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.2, 16, 64), new THREE.MeshBasicMaterial({ color: 0xff00ff }));
            ring2.rotation.x = Math.PI / 2;
            group.add(ring2);
            
            // Spikes
            const spikeGeo = new THREE.ConeGeometry(0.4, 1.5, 4);
            const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
            for(let i=0; i<8; i++) {
                const spike = new THREE.Mesh(spikeGeo, spikeMat);
                const a = (Math.PI / 4) * i;
                spike.position.set(Math.cos(a)*3.5, 0, Math.sin(a)*3.5);
                spike.rotation.x = Math.PI / 2;
                spike.rotation.z = -a;
                ring.add(spike);
            }

            group.lasers = [];
            const laserGeo = new THREE.CylinderGeometry(0.3, 0.3, 20);
            laserGeo.translate(0, 10, 0); 
            const laserMat = new THREE.MeshBasicMaterial({color: 0xff00ff, transparent: true, opacity: 0.8});
            for (let i=0; i<4; i++) {
                const laser = new THREE.Mesh(laserGeo, laserMat);
                laser.rotation.x = Math.PI / 2;
                laser.rotation.y = (Math.PI / 2) * i;
                group.add(laser);
                group.lasers.push(laser);
            }
        } else if (this.type === 'drone') {
            this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x0055ff, emissive: 0x001133 });
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8), this.bodyMat);
            group.add(body);
            const armGeo = new THREE.BoxGeometry(2, 0.1, 0.2);
            const arm1 = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({color:0x333333}));
            const arm2 = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({color:0x333333}));
            arm2.rotation.y = Math.PI / 2;
            group.add(arm1); group.add(arm2);
            const eye = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({color:0xff0000}));
            eye.position.set(0, 0, 0.4);
            group.add(eye);
        } else if (this.type === 'duck') {
            this.bodyMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x333300 }); // Amarelo Pato
            const duckBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), this.bodyMat);
            group.add(duckBody);
            const beak = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: 0xff6600 }));
            beak.position.set(0, 0.2, 0.9);
            group.add(beak);
            
            // Patas
            const footGeo = new THREE.BoxGeometry(0.5, 0.2, 0.8);
            const footMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
            const ftL = new THREE.Mesh(footGeo, footMat);
            ftL.position.set(-0.4, -0.85, 0.2);
            const ftR = new THREE.Mesh(footGeo, footMat);
            ftR.position.set(0.4, -0.85, 0.2);
            group.add(ftL); group.add(ftR);
        } else if (this.type === 'dog') {
            this.bodyMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x332200 });
            const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.2), this.bodyMat);
            dogBody.position.y = 0.5;
            group.add(dogBody);
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), this.bodyMat);
            head.position.set(0, 0.8, 0.7);
            group.add(head);
            const legGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
            const legMat = new THREE.MeshStandardMaterial({color:0x222222});
            const posList = [[-0.3, 0.3, 0.5], [0.3, 0.3, 0.5], [-0.3, 0.3, -0.4], [0.3, 0.3, -0.4]];
            posList.forEach(p => {
                const l = new THREE.Mesh(legGeo, legMat);
                l.position.set(p[0], p[1], p[2]);
                group.add(l);
            });
        } else {
            this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2, emissive: 0x110000 });
            const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.6), this.bodyMat);
            torso.position.y = 0.2;
            group.add(torso);
            
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), this.bodyMat);
            head.position.y = 1.2;
            group.add(head);
            
            const eye = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            eye.position.set(0, 1.2, 0.31);
            group.add(eye);
            
            const armGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
            const armL = new THREE.Mesh(armGeo, this.bodyMat); armL.position.set(-0.65, 0.3, 0); group.add(armL);
            const armR = new THREE.Mesh(armGeo, this.bodyMat); armR.position.set(0.65, 0.3, 0); group.add(armR);
            
            const legGeo = new THREE.BoxGeometry(0.35, 0.8, 0.35);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const legL = new THREE.Mesh(legGeo, legMat); legL.position.set(-0.25, -0.8, 0); group.add(legL);
            const legR = new THREE.Mesh(legGeo, legMat); legR.position.set(0.25, -0.8, 0); group.add(legR);
        }

        return group;
    }

    update(delta) {
        if (!this.alive) return;

        if (this.type === 'boss') {
            const toPlayer = new THREE.Vector3().subVectors(this.player.camera.position, this.mesh.position);
            toPlayer.y = 0;
            const bDist = toPlayer.length();
            toPlayer.normalize();
            if (bDist > 8) {
                this.mesh.position.x += toPlayer.x * this.speed * delta;
                this.mesh.position.z += toPlayer.z * this.speed * delta;
            }
            
            this.mesh.rotation.y += delta * 1.5; 
            
            this.mesh.lasers.forEach(laser => {
                const lDir = new THREE.Vector3(0, 1, 0);
                lDir.applyQuaternion(laser.getWorldQuaternion(new THREE.Quaternion()));
                lDir.y = 0; 
                lDir.normalize();
                
                const toPlayerFlat = new THREE.Vector3().subVectors(this.player.camera.position, this.mesh.position);
                toPlayerFlat.y = 0;
                const distP = toPlayerFlat.length();
                toPlayerFlat.normalize();
                
                if (distP > 0 && distP < 20) {
                    const angle = lDir.angleTo(toPlayerFlat);
                    if (angle < 0.2) {
                        this.player.takeDamage(50 * delta);
                    }
                }
            });

            this.fireTimer += delta;
            if (this.fireTimer >= 4.0 && this.game) {
                this.fireTimer = 0;
                this.game.fireEnemyProjectile(this.mesh.position, toPlayer, this.damage, 'bomb');
            }
            
            // Ataque Sniper
            this.mesh.sniperTimer += delta;
            if (!this.mesh.sniperLine) {
                const mat = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
                const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
                this.mesh.sniperLine = new THREE.Line(geo, mat);
                this.scene.add(this.mesh.sniperLine);
            }
            
            if (this.mesh.sniperTimer > 0) {
                this.mesh.sniperLine.material.opacity = this.mesh.sniperTimer / 5.0; // Intensifica com o tempo
                this.mesh.sniperLine.geometry.setFromPoints([this.mesh.position, this.player.camera.position]);
            }
            
            if (this.mesh.sniperTimer >= 5.0) {
                this.mesh.sniperTimer = 0;
                this.mesh.sniperLine.material.opacity = 0;
                
                // Checa se acertou (raycast simplificado de paredes)
                let hitWall = false;
                const distToP = this.player.camera.position.distanceTo(this.mesh.position);
                const steps = Math.floor(distToP * 5); // 5 cheques por unidade de distancia
                const stepVec = new THREE.Vector3().subVectors(this.player.camera.position, this.mesh.position).normalize().multiplyScalar(1/5);
                const testPos = this.mesh.position.clone();
                for (let i = 0; i < steps; i++) {
                    testPos.add(stepVec);
                    if (this.world && this.world.checkCollision(testPos.x, testPos.z, 0.1)) {
                        hitWall = true; break;
                    }
                }
                
                // Flash visual
                const flash = new THREE.PointLight(0xff0000, 10, 50);
                flash.position.copy(this.mesh.position);
                this.scene.add(flash);
                setTimeout(() => this.scene.remove(flash), 100);
                
                if (!hitWall) {
                    this.player.takeDamage(50);
                }
            }
            
            return;
        }

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
                    this.bodyMat.emissive.setHex((this.type === 'robot' || this.type === 'drone' || this.type === 'duck') ? 0x000000 : this.bodyMat.color.getHex() * 0.2);
                }
            }, 100);
        }

        if (this.hp <= 0 && this.alive) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        if (this.mesh.sniperLine) this.scene.remove(this.mesh.sniperLine);
        this.scene.remove(this.mesh);
        
        // Se for o Boss, ganha o jogo chamando função global (se existir)
        if (this.type === 'boss' && typeof playerWin === 'function') {
            playerWin();
        }
    }
}
