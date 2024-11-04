document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const timer = document.getElementById('timer');
    const fileSize = document.getElementById('fileSize');
    const preview = document.getElementById('preview');
    const previewVideo = document.getElementById('previewVideo');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const qualitySelect = document.getElementById('qualitySelect');
    const fpsSelect = document.getElementById('fpsSelect');
    const formatSelect = document.getElementById('formatSelect');
    const audioBitrateSelect = document.getElementById('audioBitrateSelect');

    // Agregar al inicio del archivo, después del DOMContentLoaded
    const style = document.createElement('style');
    style.textContent = `
        video::-webkit-media-controls {
            display: none !important;
        }
        video::-webkit-media-controls-enclosure {
            display: none !important;
        }
        video::-webkit-media-controls-panel {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    let recorder = new ScreenRecorder({
        quality: qualitySelect.value,
        fps: parseInt(fpsSelect.value),
        format: formatSelect.value,
        audioBitrate: parseInt(audioBitrateSelect.value),
        onTimeUpdate: (time) => {
            timer.textContent = time;
        },
        onFileSizeUpdate: (size) => {
            fileSize.textContent = `${size} MB`;
        },
        onStateChange: (state) => {
            switch(state) {
                case 'recording':
                    startBtn.disabled = true;
                    pauseBtn.disabled = false;
                    stopBtn.disabled = false;
                    qualitySelect.disabled = true;
                    fpsSelect.disabled = true;
                    break;
                case 'stopped':
                    startBtn.disabled = false;
                    pauseBtn.disabled = true;
                    stopBtn.disabled = true;
                    qualitySelect.disabled = false;
                    fpsSelect.disabled = false;
                    pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pausar</span>';
                    break;
            }
        }
    });

    let recordingBlob = null;

    startBtn.addEventListener('click', async () => {
        preview.classList.add('hidden');
        const started = await recorder.startRecording();
        if (started) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            qualitySelect.disabled = true;
            fpsSelect.disabled = true;
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (recorder.isPaused) {
            recorder.resumeRecording();
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pausar</span>';
        } else {
            recorder.pauseRecording();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Reanudar</span>';
        }
    });

    stopBtn.addEventListener('click', async () => {
        recordingBlob = await recorder.stopRecording();
        if (recordingBlob) {
            previewVideo.src = URL.createObjectURL(recordingBlob);
            preview.classList.remove('hidden');
        }
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        qualitySelect.disabled = false;
        fpsSelect.disabled = false;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pausar</span>';
    });

    downloadBtn.addEventListener('click', () => {
        if (recordingBlob) {
            const format = formatSelect.value;
            const url = URL.createObjectURL(recordingBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `grabacion-${new Date().toISOString()}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        }
    });

    shareBtn.addEventListener('click', async () => {
        if (recordingBlob) {
            const shared = await recorder.shareRecording(recordingBlob);
            if (!shared) {
                alert('Tu navegador no soporta la función de compartir');
            }
        }
    });

    qualitySelect.addEventListener('change', () => {
        recorder = new ScreenRecorder({
            quality: qualitySelect.value,
            fps: parseInt(fpsSelect.value),
            format: formatSelect.value,
            audioBitrate: parseInt(audioBitrateSelect.value),
            onTimeUpdate: (time) => timer.textContent = time,
            onFileSizeUpdate: (size) => fileSize.textContent = `${size} MB`
        });
    });

    fpsSelect.addEventListener('change', () => {
        recorder = new ScreenRecorder({
            quality: qualitySelect.value,
            fps: parseInt(fpsSelect.value),
            format: formatSelect.value,
            audioBitrate: parseInt(audioBitrateSelect.value),
            onTimeUpdate: (time) => timer.textContent = time,
            onFileSizeUpdate: (size) => fileSize.textContent = `${size} MB`
        });
    });

    formatSelect.addEventListener('change', () => {
        recorder = new ScreenRecorder({
            quality: qualitySelect.value,
            fps: parseInt(fpsSelect.value),
            format: formatSelect.value,
            audioBitrate: parseInt(audioBitrateSelect.value),
            onTimeUpdate: (time) => timer.textContent = time,
            onFileSizeUpdate: (size) => fileSize.textContent = `${size} MB`
        });
    });

    audioBitrateSelect.addEventListener('change', () => {
        recorder = new ScreenRecorder({
            quality: qualitySelect.value,
            fps: parseInt(fpsSelect.value),
            format: formatSelect.value,
            audioBitrate: parseInt(audioBitrateSelect.value),
            onTimeUpdate: (time) => timer.textContent = time,
            onFileSizeUpdate: (size) => fileSize.textContent = `${size} MB`
        });
    });

    // Agregar listener para el evento personalizado de grabación completada
    window.addEventListener('recordingComplete', (event) => {
        const { blob } = event.detail;
        if (blob) {
            recordingBlob = blob;
            previewVideo.src = URL.createObjectURL(blob);
            preview.classList.remove('hidden');
        }
    });
}); 