class Translator {
    constructor() {
        this.apiKey = '';
        this.model = CONFIG.MODEL || 'gpt-4';
        this.maxTokens = CONFIG.MAX_TOKENS || 1000;
        this.temperature = CONFIG.TEMPERATURE || 0.9;
        this.frequencyPenalty = CONFIG.FREQUENCY_PENALTY || 0;
        this.presencePenalty = CONFIG.PRESENCE_PENALTY || 0;
        this.chatHistory = [];
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
                this.frequencyPenalty = config.frequencyPenalty || 0;
                this.presencePenalty = config.presencePenalty || 0;
                
                // Show settings page with current values
                this.showSettingsPage();
            } catch (e) {
                localStorage.removeItem('pollyglot_config');
                this.showSettingsPage();
            }
        } else {
            // Use CONFIG defaults for settings
            this.model = CONFIG.MODEL;
            this.maxTokens = CONFIG.MAX_TOKENS;
            this.temperature = CONFIG.TEMPERATURE;
            this.frequencyPenalty = CONFIG.FREQUENCY_PENALTY || 0;
            this.presencePenalty = CONFIG.PRESENCE_PENALTY || 0;
            this.showSettingsPage();
        }
    }

    showSettingsPage() {
        // Populate settings form with current values
        this.populateSettingsForm();
        
        // Bind slider and number input synchronization
        this.bindSettingsSync();
    }

    populateSettingsForm() {
        // Set model selection
        const modelSelect = document.getElementById('model-select');
        if (modelSelect) {
            modelSelect.value = this.model;
        }
        
        // Set temperature values
        const tempSlider = document.getElementById('temperature-slider');
        const tempInput = document.getElementById('temperature');
        if (tempSlider && tempInput) {
            tempSlider.value = this.temperature;
            tempInput.value = this.temperature;
        }
        
        // Set frequency penalty values
        const freqSlider = document.getElementById('frequency-penalty-slider');
        const freqInput = document.getElementById('frequency-penalty');
        if (freqSlider && freqInput) {
            freqSlider.value = this.frequencyPenalty;
            freqInput.value = this.frequencyPenalty;
        }
        
        // Set presence penalty values
        const presenceSlider = document.getElementById('presence-penalty-slider');
        const presenceInput = document.getElementById('presence-penalty');
        if (presenceSlider && presenceInput) {
            presenceSlider.value = this.presencePenalty;
            presenceInput.value = this.presencePenalty;
        }
    }

    bindSettingsSync() {
        // Temperature synchronization
        const tempSlider = document.getElementById('temperature-slider');
        const tempInput = document.getElementById('temperature');
        if (tempSlider && tempInput) {
            tempSlider.addEventListener('input', (e) => {
                tempInput.value = e.target.value;
            });
            tempInput.addEventListener('input', (e) => {
                let value = parseFloat(e.target.value);
                if (isNaN(value)) value = 0;
                value = Math.max(0, Math.min(2, value));
                e.target.value = value;
                tempSlider.value = value;
            });
        }
        
        // Frequency penalty synchronization
        const freqSlider = document.getElementById('frequency-penalty-slider');
        const freqInput = document.getElementById('frequency-penalty');
        if (freqSlider && freqInput) {
            freqSlider.addEventListener('input', (e) => {
                freqInput.value = e.target.value;
            });
            freqInput.addEventListener('input', (e) => {
                let value = parseFloat(e.target.value);
                if (isNaN(value)) value = 0;
                value = Math.max(-2, Math.min(2, value));
                e.target.value = value;
                freqSlider.value = value;
            });
        }
        
        // Presence penalty synchronization
        const presenceSlider = document.getElementById('presence-penalty-slider');
        const presenceInput = document.getElementById('presence-penalty');
        if (presenceSlider && presenceInput) {
            presenceSlider.addEventListener('input', (e) => {
                presenceInput.value = e.target.value;
            });
            presenceInput.addEventListener('input', (e) => {
                let value = parseFloat(e.target.value);
                if (isNaN(value)) value = 0;
                value = Math.max(-2, Math.min(2, value));
                e.target.value = value;
                presenceSlider.value = value;
            });
        }
    }

    saveSettings() {
        // Get current values from form
        const model = document.getElementById('model-select').value;
        const temperature = parseFloat(document.getElementById('temperature').value);
        const frequencyPenalty = parseFloat(document.getElementById('frequency-penalty').value);
        const presencePenalty = parseFloat(document.getElementById('presence-penalty').value);

        // Update instance variables
        this.model = model;
        this.temperature = temperature;
        this.frequencyPenalty = frequencyPenalty;
        this.presencePenalty = presencePenalty;

        // Update stored configuration (keep existing API key and max tokens)
        const storedConfig = localStorage.getItem('pollyglot_config');
        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                config.model = model;
                config.temperature = temperature;
                config.frequencyPenalty = frequencyPenalty;
                config.presencePenalty = presencePenalty;
                
                localStorage.setItem('pollyglot_config', JSON.stringify(config));
                
                // Show success indicator
                this.showSaveIndicator();
            } catch (e) {
                console.error('Error saving settings:', e);
                this.showError('Failed to save settings. Please try again.');
            }
        } else {
            // Create new config if none exists
            const config = {
                apiKey: '', // Will be set when user configures API key
                model,
                maxTokens: this.maxTokens,
                temperature,
                frequencyPenalty,
                presencePenalty
            };
            
            localStorage.setItem('pollyglot_config', JSON.stringify(config));
            this.showSaveIndicator();
        }
    }

    showSaveIndicator() {
        const saveIndicator = document.getElementById('save-indicator');
        if (saveIndicator) {
            saveIndicator.style.display = 'block';
            
            // Hide indicator after 3 seconds
            setTimeout(() => {
                saveIndicator.style.display = 'none';
            }, 3000);
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
        this.populateNavbarLanguage();
        
        // Reset chat when navigating to chat section
        if (sectionName === 'chat') {
            this.resetChat();
        }
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
        // Settings page events
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }

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

        if (translateBtn) {
            translateBtn.addEventListener('click', () => this.handleTranslate());
        }
        if (inputText) {
            inputText.addEventListener('input', () => this.handleInputChange());
        }

        // Chat events
        const chatSendBtn = document.getElementById('chat-send-btn');
        const chatInput = document.getElementById('chat-input');
        const clearChatBtn = document.getElementById('clear-chat-btn');

        if (chatSendBtn) {
            chatSendBtn.addEventListener('click', () => this.handleChatSend());
        }
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleChatSend();
                }
            });
        }
        
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.clearChatHistory());
        }

        // Conversation starter events
        const starterBtns = document.querySelectorAll('.starter-btn');
        starterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const starterText = btn.getAttribute('data-starter');
                this.startConversationWithStarter(starterText);
            });
        });

        // Enter key support for translate
        if (inputText) {
            inputText.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.handleTranslate();
                }
            });
        }
    }

    // Configuration is now handled in the setup screen

    // Mode switching is now handled by the navbar navigation

    async startConversationWithStarter(topic) {
        const targetLanguage = document.getElementById('navbar-language').value;
        
        // Generate appropriate starter message in the target language
        let starterMessage = '';
        switch(topic) {
            case 'work':
                starterMessage = this.getStarterMessage('work', targetLanguage);
                break;
            case 'hobbies':
                starterMessage = this.getStarterMessage('hobbies', targetLanguage);
                break;
            case 'food':
                starterMessage = this.getStarterMessage('food', targetLanguage);
                break;
        }
        
        // Add user message in target language
        this.addChatMessage('user', starterMessage);
        
        // Hide the conversation starters after use
        const conversationStarters = document.querySelector('.conversation-starters');
        if (conversationStarters) {
            conversationStarters.style.display = 'none';
        }
        
        // Show loading state
        this.setChatLoading(true);
        
        // Disable starter buttons during loading
        const starterBtns = document.querySelectorAll('.starter-btn');
        starterBtns.forEach(btn => btn.disabled = true);
        
        // Get AI response via API
        try {
            const response = await this.getChatResponse(starterMessage, targetLanguage);
            this.addChatMessage('assistant', response);
        } catch (error) {
            this.addChatMessage('assistant', `Sorry, I encountered an error: ${error.message}`);
        } finally {
            this.setChatLoading(false);
            // Re-enable starter buttons
            starterBtns.forEach(btn => btn.disabled = false);
        }
    }

    getStarterMessage(topic, language) {
        const messages = {
            'work': {
                'Spanish': 'Me gustaría hablar sobre trabajo y carreras profesionales.',
                'French': 'J\'aimerais parler du travail et des carrières.',
                'German': 'Ich würde gerne über Arbeit und Karriere sprechen.',
                'Italian': 'Vorrei parlare di lavoro e carriere professionali.',
                'Portuguese': 'Gostaria de falar sobre trabalho e carreiras.',
                'Japanese': '仕事とキャリアについて話したいです。',
                'Russian': 'Я хотел бы поговорить о работе и карьере.',
                'Chinese': '我想谈谈工作和职业。',
                'Korean': '일과 직업에 대해 이야기하고 싶습니다.',
                'Arabic': 'أود التحدث عن العمل والمهن.'
            },
            'hobbies': {
                'Spanish': 'Me interesan los pasatiempos y actividades de tiempo libre.',
                'French': 'Je m\'intéresse aux passe-temps et aux activités de loisirs.',
                'German': 'Ich interessiere mich für Hobbys und Freizeitaktivitäten.',
                'Italian': 'Mi interessano gli hobby e le attività del tempo libero.',
                'Portuguese': 'Tenho interesse em passatempos e atividades de lazer.',
                'Japanese': '趣味や余暇活動に興味があります。',
                'Russian': 'Меня интересуют хобби и занятия в свободное время.',
                'Chinese': '我对爱好和休闲活动很感兴趣。',
                'Korean': '취미와 여가 활동에 관심이 있습니다.',
                'Arabic': 'أنا مهتم بالهوايات والأنشطة الترفيهية.'
            },
            'food': {
                'Spanish': 'Hablemos de comida y cocina.',
                'French': 'Parlons de nourriture et de cuisine.',
                'German': 'Lass uns über Essen und Kochen sprechen.',
                'Italian': 'Parliamo di cibo e cucina.',
                'Portuguese': 'Vamos falar sobre comida e culinária.',
                'Japanese': '食べ物と料理について話しましょう。',
                'Russian': 'Давайте поговорим о еде и кулинарии.',
                'Chinese': '让我们谈谈食物和烹饪。',
                'Korean': '음식과 요리에 대해 이야기해 봅시다.',
                'Arabic': 'دعنا نتحدث عن الطعام والطبخ.'
            }
        };
        
        return messages[topic][language] || messages[topic]['Spanish']; // Fallback to Spanish
    }

    resetChat() {
        const chatMessages = document.getElementById('chat-messages');
        
        // Only show welcome if no messages exist
        if (!this.chatHistory || this.chatHistory.length === 0) {
            chatMessages.innerHTML = `
                <div class="chat-welcome">
                    <p>💬 Start a conversation! Type your message below and I'll respond in the selected language.</p>
                    
                    <div class="conversation-starters">
                        <div class="starter-buttons">
                            <button class="starter-btn" data-starter="work">
                                💼 Work & Careers
                            </button>
                            <button class="starter-btn" data-starter="hobbies">
                                🎨 Hobbies & Interests
                            </button>
                            <button class="starter-btn" data-starter="food">
                                🍕 Food & Cooking
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Re-bind event listeners for the new starter buttons
            const starterBtns = chatMessages.querySelectorAll('.starter-btn');
            starterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const starterText = btn.getAttribute('data-starter');
                    this.startConversationWithStarter(starterText);
                });
            });
        } else {
            // Restore chat history
            this.restoreChatHistory();
        }
    }

    restoreChatHistory() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        // Restore all messages
        this.chatHistory.forEach(msg => {
            this.addChatMessage(msg.role, msg.content, false); // false = don't add to history
        });
        
        // Show conversation starters if no messages exist
        if (this.chatHistory.length === 0) {
            this.resetChat();
        }
    }

    clearChatHistory() {
        this.chatHistory = [];
        this.resetChat();
    }

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
        console.log(this.temperature)
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
                        content: `You are a friendly, conversational AI assistant. Always respond in ${targetLanguage}.

                        Your role is to:
                        1. Take the lead in conversations and get momentum going
                        2. When a user selects a topic (work, hobbies, food), immediately start asking engaging questions about that topic
                        3. Ask 1 specific, open-ended question to get the user talking
                        4. Show genuine curiosity and interest in their responses
                        5. Keep responses concise but engaging (2-3 sentences max)
                        6. Use the conversation starter as a signal to dive deep into that topic

                        Be proactive and engaging - get the conversation flowing! Always respond in ${targetLanguage}.`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                frequency_penalty: this.frequencyPenalty,
                presence_penalty: this.presencePenalty
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    addChatMessage(role, content, addToHistory = true) {
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
        
        // Store message in history if requested
        if (addToHistory) {
            this.chatHistory.push({ role, content, timestamp });
        }
    }

    setChatLoading(isLoading) {
        const chatSendBtn = document.getElementById('chat-send-btn');
        const chatInput = document.getElementById('chat-input');
        
        if (isLoading) {
            chatSendBtn.disabled = true;
            chatInput.disabled = true;
            chatSendBtn.querySelector('.btn-loading').style.display = 'inline-flex';
            chatSendBtn.querySelector('span:first-child').style.display = 'none';
            this.showChatLoading();
        } else {
            chatSendBtn.disabled = false;
            chatInput.disabled = false;
            chatSendBtn.querySelector('.btn-loading').style.display = 'none';
            chatSendBtn.querySelector('span:first-child').style.display = 'inline';
            this.hideChatLoading();
        }
    }

    showChatLoading() {
        const chatMessages = document.getElementById('chat-messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message assistant chat-loading-bubble';
        loadingDiv.id = 'chat-loading-bubble';
        
        loadingDiv.innerHTML = `
            <div class="chat-bubble assistant">
                <div class="loading-content">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
            <div class="chat-timestamp">${new Date().toLocaleTimeString()}</div>
        `;
        
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideChatLoading() {
        const loadingBubble = document.getElementById('chat-loading-bubble');
        if (loadingBubble) {
            loadingBubble.remove();
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
                temperature: this.temperature,
                frequency_penalty: this.frequencyPenalty,
                presence_penalty: this.presencePenalty
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
