// Real AI Video Analysis Core with Hugging Face Integration
class RealVideoAnalyzer {
    constructor() {
        this.hfToken = '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'; // Your token
        this.models = {
            clip: 'openai/clip-vit-base-patch32',
            image: 'google/vit-base-patch16-224',
            object: 'facebook/detr-resnet-50'
        };
    }

    async analyzeVideoFrames(videoElement, frameCount = 6) {
        console.log('🔍 Starting real video analysis with Hugging Face...');
        
        try {
            const frames = await this.extractFrames(videoElement, frameCount);
            console.log(`📸 Extracted ${frames.length} frames`);
            
            const analysis = await this.analyzeFrames(frames);
            console.log('✅ Analysis completed');
            
            return this.generatePromptFromAnalysis(analysis);
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            throw error;
        }
    }

    async extractFrames(videoElement, frameCount) {
        return new Promise((resolve, reject) => {
            const frames = [];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            videoElement.addEventListener('loadeddata', async () => {
                try {
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;
                    
                    const interval = Math.max(1, videoElement.duration / frameCount);
                    
                    for (let i = 0; i < frameCount; i++) {
                        videoElement.currentTime = i * interval;
                        
                        await new Promise(r => {
                            videoElement.addEventListener('seeked', r, { once: true });
                        });
                        
                        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                        const imageData = canvas.toDataURL('image/jpeg');
                        frames.push(imageData);
                        
                        console.log(`📷 Captured frame ${i + 1}/${frameCount}`);
                    }
                    
                    resolve(frames);
                } catch (error) {
                    reject(error);
                }
            });
            
            videoElement.addEventListener('error', () => {
                reject(new Error('Failed to load video'));
            });
            
            // Trigger load
            videoElement.load();
        });
    }

    async analyzeFrames(frames) {
        console.log('🤖 Sending frames to AI analysis...');
        const analyses = [];
        
        for (let i = 0; i < frames.length; i++) {
            console.log(`🔬 Analyzing frame ${i + 1}/${frames.length}`);
            const analysis = await this.analyzeSingleFrame(frames[i]);
            analyses.push(analysis);
        }
        
        return this.consolidateAnalyses(analyses);
    }

    async analyzeSingleFrame(imageData) {
        // Try Hugging Face first, fallback to computer vision
        try {
            return await this.analyzeWithHuggingFace(imageData);
        } catch (hfError) {
            console.log('🔄 Hugging Face failed, using computer vision fallback');
            return await this.analyzeWithComputerVision(imageData);
        }
    }

    async analyzeWithHuggingFace(imageData) {
        console.log('🚀 Using Hugging Face AI...');
        
        // Convert base64 to blob
        const response = await fetch(imageData);
        const blob = await response.blob();
        
        try {
            // Try CLIP model first for better understanding
            const clipResult = await fetch(
                "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
                {
                    headers: { 
                        "Authorization": `Bearer ${this.hfToken}`,
                        "Content-Type": "application/octet-stream"
                    },
                    method: "POST",
                    body: blob,
                }
            );
            
            if (!clipResult.ok) {
                throw new Error(`HTTP error! status: ${clipResult.status}`);
            }
            
            const result = await clipResult.json();
            console.log('🤖 Hugging Face response:', result);
            
            return this.interpretHuggingFaceResult(result);
            
        } catch (error) {
            console.error('❌ Hugging Face API error:', error);
            throw error;
        }
    }

    interpretHuggingFaceResult(result) {
        // Process Hugging Face response
        if (result && result.length > 0) {
            const labels = result.slice(0, 5).map(item => item.label);
            const scores = result.slice(0, 5).map(item => item.score);
            
            const confidence = Math.max(...scores) * 100;
            
            return {
                styles: this.extractStylesFromLabels(labels),
                elements: this.extractElementsFromLabels(labels),
                confidence: confidence,
                rawLabels: labels
            };
        }
        
        // Fallback if no good results
        return {
            styles: ['professional', 'digital'],
            elements: ['well-composed', 'detailed'],
            confidence: 70,
            rawLabels: []
        };
    }

    extractStylesFromLabels(labels) {
        const styleKeywords = [
            'cinematic', 'photorealistic', 'animation', '3d', 'digital', 
            'painting', 'art', 'graphic', 'minimalist', 'vibrant',
            'dark', 'bright', 'colorful', 'monochrome', 'professional'
        ];
        
        return labels
            .filter(label => styleKeywords.some(keyword => 
                label.toLowerCase().includes(keyword)
            ))
            .slice(0, 3);
    }

    extractElementsFromLabels(labels) {
        const elementKeywords = [
            'person', 'people', 'human', 'face', 'building', 'city',
            'nature', 'landscape', 'animal', 'car', 'object', 'text',
            'light', 'shadow', 'water', 'sky', 'tree', 'mountain'
        ];
        
        return labels
            .filter(label => elementKeywords.some(keyword => 
                label.toLowerCase().includes(keyword)
            ))
            .slice(0, 4);
    }

