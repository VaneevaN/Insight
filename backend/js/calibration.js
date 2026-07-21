// Главный модуль калибровки
let currentStep = 1;
let calibrationPoints = [];
let validationPoints = [];
let collectedGaze = []; // { x, y, targetX, targetY }
let gazeBuffer = [];
let validationIndex = 0;
let calibrationActive = false;
let validationActive = false;

const TOTAL_CALIBRATION_POINTS = 13;
const TOTAL_VALIDATION_POINTS = 8;
const SAMPLES_PER_POINT = 30;

function generateCalibrationPoints(width, height, count) {
    const points = [];
    const margin = 50;
    // Генерация сетки 3x3 + дополнительные точки
    const cols = 4;
    const rows = 4;
    for (let i = 0; i < count; i++) {
        if (i < 9) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = margin + (width - 2 * margin) * (col / 2);
            const y = margin + (height - 2 * margin) * (row / 2);
            points.push({ x, y });
        } else {
            // дополнительные точки в случайных местах
            const x = margin + Math.random() * (width - 2 * margin);
            const y = margin + Math.random() * (height - 2 * margin);
            points.push({ x, y });
        }
    }
    return points;
}

function generateValidationPoints(width, height, count) {
    const points = [];
    const margin = 50;
    for (let i = 0; i < count; i++) {
        const x = margin + Math.random() * (width - 2 * margin);
        const y = margin + Math.random() * (height - 2 * margin);
        points.push({ x, y });
    }
    return points;
}

async function runDetailedHardwareChecks(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // очищаем

    // Массив шагов: id, заголовок, функция проверки (возвращает {ok, message})
    const steps = [
        { id: 1, title: 'Библиотека загружена', check: () => Promise.resolve({ ok: typeof webgazer !== 'undefined', message: typeof webgazer !== 'undefined' ? 'webgazer определён в window' : 'webgazer не определён — файл не загрузился' }) },
        { id: 2, title: 'Свойства webgazer', check: () => {
            if (typeof webgazer === 'undefined') return Promise.resolve({ ok: false, message: 'webgazer не загружен' });
            const keys = Object.keys(webgazer).join(', ');
            const hasBegin = typeof webgazer.begin === 'function';
            const hasSetTracker = typeof webgazer.setTracker === 'function';
            const hasSetRegression = typeof webgazer.setRegression === 'function';
            return Promise.resolve({ ok: hasBegin && hasSetTracker, message: `begin: ${hasBegin}, setTracker: ${hasSetTracker}, setRegression: ${hasSetRegression}\nversion: ${webgazer.version ?? 'не задан'}\nключи: ${keys.slice(0,300)}` });
        }},
        { id: 3, title: 'TensorFlow.js внутри webgazer', check: () => {
            if (typeof webgazer === 'undefined') return Promise.resolve({ ok: false, message: 'webgazer не загружен' });
            // Проверяем наличие tf в webgazer (современные версии встраивают TF)
            const hasGetTracker = typeof webgazer.getTracker === 'function';
            return Promise.resolve({ ok: true, message: 'Современная сборка WebGazer использует встроенный TensorFlow. Отсутствие window.tf не является ошибкой.' });
        }},
        { id: 4, title: 'Камера (getUserMedia)', check: () => navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { stream.getTracks().forEach(t => t.stop()); return { ok: true, message: 'Камера доступна' }; })
            .catch(e => ({ ok: false, message: 'Ошибка доступа к камере: ' + e.message }))
        },
        {
            id: 5,
            title: 'webgazer.begin()',
            check: async () => {
                if (typeof webgazer === 'undefined') return { ok: false, message: 'webgazer не загружен' };
                try {
                    await webgazer.setRegression('ridge').setTracker('TFFacemesh');
                    await webgazer.begin();
                    // Отключаем всё лишнее – только трекер
                    webgazer.showVideoPreview(false).showFaceOverlay(false).showPredictionPoints(false);
                    
                    let prediction = null;
                    webgazer.setGazeListener((data) => { if (data && !prediction) prediction = data; });
                    await new Promise(res => setTimeout(res, 3000));
                    webgazer.setGazeListener(null);
                    
                    if (prediction) {
                        return { ok: true, message: `begin() выполнен, предсказание: x=${Math.round(prediction.x)}, y=${Math.round(prediction.y)}` };
                    } else {
                        return { ok: false, message: 'begin() выполнен, но предсказаний не получено (возможно, лицо не обнаружено)' };
                    }
                } catch(e) {
                    return { ok: false, message: `Ошибка begin(): ${e.message}\nТип: ${e.constructor?.name ?? 'неизвестно'}\nСтек: ${e.stack?.slice(0,300) ?? 'стек недоступен'}` };
                }
            }
        },
        { id: 6, title: 'WebGL доступен', check: () => {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                if (gl) {
                    return Promise.resolve({ ok: true, message: `WebGL доступен: ${gl.getParameter(gl.VERSION)}\nRenderer: ${gl.getParameter(gl.RENDERER)}` });
                } else {
                    return Promise.resolve({ ok: false, message: 'WebGL недоступен — getContext вернул null' });
                }
            } catch(e) {
                return Promise.resolve({ ok: false, message: 'Ошибка проверки WebGL: ' + e.message });
            }
        }}
    ];

    // Создаём блоки для каждого шага
    for (let step of steps) {
        const div = document.createElement('div');
        div.className = 'hardware-item';
        div.innerHTML = `
            <i class="status-icon fa-solid fa-circle-notch" style="color:#ccc;"></i>
            <span>${step.title}: <em id="step-msg-${step.id}">ожидание…</em></span>
        `;
        container.appendChild(div);
    }

    // Последовательно выполняем проверки
    for (let step of steps) {
        const icon = container.querySelector(`#step-msg-${step.id}`).parentElement.querySelector('.status-icon');
        const msg = document.getElementById(`step-msg-${step.id}`);
        try {
            const result = await step.check();
            icon.className = result.ok ? 'status-icon fa-solid fa-circle-check status-ok' : 'status-icon fa-solid fa-circle-exclamation status-fail';
            msg.textContent = result.message;
            msg.style.color = result.ok ? '#2d6a2d' : '#c0392b';
        } catch(e) {
            icon.className = 'status-icon fa-solid fa-circle-exclamation status-fail';
            msg.textContent = 'Неожиданная ошибка: ' + e.message;
            msg.style.color = '#c0392b';
        }
    }
}

