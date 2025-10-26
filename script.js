class NinjaPromptAI {
    constructor() {
        this.analyzer = new RealVideoAnalyzer();
        this.initEventListeners();
        console.log('🚀 Ninja Prompt AI with Real Video Analysis Started');
    }

    initEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.getAttribute('data-tab'));
            });
        });

        // URL Analysis
        document.getElementById('analyze-url').addEventListener('click', () => {
            this.analyzeURL();
        });

        // File Upload
        this.setupFileUpload();

        // Copy Button
        document.getElementById('copy-prompt').addEventListener('click', () => {
            this.copyToClipboard();
        });

        // Enter key in URL field
        document.getElementById('video-url').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.analyzeURL();
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        const analyzeBtn = document.getElementById('analyze-upload');

        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = '#e8f4fc';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.background = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
            if (e.dataTransfer.files[0]) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        analyzeBtn.addEventListener('click', () => {
            this.analyzeUpload();
        });
    }

    handleFileSelect(file) {
        if (!file.type.startsWith('video/')) {
            alert('Please select a video file (MP4, MOV, AVI, WebM)');
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            alert('File size must be less than 100MB');
            return;
        }

        this.uploadedFile = file;
        const analyzeBtn = document.getElementById('analyze-upload');
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = `Analyze: ${file.name}`;

        // Show preview
        const videoPreview = document.getElementById('video-preview');
        videoPreview.src = URL.createObjectURL(file);
        videoPreview.style.display = 'block';
    }

    async analyzeURL() {
        const url = document.getElementById('video-url').value.trim();
        
        if (!url) {
            alert('Please enter a video URL');
            return;
        }

        this.showLoading('Downloading and analyzing video...');
        
        try {
            // For URL analysis, we'll use a hybrid approach
            const videoBlob = await this.downloadVideo(url);
            const analysis = await this.analyzeVideoBlob(videoBlob, url);
            this.displayResults(analysis);
        } catch (error) {
            console.error('URL analysis error:', error);
            this.showError(`Analysis failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async analyzeUpload() {
        if (!this.uploadedFile) {
            alert('Please upload a video file first');
            return;
        }

        this.showLoading('Analyzing video frames...');
        
        try {
            const videoPreview = document.getElementById('video-preview');
            const analysis = await this.analyzer.analyzeVideoFrames(videoPreview, 8);
            this.displayResults(analysis);
        } catch (error) {
            console.error('Upload analysis error:', error);
            this.showError(`Analysis failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async downloadVideo(url) {
        // Simple video download (works for direct video links)
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to download video');
        return await response.blob();
    }

    async analyzeVideoBlob(blob, source) {
        // Create temporary video element for analysis
        const videoUrl = URL.createObjectURL(blob);
        const video = document.createElement('video');
        video.src = videoUrl;
        
        return new Promise((resolve, reject) => {
            video.addEventListener('loadeddata', async () => {
                try {
                    const analysis = await this.analyzer.analyzeVideoFrames(video, 6);
                    analysis.details.source = source;
                    resolve(analysis);
                } catch (error) {
                    reject(error);
                } finally {
                    URL.revokeObjectURL(videoUrl);
                }
            });
            
            video.addEventListener('error', () => {
                reject(new Error('Failed to load video for analysis'));
            });
        });
    }

    displayResults(data) {
        document.getElementById('prompt-output').value = data.prompt;
        
        const details = data.details;
        document.getElementById('analysis-details').innerHTML = `
            <div class="detail-item"><strong>🤖 AI Model:</strong> ${details.aiModel}</div>
            <div class="detail-item"><strong>🎬 Detected Styles:</strong> ${details.detectedStyles?.join(', ') || 'Professional'}</div>
            <div class="detail-item"><strong>📊 Visual Elements:</strong> ${details.visualElements?.join(', ') || 'Well-composed'}</div>
            <div class="detail-item"><strong>✅ Confidence:</strong> ${Math.round(details.confidence)}%</div>
            <div class="detail-item"><strong>🔧 Processing Method:</strong> ${details.processingMethod}</div>
            <div class="detail-item"><strong>🎨 Color Analysis:</strong> ${details.technicalAnalysis?.colors?.dominant ? 'Custom palette detected' : 'Professional grading'}</div>
            <div class="detail-item"><strong>📐 Composition:</strong> ${details.technicalAnalysis?.composition?.ruleOfThirds || 'Balanced'}</div>
            <div class="detail-item"><strong>⚡ Complexity:</strong> ${details.technicalAnalysis?.edges?.complexity || 'Medium'}</div>
        `;
        
        document.getElementById('results-section').style.display = 'block';
        this.hideLoading();
        
        document.getElementById('results-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    showLoading(message) {
        const loading = document.getElementById('loading');
        loading.querySelector('p').textContent = message;
        loading.style.display = 'block';
        document.getElementById('results-section').style.display = 'none';
        
        // Show progress for real analysis
        this.showProgress();
    }

    showProgress() {
        const loading = document.getElementById('loading');
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            loading.querySelector('p').textContent = `Analyzing video frames... ${progress}%`;
            
            if (progress >= 95) {
                clearInterval(progressInterval);
            }
        }, 500);
        
        this.progressInterval = progressInterval;
    }

    hideLoading() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        document.getElementById('loading').style.display = 'none';
    }

    showError(message) {
        alert(`❌ Error: ${message}`);
    }

    async copyToClipboard() {
        const textarea = document.getElementById('prompt-output');
        
        try {
            await navigator.clipboard.writeText(textarea.value);
            this.showCopyFeedback();
        } catch (err) {
            textarea.select();
            document.execCommand('copy');
            this.showCopyFeedback();
        }
    }

    showCopyFeedback() {
        const btn = document.getElementById('copy-prompt');
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = 'Copy Prompt', 2000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new NinjaPromptAI();
});