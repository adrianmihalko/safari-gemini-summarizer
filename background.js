// background.js

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Listen for messages from the popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callGemini") {
    summarizeText(request.text, request.apiKey, request.model, request.language, request.prompt)
      .then(summary => sendResponse({ success: true, data: summary }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }

  if (request.action === "getModels") {
    fetchModels(request.apiKey)
      .then(models => sendResponse({ success: true, data: models }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }
});

async function fetchModels(apiKey) {
  const url = `${BASE_URL}/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(message || `Failed to fetch models: ${response.status}`);
    }
    const data = await response.json();
    if (!data.models) return [];

    // Filter for models that support 'generateContent'
    return data.models.filter(m => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes("generateContent")
    ).map(m => m.name.replace("models/", "")); // Return just the ID, e.g., "gemini-1.5-flash"
    
  } catch (error) {
    console.error("Model Fetch Error:", error);
    throw error;
  }
}

async function summarizeText(text, apiKey, model, language, prompt) {
  // Default to a known stable model if none provided
  const modelId = model || "gemini-1.5-flash"; 
  const API_URL = `${BASE_URL}/models/${modelId}:generateContent?key=${apiKey}`;

  // Truncate text to avoid token limits (rough estimate)
  const truncatedText = text.substring(0, 30000); 
  const languageInstruction = buildLanguageInstruction(language);
  const promptText = normalizePrompt(prompt);

  const requestBody = {
    contents: [{
      parts: [{
        text: `${promptText} ${languageInstruction}\n\n${truncatedText}`
      }]
    }]
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the text from the response
    const summary = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!summary) {
      throw new Error("No summary generated.");
    }

    return summary;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

function buildLanguageInstruction(language) {
  if (!language || language === 'auto') {
    return 'Write the summary in the same language as the source content.';
  }
  return `Write the summary in ${language}.`;
}

function normalizePrompt(prompt) {
  if (!prompt || !prompt.trim()) {
    return 'Please provide a concise summary of the following web page content using markdown formatting.';
  }
  return prompt.trim();
}

async function readErrorMessage(response) {
  try {
    const data = await response.json();
    return data?.error?.message || JSON.stringify(data);
  } catch (err) {
    try {
      const text = await response.text();
      return text || null;
    } catch (readErr) {
      return null;
    }
  }
}
