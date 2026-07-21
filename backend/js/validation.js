// Модуль проверки оборудования
const HardwareValidator = {
    async checkCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return { ok: true, message: 'Камера доступна' };
        } catch (e) {
            return { ok: false, message: 'Нет доступа к камере' };
        }
    },

    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return { ok: !!gl, message: gl ? 'WebGL поддерживается' : 'WebGL не поддерживается' };
        } catch (e) {
            return { ok: false, message: 'Ошибка проверки WebGL' };
        }
    },

    checkWebGazer() {
        return { ok: typeof webgazer !== 'undefined', message: typeof webgazer !== 'undefined' ? 'WebGazer загружен' : 'WebGazer не загружен' };
    },

    async checkFaceDetection() {
        // Упрощённо: пытаемся инициализировать WebGazer и увидеть, есть ли facemesh
        try {
            await webgazer.setRegressionModule('ridge');
            await webgazer.begin();
            // Ждём пару секунд, чтобы модель загрузилась
            await new Promise(res => setTimeout(res, 2000));
            const predictions = await webgazer.getCurrentPrediction();
            webgazer.end();
            if (predictions) {
                return { ok: true, message: 'Лицо обнаружено' };
            } else {
                return { ok: false, message: 'Лицо не обнаружено' };
            }
        } catch (e) {
            return { ok: false, message: 'Ошибка инициализации WebGazer' };
        }
    },

    checkLighting(videoElement) {
        // Оценка освещённости по среднему значению пикселя
        if (!videoElement) return { ok: true, message: 'Освещение: проверка пропущена' };
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let sum = 0;
        for (let i = 0; i < imageData.length; i += 4) {
            sum += (imageData[i] + imageData[i+1] + imageData[i+2]) / 3;
        }
        const avg = sum / (imageData.length / 4);
        if (avg < 50) return { ok: false, message: 'Слишком темно' };
        if (avg > 200) return { ok: false, message: 'Слишком ярко' };
        return { ok: true, message: 'Освещение нормальное' };
    }
};