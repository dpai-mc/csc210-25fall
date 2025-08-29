/**
 * CSC210 Module Shared Utilities
 * Version: 1.0.0
 * 
 * This JavaScript library provides common utilities and functions
 * used across all CSC210 learning modules.
 */

/* ===== PLATFORM COMMUNICATION ===== */
class PlatformCommunication {
    constructor(moduleId) {
        this.moduleId = moduleId;
        this.messageQueue = [];
        this.isInitialized = false;
        
        this.setupMessageListener();
        this.sendModuleLoaded();
    }
    
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            this.handlePlatformMessage(event.data);
        });
    }
    
    handlePlatformMessage(data) {
        switch (data.type) {
            case 'themeUpdate':
                this.handleThemeUpdate(data.theme);
                break;
            case 'pauseModule':
                this.handlePause();
                break;
            case 'resumeModule':
                this.handleResume();
                break;
            case 'resetModule':
                this.handleReset();
                break;
            case 'prerequisiteStatus':
                this.handlePrerequisiteStatus(data);
                break;
        }
    }
    
    sendModuleLoaded() {
        this.sendMessage({
            type: 'moduleLoaded',
            module: this.moduleId,
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });
        this.isInitialized = true;
    }
    
    sendProgress(progress, section = null) {
        this.sendMessage({
            type: 'moduleProgress',
            module: this.moduleId,
            progress: Math.round(progress),
            section: section,
            timestamp: new Date().toISOString()
        });
    }
    
    sendCompletion(completionData = {}) {
        this.sendMessage({
            type: 'moduleComplete',
            module: this.moduleId,
            completionData: {
                timeSpent: completionData.timeSpent || 0,
                quizScore: completionData.quizScore || 0,
                sectionsCompleted: completionData.sectionsCompleted || [],
                ...completionData
            },
            timestamp: new Date().toISOString()
        });
    }
    
    sendError(error, context = {}) {
        this.sendMessage({
            type: 'moduleError',
            module: this.moduleId,
            error: {
                message: error.message || error,
                stack: error.stack,
                context: context
            },
            timestamp: new Date().toISOString()
        });
    }
    
    sendNotification(message, type = 'info') {
        this.sendMessage({
            type: 'notification',
            module: this.moduleId,
            message: message,
            notificationType: type,
            timestamp: new Date().toISOString()
        });
    }
    
    checkPrerequisites(requiredModules = []) {
        this.sendMessage({
            type: 'checkPrerequisites',
            required: requiredModules
        });
    }
    
    sendMessage(data) {
        try {
            window.parent.postMessage(data, '*');
        } catch (error) {
            console.warn('Failed to send message to parent:', error);
            this.messageQueue.push(data);
        }
    }
    
    // Event handlers that modules can override
    handleThemeUpdate(theme) {
        // Override in module if needed
        console.log('Theme updated:', theme);
    }
    
    handlePause() {
        // Override in module to pause animations, timers, etc.
        console.log('Module paused');
    }
    
    handleResume() {
        // Override in module to resume animations, timers, etc.
        console.log('Module resumed');
    }
    
    handleReset() {
        // Override in module to reset all progress
        console.log('Module reset requested');
    }
    
    handlePrerequisiteStatus(data) {
        // Override in module to handle prerequisite validation
        console.log('Prerequisite status:', data);
    }
}

/* ===== PROGRESS TRACKING ===== */
class ProgressTracker {
    constructor(moduleId, sections = []) {
        this.moduleId = moduleId;
        this.sections = sections;
        this.sectionProgress = new Array(sections.length).fill(0);
        this.currentSection = 0;
        this.startTime = Date.now();
        
        this.communication = new PlatformCommunication(moduleId);
    }
    
    updateSectionProgress(sectionIndex, progress) {
        if (sectionIndex >= 0 && sectionIndex < this.sections.length) {
            this.sectionProgress[sectionIndex] = Math.max(0, Math.min(100, progress));
            
            const totalProgress = this.getTotalProgress();
            const sectionName = this.sections[sectionIndex];
            
            this.communication.sendProgress(totalProgress, sectionName);
            this.updateProgressBar(totalProgress);
        }
    }
    
    completeSection(sectionIndex) {
        this.updateSectionProgress(sectionIndex, 100);
        
        // Auto-advance to next section if available
        if (sectionIndex + 1 < this.sections.length) {
            this.currentSection = sectionIndex + 1;
        }
    }
    