// Инициализация и запуск этапа
function startCalibration() {
    const html = `
        <div class="calibration-container" id="calibContainer">
            <!-- Этап 1: Проверка оборудования -->
            <div class="calibration-step active" id="step-1">
                <h2 class="step-title">Детальная проверка оборудования</h2>
                <div class="hardware-check" id="hardwareChecks"></div>
                <button class="btn-apply-filters" id="startDetailedChecksBtn">▶ Начать проверку</button>
                <button class="btn-apply-filters" id="nextToCalib" style="display:none; margin-top:12px;">Далее</button>
            </div>
            <!-- Этап 2: Калибровка (без изменений) -->
            <div class="calibration-step" id="step-2">
                <h2 class="step-title">Калибровка</h2>
                <p>Смотрите на оранжевую точку и нажмите на неё или пробел.</p>
                <div class="progress-bar"><div class="progress-fill" id="calibProgress" style="width:0%"></div></div>
                <div class="calibration-dots" id="calibDots"></div>
                <div id="calibStatus" style="text-align:center; margin:8px;"></div>
            </div>
            <!-- Этап 3: Проверка точности (без изменений) -->
            <div class="calibration-step" id="step-3">
                <h2 class="step-title">Проверка точности</h2>
                <p>Смотрите на фиолетовую точку, пока она не станет оранжевой.</p>
                <div class="progress-bar"><div class="progress-fill" id="validProgress" style="width:0%"></div></div>
                <div class="calibration-dots" id="validDots"></div>
            </div>
            <!-- Этап 4: Результаты (без изменений) -->
            <div class="calibration-step" id="step-4">
                <h2 class="step-title">Результаты калибровки</h2>
                <div id="resultContent"></div>
                <button class="btn-apply-filters" id="restartCalib" style="margin-top:16px;">Новая калибровка</button>
            </div>
        </div>
    `;

    setContent(html, () => {
        document.getElementById('startDetailedChecksBtn').addEventListener('click', async function() {
            this.disabled = true;
            await runDetailedHardwareChecks('hardwareChecks');
            // Показываем кнопку "Далее" только если все проверки пройдены (или всегда показываем)
            document.getElementById('nextToCalib').style.display = 'inline-block';
        });
        document.getElementById('nextToCalib').addEventListener('click', goToCalibration);
        document.getElementById('restartCalib').addEventListener('click', restartCalibration);
        calibrationActive = false;
        validationActive = false;
    });
}
async function runHardwareChecks() {
    const checksContainer = document.getElementById('hardwareChecks');
    const statusDiv = document.getElementById('checksStatus');
    checksContainer.innerHTML = '';
    statusDiv.innerHTML = '';

    const items = [];
    items.push({ label: 'Камера', fn: HardwareValidator.checkCamera });
    items.push({ label: 'WebGL', fn: () => Promise.resolve(HardwareValidator.checkWebGL()) });
    items.push({ label: 'WebGazer', fn: () => Promise.resolve(HardwareValidator.checkWebGazer()) });

    // Покажем статус камеры с иконкой
    for (let item of items) {
        const result = await item.fn();
        const iconClass = result.ok ? 'fa-solid fa-circle-check status-ok' : 'fa-solid fa-circle-exclamation status-fail';
        checksContainer.innerHTML += `
            <div class="hardware-item">
                <i class="${iconClass}"></i>
                <span>${item.label}: ${result.message}</span>
            </div>
        `;
    }

    // Проверка лица и освещения (требует инициализации WebGazer)
    statusDiv.innerHTML = '<p>Загружаем модель лица...</p>';
    try {
        await webgazer.setRegressionModule('ridge').saveData;
        await webgazer.begin();
        // Ждём готовности
        await new Promise(res => webgazer.isReady() ? res() : webgazer.onReady(res));
        const faceResult = await HardwareValidator.checkFaceDetection();
        checksContainer.innerHTML += `
            <div class="hardware-item">
                <i class="fa-solid ${faceResult.ok ? 'fa-circle-check status-ok' : 'fa-circle-exclamation status-fail'}"></i>
                <span>Лицо: ${faceResult.message}</span>
            </div>
        `;

        // Получаем видео для анализа освещения
        const video = document.querySelector('video#webgazerVideoFeed');
        const lightResult = HardwareValidator.checkLighting(video);
        checksContainer.innerHTML += `
            <div class="hardware-item">
                <i class="fa-solid ${lightResult.ok ? 'fa-circle-check status-ok' : 'fa-circle-exclamation status-warn'}"></i>
                <span>Освещение: ${lightResult.message}</span>
            </div>
        `;

        document.getElementById('nextToCalib').style.display = 'inline-block';
        statusDiv.innerHTML = '';
    } catch (e) {
        statusDiv.innerHTML = `<span style="color:#F44336;">Ошибка: ${e.message}</span>`;
    }
}

