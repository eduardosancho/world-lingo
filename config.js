// 🌍 PollyGlot Translator Configuration
// 
// INSTRUCTIONS FOR USERS:
// 1. Get your OpenAI API key from: https://platform.openai.com/api-keys
// 2. Replace 'YOUR_API_KEY_HERE' below with your actual API key
// 3. Save this file
// 4. Deploy to GitHub Pages or any static hosting service
//
// SECURITY: This file will be visible in your repository, but that's okay
// because you're the only one who should have access to your repo.
// Never share your API key publicly or commit it to a public repository.

const CONFIG = {
    // 🔑 Replace this with your actual OpenAI API key
    OPENAI_API_KEY: 'YOUR_API_KEY_HERE',
    
    // 🌐 Available languages for translation
    LANGUAGES: [
        { value: 'Spanish', label: 'Spanish', flag: '🇪🇸' },
        { value: 'French', label: 'French', flag: '🇫🇷' },
        { value: 'German', label: 'German', flag: '🇩🇪' },
        { value: 'Italian', label: 'Italian', flag: '🇮🇹' },
        { value: 'Portuguese', label: 'Portuguese', flag: '🇵🇹' },
        { value: 'Japanese', label: 'Japanese', flag: '🇯🇵' },
        { value: 'Russian', label: 'Russian', flag: '🇷🇺' },
        { value: 'Chinese', label: 'Chinese', flag: '🇨🇳' },
        { value: 'Korean', label: 'Korean', flag: '🇰🇷' },
        { value: 'Arabic', label: 'Arabic', flag: '🇸🇦' }
    ],
    
    // ⚙️ App settings
    DEFAULT_LANGUAGE: 'Spanish',
    MODEL: 'gpt-4',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.9,
    FREQUENCY_PENALTY: 0,
    PRESENCE_PENALTY: 0,
    
    // 🎨 UI settings
    APP_NAME: 'WorldLingo Chat & Translator',
    APP_VERSION: '1.0.0'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
