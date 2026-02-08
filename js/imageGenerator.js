/**
 * imageGenerator.js - Procedural Abstract Image Generation
 * Generates beautiful abstract patterns using Canvas API
 */

'use strict';

// Image dimensions
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 1200;

/**
 * Seeded random number generator for reproducible patterns
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }

    choice(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
}

/**
 * Color palette generator
 */
class ColorPalette {
    constructor(random) {
        this.random = random;
        this.schemes = [
            // Vibrant neon
            ['#FF006E', '#8338EC', '#3A86FF', '#06FFA5', '#FFBE0B'],
            // Ocean deep
            ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'],
            // Sunset gradient
            ['#FF6B35', '#F7931E', '#FDC830', '#F37335', '#C0392B'],
            // Cyberpunk
            ['#00F5FF', '#FF00FF', '#8000FF', '#00FF9F', '#FF0080'],
            // Forest mystical
            ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'],
            // Desert warm
            ['#E76F51', '#F4A261', '#E9C46A', '#2A9D8F', '#264653'],
            // Purple dream
            ['#7209B7', '#B5179E', '#F72585', '#4361EE', '#4CC9F0'],
            // Monochrome elegance
            ['#000000', '#14213D', '#FCA311', '#E5E5E5', '#FFFFFF']
        ];
    }

    getRandom() {
        return this.random.choice(this.schemes);
    }

