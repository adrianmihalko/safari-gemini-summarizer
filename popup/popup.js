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
    settingsKeyInput: document.getElementById('settings-key-input'),
    refreshModelsBtn: document.getElementById('refresh-models-btn'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    cancelSettingsBtn: document.getElementById('cancel-settings-btn'),
    settingsStatus: document.getElementById('settings-status'),

    currentModelDisplay: document.getElementById('current-model-display'),
    summarizeBtn: document.getElementById('summarize-btn'),
    loading: document.getElementById('loading'),
    resultSection: document.getElementById('result-section'),
    summaryContent: document.getElementById('summary-content'),
    mainError: document.getElementById('main-error')
  };

  // --- State ---
  let state = {
    apiKey: '',
    models: [],
    selectedModel: 'gemini-1.5-flash',
    theme: 'light' // 'light' or 'dark'
  };

  // --- Initialization ---
  loadState();

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
      await savePreferences(key, models, models[0]); // Default to first
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
  });

  // Settings: Cancel
  els.cancelSettingsBtn.addEventListener('click', () => {
    if (state.apiKey) showMain();
    else showView('setup');
  });

  // Settings: Refresh Models
  els.refreshModelsBtn.addEventListener('click', async () => {
    const key = els.settingsKeyInput.value.trim() || state.apiKey;
    if (!key) return;

    els.settingsStatus.textContent = "Fetching...";
    try {
      const models = await fetchModelsFromBackground(key);
      state.models = models;
      state.selectedModel = pickAvailableModel(models, state.selectedModel);
      populateModelDropdown(models, state.selectedModel);
      els.settingsStatus.textContent = "Models refreshed.";
    } catch (err) {
      els.settingsStatus.textContent = "Error fetching models.";
      console.error(err);
    }
  });

  // Settings: Save
  els.saveSettingsBtn.addEventListener('click', async () => {
    const newKey = els.settingsKeyInput.value.trim();
    const newModel = els.settingsModelSelect.value;
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
        await savePreferences(keyToUse, modelsToSave, selectedModel);
        showMain();
    } catch (err) {
        els.settingsStatus.textContent = "Invalid Key or Network Error.";
    }
  });

  // Main: Summarize
  els.summarizeBtn.addEventListener('click', async () => {
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

      sendMessage({
        action: "callGemini",
        text: pageText,
        apiKey: state.apiKey,
        model: state.selectedModel
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
  });


  // --- Logic Helpers ---

  function loadState() {
    storageGet(['geminiApiKey', 'geminiModels', 'geminiSelectedModel', 'geminiTheme'], (res) => {
      const data = res || {};
      state.theme = data.geminiTheme === 'dark' ? 'dark' : 'light';
      applyTheme(state.theme);
      
      if (data.geminiApiKey) {
        state.apiKey = data.geminiApiKey;
        state.models = data.geminiModels || ['gemini-1.5-flash'];
        state.selectedModel = data.geminiSelectedModel || state.models[0];
        showMain();
      } else {
        showView('setup');
      }
    });
  }

  async function savePreferences(key, models, selectedModel) {
    return new Promise((resolve) => {
      const data = {
        geminiApiKey: key,
        geminiModels: models,
        geminiSelectedModel: selectedModel
      };
      storageSet(data, () => {
        state.apiKey = key;
        state.models = models;
        state.selectedModel = selectedModel;
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
    } else {
      els.settingsBtn.classList.add('hidden');
    }
  }

  function populateSettingsUI() {
    els.settingsKeyInput.value = state.apiKey;
    populateModelDropdown(state.models, state.selectedModel);
    els.settingsStatus.textContent = '';
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

  function pickAvailableModel(models, selected) {
    if (!models || models.length === 0) return selected || 'gemini-1.5-flash';
    if (selected && models.includes(selected)) return selected;
    return models[0];
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
  }
});
