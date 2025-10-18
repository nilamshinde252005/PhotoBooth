const startBtn = document.getElementById('start');
const video = document.getElementById('cam');
const canvas = document.getElementById('cap');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');
const stripEl = document.querySelector('.strip');
stripEl.style.display = 'none'; // hide at start

// 🎨 Filters
const FILTERS = {
 // retro: 'sepia(0.45) contrast(1.1) brightness(0.95) saturate(0.75)',
 //retro:'contrast(0.9) brightness(1.15) saturate(0.8) sepia(0.35)',
 retro: 'sepia(0.75) contrast(1.3) brightness(0.95) saturate(0.85) hue-rotate(-10deg)',
 vintage:'sepia(0.85) contrast(1.4) brightness(0.9) saturate(0.7) hue-rotate(-15deg)',
  BW: `
    grayscale(1)
    contrast(1.35)
    brightness(1.05)
    sepia(0.15)
    saturate(0.9)
  `
};

// get last-used filter
let currentFilter = localStorage.getItem('filter') || 'retro';

// Apply filter to live preview
function applyPreview() {
  video.style.filter = FILTERS[currentFilter];
  video.style.transform = 'scaleX(-1)';
  video.style.objectFit = 'cover';
}
applyPreview();

// Camera setup
let stream = null;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function initCamera() {
  if (stream) return;
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' },
    audio: false
  });
  video.srcObject = stream;

  await new Promise(res => { video.onloadedmetadata = res; });
  await video.play().catch(() => {});

  let tries = 0;
  while ((!video.videoWidth || !video.videoHeight) && tries < 120) {
    await new Promise(r => requestAnimationFrame(r));
    tries++;
  }
  if (!video.videoWidth) throw new Error('Camera not ready.');
}

// Countdown animation
async function countdown(n = 3) {
  countEl.classList.add('show');
  for (let i = n; i >= 1; i--) {
    countEl.textContent = i;
    await sleep(1000);
  }
  countEl.textContent = '';
  countEl.classList.remove('show');
}

// ---- fixed capture sizing ----
const CAPTURE_W = 180;                    // width of each photo
const CAPTURE_H = Math.round(CAPTURE_W * 4 / 3); // 3:4 aspect ratio

// Capture one photo (perfect crop)
function snapFixed() {
  const w = CAPTURE_W, h = CAPTURE_H;
  const dpr = window.devicePixelRatio || 1;
  const CW = Math.round(w * dpr);
  const CH = Math.round(h * dpr);
  canvas.width = CW; 
  canvas.height = CH;

  const vw = video.videoWidth, vh = video.videoHeight;

  // "cover" scaling (matches preview framing)
  const scale = Math.max(CW / vw, CH / vh);
  const sw = Math.round(CW / scale);
  const sh = Math.round(CH / scale);
  const sx = Math.max(0, (vw - sw) / 2);
  const sy = Math.max(0, (vh - sh) / 2);

  ctx.save();
  ctx.translate(CW, 0);
  ctx.scale(-1, 1); // mirror to match preview
  ctx.filter = FILTERS[currentFilter];
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CW, CH);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.9);
}

// Main capture sequence
async function startSequence() {
  startBtn.disabled = true;
  try { await initCamera(); }
  catch (e) {
    alert('Allow camera and try again.');
    startBtn.disabled = false;
    return;
  }

  const photos = [];

  for (let i = 0; i < 3; i++) {
    await countdown(3);
    const photo = snapFixed(); // capture one photo
    photos.push(photo);
    await sleep(800);
  }

  // Save photos to localStorage for strip.html
  localStorage.setItem('photoStrip', JSON.stringify(photos));

  startBtn.disabled = false;
}

// Button listeners
startBtn.addEventListener('click', startSequence);

document.getElementById('viewStripBtn').addEventListener('click', () => {
  window.location.href = 'strip.html';
});

// Cleanup when leaving page
window.addEventListener('pagehide', () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
});