function goToCalibration() {
    document.querySelectorAll('.calibration-step').forEach(el => el.classList.remove('active'));
    document.getElementById('step-2').classList.add('active');
    startCalibrationPhase();
}

function startCalibrationPhase() {
    const container = document.getElementById('calibDots');
    const { width, height } = container.getBoundingClientRect();
    calibrationPoints = generateCalibrationPoints(width, height, TOTAL_CALIBRATION_POINTS);
    renderDots(container, calibrationPoints, 'calibration-dot', onCalibrationDotClick);
    document.addEventListener('keydown', onCalibrationKey);
    calibrationActive = true;
    updateCalibrationProgress();
}

function onCalibrationDotClick(e) {
    if (!calibrationActive) return;
    const index = parseInt(e.target.dataset.index);
    recordCalibrationPoint(index);
}

function onCalibrationKey(e) {
    if (e.code === 'Space' && calibrationActive) {
        e.preventDefault();
        const activeDot = document.querySelector('.calibration-dot.active');
        if (activeDot) {
            const index = parseInt(activeDot.dataset.index);
            recordCalibrationPoint(index);
        }
    }
}

function recordCalibrationPoint(index) {
    if (calibrationPoints[index].completed) return;
    const point = calibrationPoints[index];
    // Записываем позицию для WebGazer
    webgazer.recordScreenPosition(point.x, point.y);
    point.completed = true;
    // Обновляем визуал
    const dot = document.querySelector(`.calibration-dot[data-index="${index}"]`);
    if (dot) dot.classList.add('completed');
    // Переход к следующей непройденной точке
    let nextIndex = calibrationPoints.findIndex(p => !p.completed);
    if (nextIndex === -1) {
        finishCalibration();
    } else {
        highlightDot(nextIndex);
    }
    updateCalibrationProgress();
}

