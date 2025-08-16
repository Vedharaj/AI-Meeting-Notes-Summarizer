# AI Meeting Notes Summarizer

An AI-powered meeting notes summarizer built with Next.js and Groq API.

## Features

- 📝 AI-powered meeting transcript summarization
- 🎨 Beautiful, responsive UI with dark/light theme support
- ⚡ Fast summarization using Groq's LLM models
- 📧 Share summaries via email with beautiful formatting
- 📋 Copy summaries to clipboard
- 🔧 Customizable summarization instructions

## Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure API Keys

Create a `.env.local` file in the root directory:

```bash
# .env.local
GROQ_API_KEY=your_actual_groq_api_key_here

# Optional: For real email delivery (recommended for production)
RESEND_API_KEY=your_resend_api_key_here
```

**To get your Groq API key:**
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

**To get your Resend API key (for email delivery):**
1. Go to [Resend](https://resend.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Input**: Paste your meeting transcript in the text area
2. **Custom Instructions**: Optionally add specific summarization instructions
3. **AI Processing**: The app sends your transcript to Groq's LLM API
4. **Summary**: Receive a clear, concise summary of your meeting
5. **Share**: Copy to clipboard or send via email with beautiful formatting

## Email Sharing

The app includes two email sharing options:

### **Demo Mode (Default)**
- Uses `/api/send-email` route
- Simulates email sending
- Perfect for development and testing
- Logs email data to console

### **Production Mode (Optional)**
- Uses `/api/send-email-resend` route
- Sends actual emails via Resend
- Beautiful HTML email templates
- Professional email delivery

**To enable production email:**
1. Get a Resend API key
2. Add `RESEND_API_KEY` to your `.env.local`
3. Update the frontend to use the Resend endpoint (optional)

## API Configuration

The app uses Groq's chat completions API with the `llama3-8b-8192` model by default. You can modify the model in `app/api/summarize/route.js`:

```javascript
model: 'llama3-8b-8192', // Change to other Groq models
```

## Available Groq Models

- `llama3-8b-8192` - Fast, efficient (default)
- `llama3-70b-8192` - Higher quality, slower
- `mixtral-8x7b-32768` - Balanced performance
- `gemma2-9b-it` - Google's Gemma model

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GROQ_API_KEY` | Your Groq API key | Yes | - |
| `RESEND_API_KEY` | Your Resend API key for email delivery | No | Demo mode |

## Troubleshooting

### Common Issues

1. **"Failed to generate summary"**
   - Check if your Groq API key is correct
   - Ensure you have sufficient API credits
   - Verify the transcript is not empty

2. **"Failed to send email"**
   - Check if recipients are valid email addresses
   - Ensure summary exists before sharing
   - Check console for detailed error messages

3. **API Rate Limits**
   - Groq has rate limits based on your plan
   - Check your usage in the Groq console

4. **Model Availability**
   - Some models may be temporarily unavailable
   - Try switching to a different model

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License
