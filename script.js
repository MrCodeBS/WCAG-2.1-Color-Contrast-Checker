// Color conversion and calculation utilities
class ColorUtils {
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    static getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    static getContrastRatio(l1, l2) {
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }
}

// Color contrast analyzer
class ContrastAnalyzer {
    constructor() {
        this.wcagLevels = {
            'AA': {
                'normal': 4.5,
                'large': 3
            },
            'AAA': {
                'normal': 7,
                'large': 4.5
            }
        };
    }

    analyzeContrast(foregroundColor, backgroundColor) {
        const fgRgb = ColorUtils.hexToRgb(foregroundColor);
        const bgRgb = ColorUtils.hexToRgb(backgroundColor);

        if (!fgRgb || !bgRgb) {
            throw new Error('Invalid color format');
        }

        const fgLuminance = ColorUtils.getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
        const bgLuminance = ColorUtils.getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
        const ratio = ColorUtils.getContrastRatio(fgLuminance, bgLuminance);

        return {
            contrastRatio: Math.round(ratio * 100) / 100,
            AA: {
                normal: ratio >= this.wcagLevels.AA.normal,
                large: ratio >= this.wcagLevels.AA.large
            },
            AAA: {
                normal: ratio >= this.wcagLevels.AAA.normal,
                large: ratio >= this.wcagLevels.AAA.large
            },
            score: this.calculateScore(ratio)
        };
    }

    calculateScore(ratio) {
        if (ratio >= this.wcagLevels.AAA.normal) return 'AAA';
        if (ratio >= this.wcagLevels.AA.normal) return 'AA';
        if (ratio >= this.wcagLevels.AA.large) return 'AA Large';
        return 'Fail';
    }

    suggestAlternatives(color, targetRatio = 4.5, isBackground = false) {
        const rgb = ColorUtils.hexToRgb(color);
        const alternatives = [];
        const steps = [-20, -10, 10, 20]; // Adjustment steps

        for (const step of steps) {
            const adjusted = {
                r: Math.max(0, Math.min(255, rgb.r + step)),
                g: Math.max(0, Math.min(255, rgb.g + step)),
                b: Math.max(0, Math.min(255, rgb.b + step))
            };

            const newColor = ColorUtils.rgbToHex(adjusted.r, adjusted.g, adjusted.b);
            const contrast = this.analyzeContrast(isBackground ? color : newColor, 
                                                isBackground ? newColor : color);

            if (contrast.contrastRatio >= targetRatio) {
                alternatives.push({
                    color: newColor,
                    ratio: contrast.contrastRatio
                });
            }
        }

        return alternatives.sort((a, b) => b.ratio - a.ratio);
    }
}

// Color palette suggestions
class ColorPalette {
    static getAccessiblePalettes() {
        return [
            { name: 'Modern Dark', fg: '#FFFFFF', bg: '#1A1A1A' },
            { name: 'Slate', fg: '#F8FAFC', bg: '#0F172A' },
            { name: 'Forest', fg: '#F0FDF4', bg: '#166534' },
            { name: 'Ocean', fg: '#ECFEFF', bg: '#164E63' },
            { name: 'Classic', fg: '#000000', bg: '#FFFFFF' },
            { name: 'Warm', fg: '#7C2D12', bg: '#FEF3C7' }
        ];
    }

    static getSimilarColors(hex, count = 5) {
        const rgb = ColorUtils.hexToRgb(hex);
        const colors = [];
        const variance = 30;

        for (let i = 0; i < count; i++) {
            const adjusted = {
                r: Math.max(0, Math.min(255, rgb.r + (Math.random() - 0.5) * variance)),
                g: Math.max(0, Math.min(255, rgb.g + (Math.random() - 0.5) * variance)),
                b: Math.max(0, Math.min(255, rgb.b + (Math.random() - 0.5) * variance))
            };
            colors.push(ColorUtils.rgbToHex(adjusted.r, adjusted.g, adjusted.b));
        }

        return colors;
    }
}

// Usage Example:
const analyzer = new ContrastAnalyzer();

// Event handler for color inputs
function handleColorChange(foregroundColor, backgroundColor) {
    try {
        const results = analyzer.analyzeContrast(foregroundColor, backgroundColor);
        
        // Example of getting alternative colors if contrast is too low
        if (results.score === 'Fail') {
            const alternatives = analyzer.suggestAlternatives(foregroundColor);
            console.log('Suggested alternatives:', alternatives);
        }
        
        return results;
    } catch (error) {
        console.error('Invalid color values:', error);
        return null;
    }
}

// Example of getting color palettes
function getAccessibleColorSuggestions() {
    return ColorPalette.getAccessiblePalettes();
}

// Example of getting similar colors
function getSimilarColorSuggestions(baseColor) {
    return ColorPalette.getSimilarColors(baseColor);
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ColorUtils,
        ContrastAnalyzer,
        ColorPalette
    };
}