function highlightDot(index) {
    document.querySelectorAll('.calibration-dot').forEach(d => d.classList.remove('active'));
    const dot = document.querySelector(`.calibration-dot[data-index="${index}"]`);
    if (dot) dot.classList.add('active');
}

function updateCalibrationProgress() {
    const completed = calibrationPoints.filter(p => p.completed).length;
    const percent = (completed / TOTAL_CALIBRATION_POINTS) * 100;
    document.getElementById('calibProgress').style.width = percent + '%';
}

function finishCalibration() {
    calibrationActive = false;
    document.removeEventListener('keydown', onCalibrationKey);
    webgazer.train().then(() => {
        showToast('Калибровка завершена', 'success');
        document.querySelectorAll('.calibration-step').forEach(el => el.classList.remove('active'));
        document.getElementById('step-3').classList.add('active');
        startValidationPhase();
    });
}

// Валидация
function startValidationPhase() {
    const container = document.getElementById('validDots');
    const { width, height } = container.getBoundingClientRect();
    validationPoints = generateValidationPoints(width, height, TOTAL_VALIDATION_POINTS);
    validationIndex = 0;
    collectedGaze = [];
    renderValidationPoint(container, validationPoints[0]);
    validationActive = true;
    collectGazeForPoint(0);
}

function collectGazeForPoint(index) {
    if (index >= validationPoints.length) {
        finishValidation();
        return;
    }
    const point = validationPoints[index];
    gazeBuffer = [];
    // Устанавливаем слушатель взгляда
    webgazer.setGazeListener((data, timestamp) => {
        if (data && validationActive) {
            gazeBuffer.push({ x: data.x, y: data.y, targetX: point.x, targetY: point.y, timestamp });
        }
    });

    // Ждём, пока наберётся нужное количество образцов
    const checkInterval = setInterval(() => {
        if (gazeBuffer.length >= SAMPLES_PER_POINT) {
            clearInterval(checkInterval);
            webgazer.setGazeListener(null); // останавливаем сбор
            // Сохраняем образцы
            collectedGaze = collectedGaze.concat(gazeBuffer.map(g => ({...g, pointIndex: index})));
            // Обновляем точку (визуально)
            const dot = document.querySelector(`.validation-point[data-index="${index}"]`);
            if (dot) dot.classList.remove('collecting');
            // Переход к следующей точке
            validationIndex++;
            document.getElementById('validProgress').style.width = (validationIndex / TOTAL_VALIDATION_POINTS * 100) + '%';
            if (validationIndex < validationPoints.length) {
                const container = document.getElementById('validDots');
                renderValidationPoint(container, validationPoints[validationIndex]);
                collectGazeForPoint(validationIndex);
            } else {
                finishValidation();
            }
        }
    }, 100);

    // Визуально пометим точку как собирающую
    const dot = document.querySelector(`.validation-point[data-index="${index}"]`);
    if (dot) dot.classList.add('collecting');
}

function renderValidationPoint(container, point) {
    container.innerHTML = ''; // удаляем старую точку
    const dot = document.createElement('div');
    dot.className = 'validation-point';
    dot.style.left = point.x + 'px';
    dot.style.top = point.y + 'px';
    dot.dataset.index = validationIndex;
    container.appendChild(dot);
}

function finishValidation() {
    validationActive = false;
    webgazer.setGazeListener(null);
    webgazer.end();
    document.querySelectorAll('.calibration-step').forEach(el => el.classList.remove('active'));
    document.getElementById('step-4').classList.add('active');
    showResults();
}

