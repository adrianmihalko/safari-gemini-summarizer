document.addEventListener('DOMContentLoaded', () => {
  const ext = globalThis.browser;
  if (!ext) {
    console.warn('Extension API not available.');
  }
  // --- UI References ---
  const views = {
    setup: document.getElementById('setup-view'),
    settings: document.getElementById('settings-view'),
    main: document.getElementById('main-view')
  };

  const els = {
    apiKeyInput: document.getElementById('api-key-input'),
    setupLoading: document.getElementById('setup-loading'),
    saveKeyBtn: document.getElementById('save-key-btn'),
    setupError: document.getElementById('setup-error'),
    
    settingsBtn: document.getElementById('settings-toggle-btn'),
    themeBtn: document.getElementById('theme-toggle-btn'),
    settingsModelSelect: document.getElementById('settings-model-select'),
    settingsLanguageSelect: document.getElementById('settings-language-select'),
    settingsPromptSelect: document.getElementById('settings-prompt-select'),
    settingsPromptInput: document.getElementById('settings-prompt-input'),
    resetPromptBtn: document.getElementById('reset-prompt-btn'),
    settingsKeyInput: document.getElementById('settings-key-input'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    settingsStatus: document.getElementById('settings-status'),

    currentModelDisplay: document.getElementById('current-model-display'),
    currentLanguageDisplay: document.getElementById('current-language-display'),
    summarizeBtn: document.getElementById('summarize-btn'),
    loading: document.getElementById('loading'),
    resultSection: document.getElementById('result-section'),
    summaryContent: document.getElementById('summary-content'),
    copySummaryBtn: document.getElementById('copy-summary-btn'),
    copyStatus: document.getElementById('copy-status'),
    mainError: document.getElementById('main-error')
  };

  // --- State ---
  const DEFAULT_LANGUAGE = 'auto';
  const DEFAULT_PROMPT = 'Please provide a concise summary of the following web page content using markdown formatting.';
  const DEFAULT_PROMPT_OPTIONS = [
    {
      id: 'executive',
      label: 'Quick Overview',
      text: 'Summarize the content of this page into a structured executive summary. Please include:\n\nOne-sentence hook: What is the main thesis or purpose?\n\nCore Pillars: 3-5 bullet points of the most important arguments or facts.\n\nKey Takeaway: The single most important piece of information for a reader to remember.'
    },
    {
      id: 'nutshell',
      label: 'Nutshell (TL;DR)',
      text: "Provide a TL;DR summary of this page in under 100 words. Focus only on the 'what' and the 'why,' avoiding fluff or introductory language."
    },
    {
      id: 'action',
      label: 'Action-Oriented',
      text: 'Analyze this page and extract a list of actionable steps. Format it as a checklist. If the author mentions specific tools or resources, list those separately at the end.'
    },
    {
      id: 'skeptic',
      label: "Skeptic's Summary",
      text: "Summarize this article, but specifically highlight:\n\nThe author's primary claim.\n\nThe evidence provided to support that claim.\n\nAny potential biases or gaps in the logic that are apparent."
    }
  ];
  const DEFAULT_PROMPT_SELECTION = 'executive';
  const LANGUAGE_OPTIONS = [
    { value: 'auto', label: 'Auto (same as page)' },
    { value: 'Afrikaans', label: 'Afrikaans' },
    { value: 'Albanian', label: 'Albanian' },
    { value: 'Amharic', label: 'Amharic' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Armenian', label: 'Armenian' },
    { value: 'Azerbaijani', label: 'Azerbaijani' },
    { value: 'Basque', label: 'Basque' },
    { value: 'Belarusian', label: 'Belarusian' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Bosnian', label: 'Bosnian' },
    { value: 'Bulgarian', label: 'Bulgarian' },
    { value: 'Catalan', label: 'Catalan' },
    { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
    { value: 'Chinese (Traditional)', label: 'Chinese (Traditional)' },
    { value: 'Croatian', label: 'Croatian' },
    { value: 'Czech', label: 'Czech' },
    { value: 'Danish', label: 'Danish' },
    { value: 'Dutch', label: 'Dutch' },
    { value: 'English', label: 'English' },
    { value: 'Estonian', label: 'Estonian' },
    { value: 'Filipino', label: 'Filipino' },
    { value: 'Finnish', label: 'Finnish' },
    { value: 'French', label: 'French' },
    { value: 'Galician', label: 'Galician' },
    { value: 'Georgian', label: 'Georgian' },
    { value: 'German', label: 'German' },
    { value: 'Greek', label: 'Greek' },
    { value: 'Gujarati', label: 'Gujarati' },
    { value: 'Haitian Creole', label: 'Haitian Creole' },
    { value: 'Hebrew', label: 'Hebrew' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Hungarian', label: 'Hungarian' },
    { value: 'Icelandic', label: 'Icelandic' },
    { value: 'Indonesian', label: 'Indonesian' },
    { value: 'Irish', label: 'Irish' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Kannada', label: 'Kannada' },
    { value: 'Kazakh', label: 'Kazakh' },
    { value: 'Khmer', label: 'Khmer' },
    { value: 'Korean', label: 'Korean' },
    { value: 'Kurdish', label: 'Kurdish' },
    { value: 'Kyrgyz', label: 'Kyrgyz' },
    { value: 'Lao', label: 'Lao' },
    { value: 'Latvian', label: 'Latvian' },
    { value: 'Lithuanian', label: 'Lithuanian' },
    { value: 'Macedonian', label: 'Macedonian' },
    { value: 'Malay', label: 'Malay' },
    { value: 'Malayalam', label: 'Malayalam' },
    { value: 'Maltese', label: 'Maltese' },
    { value: 'Marathi', label: 'Marathi' },
    { value: 'Mongolian', label: 'Mongolian' },
    { value: 'Nepali', label: 'Nepali' },
    { value: 'Norwegian', label: 'Norwegian' },
    { value: 'Persian', label: 'Persian' },
    { value: 'Polish', label: 'Polish' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Punjabi', label: 'Punjabi' },
    { value: 'Romanian', label: 'Romanian' },
    { value: 'Russian', label: 'Russian' },
    { value: 'Serbian', label: 'Serbian' },
    { value: 'Sinhala', label: 'Sinhala' },
    { value: 'Slovak', label: 'Slovak' },
    { value: 'Slovenian', label: 'Slovenian' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'Swahili', label: 'Swahili' },
    { value: 'Swedish', label: 'Swedish' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'Thai', label: 'Thai' },
    { value: 'Turkish', label: 'Turkish' },
    { value: 'Ukrainian', label: 'Ukrainian' },
    { value: 'Urdu', label: 'Urdu' },
    { value: 'Uzbek', label: 'Uzbek' },
    { value: 'Vietnamese', label: 'Vietnamese' },
    { value: 'Welsh', label: 'Welsh' },
    { value: 'Yiddish', label: 'Yiddish' },
    { value: 'Zulu', label: 'Zulu' }
  ];

  let state = {
    apiKey: '',
    models: [],
    selectedModel: 'gemini-1.5-flash',
    theme: 'light', // 'light' or 'dark'
    language: DEFAULT_LANGUAGE,
    prompt: DEFAULT_PROMPT,
    promptOptions: DEFAULT_PROMPT_OPTIONS,
    selectedPromptId: DEFAULT_PROMPT_SELECTION,
    lastSummary: ''
  };

  // --- Initialization ---
  loadState();
  initPopupSizing();

  // --- Event Listeners ---

  // Theme Toggle
  els.themeBtn.addEventListener('click', () => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    state.theme = nextTheme;
    applyTheme(nextTheme);
    storageSet({ geminiTheme: nextTheme });
  });

  // Setup View
  els.saveKeyBtn.addEventListener('click', async () => {
    const key = els.apiKeyInput.value.trim();
    if (!key) {
      showError(els.setupError, "Please enter an API Key.");
      return;
    }
    
    els.setupLoading.classList.remove('hidden');
    els.saveKeyBtn.disabled = true;
    els.setupError.classList.add('hidden');

    try {
      const models = await fetchModelsFromBackground(key);
      if (models.length === 0) {
        throw new Error("No compatible models found. Check permissions or key.");
      }
      
      // Save
      await savePreferences(key, models, models[0], DEFAULT_LANGUAGE, DEFAULT_PROMPT); // Default to first model + language + prompt
      showMain();

    } catch (err) {
      showError(els.setupError, err.message);
    } finally {
      els.setupLoading.classList.add('hidden');
      els.saveKeyBtn.disabled = false;
    }
  });

  // Settings Toggle
  els.settingsBtn.addEventListener('click', () => {
    populateSettingsUI();
    showView('settings');
    refreshModelsInSettings();
  });

  // Settings: Save
  els.saveSettingsBtn.addEventListener('click', async () => {
    const newKey = els.settingsKeyInput.value.trim();
    const newModel = els.settingsModelSelect.value;
    const newLanguage = els.settingsLanguageSelect.value;
    const newPrompt = getPromptForSelection().trim() || DEFAULT_PROMPT;
    const keyToUse = newKey || state.apiKey;
    
    if (!keyToUse) {
      els.settingsStatus.textContent = "API Key cannot be empty.";
      return;
    }

    try {
        let modelsToSave = state.models;
        if (newKey && newKey !== state.apiKey) {
             modelsToSave = await fetchModelsFromBackground(newKey);
        }

        const selectedModel = pickAvailableModel(modelsToSave, newModel);
        populateModelDropdown(modelsToSave, selectedModel);
        await savePreferences(keyToUse, modelsToSave, selectedModel, newLanguage, newPrompt);
        showMain();
    } catch (err) {
        els.settingsStatus.textContent = "Invalid Key or Network Error.";
    }
  });

  // Settings: Reset Prompt
  els.resetPromptBtn.addEventListener('click', () => {
    resetSelectedPrompt();
    els.settingsStatus.textContent = 'Prompt reset to default.';
  });

  // Settings: Prompt Selection
  els.settingsPromptSelect.addEventListener('change', () => {
    state.selectedPromptId = els.settingsPromptSelect.value;
    applyPromptSelection();
    syncPromptSelections();
  });

  // Settings: Prompt Edit
  els.settingsPromptInput.addEventListener('input', () => {
    updatePromptOptionText(state.selectedPromptId, els.settingsPromptInput.value);
    syncPromptSelections();
  });

  // Main: Summarize
  els.summarizeBtn.addEventListener('click', () => {
    handleSummarize();
  });

  // Main: Copy Summary
  els.copySummaryBtn.addEventListener('click', async () => {
    if (!state.lastSummary) return;
    const ok = await copyText(state.lastSummary);
    if (ok) {
      showStatus(els.copyStatus, 'Copied');
    } else {
      showStatus(els.copyStatus, 'Copy failed');
    }
  });


  // --- Logic Helpers ---

  function loadState() {
    storageGet(['geminiApiKey', 'geminiModels', 'geminiSelectedModel', 'geminiTheme', 'geminiLanguage', 'geminiPrompt', 'geminiPromptOptions', 'geminiSelectedPromptId'], (res) => {
      const data = res || {};
      state.theme = data.geminiTheme === 'dark' ? 'dark' : 'light';
      applyTheme(state.theme);
      
      if (data.geminiApiKey) {
        state.apiKey = data.geminiApiKey;
        state.models = data.geminiModels || ['gemini-1.5-flash'];
        state.selectedModel = data.geminiSelectedModel || state.models[0];
        state.language = normalizeLanguage(data.geminiLanguage);
        state.prompt = normalizePrompt(data.geminiPrompt);
        state.promptOptions = normalizePromptOptions(data.geminiPromptOptions);
        state.selectedPromptId = normalizePromptSelection(data.geminiSelectedPromptId, state.promptOptions);
        showMain();
      } else {
        showView('setup');
      }
    });
  }

  async function savePreferences(key, models, selectedModel, language, prompt) {
    return new Promise((resolve) => {
      const data = {
        geminiApiKey: key,
        geminiModels: models,
        geminiSelectedModel: selectedModel,
        geminiLanguage: normalizeLanguage(language),
        geminiPrompt: normalizePrompt(prompt),
        geminiPromptOptions: state.promptOptions,
        geminiSelectedPromptId: state.selectedPromptId
      };
      storageSet(data, () => {
        state.apiKey = key;
        state.models = models;
        state.selectedModel = selectedModel;
        state.language = normalizeLanguage(language);
        state.prompt = normalizePrompt(prompt);
        resolve();
      });
    });
  }

  function applyTheme(theme) {
    const icon = theme === 'dark' ? '🌙' : '☀️';
    els.themeBtn.textContent = icon;
    els.themeBtn.title = theme === 'dark' ? 'Theme: Dark' : 'Theme: Light';
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
    }
  }

  function fetchModelsFromBackground(apiKey) {
    return sendMessage({ action: "getModels", apiKey })
      .then((res) => {
        if (res && res.success) return res.data;
        throw new Error(res?.error || "Failed to fetch models");
      });
  }

  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!ext) {
        reject(new Error('Extension API not available.'));
        return;
      }
      let maybePromise;
      try {
        maybePromise = ext.runtime.sendMessage(message, (res) => {
          const err = ext.runtime.lastError;
          if (err) {
            reject(new Error(err.message));
            return;
          }
          resolve(res);
        });
      } catch (err) {
        maybePromise = ext.runtime.sendMessage(message);
      }
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve, (err) => reject(new Error(err?.message || String(err))));
      }
    });
  }

  function storageGet(keys, cb) {
    if (!ext) {
      cb({});
      return;
    }
    let maybePromise;
    try {
      maybePromise = ext.storage.local.get(keys, cb);
    } catch (err) {
      maybePromise = ext.storage.local.get(keys);
    }
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(cb);
    }
  }

  function storageSet(data, cb) {
    if (!ext) {
      if (cb) cb();
      return;
    }
    let maybePromise;
    try {
      maybePromise = ext.storage.local.set(data, cb);
    } catch (err) {
      maybePromise = ext.storage.local.set(data);
    }
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(() => cb && cb());
    }
  }

  function tabsQuery(queryInfo) {
    return new Promise((resolve, reject) => {
      if (!ext) {
        reject(new Error('Extension API not available.'));
        return;
      }
      let maybePromise;
      try {
        maybePromise = ext.tabs.query(queryInfo, (tabs) => {
          const err = ext.runtime.lastError;
          if (err) {
            reject(new Error(err.message));
            return;
          }
          resolve(tabs);
        });
      } catch (err) {
        maybePromise = ext.tabs.query(queryInfo);
      }
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve, (err) => reject(new Error(err?.message || String(err))));
      }
    });
  }

  function executeScript(details) {
    return new Promise((resolve, reject) => {
      if (!ext) {
        reject(new Error('Extension API not available.'));
        return;
      }
      let maybePromise;
      try {
        maybePromise = ext.scripting.executeScript(details, (results) => {
          const err = ext.runtime.lastError;
          if (err) {
            reject(new Error(err.message));
            return;
          }
          resolve(results);
        });
      } catch (err) {
        maybePromise = ext.scripting.executeScript(details);
      }
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(resolve, (err) => reject(new Error(err?.message || String(err))));
      }
    });
  }


  // --- UI Helpers ---

  function displayResult(markdownText) {
      state.lastSummary = markdownText || '';
      // Parse markdown, then sanitize before injecting.
      if (typeof marked !== 'undefined') {
          const rawHtml = marked.parse(markdownText, { mangle: false, headerIds: false });
          els.summaryContent.innerHTML = sanitizeHtml(rawHtml);
      } else {
          // Fallback
          els.summaryContent.textContent = markdownText;
      }
      els.resultSection.classList.remove('hidden');
  }

  function showMain() {
    showView('main');
  }

  function showView(viewName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');

    if (viewName === 'main') {
      els.settingsBtn.classList.remove('hidden');
      els.currentModelDisplay.textContent = state.selectedModel;
      els.currentLanguageDisplay.textContent = getLanguageLabel(state.language);
    } else {
      els.settingsBtn.classList.add('hidden');
    }
  }

  function populateSettingsUI() {
    els.settingsKeyInput.value = state.apiKey;
    populateModelDropdown(state.models, state.selectedModel);
    populateLanguageDropdown(state.language);
    populatePromptDropdown(state.promptOptions, state.selectedPromptId, els.settingsPromptSelect);
    applyPromptSelection();
    els.settingsStatus.textContent = '';
  }

  async function refreshModelsInSettings() {
    const key = els.settingsKeyInput.value.trim() || state.apiKey;
    if (!key) return;

    els.settingsStatus.textContent = "Fetching...";
    try {
      const models = await fetchModelsFromBackground(key);
      state.models = models;
      state.selectedModel = pickAvailableModel(models, state.selectedModel);
      populateModelDropdown(models, state.selectedModel);
      els.settingsStatus.textContent = "";
    } catch (err) {
      els.settingsStatus.textContent = "Error fetching models.";
      console.error(err);
    }
  }

  function populateModelDropdown(models, selected) {
    els.settingsModelSelect.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === selected) opt.selected = true;
      els.settingsModelSelect.appendChild(opt);
    });
  }

  function populateLanguageDropdown(selected) {
    els.settingsLanguageSelect.innerHTML = '';
    LANGUAGE_OPTIONS.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      if (option.value === selected) opt.selected = true;
      els.settingsLanguageSelect.appendChild(opt);
    });
  }

  function populatePromptDropdown(options, selectedId, targetEl) {
    targetEl.innerHTML = '';
    options.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.id;
      opt.textContent = option.label;
      if (option.id === selectedId) opt.selected = true;
      targetEl.appendChild(opt);
    });
    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = 'Custom';
    if (selectedId === 'custom') customOpt.selected = true;
    targetEl.appendChild(customOpt);
  }

  function applyPromptSelection() {
    const selected = state.selectedPromptId;
    if (selected === 'custom') {
      if (els.settingsPromptInput) {
        els.settingsPromptInput.value = state.prompt;
      }
      return;
    }
    const promptOption = getPromptOptionById(selected);
    if (promptOption) {
      if (els.settingsPromptInput) {
        els.settingsPromptInput.value = promptOption.text;
      }
    } else {
      state.selectedPromptId = DEFAULT_PROMPT_SELECTION;
      const fallback = getPromptOptionById(DEFAULT_PROMPT_SELECTION);
      if (els.settingsPromptInput) {
        els.settingsPromptInput.value = fallback ? fallback.text : DEFAULT_PROMPT;
      }
    }
  }

  function getPromptOptionById(id) {
    return state.promptOptions.find(option => option.id === id);
  }

  function updatePromptOptionText(id, text) {
    if (id === 'custom') {
      state.prompt = normalizePrompt(text);
      return;
    }
    const option = getPromptOptionById(id);
    if (option) {
      option.text = text;
    }
  }

  function getPromptForSelection() {
    if (state.selectedPromptId === 'custom') {
      return state.prompt;
    }
    const option = getPromptOptionById(state.selectedPromptId);
    return option ? option.text : DEFAULT_PROMPT;
  }

  function resetSelectedPrompt() {
    if (state.selectedPromptId === 'custom') {
      state.prompt = DEFAULT_PROMPT;
      els.settingsPromptInput.value = DEFAULT_PROMPT;
      return;
    }
    const defaultOption = DEFAULT_PROMPT_OPTIONS.find(option => option.id === state.selectedPromptId);
    if (defaultOption) {
      updatePromptOptionText(state.selectedPromptId, defaultOption.text);
      els.settingsPromptInput.value = defaultOption.text;
      return;
    }
    els.settingsPromptInput.value = DEFAULT_PROMPT;
  }

  function syncPromptSelections() {
    if (els.settingsPromptSelect) {
      els.settingsPromptSelect.value = state.selectedPromptId;
    }
  }

  async function savePromptSelection() {
    return new Promise((resolve) => {
      const data = {
        geminiPromptOptions: state.promptOptions,
        geminiSelectedPromptId: state.selectedPromptId,
        geminiPrompt: normalizePrompt(getPromptForSelection())
      };
      storageSet(data, () => {
        state.prompt = normalizePrompt(getPromptForSelection());
        resolve();
      });
    });
  }

  function pickAvailableModel(models, selected) {
    if (!models || models.length === 0) return selected || 'gemini-1.5-flash';
    if (selected && models.includes(selected)) return selected;
    return models[0];
  }

  function normalizeLanguage(language) {
    if (!language) return DEFAULT_LANGUAGE;
    const values = LANGUAGE_OPTIONS.map(option => option.value);
    return values.includes(language) ? language : DEFAULT_LANGUAGE;
  }

  function normalizePrompt(prompt) {
    if (!prompt || !prompt.trim()) return DEFAULT_PROMPT;
    return prompt.trim();
  }

  function normalizePromptOptions(options) {
    if (!Array.isArray(options) || options.length === 0) {
      return DEFAULT_PROMPT_OPTIONS.map(option => ({ ...option }));
    }
    const normalized = options
      .filter(option => option && option.id && option.label)
      .map(option => ({
        id: String(option.id),
        label: String(option.label),
        text: normalizePrompt(option.text || DEFAULT_PROMPT)
      }));
    if (!normalized.length) {
      return DEFAULT_PROMPT_OPTIONS.map(option => ({ ...option }));
    }
    const updated = normalized.map((option) => {
      if (option.id === 'executive' && option.label === 'Executive Summary') {
        return { ...option, label: 'Quick Overview' };
      }
      return option;
    });
    return updated;
  }

  function normalizePromptSelection(selectedId, options) {
    if (!selectedId) return DEFAULT_PROMPT_SELECTION;
    if (selectedId === 'custom') return 'custom';
    const exists = options.some(option => option.id === selectedId);
    return exists ? selectedId : DEFAULT_PROMPT_SELECTION;
  }

  function getLanguageLabel(language) {
    const found = LANGUAGE_OPTIONS.find(option => option.value === language);
    return found ? found.label : language || DEFAULT_LANGUAGE;
  }

  function sanitizeHtml(rawHtml) {
    const template = document.createElement('template');
    template.innerHTML = rawHtml;

    const blockedTags = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base'];
    blockedTags.forEach((tag) => {
      template.content.querySelectorAll(tag).forEach((node) => node.remove());
    });

    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    for (let el = walker.nextNode(); el; el = walker.nextNode()) {
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }
        if ((name === 'href' || name === 'src' || name === 'xlink:href') && value.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    }

    return template.innerHTML;
  }

  function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function showLoading(isLoading) {
    if (isLoading) {
      els.loading.classList.remove('hidden');
      els.summarizeBtn.disabled = true;
      els.resultSection.classList.add('hidden');
      els.mainError.classList.add('hidden');
    } else {
      els.loading.classList.add('hidden');
      els.summarizeBtn.disabled = false;
    }
  }

  function resetMainUI() {
    els.mainError.classList.add('hidden');
    els.resultSection.classList.add('hidden');
    els.summaryContent.textContent = '';
    els.copyStatus.classList.add('hidden');
    els.copyStatus.textContent = '';
  }

  async function handleSummarize() {
    if (!state.apiKey || !els.loading.classList.contains('hidden')) {
      return;
    }
    resetMainUI();
    showLoading(true);

    try {
      const [tab] = await tabsQuery({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab.");

      const results = await executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText,
      });

      if (!results || !results[0] || !results[0].result) {
        throw new Error("Could not extract content.");
      }

      const pageText = results[0].result;
      state.prompt = normalizePrompt(getPromptForSelection());

      sendMessage({
        action: "callGemini",
        text: pageText,
        apiKey: state.apiKey,
        model: state.selectedModel,
        language: state.language,
        prompt: state.prompt
      }).then((response) => {
        showLoading(false);
        if (response && response.success) {
          displayResult(response.data);
        } else {
          showError(els.mainError, response.error || "Unknown error.");
        }
      }).catch((err) => {
        showLoading(false);
        showError(els.mainError, err.message);
      });

    } catch (err) {
      showLoading(false);
      showError(els.mainError, err.message);
    }
  }

  function showStatus(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => {
      el.classList.add('hidden');
      el.textContent = '';
    }, 1500);
  }

  async function copyText(text) {
    if (!text) return false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        return false;
      }
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch (err) {
      return false;
    }
  }

  function initPopupSizing() {
    const MIN_WIDTH = 320;
    const MIN_HEIGHT = 240;
    const MAX_WIDTH = 900;
    const MAX_HEIGHT = 900;

    storageGet(['geminiPopupWidth', 'geminiPopupHeight'], (res) => {
      const width = clampSize(res.geminiPopupWidth, MIN_WIDTH, MAX_WIDTH);
      const height = clampSize(res.geminiPopupHeight, MIN_HEIGHT, MAX_HEIGHT);
      if (width) document.body.style.width = `${width}px`;
      if (height) document.body.style.height = `${height}px`;
      setTimeout(() => {
        normalizePopupHeight(height, MIN_HEIGHT);
      }, 0);
    });

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      schedulePopupSizeSave(rect.width, rect.height, MIN_WIDTH, MIN_HEIGHT, MAX_WIDTH, MAX_HEIGHT);
    });
    observer.observe(document.body);
  }

  let sizeSaveTimer;
  function schedulePopupSizeSave(width, height, minW, minH, maxW, maxH) {
    clearTimeout(sizeSaveTimer);
    sizeSaveTimer = setTimeout(() => {
      const clampedWidth = clampSize(width, minW, maxW);
      const clampedHeight = clampSize(height, minH, maxH);
      storageSet({
        geminiPopupWidth: clampedWidth,
        geminiPopupHeight: clampedHeight
      });
    }, 200);
  }

  function clampSize(value, min, max) {
    const number = Number(value);
    if (!number || Number.isNaN(number)) return null;
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function normalizePopupHeight(savedHeight, minHeight) {
    const container = document.querySelector('.container');
    const measured = container ? container.scrollHeight + 24 : document.body.scrollHeight;
    const contentHeight = Math.max(measured, minHeight);
    if (savedHeight && savedHeight > contentHeight + 40) {
      document.body.style.height = `${contentHeight}px`;
      storageSet({ geminiPopupHeight: contentHeight });
    }
  }
});
