// Using global window CDNs for GSAP, ScrollTrigger, Lenis, THREE.

gsap.registerPlugin(ScrollTrigger);

// --- 1. SMOOTH SCROLLING WITH LENIS ---
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Integrate GSAP with Lenis
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0, 0);

// --- 2. THREE.JS PARTICLES BACKGROUND ---
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true, // Transparent background to show CSS images
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Creating simple particle texture programmatically (Glowing dot / Diya / Petal)
function createCircleTexture(color, size) {
  const matCanvas = document.createElement('canvas');
  matCanvas.width = size;
  matCanvas.height = size;
  const ctx = matCanvas.getContext('2d');
  
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color.replace(', 1)', ', 0.5)'));
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(matCanvas);
}

// Particle system setup
const particlesCount = 300;
const posArray = new Float32Array(particlesCount * 3);
const velocityArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  // Postions
  posArray[i] = (Math.random() - 0.5) * 15;
  // Velocities (slow rising)
  velocityArray[i] = (Math.random() - 0.5) * 0.02;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
geometry.setAttribute('velocity', new THREE.BufferAttribute(velocityArray, 3));

// Gold / Saffron particle material
const material = new THREE.PointsMaterial({
  size: 0.1,
  map: createCircleTexture('rgba(255, 153, 51, 1)', 64),
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(geometry, material);
scene.add(particlesMesh);

// Post-processing or simple render loop
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();
  
  // Slowly rise particles up
  for(let i = 1; i < particlesCount * 3; i+=3) {
    const yVel = velocityArray[i];
    posArray[i] += 0.01 + Math.abs(yVel); 
    if (posArray[i] > 7.5) {
      posArray[i] = -7.5; // Reset to bottom
    }
  }
  
  geometry.attributes.position.needsUpdate = true;
  
  // Slow gentle rotation
  particlesMesh.rotation.y = elapsedTime * 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- 3. GSAP ANIMATIONS ---

// 3.1 Background Images Parallax & Crossfade
const sections = document.querySelectorAll('.panel');
const bgImages = document.querySelectorAll('.bg-image');

// Set first to full opacity initially
gsap.set(bgImages[0], { opacity: 1, scale: 1 });

sections.forEach((sec, i) => {
  if (i === 0) return; // Skip first because it's default
  if (!bgImages[i]) return; // Safeguard if there are more sections than backgrounds
  
  // Crossfade background images as we scroll through sections
  ScrollTrigger.create({
    trigger: sec,
    start: "top 70%", // Start transition when next section is 70% from top
    end: "top 30%",
    scrub: 1,
    onEnter: () => {
      gsap.to(bgImages[i], { opacity: 1, duration: 1, ease: 'power2.inOut' });
      gsap.to(bgImages[i], { scale: 1, duration: 5, ease: 'none' }); // subtle zoom
    },
    onLeaveBack: () => {
      gsap.to(bgImages[i], { opacity: 0, duration: 1, ease: 'power2.inOut' });
      gsap.to(bgImages[i], { scale: 1.1, duration: 1, ease: 'power2.inOut' });
    }
  });
});

// 3.2 Add deep parallax on actual panels & content fade-in
sections.forEach((sec) => {
  const content = sec.querySelector('.content-box');
  
  // Move section backgrounds in parallax (already doing this with fixed bg images effectively)
  // But we will fade in the content nicely
  if (content) {
    gsap.fromTo(content, 
      { opacity: 0, y: 100 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1, 
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sec,
          start: 'top 60%', // Trigger when top of section hits 60% viewport
          toggleActions: 'play reverse play reverse'
        }
      }
    );
  }
});
