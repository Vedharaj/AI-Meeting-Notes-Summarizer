"use client";

import { useState, useEffect } from 'react';

export default function MeetingSummarizer() {
  const [transcript, setTranscript] = useState('');
  const [instructions, setInstructions] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string; recipients?: string[]; successful?: number; failed?: number } | null>(null);
  const [history, setHistory] = useState<Array<{
    id: string;
    transcript: string;
    summary: string;
    instructions: string;
    timestamp: Date;
    title: string;
  }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<typeof history[0] | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    autoSave: true,
    maxHistoryItems: 50,
    defaultInstructions: 'Summarize the meeting notes clearly and concisely',
    emailNotifications: true,
    language: 'en' as 'en' | 'es' | 'fr' | 'de',
    summaryLength: 'medium' as 'short' | 'medium' | 'long'
  });
  const [pendingSettings, setPendingSettings] = useState(settings);
  const [settingsChanged, setSettingsChanged] = useState(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('meetingSumHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Convert timestamp strings back to Date objects
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(historyWithDates);
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('meetingSumHistory', JSON.stringify(history));
  }, [history]);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('meetingSumSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        const loadedSettings = { ...settings, ...parsedSettings };
        setSettings(loadedSettings);
        setPendingSettings(loadedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('meetingSumSettings', JSON.stringify(settings));
  }, [settings]);

  // Check if pending settings differ from current settings
  useEffect(() => {
    setSettingsChanged(JSON.stringify(pendingSettings) !== JSON.stringify(settings));
  }, [pendingSettings, settings]);

  const generateSummary = async () => {
    if (!transcript.trim()) {
      alert('Please enter some meeting notes to summarize.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call Groq API
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcript, 
          instructions: instructions || settings.defaultInstructions 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate summary');
      }

      setSummary(data.summary);
      
      // Save to history
      const newHistoryItem = {
        id: Date.now().toString(),
        transcript: transcript,
        summary: data.summary,
        instructions: instructions,
        timestamp: new Date(),
        title: transcript.substring(0, 50) + (transcript.length > 50 ? '...' : '')
      };
      
      setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate summary: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!recipients.trim()) {
      return alert('Please enter at least one recipient');
    }
    
    if (!summary.trim()) {
      return alert('Please generate a summary first before sending');
    }
    
    setIsSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          summary,
          subject: 'Meeting Summary from MeetingSum'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send email');
      }
      
      setResult(data);
      // Clear form on success
      setRecipients('');
    } catch (error) {
      console.error('Email error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult({ error: errorMessage });
    } finally {
      setIsSending(false);
    }
  };

  const loadHistoryItem = (historyItem: typeof history[0]) => {
    setTranscript(historyItem.transcript);
    setInstructions(historyItem.instructions);
    setSummary(historyItem.summary);
    setSelectedHistory(historyItem);
    setShowHistory(false);
  };

  const deleteHistoryItem = (id: string) => {
    if (confirm('Are you sure you want to delete this summary?')) {
      setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
      if (selectedHistory?.id === id) {
        setSelectedHistory(null);
      }
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      setHistory([]);
      setSelectedHistory(null);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setPendingSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      const defaultSettings = {
        autoSave: true,
        maxHistoryItems: 50,
        defaultInstructions: 'Summarize the meeting notes clearly and concisely',
        emailNotifications: true,
        language: 'en' as 'en' | 'es' | 'fr' | 'de',
        summaryLength: 'medium' as 'short' | 'medium' | 'long'
      };
      setSettings(defaultSettings);
      setPendingSettings(defaultSettings);
    }
  };

  const applySettings = () => {
    setSettings(pendingSettings);
    setSettingsChanged(false);
  };

  const cancelSettings = () => {
    setPendingSettings(settings);
    setSettingsChanged(false);
  };

  // Apply maxHistoryItems setting to history
  useEffect(() => {
    if (history.length > settings.maxHistoryItems) {
      setHistory(prev => prev.slice(0, settings.maxHistoryItems));
    }
  }, [settings.maxHistoryItems, history.length]);
  

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/meeting.png" 
                alt="MeetingSum AI meeting summarizer app logo"
                className="h-10 w-10 rounded-lg"
              />
              <h1 className="text-2xl font-bold">MeetingSum</h1>
            </div>
            <nav>
              <ul className="flex space-x-4">
                <li><a href="#" className="hover:opacity-80 transition">Home</a></li>
                <li>
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="hover:opacity-80 transition text-white relative"
                  >
                    History
                    {history.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {history.length}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="hover:opacity-80 transition text-white"
                  >
                    Settings
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* History Panel */}
          {showHistory && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Meeting History</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={clearHistory}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No meeting summaries yet.</p>
                  <p className="text-sm mt-2">Generate your first summary to see it here!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedHistory?.id === item.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      onClick={() => loadHistoryItem(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {item.instructions || 'No custom instructions'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item.id);
                          }}
                          className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
                  {settingsChanged && (
                    <span className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-full">
                      Unsaved Changes
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (settingsChanged) {
                      if (confirm('You have unsaved changes. Are you sure you want to close without applying them?')) {
                        cancelSettings();
                        setShowSettings(false);
                      }
                    } else {
                      setShowSettings(false);
                    }
                  }}
                  className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                >
                  Close
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 border-b pb-2">General</h3>
                  
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={pendingSettings.autoSave}
                        onChange={(e) => updateSetting('autoSave', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Auto-save summaries to history</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maximum History Items
                    </label>
                    <select
                      value={pendingSettings.maxHistoryItems}
                      onChange={(e) => updateSetting('maxHistoryItems', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value={25}>25 items</option>
                      <option value={50}>50 items</option>
                      <option value={100}>100 items</option>
                      <option value={200}>200 items</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Instructions
                    </label>
                    <textarea
                      value={pendingSettings.defaultInstructions}
                      onChange={(e) => updateSetting('defaultInstructions', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Default instructions for AI summarization"
                    />
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 border-b pb-2">Language</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={pendingSettings.language}
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Summary Length
                    </label>
                    <select
                      value={pendingSettings.summaryLength}
                      onChange={(e) => updateSetting('summaryLength', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {settingsChanged && (
                  <>
                    <button
                      onClick={applySettings}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      ✅ Apply Changes
                    </button>
                    <button
                      onClick={cancelSettings}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                    >
                      ❌ Cancel Changes
                    </button>
                  </>
                )}
                <button
                  onClick={resetSettings}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  🔄 Reset to Default
                </button>
              </div>
            </section>
          )}

          {/* Input Section */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Prepare Your Meeting Notes</h2>
              {selectedHistory && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-purple-600 dark:text-purple-400">
                    📚 Loaded from history
                  </span>
                  <button
                    onClick={() => {
                      setTranscript('');
                      setInstructions('');
                      setSummary('');
                      setSelectedHistory(null);
                    }}
                    className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            
            {/* Transcript Input */}
            <div className="mb-6">
              <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Transcript
              </label>
              <textarea
                id="transcript"
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Paste your meeting transcript here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </div>
            
            {/* Custom Instructions */}
            <div className="mb-6">
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Instructions (Optional)
              </label>
              <input
                type="text"
                id="instructions"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Example: 'Summarize in bullet points for executives' or 'Highlight only action items'"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
            
            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={generateSummary}
                disabled={isLoading}
                className="button-63 text-white border-0 rounded-lg shadow-[rgba(151,65,252,0.2)_0_15px_30px_-5px] box-border flex items-center justify-center text-xl md:text-xl leading-none max-w-full min-w-[140px] md:min-w-[196px] px-6 py-4 md:px-6 md:py-5 text-center select-none cursor-pointer hover:outline-none active:outline-none disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none transition-all duration-200"
              >
                {isLoading ? 'Generating...' : 'Generate Summary'}
              </button>
            </div>
          </section>
          
          {/* Output Section */}
          {(summary || isLoading) && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Generated Summary</h2>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Generating AI summary...</p>
                </div>
              ) : (
                <>
                  <div
                    contentEditable
                    className="min-h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg mb-6 focus:border-purple-500 outline-none focus:ring-2 focus:ring-purple-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: summary }}
                    onBlur={(e) => setSummary(e.target.innerHTML)}
                  />
                  
                  {/* Share Options */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Share Summary</h3>
                    
                    {/* Copy to Clipboard */}
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(summary);
                          alert('Summary copied to clipboard!');
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105 shadow-md mr-3"
                      >
                        📋 Copy to Clipboard
                      </button>
                    </div>

                    {/* Email Sharing */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h4 className="text-md font-medium mb-3 text-gray-600 dark:text-gray-400">Send via Email</h4>
                      <div className="flex flex-wrap items-end gap-4 mb-4">
                        <div className="flex-grow">
                          <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email Recipients (comma separated)
                          </label>
                          <input
                            type="text"
                            id="recipients"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="recipient1@example.com, recipient2@example.com"
                            value={recipients}
                            onChange={(e) => setRecipients(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={handleSend}
                          disabled={isSending}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition transform hover:scale-105 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isSending ? 'Sending...' : '📧 Send Email'}
                        </button>
                      </div>
                      
                      {/* Result Display */}
                      {result && (
                        <div className={`mt-2 p-3 rounded-lg text-sm ${
                          result.error 
                            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700' 
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                        }`}>
                          {result.error ? (
                            <div className="flex items-center">
                              <span className="mr-2">❌</span>
                              <span>Error: {result.error}</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="mr-2">✅</span>
                              <span>{result.message}</span>
                              {result.successful && result.failed !== undefined && (
                                <span className="ml-2 text-xs">
                                  ({result.successful} sent, {result.failed} failed)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
