import { useEffect, useRef } from 'react';
import noiseTexture from "../assets/images/noise.jpg";

type Config = {
    x: number;
    y: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    radius: number;
    startRadius: number;
    endRadius: number;
    color: string;
    progress: number;
    speed: number;
    isMoving: boolean;
    angle: number; // Track current angle in circular path
    centerX: number; // Center point for circular motion
    centerY: number;
    radiusX: number; // X radius of ellipse
    radiusY: number; // Y radius of ellipse
}

const maxCanvasFPS = 30;
const maxCanvasRefreshInterval = Math.round(1000 / maxCanvasFPS);

function shuffleArray<T extends Array<any>>(array: T) {
    let currentIndex = array.length;
    let randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

const NothingAtmosphere = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bubblesRef = useRef<Config[]>([]);

    // Helper functions
    const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
    // const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Create bubbles (only once)
        if (bubblesRef.current.length === 0) {
            const colors = shuffleArray(['#15c7d3', '#066170', '#052b34']);
            const colorsCount = colors.length;
            bubblesRef.current = Array.from({ length: colorsCount }, (_, i) => {
                const startX = (Math.random() > 0.5 ? (-1 * Math.random() * canvas.width) : (0.8 * canvas.width)) + Math.random() * canvas.width;
                const startY = Math.random() * canvas.height;
                const endX = Math.random() * canvas.width;
                const endY = (i * canvas.height / colorsCount) + Math.random() * (canvas.height / colorsCount);

                // Calculate center point between start and end
                const centerX = (startX + endX) / 2;
                const centerY = (startY + endY) / 2;

                // Calculate radius of the circular path
                const radiusX = Math.round(endX - startX) / 2;
                const radiusY = Math.round(endY - startY) / 2;

                return {
                    startX,
                    startY,
                    endX,
                    endY,
                    x: startX,
                    y: startY,
                    startRadius: (canvas.width / 4) + Math.random() * (canvas.width / 3),
                    endRadius: (canvas.width / 2) + Math.random() * (canvas.width / 3),
                    radius: 1 + Math.random() * 10,
                    color: colors[i],
                    progress: 0,
                    speed: 0.008 + Math.random() * (Math.pow(1.2, i) * 0.015),
                    isMoving: true,
                    angle: Math.round(Math.random() * 60), // Start angle
                    centerX,
                    centerY,
                    radiusX,
                    radiusY
                };
            });
        }

        const img = new Image();
        img.src = noiseTexture;

        const drawTexture = () => {
            ctx.globalAlpha = 0.1;
            ctx.filter = `none`;
            ctx.globalCompositeOperation = 'screen';

            const canvasAspect = canvas.width / canvas.height;
            const imgAspect = img.width / img.height;

            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

            if (imgAspect > canvasAspect) {
                drawHeight = canvas.height;
                drawWidth = img.width * (canvas.height / img.height);
                offsetX = (canvas.width - drawWidth) / 2;
            } else {
                drawWidth = canvas.width;
                drawHeight = img.height * (canvas.width / img.width);
                offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            // ctx.globalAlpha = 1;
        };

        // Animation loop
        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let stillMoving = false;

            for (const bubble of bubblesRef.current) {
                if (!bubble.isMoving) {
                    // Draw stationary bubbles at end position
                    ctx.beginPath();
                    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
                    ctx.fillStyle = bubble.color;
                    ctx.globalAlpha = 0.7;
                    ctx.filter = `blur(${bubble.radius / 3}px)`;
                    ctx.fill();
                } else {
                    // Update progress with dynamic speed
                    bubble.progress += bubble.speed * (1 - bubble.progress * 0.8);

                    // Calculate eased progress
                    const easedProgress = easeInOutQuad(bubble.progress);

                    // Update angle for circular motion (0 to π radians)
                    bubble.angle = Math.PI * easedProgress;

                    // Calculate circular position (ellipse path)
                    bubble.x = bubble.centerX + Math.sin(bubble.angle) * bubble.radiusX;
                    bubble.y = bubble.centerY - Math.cos(bubble.angle) * bubble.radiusY;

                    // Update radius size
                    bubble.radius = lerp(bubble.startRadius, bubble.endRadius, easedProgress);

                    // Draw bubble
                    ctx.beginPath();
                    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
                    ctx.fillStyle = bubble.color;
                    ctx.globalAlpha = 0.7;
                    ctx.filter = `blur(${bubble.radius / 3}px)`;
                    ctx.fill();

                    if (bubble.progress >= 1) {
                        bubble.isMoving = false;
                        // Snap to final position
                        // bubble.x = bubble.endX;
                        // bubble.y = bubble.endY;
                        // bubble.radius = bubble.endRadius;
                    } else {
                        stillMoving = true;
                    }
                }
            }

            drawTexture();

            if (stillMoving) {
                setTimeout(() => {
                    animationId = window.requestAnimationFrame(animate);
                }, maxCanvasRefreshInterval);
            }
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'black',
                zIndex: -1
            }}
        />
    );
};

export default NothingAtmosphere;