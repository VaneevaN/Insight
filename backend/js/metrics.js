const MetricsCalculator = {
    calculate(gazeData) {
        const errors = gazeData.map(g => {
            const dx = g.x - g.targetX;
            const dy = g.y - g.targetY;
            return Math.sqrt(dx*dx + dy*dy);
        });

        errors.sort((a,b) => a - b);
        const n = errors.length;
        const mean = errors.reduce((a,b) => a+b, 0) / n;
        const median = n % 2 === 0 ? (errors[n/2-1] + errors[n/2])/2 : errors[Math.floor(n/2)];
        const p95 = errors[Math.floor(n * 0.95)];
        const max = errors[n-1];

        // Jitter: среднее изменение между последовательными кадрами
        let jitterSum = 0;
        for (let i = 1; i < gazeData.length; i++) {
            const dx = gazeData[i].x - gazeData[i-1].x;
            const dy = gazeData[i].y - gazeData[i-1].y;
            jitterSum += Math.sqrt(dx*dx + dy*dy);
        }
        const jitter = jitterSum / (n - 1);

        // FPS: количество кадров / время сбора (приблизительно)
        const timestamps = gazeData.map(g => g.timestamp).filter(t => t);
        let fps = 0;
        if (timestamps.length > 1) {
            const duration = (timestamps[timestamps.length-1] - timestamps[0]) / 1000;
            fps = Math.round(timestamps.length / duration);
        }

        // Точность как процент попаданий в радиус 50px от цели
        const hits = errors.filter(e => e <= 50).length;
        const accuracy = (hits / n) * 100;

        return { meanError: mean, medianError: median, p95, maxError: max, jitter, fps, accuracy };
    }
};