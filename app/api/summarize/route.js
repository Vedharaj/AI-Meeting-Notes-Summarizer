import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { transcript, instructions } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Call Groq API using the chat completions endpoint
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'User-Agent': 'GroqSum-AI-Meeting-Summarizer'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // You can change this to other Groq models
        messages: [
          {
            role: 'system',
            content: instructions || 'You are a helpful AI assistant that summarizes meeting notes clearly and concisely. Focus on key points, action items, and important decisions.'
          },
          {
            role: 'user',
            content: `Please summarize the following meeting transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error('Groq API error response:', errorData);
      throw new Error(`Groq API error: ${groqResponse.status} ${groqResponse.statusText}`);
    }

    const data = await groqResponse.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Groq API');
    }

    const summary = data.choices[0].message.content;

    return NextResponse.json({
      summary: summary,
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate summary',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
  