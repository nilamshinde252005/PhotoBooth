const startBtn = document.getElementById('start');
    const video    = document.getElementById('cam'); //shows the live preview
    const canvas   = document.getElementById('cap'); //capture surface (not visible to users).
    const ctx      = canvas.getContext('2d'); // 2D drawing context you use to copy pixels from video → canvas.
    const imgs     = [document.getElementById('p1'), document.getElementById('p2'), document.getElementById('p3')];// where each captured photo goes (3 placeholders).
    const countEl  = document.getElementById('count'); 


    
    let stream = null; //no camera stream yet
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));//Small helper to “pause” code for a few milliseconds using await. pause is for the camera to start and to capture photo ms is how many millisecs and r is run
//A Promise is just an object that represents a value that will be available later.



    async function initCamera() {
      if (stream) return;
      // ask for front camera
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      video.srcObject = stream; // connected your camera ---> src object connect my camera(stream) to video id which is the preview

      // wait metadata + playing + non-zero size



      // When metadata is loaded, call res()
      // until metadata is loaded await (metadata has the info like width size ht)
      await new Promise(res => { video.onloadedmetadata = res; });
      await video.play().catch(()=>{});// video.play() starts the webcam video stream.


      let tries = 0;
      while ((!video.videoWidth || !video.videoHeight) && tries < 120) {
        await new Promise(r => requestAnimationFrame(r));
        tries++;
      }
      if (!video.videoWidth) throw new Error('Camera not ready.');
    }



    async function countdown(n=3) {
      countEl.classList.add('show');
      for (let i=n; i>=1; i--) {
        countEl.textContent = i;
        await sleep(1000);
      }
      countEl.textContent = '';
      countEl.classList.remove('show');
    }



//Take a snapshot from your webcam - returning a jpej img
    function snapMirrored() {
      const w = video.videoWidth, h = video.videoHeight;
      canvas.width = w; canvas.height = h;

      // mirror draw so the image matches the preview (selfie style)
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      return canvas.toDataURL('image/jpeg', 0.92);
    }





    async function startSequence() {
      startBtn.disabled = true;
      try { await initCamera(); }
      catch (e) { alert('Allow camera and try again.'); startBtn.disabled = false; return; }

      await countdown(3);

      for (let i = 0; i < 3; i++) {
        imgs[i].src = snapMirrored();
        await sleep(1000);
        await countdown(3);
      }

      startBtn.disabled = false;
    }



    startBtn.addEventListener('click', startSequence);

    // optional cleanup
    window.addEventListener('pagehide', () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    });


