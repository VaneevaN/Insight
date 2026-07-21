const HeatmapRenderer = {
    draw(canvas, gazeData) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Создаём радиальные градиенты вокруг каждой точки взгляда
        gazeData.forEach(g => {
            const x = g.x * canvas.width / window.innerWidth; // приблизительно
            const y = g.y * canvas.height / window.innerHeight;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
            gradient.addColorStop(0, 'rgba(240, 136, 58, 0.6)');
            gradient.addColorStop(1, 'rgba(240, 136, 58, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - 40, y - 40, 80, 80);
        });
    }
};