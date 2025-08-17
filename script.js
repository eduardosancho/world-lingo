class Translator {
    constructor() {
        this.apiKey = '';
        this.model = 'gpt-4';
        this.maxTokens = 1000;
        this.temperature = 1.2;
        this.init();
    }

    init() {
        this.checkSetupStatus();
        this.populateNavbarLanguage();
        this.bindEvents();
    }

    checkSetupStatus() {
        // Check if we have stored configuration
        const storedConfig = localStorage.getItem('pollyglot_config');
        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                this.apiKey = config.apiKey;
                this.model = config.model;
                this.maxTokens = config.maxTokens;
                this.temperature = config.temperature;
                this.navigateToSection('translate');
            } catch (e) {
                localStorage.removeItem('pollyglot_config');
                this.navigateToSection('setup');
            }
        } else {
            this.navigateToSection('setup');
        }
    }

    navigateToSection(sectionName) {
        // Hide all sections
        const sections = ['setup-section', 'translate-section', 'chat-section'];
        sections.forEach(section => {
            document.getElementById(section).style.display = 'none';
        });

        // Show selected section
        document.getElementById(`${sectionName}-section`).style.display = 'block';

        // Update navigation buttons
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-section') === sectionName) {
                btn.classList.add('active');
            }
        });

        // Language selection is now handled globally in the navbar
    }

    populateLanguages(sectionName = 'translate') {
        const containerId = sectionName === 'chat' ? 'chat-language-options' : 'language-options';
        const languageContainer = document.getElementById(containerId);
        if (!languageContainer) return;
        
        languageContainer.innerHTML = '';
        
        CONFIG.LANGUAGES.forEach((lang, index) => {
            const label = document.createElement('label');
            label.className = 'radio-option';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = sectionName === 'chat' ? 'chat-target-language' : 'target-language';
            radio.value = lang.value;
            if (index === 0) radio.checked = true;
            
            const text = document.createTextNode(` ${lang.flag} ${lang.label}`);
            
            label.appendChild(radio);
            label.appendChild(text);
            languageContainer.appendChild(label);
        });
    }

    populateNavbarLanguage() {
        const languageDropdown = document.getElementById('navbar-language');
        if (!languageDropdown) return;
        
        languageDropdown.innerHTML = '';
        
        CONFIG.LANGUAGES.forEach((lang, index) => {
            const option = document.createElement('option');
            option.value = lang.value;
            option.textContent = `${lang.flag} ${lang.label}`;
            if (index === 0) option.selected = true;
            languageDropdown.appendChild(option);
        });
    }

    bindEvents() {
        // Setup screen events
        const setupCompleteBtn = document.getElementById('setup-complete-btn');
        const tempSlider = document.getElementById('temperature');
        const tempValue = document.getElementById('temp-value');

        setupCompleteBtn.addEventListener('click', () => this.completeSetup());
        tempSlider.addEventListener('input', (e) => {
            tempValue.textContent = e.target.value;
        });

        // Navigation events
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });

        // Language selection event
        const languageDropdown = document.getElementById('navbar-language');
        if (languageDropdown) {
            languageDropdown.addEventListener('change', () => {
                this.updateTargetLanguage();
            });
        }

        // Translator events
        const translateBtn = document.getElementById('translate-btn');
        const inputText = document.getElementById('input-text');

        translateBtn.addEventListener('click', () => this.handleTranslate());
        inputText.addEventListener('input', () => this.handleInputChange());

        // Chat events
        const chatSendBtn = document.getElementById('chat-send-btn');
        const chatInput = document.getElementById('chat-input');

        chatSendBtn.addEventListener('click', () => this.handleChatSend());
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleChatSend();
            }
        });

        // Enter key support for translate
        inputText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.handleTranslate();
            }
        });
    }

    // Configuration is now handled in the setup screen

    // Mode switching is now handled by the navbar navigation

    async handleChatSend() {
        const chatInput = document.getElementById('chat-input');
        const chatSendBtn = document.getElementById('chat-send-btn');
        const message = chatInput.value.trim();

        if (!message) return;

        const targetLanguage = document.getElementById('navbar-language').value;
        
        // Add user message to chat
        this.addChatMessage('user', message);
        
        // Clear input and disable send button
        chatInput.value = '';
        this.setChatLoading(true);

        try {
            // Get AI response
            const response = await this.getChatResponse(message, targetLanguage);
            this.addChatMessage('assistant', response);
        } catch (error) {
            this.addChatMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
        } finally {
            this.setChatLoading(false);
        }
    }

    async getChatResponse(message, targetLanguage) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful AI assistant. Respond to the user's message in ${targetLanguage}. 
                        Keep your responses conversational and natural. If the user asks a question, answer it helpfully.
                        If they just want to chat, engage with them naturally. Always respond in ${targetLanguage}.`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    addChatMessage(role, content) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="chat-bubble ${role}">${content}</div>
            <div class="chat-timestamp">${timestamp}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    setChatLoading(isLoading) {
        const chatSendBtn = document.getElementById('chat-send-btn');
        const chatInput = document.getElementById('chat-input');
        
        if (isLoading) {
            chatSendBtn.disabled = true;
            chatInput.disabled = true;
            chatSendBtn.querySelector('.btn-loading').style.display = 'inline-flex';
            chatSendBtn.querySelector('span:first-child').style.display = 'none';
        } else {
            chatSendBtn.disabled = false;
            chatInput.disabled = false;
            chatSendBtn.querySelector('.btn-loading').style.display = 'none';
            chatSendBtn.querySelector('span:first-child').style.display = 'inline';
        }
    }

    completeSetup() {
        const apiKey = document.getElementById('api-key').value.trim();
        const model = document.getElementById('model-select').value;
        const maxTokens = parseInt(document.getElementById('max-tokens').value);
        const temperature = parseFloat(document.getElementById('temperature').value);

        if (!apiKey) {
            alert('Please enter your OpenAI API key.');
            return;
        }

        // Save configuration
        this.apiKey = apiKey;
        this.model = model;
        this.maxTokens = maxTokens;
        this.temperature = temperature;

        const config = {
            apiKey,
            model,
            maxTokens,
            temperature
        };

        localStorage.setItem('pollyglot_config', JSON.stringify(config));
        
        // Transition to translate section
        this.navigateToSection('translate');
        this.showSuccess('✅ Configuration saved! You can now start translating.');
    }

    setTempApiKey() {
        const tempKey = document.getElementById('temp-api-key').value.trim();
        if (tempKey) {
            this.apiKey = tempKey;
            localStorage.setItem('openai_api_key', tempKey);
            document.querySelector('.config-help').remove();
            this.showSuccess('✅ API key set successfully! You can now translate text.');
        } else {
            alert('Please enter a valid API key.');
        }
    }

    async handleTranslate() {
        const inputText = document.getElementById('input-text').value.trim();
        const targetLanguage = document.getElementById('navbar-language').value;

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
                model: this.model,
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
                max_tokens: this.maxTokens,
                temperature: this.temperature
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

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = 'color: #27ae60; background: #d5f4e6; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center;';
        
        document.querySelector('.translator').insertBefore(successDiv, document.querySelector('.input-section'));
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
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
        const selectedLanguage = document.getElementById('navbar-language').value;
        if (targetLangSpan) {
            targetLangSpan.textContent = selectedLanguage;
        }
    }
}

// Initialize the translator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.translator = new Translator();
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