    getTotalProgress() {
        const sum = this.sectionProgress.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.sections.length);
    }
    
    getTimeSpent() {
        return Math.round((Date.now() - this.startTime) / 1000);
    }
    
    updateProgressBar(progress) {
        const progressBar = document.getElementById('module-progress');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar) {
            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        if (progressText) {
            progressText.textContent = progress + '%';
        }
    }
    
    markComplete(additionalData = {}) {
        const completionData = {
            timeSpent: this.getTimeSpent(),
            sectionsCompleted: this.sections,
            finalProgress: this.getTotalProgress(),
            ...additionalData
        };
        
        this.communication.sendCompletion(completionData);
    }
}

/* ===== QUIZ SYSTEM ===== */
class QuizManager {
    constructor(quizData, passingScore = 80) {
        this.questions = quizData;
        this.currentQuestion = 0;
        this.answers = {};
        this.passingScore = passingScore;
        this.completed = false;
        
        this.setupQuizInterface();
    }
    
    setupQuizInterface() {
        const container = document.getElementById('quiz-container');
        if (!container) return;
        
        this.renderQuestion();
    }
    
    renderQuestion() {
        const container = document.getElementById('quiz-container');
        const question = this.questions[this.currentQuestion];
        
        container.innerHTML = `
            <div class="quiz-question">
                <div class="quiz-header">
                    <h3>Question ${this.currentQuestion + 1} of ${this.questions.length}</h3>
                    <div class="quiz-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.currentQuestion / this.questions.length) * 100}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="question-content">
                    <h4>${question.question}</h4>
                    
                    <div class="quiz-options" role="radiogroup" aria-labelledby="question-${this.currentQuestion}">
                        ${question.options.map((option, index) => `
                            <div class="quiz-option">
                                <label>
                                    <input type="radio" 
                                           name="question-${this.currentQuestion}" 
                                           value="${index}"
                                           onchange="quizManager.selectAnswer(${index})"
                                           aria-describedby="option-${this.currentQuestion}-${index}">
                                    <span id="option-${this.currentQuestion}-${index}">${option}</span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="quiz-feedback" id="feedback-${this.currentQuestion}"></div>
                </div>
                
                <div class="quiz-actions">
                    <button class="btn btn-secondary" onclick="quizManager.previousQuestion()" 
                            ${this.currentQuestion === 0 ? 'disabled' : ''}>
                        Previous
                    </button>
                    
                    <button class="btn btn-primary" onclick="quizManager.checkAnswer()" 
                            id="check-answer-btn" disabled>
                        Check Answer
                    </button>
                    
                    <button class="btn btn-primary" onclick="quizManager.nextQuestion()" 
                            id="next-question-btn" style="display: none;">
                        ${this.currentQuestion === this.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </button>
                </div>
            </div>
        `;
    }
    
    selectAnswer(answerIndex) {
        this.answers[this.currentQuestion] = answerIndex;
        document.getElementById('check-answer-btn').disabled = false;
    }
    
    checkAnswer() {
        const question = this.questions[this.currentQuestion];
        const userAnswer = this.answers[this.currentQuestion];
        const isCorrect = userAnswer === question.correct;
        
        const feedback = document.getElementById(`feedback-${this.currentQuestion}`);
        feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.style.display = 'block';
        feedback.innerHTML = `
            <strong>${isCorrect ? 'Correct!' : 'Incorrect.'}</strong>
            <p>${question.explanation || (isCorrect ? 'Well done!' : 'Please review the material and try again.')}</p>
        `;
        
        // Disable answer options and show next button
        const options = document.querySelectorAll(`input[name="question-${this.currentQuestion}"]`);
        options.forEach(option => option.disabled = true);
        
        document.getElementById('check-answer-btn').style.display = 'none';
        document.getElementById('next-question-btn').style.display = 'inline-block';
        
        // Announce result for screen readers
        this.announceToScreenReader(isCorrect ? 'Correct answer' : 'Incorrect answer');
    }
    
    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.renderQuestion();
        } else {
            this.completeQuiz();
        }
    }
    
    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.renderQuestion();
        }
    }
    
    completeQuiz() {
        const score = this.calculateScore();
        const passed = score >= this.passingScore;
        
        this.completed = true;
        this.displayResults(score, passed);
        
        return { score, passed };
    }
    
    calculateScore() {
        const correctAnswers = this.questions.reduce((count, question, index) => {
            return count + (this.answers[index] === question.correct ? 1 : 0);
        }, 0);
        
        return Math.round((correctAnswers / this.questions.length) * 100);
    }
    
    displayResults(score, passed) {
        const container = document.getElementById('quiz-container');
        
        container.innerHTML = `
            <div class="quiz-results">
                <div class="results-header">
                    <h3>Quiz Complete!</h3>
                    <div class="score-display ${passed ? 'passed' : 'failed'}">
                        <div class="score-circle">
                            <span class="score-number">${score}%</span>
                        </div>
                        <p class="score-status">
                            ${passed ? `Congratulations! You passed with ${score}%.` : `You scored ${score}%. You need ${this.passingScore}% to pass.`}
                        </p>
                    </div>
                </div>
                
                <div class="results-breakdown">
                    <h4>Question Breakdown:</h4>
                    <div class="question-summary">
                        ${this.questions.map((question, index) => {
                            const isCorrect = this.answers[index] === question.correct;
                            return `
                                <div class="question-item ${isCorrect ? 'correct' : 'incorrect'}">
                                    <span class="question-number">Q${index + 1}</span>
                                    <span class="question-status">${isCorrect ? '✓' : '✗'}</span>
                                    <span class="question-text">${question.question.substring(0, 50)}...</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="results-actions">
                    ${!passed ? `
                        <button class="btn btn-primary" onclick="quizManager.retakeQuiz()">
                            Retake Quiz
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="quizManager.reviewAnswers()">
                        Review Answers
                    </button>
                </div>
            </div>
        `;
        
        // Announce completion for screen readers
        this.announceToScreenReader(`Quiz completed. Score: ${score} percent. ${passed ? 'Passed' : 'Failed'}.`);
    }
    
    retakeQuiz() {
        this.currentQuestion = 0;
        this.answers = {};
        this.completed = false;
        this.renderQuestion();
    }
    
    reviewAnswers() {
        // Implementation for reviewing answers
        console.log('Review answers functionality');
    }
    
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
}

/* ===== ERROR HANDLING ===== */
class ErrorHandler {
    constructor(moduleId) {
        this.moduleId = moduleId;
        this.errors = [];
        this.setupGlobalErrorHandling();
    }
    
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError(event.error, {
                filename: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'unhandled_promise_rejection'
            });
        });
    }
    
    handleError(error, context = {}) {
        const errorInfo = {
            message: error.message || error,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            moduleId: this.moduleId
        };
        
        this.errors.push(errorInfo);
        
        // Log to console for debugging
        console.error('Module Error:', errorInfo);
        
        // Send to platform if it's a critical error
        if (this.isCriticalError(error)) {
            const communication = new PlatformCommunication(this.moduleId);
            communication.sendError(error, context);
        }
        
        // Show user-friendly error message
        this.showUserError(error, context);
    }
    
    isCriticalError(error) {
        const criticalKeywords = [
            'simulator',
            'calculation',
            'postMessage',
            'undefined is not a function',
            'cannot read property',
            'network error'
        ];
        
        const errorMessage = (error.message || error).toLowerCase();
        return criticalKeywords.some(keyword => errorMessage.includes(keyword));
    }
    
    showUserError(error, context = {}) {
        const errorContainer = document.getElementById('error-container') || this.createErrorContainer();
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-notification';
        errorElement.innerHTML = `
            <div class="error-content">
                <strong>⚠️ Something went wrong</strong>
                <p>We encountered an issue with the simulator. Please try refreshing the page.</p>
                <button class="btn btn-small btn-secondary" onclick="this.parentElement.parentElement.remove()">
                    Dismiss
                </button>
            </div>
        `;
        
        errorContainer.appendChild(errorElement);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorElement.parentElement) {
                errorElement.remove();
            }
        }, 10000);
    }
    
    createErrorContainer() {
        const container = document.createElement('div');
        container.id = 'error-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
        `;
        
        document.body.appendChild(container);
        return container;
    }
    
    getErrors() {
        return this.errors;
    }
    
    clearErrors() {
        this.errors = [];
    }
}

/* ===== UTILITY FUNCTIONS ===== */
const Utils = {
    // Debounce function for performance optimization
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    // Throttle function for performance optimization
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Binary conversion utilities
    binary: {
        toBinary(decimal, bits = 4) {
            return decimal.toString(2).padStart(bits, '0');
        },
        
        toDecimal(binary) {
            return parseInt(binary, 2);
        },
        
        toHex(decimal) {
            return decimal.toString(16).toUpperCase().padStart(2, '0');
        }
    },
    
    // Boolean algebra utilities
    boolean: {
        and(a, b) {
            return a && b;
        },
        
        or(a, b) {
            return a || b;
        },
        
        not(a) {
            return !a;
        },
        
        xor(a, b) {
            return a !== b;
        },
        
        nand(a, b) {
            return !(a && b);
        },
        
        nor(a, b) {
            return !(a || b);
        }
    },
    
    // Animation utilities
    animation: {
        easeInOut(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        },
        
        animate(element, properties, duration = 300, easing = this.easeInOut) {
            const startTime = performance.now();
            const startValues = {};
            
            // Get initial values
            Object.keys(properties).forEach(prop => {
                const computedStyle = window.getComputedStyle(element);
                startValues[prop] = parseFloat(computedStyle[prop]) || 0;
            });
            
            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easing(progress);
                
                Object.keys(properties).forEach(prop => {
                    const startValue = startValues[prop];
                    const endValue = properties[prop];
                    const currentValue = startValue + (endValue - startValue) * easedProgress;
                    
                    element.style[prop] = currentValue + (prop.includes('opacity') ? '' : 'px');
                });
                
                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            }
            
            requestAnimationFrame(step);
        }
    },
    
    // Local storage utilities (fallback for platforms that don't support it)
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('Local storage not available, using memory storage');
                this._memoryStorage = this._memoryStorage || {};
                this._memoryStorage[key] = value;
                return false;
            }
        },
        
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                return this._memoryStorage ? this._memoryStorage[key] : null;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                if (this._memoryStorage) {
                    delete this._memoryStorage[key];
                }
            }
        }
    },
    
    // Accessibility utilities
    accessibility: {
        announceToScreenReader(message) {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            
            document.body.appendChild(announcement);
            
            setTimeout(() => {
                if (announcement.parentElement) {
                    document.body.removeChild(announcement);
                }
            }, 1000);
        },
        
        manageFocus(element) {
            if (element) {
                element.focus();
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },
        
        trapFocus(container) {
            const focusableElements = container.querySelectorAll(
                'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
            );
            
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            container.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusable) {
                            lastFocusable.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastFocusable) {
                            firstFocusable.focus();
                            e.preventDefault();
                        }
                    }
                }
            });
        }
    },
    
    // Performance utilities
    performance: {
        measureFunction(func, name = 'Function') {
            return function(...args) {
                const start = performance.now();
                const result = func.apply(this, args);
                const end = performance.now();
                console.log(`${name} took ${end - start} milliseconds.`);
                return result;
            };
        },
        
        fps: {
            counter: 0,
            lastTime: 0,
            
            start() {
                this.lastTime = performance.now();
                this.counter = 0;
                this.measure();
            },
            
            measure() {
                this.counter++;
                const currentTime = performance.now();
                
                if (currentTime - this.lastTime >= 1000) {
                    console.log(`FPS: ${this.counter}`);
                    this.counter = 0;
                    this.lastTime = currentTime;
                }
                
                requestAnimationFrame(() => this.measure());
            }
        }
    }
};

/* ===== VALIDATION UTILITIES ===== */
class Validator {
    static validateBinaryInput(input, bits = 4) {
        const binaryPattern = new RegExp(`^[01]{1,${bits}});
        return binaryPattern.test(input);
    }
    
    static validateDecimalInput(input, max = 15) {
        const num = parseInt(input);
        return !isNaN(num) && num >= 0 && num <= max;
    }
    
    static validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }
    
    static sanitizeInput(input) {
        return input.replace(/[<>&"']/g, (match) => {
            const entities = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return entities[match];
        });
    }
}

/* ===== EXPORT FOR MODULE USAGE ===== */
// Make utilities available globally for module usage
window.ModuleUtils = {
    PlatformCommunication,
    ProgressTracker,
    QuizManager,
    ErrorHandler,
    Utils,
    Validator
};

// Initialize error handling for all modules
window.addEventListener('DOMContentLoaded', () => {
    // Auto-initialize error handling if moduleId is defined
    if (typeof window.MODULE_ID !== 'undefined') {
        window.errorHandler = new ErrorHandler(window.MODULE_ID);
    }
});

// Export for ES6 modules if supported
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ModuleUtils;
}
