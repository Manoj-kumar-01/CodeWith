// THIN NEON // EDGE FLOW — Ported from animi.html
(function () {
    const container = document.getElementById('bg-container');
    if (!container) return;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Using ReinhardToneMapping as in animi.html (user reverted ACESFilmic)
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.cssText = 'position:absolute;top:0;left:0;display:block';

    // ── Scene ─────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    // ── Camera ────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    const keyboardGroupWrap = new THREE.Group();
    scene.add(keyboardGroupWrap);

    // PERFECT STATIC VIEW CONFIGURATION
    // Desktop: Keyboard (Visible)
    // Mobile: Plain Background (Keyboard Hidden)
    function setPerfectAngle() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspect = width / height;

        if (width < 1024) {
            // Mobile & Tablet: Hide everything
            keyboardGroupWrap.visible = false;
        } else {
            // Desktop: Show Keyboard
            keyboardGroupWrap.visible = true;

            // Desktop Camera Logic
            // Moved camera slightly to center the keyboard higher in the view
            camera.position.set(6, 5.5, 8.5);
            camera.lookAt(4, -0.5, 0);
        }
    }
    setPerfectAngle();

    // ── Controls ──────────────────────────────────────────────────
    // OrbitControls REMOVED to fix scrolling/clicking issues.
    // Static view ensures perfect visibility without user error.
    const controls = null;

    // keyboardGroupWrap already initialized at top
    // Terrain removed.
    // We will toggle visibility of keyboardGroupWrap based on screen size.

    // ── Lighting ──────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.9);
    fillLight.position.set(-4, 5, 6);
    scene.add(fillLight);

    const backLight = new THREE.PointLight(0x4466aa, 1.2);
    backLight.position.set(2, 2, -6);
    scene.add(backLight);

    const rimLight = new THREE.PointLight(0x44aaff, 1.0);
    rimLight.position.set(6, 3, 4);
    scene.add(rimLight);

    const glowLight1 = new THREE.PointLight(0x00ffaa, 0.5);
    glowLight1.position.set(2, 1, 3);
    scene.add(glowLight1);

    const glowLight2 = new THREE.PointLight(0xffaa00, 0.3);
    glowLight2.position.set(5, 1, -2);
    scene.add(glowLight2);

    // ── Keyboard Base ─────────────────────────────────────────────
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x020202,
        roughness: 0.1,  // Glossy
        metalness: 0.95, // Highly reflective
        emissive: new THREE.Color(0x000000)
    });

    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 5), bodyMat);
    basePlate.position.set(4, 0, 0);
    basePlate.castShadow = true;
    basePlate.receiveShadow = true;
    keyboardGroupWrap.add(basePlate);

    const topCoverMat = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.15, // Glossy
        metalness: 0.9   // Shiny
    });

    const topCover = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.2, 4.8), topCoverMat);
    topCover.position.set(4, 0.25, 0);
    topCover.castShadow = true;
    topCover.receiveShadow = true;
    keyboardGroupWrap.add(topCover);

    const outlineMat = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.1,
        metalness: 0.3,
        emissive: new THREE.Color(0x00ffaa),
        emissiveIntensity: 0.15
    });

    const frontStrip = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.1, 0.3), outlineMat);
    frontStrip.position.set(4, 0.15, 2.4);
    frontStrip.castShadow = true;
    frontStrip.receiveShadow = true;
    keyboardGroupWrap.add(frontStrip);

    const backStrip = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.1, 0.3), outlineMat);
    backStrip.position.set(4, 0.15, -2.4);
    backStrip.castShadow = true;
    backStrip.receiveShadow = true;
    keyboardGroupWrap.add(backStrip);

    const leftStrip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 4.8), outlineMat);
    leftStrip.position.set(-1.8, 0.15, 0);
    leftStrip.castShadow = true;
    leftStrip.receiveShadow = true;
    keyboardGroupWrap.add(leftStrip);

    const rightStrip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 4.8), outlineMat);
    rightStrip.position.set(9.8, 0.15, 0);
    rightStrip.castShadow = true;
    rightStrip.receiveShadow = true;
    keyboardGroupWrap.add(rightStrip);

    const underGlow = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.05, 4.5), new THREE.MeshStandardMaterial({
        color: 0x00ffaa,
        emissive: new THREE.Color(0x00ffaa),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.2
    }));
    underGlow.position.set(4, -0.1, 0);
    keyboardGroupWrap.add(underGlow);

    // ── Font Loading & Texture generation ─────────────────────────
    function createNeonTexture(letter, glowColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = '900 70px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dark/Opaque text to sit on top
        ctx.fillStyle = '#ffffff';
        ctx.fillText(letter, 64, 64);

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(letter, 64, 64);

        ctx.shadowBlur = 30;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = glowColor;
        ctx.fillText(letter, 64, 64);

        return new THREE.CanvasTexture(canvas);
    }

    // ── Keys ──────────────────────────────────────────────────────
    const keys = [];
    const interactiveMeshes = [];
    const keyGroup = new THREE.Group();
    const neonGroup = new THREE.Group();

    const positions = [
        { x: 1.5, z: 1.5, letter: 'C' },
        { x: 3.0, z: 1.5, letter: 'O' },
        { x: 4.5, z: 1.5, letter: 'D' },
        { x: 6.0, z: 1.5, letter: 'E' },
        { x: 2.25, z: 0, letter: 'W' },
        { x: 3.75, z: 0, letter: 'I' },
        { x: 5.25, z: 0, letter: 'T' },
        { x: 6.75, z: 0, letter: 'H' },
        { x: 4.5, z: -1.5, letter: '?' }
    ];

    function initKeys() {
        positions.forEach(function (pos, index) {
            const keyObj = new THREE.Group();

            // Calculate color gradient based on X position (Left Blue -> Right Pink/Red)
            const hue = 0.5 + (pos.x / 10.0) * 0.45; // 0.5(Cyan) to 0.95(Pink/Red)
            const colorHex = new THREE.Color().setHSL(hue, 1.0, 0.5);
            const colorCss = '#' + colorHex.getHexString();

            // 1. Stem
            const stemGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 8);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.8, metalness: 0.2 });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.set(0, -0.2, 0); // Local space
            stem.castShadow = true;
            stem.receiveShadow = true;
            keyObj.add(stem);

            // 2. Mid connector (Thinned out to reduce height)
            const midGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 6);
            const midMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.4, metalness: 0.6 });
            const mid = new THREE.Mesh(midGeo, midMat);
            mid.position.set(0, 0.02, 0); // Lowered closer to stem
            mid.castShadow = true;
            mid.receiveShadow = true;
            keyObj.add(mid);

            // 3. Tapered Beveled Mechanical Keycap (ExtrudeGeometry)
            const capShape = new THREE.Shape();
            const bw = 0.48; // Base half-width
            capShape.moveTo(-bw, -bw);
            capShape.lineTo(bw, -bw);
            capShape.lineTo(bw, bw);
            capShape.lineTo(-bw, bw);
            capShape.lineTo(-bw, -bw);

            const extrudeSettings = {
                depth: 0.35,
                bevelEnabled: true,
                bevelSegments: 3,
                steps: 1,
                bevelSize: 0.05,
                bevelThickness: 0.05
            };

            const topGeo = new THREE.ExtrudeGeometry(capShape, extrudeSettings);

            // Adjust geometry center and taper manually via vertices
            const posAttr = topGeo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                let zPos = posAttr.getZ(i); // depth axis in ExtrudeGeometry
                // Taper effect: As Z increases (moves top), X and Y shrink
                if (zPos > 0) {
                    const taperFactor = 1.0 - (zPos / 0.35) * 0.15; // 15% shrinkage at top
                    posAttr.setX(i, posAttr.getX(i) * taperFactor);
                    posAttr.setY(i, posAttr.getY(i) * taperFactor);
                }
            }
            topGeo.computeVertexNormals();

            // Rotate extruded geometry so depth acts as Y-axis (height)
            topGeo.rotateX(-Math.PI / 2);

            const topMat = new THREE.MeshStandardMaterial({
                color: 0x1a1a24,
                roughness: 0.4, // Smoother finish
                metalness: 0.4
            });
            const topCap = new THREE.Mesh(topGeo, topMat);
            topCap.position.set(0, 0.1, 0); // Position relative to stem
            topCap.castShadow = true;
            topCap.receiveShadow = true;
            keyObj.add(topCap);

            // 4. Smooth Top Inset (matches tapered top size)
            const tw = bw * 0.85; // Top width after taper
            const insetGeo = new THREE.BoxGeometry(tw * 2, 0.05, tw * 2);
            const insetMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.7, metalness: 0.2 });
            const inset = new THREE.Mesh(insetGeo, insetMat);
            inset.position.set(0, 0.48, 0); // Directly on top of tapered extrusion
            keyObj.add(inset);

            // 5. Projected Holographic Neon Text
            const tex = createNeonTexture(pos.letter, colorCss);
            const letterMat = new THREE.MeshStandardMaterial({
                map: tex,
                emissive: colorHex,
                emissiveMap: tex,
                emissiveIntensity: 4.0, // High glow
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            const letterPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), letterMat);
            letterPlane.rotation.x = -0.3;
            letterPlane.rotation.y = 0.2;
            letterPlane.position.set(pos.x, 1.5, pos.z); // Global float height
            neonGroup.add(letterPlane);

            // 6. Light yellow golden flash underneath the keycaps for a perfect reflection
            const goldenColor = 0xffe066; // Light golden yellow
            const deskLight = new THREE.PointLight(goldenColor, 0.5, 3.0);
            deskLight.position.set(0, -0.25, 0); // Positioned perfectly just above the board surface
            keyObj.add(deskLight);

            keyObj.position.set(pos.x, 0.65, pos.z); // Lowered entire key object slightly

            // Store reference data for mechanics animation
            keyObj.userData = {
                originalY: 0.65, // Lowered resting height
                hovered: false,
                letterMat: letterMat,
                deskLight: deskLight,
                depressedTarget: 0.40, // Push depth down further
                letterPlane: letterPlane,
                letterBaseY: 1.45,     // Lowered projection height
                index: index
            };

            // Interactive target logic
            topCap.userData.parentKey = keyObj;
            inset.userData.parentKey = keyObj;
            interactiveMeshes.push(topCap, inset);

            keys.push(keyObj);
            keyGroup.add(keyObj);
        });
        keyboardGroupWrap.add(keyGroup);
        keyboardGroupWrap.add(neonGroup);
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { initKeys(); });
    } else {
        initKeys();
    }

    // ── Particles ─────────────────────────────────────────────────
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 18 + 4;
        particlePositions[i * 3 + 1] = Math.random() * 5;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
        color: 0x88aaff,
        size: 0.02,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Raycaster ─────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(999, 999);

    function onTouch(event) {
        if (event.touches.length > 0) {
            const t = event.touches[0];
            mouse.x = (t.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
        }
    }
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });

    window.addEventListener('mousemove', function (event) {
        // Calibration Fix for Desktop
        let calibrationOffsetX = 0;
        if (window.innerWidth >= 1024) {
            calibrationOffsetX = 0.04;
        }
        mouse.x = ((event.clientX / window.innerWidth) * 2 - 1) + calibrationOffsetX;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // ── Pre-render ────────────────────────────────────────────────
    renderer.render(scene, camera);
    container.appendChild(renderer.domElement);

    // ── Anim Loop ─────────────────────────────────────────────────
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsedTime = performance.now() * 0.001;

        // Raycasting
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes);

        let hoveredKeyObj = null;
        if (intersects.length > 0) {
            hoveredKeyObj = intersects[0].object.userData.parentKey;
        }

        // Animate Physics
        keys.forEach(function (keyObj) {
            const ud = keyObj.userData;
            const isHovered = (keyObj === hoveredKeyObj);

            // Breathe / Float naturally if not hovered
            const floatOffset = Math.sin(elapsedTime * 2.0 + keyObj.position.x) * 0.03;
            const targetY = isHovered ? ud.depressedTarget : ud.originalY + floatOffset;

            // Interpolate position
            keyObj.position.y += (targetY - keyObj.position.y) * 0.2;

            // Interpolate Glow
            // High intensity golden flash when hovered
            const targetLight = isHovered ? 4.0 : 0.4;

            ud.letterMat.emissiveIntensity += ((isHovered ? 6.0 : 4.0) - ud.letterMat.emissiveIntensity) * 0.2;
            ud.deskLight.intensity += (targetLight - ud.deskLight.intensity) * 0.2;

            // Float holographic planes dynamically matching key height
            if (ud.letterPlane) {
                ud.letterPlane.position.y = ud.letterBaseY + Math.sin(elapsedTime * 1.5 + ud.index) * 0.08 + (keyObj.position.y - ud.originalY);
            }
        });

        // Pulse underglow
        underGlow.material.emissiveIntensity = 0.2 + Math.sin(elapsedTime * 2) * 0.1;

        // Rotate particles
        particles.rotation.y += 0.0002;

        if (controls) controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        setPerfectAngle(); // Maintain perfect view
    });
})();
