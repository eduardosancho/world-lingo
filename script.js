class Translator {
    constructor() {
        this.apiKey = '';
        this.model = CONFIG.MODEL || 'gpt-4';
        this.maxTokens = CONFIG.MAX_TOKENS || 1000;
        this.temperature = CONFIG.TEMPERATURE || 0.9;
        this.frequencyPenalty = CONFIG.FREQUENCY_PENALTY || 0;
        this.presencePenalty = CONFIG.PRESENCE_PENALTY || 0;
        this.chatHistory = [];
        this.chatInputState = { text: '' };
        this.loadChatHistory();
        this.loadChatInputState();
        this.init();
    }

    saveChatHistory() {
        try {
            localStorage.setItem('pollyglot_chat_history', JSON.stringify(this.chatHistory));
        } catch (e) {
            console.warn('Could not save chat history to localStorage:', e);
        }
    }

    loadChatHistory() {
        try {
            const stored = localStorage.getItem('pollyglot_chat_history');
            if (stored) {
                this.chatHistory = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Could not load chat history from localStorage:', e);
            this.chatHistory = [];
        }
    }

    saveChatInputState() {
        try {
            localStorage.setItem('pollyglot_chat_input_state', JSON.stringify(this.chatInputState));
        } catch (e) {
            console.warn('Could not save chat input state to localStorage:', e);
        }
    }

    loadChatInputState() {
        try {
            const stored = localStorage.getItem('pollyglot_chat_input_state');
            if (stored) {
                this.chatInputState = JSON.parse(stored);
                const chatInput = document.getElementById('chat-input');
                if (chatInput) {
                    chatInput.value = this.chatInputState.text;
                    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        } catch (e) {
            console.warn('Could not load chat input state from localStorage:', e);
        }
    }

    init() {
        this.checkSetupStatus();
        this.populateNavbarLanguage();
        this.bindEvents();
        this.restoreNavigationState();
    }

    restoreNavigationState() {
        // Check if there's a stored active section and restore it
        const activeSection = localStorage.getItem('pollyglot_active_section');
        if (activeSection) {
            // Update the navigation button states
            const navBtns = document.querySelectorAll('.nav-btn');
            navBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-section') === activeSection) {
                    btn.classList.add('active');
                }
            });
            
            // Show the correct section content
            this.showSectionContent(activeSection);
        } else {
            // Default to chat section
            this.navigateToSection('chat');
        }
    }

    showSectionContent(sectionName) {
        // Hide all sections
        const sections = ['setup-section', 'translate-section', 'chat-section'];
        sections.forEach(section => {
            document.getElementById(section).style.display = 'none';
        });

        // Show selected section
        document.getElementById(`${sectionName}-section`).style.display = 'block';
        
        // Handle special cases for each section
        if (sectionName === 'setup') {
            this.showSettingsPage();
        } else if (sectionName === 'chat') {
            this.resetChat();
        }
    }

    checkSetupStatus() {
        this.apiKey = CONFIG.OPENAI_API_KEY;
        
        // Check if we have stored configuration
        const storedConfig = localStorage.getItem('pollyglot_config');
        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                this.model = config.model;
                this.maxTokens = config.maxTokens;
                this.temperature = config.temperature;
                this.frequencyPenalty = config.frequencyPenalty || 0;
                this.presencePenalty = config.presencePenalty || 0;
                
                // Restore last active section if present; otherwise default to chat
                const activeSection = localStorage.getItem('pollyglot_active_section');
                if (activeSection) {
                    this.navigateToSection(activeSection);
                } else {
                    this.navigateToSection('chat');
                }
            } catch (e) {
                localStorage.removeItem('pollyglot_config');
                this.navigateToSection('chat');
            }
        } else {
            // Use CONFIG defaults for settings
            this.model = CONFIG.MODEL;
            this.maxTokens = CONFIG.MAX_TOKENS;
            this.temperature = CONFIG.TEMPERATURE;
            this.frequencyPenalty = CONFIG.FREQUENCY_PENALTY || 0;
            this.presencePenalty = CONFIG.PRESENCE_PENALTY || 0;
            
            // Restore last active section if present; otherwise default to chat
            const activeSection = localStorage.getItem('pollyglot_active_section');
            if (activeSection) {
                this.navigateToSection(activeSection);
            } else {
                this.navigateToSection('chat');
            }
        }
    }

    isApiKeyValid() {
        return this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE' && this.apiKey.trim() !== '';
    }

    async makeOpenAIRequest(messages, context = '') {
        if (!this.isApiKeyValid()) {
            console.error('API key validation failed');
            throw new Error('API key validation failed');
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    max_tokens: this.maxTokens,
                    temperature: this.temperature,
                    frequency_penalty: this.frequencyPenalty,
                    presence_penalty: this.presencePenalty
                })
            });

            if (!response.ok) {
                console.error(`${context}: API error ${response.status} - ${response.statusText}`);
                
                let errorMessage;
                if (response.status === 429) {
                    errorMessage = 'Service is busy. Please try again in a few minutes.';
                } else {
                    errorMessage = 'Service temporarily unavailable. Please try again later.';
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {            
            console.error(`${context}: Request failed.`, error.message);
            throw new Error(error);
        }
    }

    showSettingsPage() {
        // Populate settings form with current values
        this.populateSettingsForm();
        
        // Bind slider and number input synchronization
        this.bindSettingsSync();
        
        // Do not navigate here to avoid recursion; navigation is handled by caller
    }

    populateSettingsForm() {
        // Set model (read-only display)
        const modelReadonly = document.getElementById('model-readonly');
        if (modelReadonly) {
            modelReadonly.textContent = this.model;
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
        const temperature = parseFloat(document.getElementById('temperature').value);
        const frequencyPenalty = parseFloat(document.getElementById('frequency-penalty').value);
        const presencePenalty = parseFloat(document.getElementById('presence-penalty').value);

        // Update instance variables
        this.temperature = temperature;
        this.frequencyPenalty = frequencyPenalty;
        this.presencePenalty = presencePenalty;

        // Update stored configuration
        const storedConfig = localStorage.getItem('pollyglot_config');
        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                config.temperature = temperature;
                config.frequencyPenalty = frequencyPenalty;
                config.presencePenalty = presencePenalty;
                
                localStorage.setItem('pollyglot_config', JSON.stringify(config));
                
                this.showSaveIndicator();
                
                setTimeout(() => {
                    this.navigateToSection('chat');
                }, 1500);
            } catch (e) {
                this.showError('Failed to save settings. Please try again.');
            }
        } else {
            // Create new config if none exists
            const config = {
                apiKey: this.apiKey, // Use API key from CONFIG
                model: this.model,
                maxTokens: this.maxTokens,
                temperature,
                frequencyPenalty,
                presencePenalty
            };
            
            localStorage.setItem('pollyglot_config', JSON.stringify(config));
            this.showSaveIndicator();
            
            // Navigate to chat section after successful save
            setTimeout(() => {
                this.navigateToSection('chat');
            }, 1500);
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
        // Show the selected section content
        this.showSectionContent(sectionName);

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
        
        // Save the current active section
        localStorage.setItem('pollyglot_active_section', sectionName);
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
        const copyToChatBtn = document.getElementById('copy-to-chat-btn');

        if (translateBtn) {
            translateBtn.addEventListener('click', () => this.handleTranslate());
        }
        if (inputText) {
            inputText.addEventListener('input', () => {
                this.adjustTextareaHeight(inputText);
                this.updateCharacterCount(inputText);
            });
        }
        if (copyToChatBtn) {
            copyToChatBtn.addEventListener('click', () => this.copyTranslationToChat());
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
            // Save chat input as user types for persistence
            chatInput.addEventListener('input', () => {
                this.chatInputState.text = chatInput.value;
                this.saveChatInputState();
            });
        }
        
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.clearChatHistory());
        }

        // Enter key support for translate
        if (inputText) {
            inputText.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.handleTranslate();
                }
            });
        }
    }

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
        
        this.addChatMessage('user', starterMessage);
        
        // Hide the conversation starters after use
        const conversationStarters = document.querySelector('.conversation-starters');
        if (conversationStarters) {
            conversationStarters.style.display = 'none';
        }
        
        this.setChatLoading(true);
        
        try {
            const response = await this.getChatResponse(starterMessage, targetLanguage);
            this.addChatMessage('assistant', response);
        } catch (error) {
            this.addChatMessage('assistant', 'Whoops! Something went wrong. Please try again later.');
        } finally {
            this.setChatLoading(false);
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
            this.restoreChatHistory();
        }
    }

    restoreChatHistory() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        const baseWelcome = `
            <div class="chat-welcome">
                <p>💬 Start a conversation! Type your message below and I'll respond in the selected language.</p>
            </div>
        `;
        
        // If there are no messages, include conversation starters as well
        if (!this.chatHistory || this.chatHistory.length === 0) {
            chatMessages.innerHTML = `
                ${baseWelcome}
                <div class="conversation-starters">
                    <div class="starter-buttons">
                        <button class="starter-btn" data-starter="work">💼 Work & Careers</button>
                        <button class="starter-btn" data-starter="hobbies">🎨 Hobbies & Interests</button>
                        <button class="starter-btn" data-starter="food">🍕 Food & Cooking</button>
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
            return;
        }
        
        chatMessages.innerHTML = baseWelcome;
        
        this.chatHistory.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${msg.role}`;
            messageDiv.innerHTML = this.createMessageHTML(msg.role, msg.content, msg.timestamp);
            
            if (msg.role === 'assistant') {
                this.bindMessageActions(messageDiv, msg.content);
            }
            
            chatMessages.appendChild(messageDiv);
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    clearChatHistory() {
        this.chatHistory = [];
        this.saveChatHistory();
        this.resetChat();
    }

    async handleChatSend() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();

        if (!message) return;

        const targetLanguage = document.getElementById('navbar-language').value;
        
        this.addChatMessage('user', message);
        
        // Clear input and disable send button
        chatInput.value = '';
        this.chatInputState.text = '';
        this.saveChatInputState();
        this.setChatLoading(true);

        try {
            const response = await this.getChatResponse(message, targetLanguage);
            this.addChatMessage('assistant', response);
        } catch (error) {
            this.addChatMessage('assistant', 'Whoops! Something went wrong. Please try again later.');
        } finally {
            this.setChatLoading(false);
        }
    }

    async translateText(text, targetLanguage) {
        const messages = [
            {
                role: 'system',
                content: `You are a professional translator.
                Follow this rule:
                - If the input looks like English, translate it into ${targetLanguage}.
                - Otherwise, assume the input is written in ${targetLanguage} and translate it into English.
                Only return the translated text, nothing else. Maintain the original formatting and tone.`
            },
            {
                role: 'user',
                content: text
            }
        ];

        return await this.makeOpenAIRequest(messages, 'Translation');
    }

    async getChatResponse(message, targetLanguage) {
        const messages = [
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
        ];

        return await this.makeOpenAIRequest(messages, 'Chat');
    }

    displayTranslation(translation, targetLanguage) {
        const outputSection = document.getElementById('output-section');
        const translationResult = document.getElementById('translation-result');
        const targetLangSpan = document.getElementById('target-lang');

        translationResult.textContent = translation;
        targetLangSpan.textContent = 'English';
        
        outputSection.style.display = 'block';
        
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
        const selectedLanguage = document.getElementById('navbar-language').value;
        if (targetLangSpan) {
            targetLangSpan.textContent = selectedLanguage;
        }
    }

    createMessageHTML(role, content, timestamp) {
        if (role === 'assistant') {
            return `
                <div class="chat-bubble ${role}">
                    ${content}
                    <div class="message-actions">
                        <button class="action-btn copy-btn" title="Copy message">Copy</button>
                        <button class="action-btn to-translator-btn" title="Put into translator">Translate</button>
                        <button class="action-btn more-btn" title="More options">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="chat-timestamp">${timestamp}</div>
            `;
        } else {
            return `
                <div class="chat-bubble ${role}">${content}</div>
                <div class="chat-timestamp">${timestamp}</div>
            `;
        }
    }

    addChatMessage(role, content, addToHistory = true) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        
        const timestamp = new Date().toLocaleTimeString();
        messageDiv.innerHTML = this.createMessageHTML(role, content, timestamp);
        
        // Add event listeners for assistant message actions
        if (role === 'assistant') {
            this.bindMessageActions(messageDiv, content);
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store message in history if requested
        if (addToHistory) {
            this.chatHistory.push({ role, content, timestamp });
            this.saveChatHistory();
        }
    }

    bindMessageActions(messageDiv, content) {
        const copyBtn = messageDiv.querySelector('.copy-btn');
        const toTranslatorBtn = messageDiv.querySelector('.to-translator-btn');
        const moreBtn = messageDiv.querySelector('.more-btn');
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(content).then(() => {
                    // Show temporary success feedback
                    copyBtn.textContent = 'Copied!';
                    copyBtn.style.color = '#10b981';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy';
                        copyBtn.style.color = '';
                    }, 1500);
                });
            });
        }
        
        if (toTranslatorBtn) {
            toTranslatorBtn.addEventListener('click', () => {
                this.navigateToSection('translate');

                requestAnimationFrame(() => {
                    const textarea = document.getElementById('input-text');
                    if (textarea) {
                        textarea.value = content;

                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';

                        // Trigger input events so auto-resize and counters update
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                        textarea.focus();
                        try {
                            textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
                        } catch (_) { /* noop for unsupported browsers */ }
                    }
                });
            });
        }
        
        if (moreBtn) {
            moreBtn.addEventListener('click', () => {
                // Placeholder for future functionality
                console.log('More options clicked for:', content);
            });
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

    copyTranslationToChat() {
        const translationResult = document.getElementById('translation-result');
        const chatInput = document.getElementById('chat-input');
        
        if (translationResult && chatInput) {
            const translationText = translationResult.textContent;
            if (translationText.trim()) {
                chatInput.value = translationText;
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                setTimeout(() => {
                    this.navigateToSection('chat');
                    
                    requestAnimationFrame(() => {
                        const chatInputEl = document.getElementById('chat-input');
                        if (chatInputEl) {
                            chatInputEl.focus();
                            try {
                                chatInputEl.selectionStart = chatInputEl.selectionEnd = chatInputEl.value.length;
                            } catch (_) { /* noop */ }
                            // Apply a brief background highlight animation
                            chatInputEl.classList.remove('chat-paste-animate');
                            void chatInputEl.offsetWidth; // reflow to restart animation
                            chatInputEl.classList.add('chat-paste-animate');
                            setTimeout(() => chatInputEl.classList.remove('chat-paste-animate'), 1200);
                        }
                    });
                }, 200);
            }
        }
    }

    async handleTranslate() {
        const inputText = document.getElementById('input-text').value.trim();
        const targetLanguage = document.getElementById('navbar-language').value;

        if (!inputText) {
            this.showError('Please enter some text to translate.');
            return;
        }

        this.setLoadingState(true);
        this.hideOutput();
        this.clearErrors();

        try {
            const translation = await this.translateText(inputText, targetLanguage);
            this.displayTranslation(translation, targetLanguage);
            
            // Save translator state after successful translation
        } catch (error) {
            this.showError('Whoops! Something went wrong. Please try again later.');
        } finally {
            this.setLoadingState(false);
        }
    }
}

// Initialize the translator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.translator = new Translator();
});

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
