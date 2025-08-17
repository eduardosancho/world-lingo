# 🌍 PollyGlot Translator

A beautiful, modern web application that translates text to multiple languages using OpenAI's GPT-4 API.

## ✨ Features

- **Clean, Modern UI**: Beautiful gradient design with smooth animations
- **Multiple Languages**: Support for Spanish, French, German, Italian, Portuguese, and Japanese
- **Real-time Translation**: Powered by OpenAI's GPT-4 for accurate translations
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Smart Error Handling**: Comprehensive error messages and validation
- **API Key Management**: Secure storage of your OpenAI API key
- **Character Counter**: Track input length as you type
- **Keyboard Shortcuts**: Use Ctrl+Enter to translate quickly

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- An OpenAI API key

### Setup

1. **Clone or download** this project to your local machine
2. **Get an OpenAI API key**:
   - Visit [OpenAI's website](https://platform.openai.com/)
   - Sign up or log in to your account
   - Navigate to API Keys section
   - Create a new API key
3. **Open the application**:
   - Double-click `index.html` or open it in your browser
   - Enter your OpenAI API key when prompted
   - Start translating!

## 📁 Project Structure

```
scrimba_pollyglot/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and animations
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## 🔧 How It Works

1. **Input**: Type or paste text in the textarea
2. **Language Selection**: Choose your target language using the radio buttons
3. **Translation**: Click the "Translate" button or press Ctrl+Enter
4. **AI Processing**: The app sends your text to OpenAI's GPT-4 API
5. **Result**: View the translated text with source and target language information

## 🎨 Customization

### Adding More Languages

To add more languages, edit the `index.html` file and add new radio button options:

```html
<label class="radio-option">
    <input type="radio" name="target-language" value="Russian">
    <span class="radio-custom"></span>
    Russian
</label>
```

### Changing Colors

Modify the CSS variables in `styles.css` to customize the color scheme:

```css
body {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

## 🔒 Security Notes

- Your OpenAI API key is stored locally in your browser's localStorage
- The key is never sent to any server other than OpenAI's API
- Consider clearing your browser data if you're on a shared computer

## 💰 API Costs

- OpenAI charges per token used
- Translation costs depend on the length of your text
- Check [OpenAI's pricing page](https://openai.com/pricing) for current rates

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid API key" error**:
   - Check that your API key is correct
   - Ensure you have sufficient credits in your OpenAI account

2. **"Rate limit exceeded" error**:
   - Wait a few minutes before trying again
   - Consider upgrading your OpenAI plan

3. **Translation not working**:
   - Check your internet connection
   - Verify that your API key is valid
   - Check the browser console for error messages

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this project!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with HTML, CSS, and vanilla JavaScript
- Powered by OpenAI's GPT-4 API
- Designed for simplicity and ease of use

---

**Happy Translating! 🌍✨**
