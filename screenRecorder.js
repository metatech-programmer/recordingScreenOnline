class ScreenRecorder {
    constructor(options = {}) {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = 0;
        this.duration = 0;
        this.timerInterval = null;
        this.stream = null;

        // Definición de resoluciones
        this.resolutions = {
            '4k': {
                width: 3840,
                height: 2160,
                bitrate: 16000000
            },
            '2k': {
                width: 2560,
                height: 1440,
                bitrate: 12000000
            },
            'fullHD': {
                width: 1920,
                height: 1080,
                bitrate: 8000000
            },
            'hd': {
                width: 1280,
                height: 720,
                bitrate: 5000000
            },
            'sd': {
                width: 854,
                height: 480,
                bitrate: 2500000
            }
        };

        this.options = {
            quality: options.quality || 'fullHD',
            fps: options.fps || 60,
            format: options.format || 'mp4',
            audioBitrate: options.audioBitrate || 320,
            onTimeUpdate: options.onTimeUpdate || (() => {}),
            onFileSizeUpdate: options.onFileSizeUpdate || (() => {}),
            onStateChange: options.onStateChange || (() => {})
        };
    }

    getVideoConstraints() {
        const resolution = this.resolutions[this.options.quality];
        return {
            cursor: 'always',
            displaySurface: 'monitor',
            width: { ideal: resolution.width },
            height: { ideal: resolution.height },
            frameRate: { ideal: parseInt(this.options.fps) }
        };
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: this.getVideoConstraints(),
                audio: true
            });

            // Agregar listener para detectar cuando el usuario detiene la grabación desde Chrome
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                // Simular clic en el botón de detener
                document.getElementById('stopBtn').click();
            });

            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 48000
                    }
                });
                const tracks = [...stream.getTracks(), ...audioStream.getTracks()];
                this.stream = new MediaStream(tracks);
            } catch (e) {
                console.warn('No se pudo capturar el audio del micrófono:', e);
                this.stream = stream;
            }

            // Configurar el codec según el formato seleccionado
            const mimeType = this.getMimeType();
            
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType,
                videoBitsPerSecond: this.resolutions[this.options.quality].bitrate,
                audioBitsPerSecond: this.options.audioBitrate * 1000
            });

            // Agregar listener para el estado del MediaRecorder
            this.mediaRecorder.addEventListener('pause', () => {
                if (!this.isPaused) {
                    document.getElementById('pauseBtn').click();
                }
            });

            this.mediaRecorder.addEventListener('resume', () => {
                if (this.isPaused) {
                    document.getElementById('pauseBtn').click();
                }
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                    this.updateFileSize();
                }
            };

            this.mediaRecorder.start(1000);
            this.isRecording = true;
            this.startTime = Date.now();
            this.startTimer();
            
            return true;
        } catch (error) {
            console.error('Error al iniciar la grabación:', error);
            return false;
        }
    }

    updateFileSize() {
        const totalSize = this.recordedChunks.reduce((size, chunk) => size + chunk.size, 0);
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        this.options.onFileSizeUpdate(sizeMB);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            this.options.onTimeUpdate(this.formatTime(elapsed));
        }, 1000);
    }

    formatTime(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    pauseRecording() {
        if (this.isRecording && !this.isPaused) {
            this.mediaRecorder.pause();
            this.isPaused = true;
            clearInterval(this.timerInterval);
        }
    }

    resumeRecording() {
        if (this.isRecording && this.isPaused) {
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.startTimer();
        }
    }

    async stopRecording() {
        return new Promise((resolve) => {
            if (!this.isRecording) {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = async () => {
                clearInterval(this.timerInterval);
                
                // Crear el blob con el formato correcto
                const blob = new Blob(this.recordedChunks, {
                    type: this.mediaRecorder.mimeType
                });

                // Convertir el formato si es necesario
                const finalBlob = await this.convertFormat(blob);
                
                this.isRecording = false;
                this.isPaused = false;
                this.recordedChunks = [];
                
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                }
                
                resolve(finalBlob);
            };

            this.mediaRecorder.stop();
        });
    }

    async convertFormat(blob) {
        const format = this.options.format;
        const originalType = blob.type;

        // Si ya está en el formato correcto, retornar el blob original
        if (originalType.includes(format)) {
            return blob;
        }

        // Crear un elemento de video temporal para la conversión
        const video = document.createElement('video');
        video.src = URL.createObjectURL(blob);
        await video.load();

        // Crear un canvas para la conversión
        const canvas = document.createElement('canvas');
        canvas.width = this.resolutions[this.options.quality].width;
        canvas.height = this.resolutions[this.options.quality].height;
        const ctx = canvas.getContext('2d');

        // Configurar el formato de salida
        const mimeType = format === 'mp4' ? 'video/mp4' : 
                        format === 'avi' ? 'video/avi' : 
                        'video/webm';

        return new Promise((resolve) => {
            const mediaRecorder = new MediaRecorder(canvas.captureStream(), {
                mimeType,
                videoBitsPerSecond: this.resolutions[this.options.quality].bitrate
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const newBlob = new Blob(chunks, { type: mimeType });
                URL.revokeObjectURL(video.src);
                resolve(newBlob);
            };

            video.play();
            mediaRecorder.start();
            video.onended = () => mediaRecorder.stop();
        });
    }

    async shareRecording(blob) {
        if (navigator.share) {
            const format = this.options.format;
            const file = new File([blob], `grabacion-${new Date().toISOString()}.${format}`, {
                type: blob.type
            });

            try {
                await navigator.share({
                    files: [file],
                    title: 'Grabación de pantalla',
                    text: 'Mira mi grabación de pantalla'
                });
                return true;
            } catch (error) {
                console.error('Error al compartir:', error);
                return false;
            }
        }
        return false;
    }

    getMimeType() {
        const format = this.options.format;
        const codecs = {
            'mp4': [
                'video/mp4;codecs=h264,aac',
                'video/mp4;codecs=avc1,mp4a.40.2'
            ],
            'webm': [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm'
            ],
            'avi': [
                'video/avi',
                'video/webm;codecs=vp8,opus' // fallback
            ]
        };

        const formatCodecs = codecs[format] || codecs.webm;
        
        for (const codec of formatCodecs) {
            if (MediaRecorder.isTypeSupported(codec)) {
                return codec;
            }
        }
        
        return 'video/webm'; // formato por defecto si nada más es soportado
    }
} 