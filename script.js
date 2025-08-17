class Translator {
    constructor() {
        this.apiKey = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadApiKey();
    }

    bindEvents() {
        const translateBtn = document.getElementById('translate-btn');
        const inputText = document.getElementById('input-text');
        const languageRadios = document.querySelectorAll('input[name="target-language"]');

        translateBtn.addEventListener('click', () => this.handleTranslate());
        inputText.addEventListener('input', () => this.handleInputChange());
        
        languageRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateTargetLanguage());
        });

        // Enter key support
        inputText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.handleTranslate();
            }
        });
    }

    loadApiKey() {
        // Check if API key is stored in localStorage
        const storedKey = localStorage.getItem('openai_api_key');
        if (storedKey) {
            this.apiKey = storedKey;
            return;
        }

        // Prompt user for API key if not stored
        this.promptForApiKey();
    }

    promptForApiKey() {
        const apiKey = prompt('Please enter your OpenAI API key:');
        if (apiKey && apiKey.trim()) {
            this.apiKey = apiKey.trim();
            localStorage.setItem('openai_api_key', this.apiKey);
        } else {
            this.showError('API key is required to use the translator.');
        }
    }

    async handleTranslate() {
        const inputText = document.getElementById('input-text').value.trim();
        const targetLanguage = document.querySelector('input[name="target-language"]:checked').value;

        if (!inputText) {
            this.showError('Please enter some text to translate.');
            return;
        }

        if (!this.apiKey) {
            this.promptForApiKey();
            if (!this.apiKey) return;
        }

        this.setLoadingState(true);
        this.hideOutput();
        this.clearErrors();

        try {
            const translation = await this.translateText(inputText, targetLanguage);
            this.displayTranslation(translation, targetLanguage);
        } catch (error) {
            console.error('Translation error:', error);
            this.showError(error.message || 'Translation failed. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    async translateText(text, targetLanguage) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Translate the given text to ${targetLanguage}. 
                        Only return the translated text, nothing else. Maintain the original formatting and tone.`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your OpenAI API key.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            } else {
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    displayTranslation(translation, targetLanguage) {
        const outputSection = document.getElementById('output-section');
        const translationResult = document.getElementById('translation-result');
        const targetLangSpan = document.getElementById('target-lang');

        translationResult.textContent = translation;
        targetLangSpan.textContent = targetLanguage;
        
        outputSection.style.display = 'block';
        
        // Smooth scroll to output
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    setLoadingState(isLoading) {
        const translateBtn = document.getElementById('translate-btn');
        const inputText = document.getElementById('input-text');

        if (isLoading) {
            translateBtn.classList.add('translating');
            translateBtn.disabled = true;
            inputText.disabled = true;
        } else {
            translateBtn.classList.remove('translating');
            translateBtn.disabled = false;
            inputText.disabled = false;
        }
    }

    hideOutput() {
        document.getElementById('output-section').style.display = 'none';
    }

    clearErrors() {
        const inputText = document.getElementById('input-text');
        inputText.classList.remove('error');
        
        // Remove existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    showError(message) {
        const inputText = document.getElementById('input-text');
        inputText.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        inputText.parentNode.appendChild(errorDiv);
    }

    handleInputChange() {
        const inputText = document.getElementById('input-text');
        inputText.classList.remove('error');
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    updateTargetLanguage() {
        const targetLangSpan = document.getElementById('target-lang');
        const selectedLanguage = document.querySelector('input[name="target-language"]:checked').value;
        targetLangSpan.textContent = selectedLanguage;
    }
}

// Initialize the translator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Translator();
});

// Add some helpful features
document.addEventListener('DOMContentLoaded', () => {
    // Auto-resize textarea
    const textarea = document.getElementById('input-text');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    // Add character count
    const charCount = document.createElement('div');
    charCount.style.cssText = 'text-align: right; font-size: 12px; color: #666; margin-top: 5px;';
    textarea.parentNode.appendChild(charCount);

    textarea.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = `${count} characters`;
    });
});