    interpolate(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        return `rgb(${r},${g},${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
}

/**
 * Generates a geometric pattern with Voronoi diagram
 */
function generateVoronoiPattern(ctx, random, palette) {
    const points = [];
    const numPoints = random.nextInt(20, 50);

    // Generate random points
    for (let i = 0; i < numPoints; i++) {
        points.push({
            x: random.nextFloat(0, IMAGE_WIDTH),
            y: random.nextFloat(0, IMAGE_HEIGHT),
            color: random.choice(palette)
        });
    }

    // Draw Voronoi cells
    for (let y = 0; y < IMAGE_HEIGHT; y += 2) {
        for (let x = 0; x < IMAGE_WIDTH; x += 2) {
            let minDist = Infinity;
            let nearestPoint = points[0];

            // Find nearest point
            for (const point of points) {
                const dist = Math.hypot(x - point.x, y - point.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearestPoint = point;
                }
            }

            ctx.fillStyle = nearestPoint.color;
            ctx.fillRect(x, y, 2, 2);
        }
    }

    // Add gradient overlay
    const gradient = ctx.createRadialGradient(
        IMAGE_WIDTH / 2, IMAGE_HEIGHT / 2, 0,
        IMAGE_WIDTH / 2, IMAGE_HEIGHT / 2, IMAGE_WIDTH / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
}

/**
 * Generates concentric circles pattern
 */
function generateConcentricCircles(ctx, random, palette) {
    const centerX = IMAGE_WIDTH / 2;
    const centerY = IMAGE_HEIGHT / 2;
    const maxRadius = Math.hypot(centerX, centerY);
    const numCircles = random.nextInt(30, 60);

    // Background
    ctx.fillStyle = palette[0];
    ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

    // Draw circles from outside to inside
    for (let i = numCircles; i >= 0; i--) {
        const radius = (i / numCircles) * maxRadius;
        const color = palette[i % palette.length];
        const alpha = random.nextFloat(0.6, 1.0);

        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1.0;
}

/**
 * Generates flowing curves pattern
 */
function generateFlowField(ctx, random, palette) {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(1, palette[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

    // Draw flowing curves
    const numCurves = random.nextInt(50, 100);
    ctx.lineWidth = random.nextFloat(1, 4);
    ctx.globalAlpha = 0.6;

    for (let i = 0; i < numCurves; i++) {
        ctx.beginPath();
        ctx.strokeStyle = random.choice(palette);

        let x = random.nextFloat(0, IMAGE_WIDTH);
        let y = random.nextFloat(0, IMAGE_HEIGHT);
        let angle = random.nextFloat(0, Math.PI * 2);
        const angleStep = random.nextFloat(-0.3, 0.3);
        const stepSize = random.nextFloat(5, 15);

        ctx.moveTo(x, y);

        for (let step = 0; step < 200; step++) {
            angle += angleStep;
            x += Math.cos(angle) * stepSize;
            y += Math.sin(angle) * stepSize;

            if (x < 0 || x > IMAGE_WIDTH || y < 0 || y > IMAGE_HEIGHT) break;

            ctx.lineTo(x, y);
        }

        ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
}

/**
 * Generates random polygons pattern
 */
function generatePolygonPattern(ctx, random, palette) {
    // Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, IMAGE_HEIGHT);
    bgGradient.addColorStop(0, palette[0]);
    bgGradient.addColorStop(1, palette[1]);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

    // Draw random polygons
    const numPolygons = random.nextInt(40, 80);

    for (let i = 0; i < numPolygons; i++) {
        const sides = random.nextInt(3, 8);
        const centerX = random.nextFloat(0, IMAGE_WIDTH);
        const centerY = random.nextFloat(0, IMAGE_HEIGHT);
        const radius = random.nextFloat(30, 150);
        const rotation = random.nextFloat(0, Math.PI * 2);

        ctx.beginPath();
        for (let side = 0; side <= sides; side++) {
            const angle = rotation + (side / sides) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            if (side === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fillStyle = random.choice(palette);
        ctx.globalAlpha = random.nextFloat(0.4, 0.8);
        ctx.fill();
    }

    ctx.globalAlpha = 1.0;
}

/**
 * Generates wave interference pattern
 */
function generateWavePattern(ctx, random, palette) {
    // Background
    ctx.fillStyle = palette[0];
    ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

    // Create wave sources
    const sources = [];
    const numSources = random.nextInt(3, 6);

    for (let i = 0; i < numSources; i++) {
        sources.push({
            x: random.nextFloat(0, IMAGE_WIDTH),
            y: random.nextFloat(0, IMAGE_HEIGHT),
            frequency: random.nextFloat(0.01, 0.03),
            phase: random.nextFloat(0, Math.PI * 2)
        });
    }

    // Draw wave interference
    const imageData = ctx.createImageData(IMAGE_WIDTH, IMAGE_HEIGHT);
    const data = imageData.data;

    for (let y = 0; y < IMAGE_HEIGHT; y += 2) {
        for (let x = 0; x < IMAGE_WIDTH; x += 2) {
            let value = 0;

            // Calculate interference from all sources
            for (const source of sources) {
                const dist = Math.hypot(x - source.x, y - source.y);
                value += Math.sin(dist * source.frequency + source.phase);
            }

            // Normalize and map to color
            value = (value / sources.length + 1) / 2; // 0 to 1
            const colorIndex = Math.floor(value * (palette.length - 1));
            const color = new ColorPalette(random).hexToRgb(palette[colorIndex]);

            // Set pixel
            const idx = (y * IMAGE_WIDTH + x) * 4;
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Generates circular packing pattern
 */
function generateCirclePacking(ctx, random, palette) {
    // Background
    const gradient = ctx.createRadialGradient(
        IMAGE_WIDTH / 2, IMAGE_HEIGHT / 2, 0,
        IMAGE_WIDTH / 2, IMAGE_HEIGHT / 2, IMAGE_WIDTH / 2
    );
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(1, palette[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

    const circles = [];
    const maxAttempts = 5000;
    const minRadius = 5;
    const maxRadius = 80;

    // Pack circles
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const newCircle = {
            x: random.nextFloat(0, IMAGE_WIDTH),
            y: random.nextFloat(0, IMAGE_HEIGHT),
            r: random.nextFloat(minRadius, maxRadius),
            color: random.choice(palette)
        };

        // Check collision with existing circles
        let overlaps = false;
        for (const circle of circles) {
            const dist = Math.hypot(newCircle.x - circle.x, newCircle.y - circle.y);
            if (dist < newCircle.r + circle.r + 5) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            circles.push(newCircle);
        }
    }

    // Draw circles
    for (const circle of circles) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.globalAlpha = random.nextFloat(0.6, 0.9);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
}

/**
 * Main function to generate a random abstract image
 * @param {number} seed - Optional seed for reproducible patterns
 * @returns {Promise<HTMLCanvasElement>} Canvas with generated image
 */
export async function generateAbstractImage(seed = null) {
    try {
        // Use timestamp as seed if not provided
        if (seed === null) {
            seed = Date.now() + Math.floor(Math.random() * 10000);
        }

        const random = new SeededRandom(seed);
        const colorPalette = new ColorPalette(random);
        const palette = colorPalette.getRandom();

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_WIDTH;
        canvas.height = IMAGE_HEIGHT;
        const ctx = canvas.getContext('2d');

        // Select random pattern generator
        const generators = [
            generateVoronoiPattern,
            generateConcentricCircles,
            generateFlowField,
            generatePolygonPattern,
            generateWavePattern,
            generateCirclePacking
        ];

        const selectedGenerator = random.choice(generators);
        selectedGenerator(ctx, random, palette);

        return canvas;
    } catch (error) {
        console.error('Image generation error:', error);
        throw new Error('Failed to generate abstract image: ' + error.message);
    }
}

/**
 * Generates a preview thumbnail of an abstract pattern
 * @param {number} size - Thumbnail size
 * @param {number} seed - Seed for pattern
 * @returns {Promise<HTMLCanvasElement>} Thumbnail canvas
 */
export async function generateThumbnail(size = 200, seed = null) {
    const fullCanvas = await generateAbstractImage(seed);
    
    const thumbnail = document.createElement('canvas');
    thumbnail.width = size;
    thumbnail.height = size;
    const ctx = thumbnail.getContext('2d');
    
    ctx.drawImage(fullCanvas, 0, 0, size, size);
    
    return thumbnail;
}

/**
 * Tests if image generation is working
 * @returns {Promise<boolean>} True if test passes
 */
export async function testImageGeneration() {
    try {
        const canvas = await generateAbstractImage(12345);
        return canvas.width === IMAGE_WIDTH && 
               canvas.height === IMAGE_HEIGHT &&
               canvas.getContext('2d') !== null;
    } catch (error) {
        console.error('Image generation test failed:', error);
        return false;
    }
}

/**
 * Gets information about the generated image
 * @returns {Object} Image specifications
 */
export function getImageSpecs() {
    return {
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        format: 'PNG',
        colorDepth: 24,
        totalPixels: IMAGE_WIDTH * IMAGE_HEIGHT
    };
}