function showResults() {
    const metrics = MetricsCalculator.calculate(collectedGaze);
    const heatmapCanvas = document.getElementById('resultContent').querySelector('canvas');
    HeatmapRenderer.draw(heatmapCanvas, collectedGaze);

    let rating, ratingClass;
    if (metrics.accuracy >= 80) {
        rating = 'Отлично';
        ratingClass = 'rating-good';
    } else if (metrics.accuracy >= 60) {
        rating = 'Средне';
        ratingClass = 'rating-medium';
    } else {
        rating = 'Плохо';
        ratingClass = 'rating-bad';
    }

    const resultHTML = `
        <div style="text-align:center; margin-bottom:16px;">
            <span class="rating-badge ${ratingClass}">${rating}</span>
            <p style="font-size:18px; margin-top:8px;">Точность: ${metrics.accuracy.toFixed(1)}%</p>
        </div>
        <div class="result-metrics">
            <div class="result-card">
                <div class="result-card__label">Средняя ошибка</div>
                <div class="result-card__value">${metrics.meanError.toFixed(2)} px</div>
            </div>
            <div class="result-card">
                <div class="result-card__label">Медиана</div>
                <div class="result-card__value">${metrics.medianError.toFixed(2)} px</div>
            </div>
            <div class="result-card">
                <div class="result-card__label">95-й процентиль</div>
                <div class="result-card__value">${metrics.p95.toFixed(2)} px</div>
            </div>
            <div class="result-card">
                <div class="result-card__label">Макс. ошибка</div>
                <div class="result-card__value">${metrics.maxError.toFixed(2)} px</div>
            </div>
            <div class="result-card">
                <div class="result-card__label">Jitter</div>
                <div class="result-card__value">${metrics.jitter.toFixed(2)} px</div>
            </div>
            <div class="result-card">
                <div class="result-card__label">FPS</div>
                <div class="result-card__value">${metrics.fps}</div>
            </div>
        </div>
        <div style="margin-top:16px;">
            <h3>Тепловая карта взгляда</h3>
            <canvas id="heatmapCanvas" width="600" height="400" class="heatmap-canvas"></canvas>
        </div>
        <div style="margin-top:16px; color:#888; font-size:14px;">
            <p>Рекомендации: ${getRecommendation(metrics)}</p>
        </div>
    `;

    document.getElementById('resultContent').innerHTML = resultHTML;
    // После вставки canvas отрисовываем тепловую карту
    setTimeout(() => {
        const canvas = document.getElementById('heatmapCanvas');
        if (canvas) HeatmapRenderer.draw(canvas, collectedGaze);
    }, 100);
}

function getRecommendation(metrics) {
    if (metrics.accuracy >= 80) return 'Отличная калибровка. Можно начинать работу.';
    if (metrics.accuracy >= 60) return 'Калибровка приемлемая. Рекомендуется перекалиброваться в хорошо освещённом месте.';
    return 'Плохая калибровка. Проверьте освещение и положение головы, затем повторите.';
}

function restartCalibration() {
    // Сбрасываем всё и начинаем заново
    document.querySelectorAll('.calibration-step').forEach(el => el.classList.remove('active'));
    document.getElementById('step-1').classList.add('active');
    // Очищаем предыдущие данные
    calibrationPoints = [];
    validationPoints = [];
    collectedGaze = [];
    // Останавливаем WebGazer, если активен
    if (typeof webgazer !== 'undefined') {
        webgazer.end();
    }
    currentStep = 1;
}

// Вспомогательная функция отрисовки точек калибровки
function renderDots(container, points, className, clickHandler) {
    container.innerHTML = '';
    points.forEach((point, i) => {
        const dot = document.createElement('div');
        dot.className = className;
        dot.style.left = point.x + 'px';
        dot.style.top = point.y + 'px';
        dot.dataset.index = i;
        dot.addEventListener('click', clickHandler);
        container.appendChild(dot);
    });
    // Активируем первую точку
    if (points.length > 0) highlightDot(0);
}

// Глобальная функция для вызова из script.js
window.startCalibration = startCalibration;