    async analyzeWithComputerVision(imageData) {
        console.log('🔍 Using computer vision analysis...');
        
        const blob = await fetch(imageData).then(r => r.blob());
        const features = await this.extractVisualFeatures(blob);
        return this.interpretFeatures(features);
    }

    extractVisualFeatures(imageBlob) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const features = {
                    colors: this.analyzeColors(imageData),
                    composition: this.analyzeComposition(imageData),
                    edges: this.analyzeEdges(imageData),
                    brightness: this.calculateBrightness(imageData)
                };
                
                resolve(features);
            };
            img.src = URL.createObjectURL(imageBlob);
        });
    }

    analyzeColors(imageData) {
        const data = imageData.data;
        let r = 0, g = 0, b = 0;
        let saturation = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            
            const max = Math.max(data[i], data[i+1], data[i+2]);
            const min = Math.min(data[i], data[i+1], data[i+2]);
            saturation += (max - min) / max || 0;
        }
        
        const total = data.length / 4;
        const avgR = Math.round(r/total);
        const avgG = Math.round(g/total);
        const avgB = Math.round(b/total);
        const avgSaturation = saturation / total;
        
        return {
            dominant: `rgb(${avgR}, ${avgG}, ${avgB})`,
            brightness: (r + g + b) / (3 * total),
            saturation: avgSaturation,
            temperature: this.getColorTemperature(avgR, avgG, avgB)
        };
    }

    getColorTemperature(r, g, b) {
        // Simple color temperature detection
        if (r > g + 30 && r > b + 30) return 'warm';
        if (b > r + 30 && b > g + 30) return 'cool';
        return 'neutral';
    }

    analyzeComposition(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        
        // Rule of thirds analysis
        const horizontalThirds = [
            this.getRegionBrightness(imageData, 0, width/3, 0, height), // Left
            this.getRegionBrightness(imageData, width/3, 2*width/3, 0, height), // Center
            this.getRegionBrightness(imageData, 2*width/3, width, 0, height) // Right
        ];
        
        const verticalThirds = [
            this.getRegionBrightness(imageData, 0, width, 0, height/3), // Top
            this.getRegionBrightness(imageData, 0, width, height/3, 2*height/3), // Middle
            this.getRegionBrightness(imageData, 0, width, 2*height/3, height) // Bottom
        ];
        
        return {
            ruleOfThirds: this.evaluateComposition(horizontalThirds, verticalThirds),
            symmetry: this.calculateSymmetry(imageData),
            focus: this.detectFocusArea(imageData)
        };
    }

    analyzeEdges(imageData) {
        const data = imageData.data;
        let edgeCount = 0;
        
        for (let i = 0; i < data.length - 4; i += 4) {
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
            const nextBrightness = (data[i+4] + data[i+5] + data[i+6]) / 3;
            
            if (Math.abs(brightness - nextBrightness) > 25) {
                edgeCount++;
            }
        }
        
        const edgeDensity = edgeCount / (imageData.width * imageData.height);
        
        return {
            edgeDensity: edgeDensity,
            complexity: edgeDensity > 0.1 ? 'high' : edgeDensity > 0.05 ? 'medium' : 'low'
        };
    }

    calculateBrightness(imageData) {
        const data = imageData.data;
        let total = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            total += (data[i] + data[i+1] + data[i+2]) / 3;
        }
        
        return total / (data.length / 4);
    }

    interpretFeatures(features) {
        const styles = [];
        const elements = [];
        
        // Determine style from visual features
        if (features.colors.brightness > 180) styles.push('bright', 'vibrant');
        if (features.colors.brightness < 100) styles.push('moody', 'dramatic');
        if (features.colors.saturation > 0.6) styles.push('colorful', 'saturated');
        if (features.colors.saturation < 0.3) styles.push('muted', 'desaturated');
        if (features.colors.temperature === 'warm') styles.push('warm tones');
        if (features.colors.temperature === 'cool') styles.push('cool tones');
        
        // Determine elements from composition
        if (features.composition.ruleOfThirds === 'balanced') elements.push('professional composition');
        if (features.composition.symmetry > 0.8) elements.push('symmetrical');
        if (features.edges.complexity === 'high') elements.push('detailed', 'complex');
        if (features.edges.complexity === 'low') elements.push('minimalist', 'clean');
        if (features.composition.focus === 'centered') elements.push('centered subject');
        
        return {
            styles: [...new Set(styles)],
            elements: [...new Set(elements)],
            confidence: Math.min(70 + features.edges.edgeDensity * 100, 90),
            technical: features
        };
    }

    generatePromptFromAnalysis(analysis) {
        const style = analysis.styles.join(', ') || 'professional';
        const elements = analysis.elements.join(', ') || 'well-composed';
        const confidence = Math.round(analysis.confidence);
        
        const basePrompt = `A ${style} video featuring ${elements}, professional quality, high detail`;
        
        // Add specific details based on analysis
        let detailedPrompt = basePrompt;
        
        if (analysis.styles.includes('cinematic') || analysis.styles.includes('dramatic')) {
            detailedPrompt += ', cinematic lighting, dramatic atmosphere';
        }
        
        if (analysis.styles.includes('bright') || analysis.styles.includes('vibrant')) {
            detailedPrompt += ', vibrant colors, well-lit';
        }
        
        if (analysis.technical?.colors?.saturation > 0.6) {
            detailedPrompt += ', highly saturated colors';
        }
        
        detailedPrompt += ', trending on ArtStation, masterpiece, 8K resolution';
        
        return {
            prompt: detailedPrompt,
            details: {
                detectedStyles: analysis.styles.length > 0 ? analysis.styles : ['professional', 'high-quality'],
                visualElements: analysis.elements.length > 0 ? analysis.elements : ['well-composed', 'detailed'],
                confidence: confidence,
                technicalAnalysis: analysis.technical,
                aiModel: analysis.rawLabels ? 'Hugging Face CLIP + Computer Vision' : 'Computer Vision Analysis',
                processingMethod: 'Frame-by-frame AI analysis',
                rawAnalysis: analysis.rawLabels || []
            }
        };
    }

    // Helper methods (same as before)
    getRegionBrightness(imageData, x1, x2, y1, y2) {
        const data = imageData.data;
        let total = 0, count = 0;
        
        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                const idx = (y * imageData.width + x) * 4;
                total += (data[idx] + data[idx+1] + data[idx+2]) / 3;
                count++;
            }
        }
        
        return total / count;
    }

    evaluateComposition(horizontal, vertical) {
        const hVariation = Math.max(...horizontal) - Math.min(...horizontal);
        const vVariation = Math.max(...vertical) - Math.min(...vertical);
        return (hVariation < 40 && vVariation < 40) ? 'balanced' : 'dynamic';
    }

    calculateSymmetry(imageData) {
        const width = imageData.width;
        const half = Math.floor(width / 2);
        let symmetry = 0;
        
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < half; x++) {
                const leftIdx = (y * width + x) * 4;
                const rightIdx = (y * width + (width - 1 - x)) * 4;
                
                const leftBright = (imageData.data[leftIdx] + imageData.data[leftIdx+1] + imageData.data[leftIdx+2]) / 3;
                const rightBright = (imageData.data[rightIdx] + imageData.data[rightIdx+1] + imageData.data[rightIdx+2]) / 3;
                
                symmetry += 1 - Math.abs(leftBright - rightBright) / 255;
            }
        }
        
        return symmetry / (half * imageData.height);
    }

    detectFocusArea(imageData) {
        const centerX = imageData.width / 2;
        const centerY = imageData.height / 2;
        const centerSize = Math.min(imageData.width, imageData.height) / 4;
        
        const centerEdges = this.countEdgesInRegion(imageData, centerX - centerSize/2, centerX + centerSize/2, centerY - centerSize/2, centerY + centerSize/2);
        const totalEdges = this.countEdgesInRegion(imageData, 0, imageData.width, 0, imageData.height);
        
        return centerEdges / totalEdges > 0.3 ? 'centered' : 'distributed';
    }

    countEdgesInRegion(imageData, x1, x2, y1, y2) {
        let edges = 0;
        const data = imageData.data;
        
        for (let y = Math.max(0, y1); y < Math.min(imageData.height, y2); y++) {
            for (let x = Math.max(0, x1); x < Math.min(imageData.width, x2); x++) {
                const idx = (y * imageData.width + x) * 4;
                if (x < imageData.width - 1) {
                    const nextIdx = (y * imageData.width + (x + 1)) * 4;
                    const brightness = (data[idx] + data[idx+1] + data[idx+2]) / 3;
                    const nextBrightness = (data[nextIdx] + data[nextIdx+1] + data[nextIdx+2]) / 3;
                    
                    if (Math.abs(brightness - nextBrightness) > 25) edges++;
                }
            }
        }
        
        return edges;
    }

    consolidateAnalyses(analyses) {
        const consolidated = {
            styles: [],
            elements: [],
            confidence: 0,
            technical: analyses[0]?.technical || {},
            rawLabels: []
        };
        
        analyses.forEach(analysis => {
            consolidated.styles.push(...analysis.styles);
            consolidated.elements.push(...analysis.elements);
            consolidated.confidence += analysis.confidence;
            if (analysis.rawLabels) {
                consolidated.rawLabels.push(...analysis.rawLabels);
            }
        });
        
        consolidated.styles = [...new Set(consolidated.styles)];
        consolidated.elements = [...new Set(consolidated.elements)];
        consolidated.rawLabels = [...new Set(consolidated.rawLabels)];
        consolidated.confidence = consolidated.confidence / analyses.length;
        
        return consolidated;
    }
}