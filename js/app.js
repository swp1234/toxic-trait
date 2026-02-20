/* Toxic Trait Detector - Main App Logic */
(function() {
  'use strict';

  // Get the i18n instance (supports both window.i18n and global const i18n)
  function getI18n() {
    try {
      // The i18n.js may use window.i18n or const i18n at global scope
      if (typeof i18n !== 'undefined') return i18n;
    } catch (e) { /* silent */ }
    return null;
  }

  // i18n helper with try-catch
  function t(key) {
    try {
      var inst = getI18n();
      if (inst && typeof inst.t === 'function') {
        var val = inst.t(key);
        return (val && val !== key) ? val : key;
      }
    } catch (e) { /* silent */ }
    return key;
  }

  // Format template string: replaces {key} with values
  function fmt(template, values) {
    return template.replace(/\{(\w+)\}/g, function(_, k) {
      return values[k] !== undefined ? values[k] : '{' + k + '}';
    });
  }

  // ============================================================
  // QUESTION DATA
  // Each option maps to 1-2 archetypes
  // ============================================================
  var QUESTIONS = [
    { id: 'q1',  options: { a: ['sponge','pleaser'], b: ['jealous'], c: ['control','overthinker'], d: [] } },
    { id: 'q2',  options: { a: ['overthinker'], b: ['passive'], c: ['overthinker','jealous'], d: [] } },
    { id: 'q3',  options: { a: ['overthinker','control'], b: ['pleaser','passive'], c: ['ghost'], d: [] } },
    { id: 'q4',  options: { a: ['sponge'], b: ['mainchar'], c: ['control'], d: [] } },
    { id: 'q5',  options: { a: ['overthinker'], b: ['passive'], c: ['mainchar'], d: [] } },
    { id: 'q6',  options: { a: ['overthinker','control'], b: ['passive','ghost'], c: ['passive'], d: [] } },
    { id: 'q7',  options: { a: ['jealous','overthinker'], b: ['passive','jealous'], c: ['mainchar'], d: [] } },
    { id: 'q8',  options: { a: ['pleaser'], b: ['control'], c: ['passive'], d: [] } },
    { id: 'q9',  options: { a: ['control'], b: ['passive','pleaser'], c: ['mainchar'], d: [] } },
    { id: 'q10', options: { a: ['overthinker','sponge'], b: ['passive'], c: ['ghost'], d: [] } },
    { id: 'q11', options: { a: ['jealous'], b: ['sponge'], c: ['mainchar'], d: [] } },
    { id: 'q12', options: { a: ['overthinker'], b: ['ghost'], c: ['control'], d: [] } }
  ];

  var ARCHETYPES = ['overthinker','passive','mainchar','sponge','control','ghost','jealous','pleaser'];

  var ARCHETYPE_META = {
    overthinker: { emoji: '🧠' },
    passive:     { emoji: '😏' },
    mainchar:    { emoji: '👑' },
    sponge:      { emoji: '🧽' },
    control:     { emoji: '🎮' },
    ghost:       { emoji: '👻' },
    jealous:     { emoji: '👀' },
    pleaser:     { emoji: '🤝' }
  };

  // ============================================================
  // APP STATE
  // ============================================================
  var currentQuestion = 0;
  var answers = [];
  var scores = {};

  // ============================================================
  // DOM HELPERS
  // ============================================================
  function $(id) { return document.getElementById(id); }

  function hideScreen(id) {
    var el = $(id);
    if (el) el.style.display = 'none';
  }

  function showScreen(id) {
    var el = $(id);
    if (el) {
      el.style.display = 'block';
      el.classList.add('fade-in');
    }
  }

  // ============================================================
  // THEME TOGGLE
  // ============================================================
  function initTheme() {
    var saved = localStorage.getItem('theme');
    var icon = $('themeIcon');
    if (saved === 'light') {
      document.body.classList.add('light-mode');
      if (icon) icon.textContent = '🌙';
    }
    var btn = $('themeToggle');
    if (btn) {
      btn.addEventListener('click', function() {
        document.body.classList.toggle('light-mode');
        var isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        if (icon) icon.textContent = isLight ? '🌙' : '☀️';
      });
    }
  }

  // ============================================================
  // LANGUAGE SELECTOR
  // ============================================================
  function initLangSelector() {
    var langBtn = $('langBtn');
    var dropdown = $('langDropdown');
    if (!langBtn || !dropdown) return;

    langBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    var options = document.querySelectorAll('.lang-option');
    options.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var lang = btn.dataset.lang;
        var inst = getI18n();
        if (inst && typeof inst.setLanguage === 'function') {
          inst.setLanguage(lang).then(function() {
            updateLangLabel(btn);
            refreshCurrentView();
          });
        }
        dropdown.classList.remove('open');
      });
    });

    document.addEventListener('click', function() {
      dropdown.classList.remove('open');
    });
  }

  function updateLangLabel(btn) {
    var label = $('currentLang');
    if (label) {
      var parts = btn.textContent.trim().split(' ');
      label.textContent = parts.slice(1).join(' ') || parts[0];
    }
  }

  function refreshCurrentView() {
    var quizScreen = $('quiz-screen');
    if (quizScreen && quizScreen.style.display !== 'none') {
      renderQuestion(currentQuestion);
    }
    var resultScreen = $('result-screen');
    if (resultScreen && resultScreen.style.display !== 'none') {
      showResult();
    }
  }

  // ============================================================
  // START SCREEN
  // ============================================================
  function initStart() {
    var btn = $('startBtn');
    if (btn) {
      btn.addEventListener('click', function() {
        currentQuestion = 0;
        answers = [];
        scores = {};
        ARCHETYPES.forEach(function(a) { scores[a] = 0; });
        hideScreen('start-screen');
        showScreen('quiz-screen');
        renderQuestion(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ============================================================
  // QUIZ LOGIC
  // ============================================================
  function renderQuestion(idx) {
    var q = QUESTIONS[idx];
    var total = QUESTIONS.length;

    // Progress
    var pct = ((idx) / total * 100);
    var bar = $('progressBar');
    if (bar) bar.style.width = pct + '%';
    var pText = $('progressText');
    if (pText) {
      var template = t('question.progress');
      if (template === 'question.progress') template = '{current} / {total}';
      pText.textContent = fmt(template, { current: idx + 1, total: total });
    }

    // Question number
    var qNum = $('qNumber');
    if (qNum) qNum.textContent = 'Q' + (idx + 1);

    // Question text
    var qText = $('qText');
    if (qText) qText.textContent = t('questions.' + q.id + '.text');

    // Build choices
    var container = $('choiceContainer');
    if (!container) return;
    container.innerHTML = '';

    var labels = ['A', 'B', 'C', 'D'];
    var keys = ['a', 'b', 'c', 'd'];

    keys.forEach(function(key, i) {
      var btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.setAttribute('aria-pressed', 'false');

      var labelSpan = document.createElement('span');
      labelSpan.className = 'choice-label';
      labelSpan.setAttribute('aria-hidden', 'true');
      labelSpan.textContent = labels[i];

      var textSpan = document.createElement('span');
      textSpan.textContent = t('questions.' + q.id + '.' + key);

      btn.appendChild(labelSpan);
      btn.appendChild(textSpan);

      // Check if previously answered
      if (answers[idx] === key) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      }

      btn.addEventListener('click', function() {
        selectAnswer(idx, key);
      });

      container.appendChild(btn);
    });

    // Animate card
    var card = $('questionCard');
    if (card) {
      card.classList.remove('fade-in');
      void card.offsetWidth; // reflow
      card.classList.add('fade-in');
    }
  }

  function selectAnswer(idx, key) {
    answers[idx] = key;

    // Update scores: add archetype points for this choice
    var q = QUESTIONS[idx];
    var archetypes = q.options[key];

    // Mark selected visually
    var btns = document.querySelectorAll('#choiceContainer .choice-btn');
    btns.forEach(function(btn, i) {
      var k = ['a','b','c','d'][i];
      btn.classList.toggle('selected', k === key);
      btn.setAttribute('aria-pressed', k === key ? 'true' : 'false');
    });

    // Auto-advance after short delay
    setTimeout(function() {
      if (currentQuestion < QUESTIONS.length - 1) {
        currentQuestion++;
        renderQuestion(currentQuestion);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        calculateAndShowResult();
      }
    }, 350);
  }

  // ============================================================
  // RESULT CALCULATION
  // ============================================================
  function calculateAndShowResult() {
    // Reset scores
    scores = {};
    ARCHETYPES.forEach(function(a) { scores[a] = 0; });

    // Tally scores from all answers
    QUESTIONS.forEach(function(q, idx) {
      var ans = answers[idx];
      if (ans) {
        var archetypes = q.options[ans];
        if (archetypes) {
          archetypes.forEach(function(a) {
            scores[a] = (scores[a] || 0) + 1;
          });
        }
      }
    });

    showResult();
  }

  function showResult() {
    // Recalculate if needed
    if (!scores || Object.keys(scores).length === 0) {
      scores = {};
      ARCHETYPES.forEach(function(a) { scores[a] = 0; });
      QUESTIONS.forEach(function(q, idx) {
        var ans = answers[idx];
        if (ans) {
          var archetypes = q.options[ans];
          if (archetypes) {
            archetypes.forEach(function(a) {
              scores[a] = (scores[a] || 0) + 1;
            });
          }
        }
      });
    }

    // Sort archetypes by score
    var sorted = ARCHETYPES.slice().sort(function(a, b) {
      return (scores[b] || 0) - (scores[a] || 0);
    });

    var primary = sorted[0];
    var secondary = sorted[1];
    var meta = ARCHETYPE_META[primary];
    var secMeta = ARCHETYPE_META[secondary];

    // Result hero
    var emoji = $('resultEmoji');
    if (emoji) emoji.textContent = t('archetypes.' + primary + '.emoji') !== 'archetypes.' + primary + '.emoji'
      ? t('archetypes.' + primary + '.emoji') : meta.emoji;

    var title = $('resultTitle');
    if (title) title.textContent = t('archetypes.' + primary + '.title');

    var desc = $('resultDesc');
    if (desc) desc.textContent = t('archetypes.' + primary + '.desc');

    // Toxicity meter: pseudo-score between 40-90 for drama
    var totalPts = 0;
    ARCHETYPES.forEach(function(a) { totalPts += scores[a] || 0; });
    var rawPct = totalPts > 0 ? ((scores[primary] || 0) / totalPts * 100) : 50;
    // Map to 40-90 range for dramatic effect
    var toxicity = Math.round(40 + (rawPct / 100) * 50);
    if (toxicity > 90) toxicity = 90;
    if (toxicity < 40) toxicity = 40;

    var meterFill = $('meterFill');
    var meterValue = $('meterValue');
    if (meterFill) {
      meterFill.style.width = '0%';
      setTimeout(function() {
        meterFill.style.width = toxicity + '%';
      }, 200);
    }
    if (meterValue) {
      // Animate counter
      animateCounter(meterValue, 0, toxicity, 1200);
    }

    // Secondary trait
    var secEl = $('secondaryTrait');
    if (secEl) {
      var secTemplate = t('result.secondary');
      if (secTemplate === 'result.secondary') secTemplate = 'Secondary trait: {trait}';
      var secTitle = t('archetypes.' + secondary + '.title');
      var secEmoji = secMeta.emoji;
      secEl.textContent = secEmoji + ' ' + fmt(secTemplate, { trait: secTitle });
    }

    // Show result screen
    hideScreen('quiz-screen');
    showScreen('result-screen');

    // Set progress bar to 100%
    var bar = $('progressBar');
    if (bar) bar.style.width = '100%';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // GA4 event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'test_complete', {
        event_category: 'toxic_trait',
        primary_trait: primary,
        toxicity_level: toxicity
      });
    }
  }

  function animateCounter(el, from, to, duration) {
    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      // Ease out
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(from + (to - from) * eased);
      el.textContent = current + '%';
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ============================================================
  // SHARE
  // ============================================================
  function initShare() {
    var twitterBtn = $('shareTwitterBtn');
    if (twitterBtn) {
      twitterBtn.addEventListener('click', function() {
        var sorted = ARCHETYPES.slice().sort(function(a, b) {
          return (scores[b] || 0) - (scores[a] || 0);
        });
        var primary = sorted[0];
        var meta = ARCHETYPE_META[primary];

        var shareTemplate = t('share.text');
        if (shareTemplate === 'share.text') shareTemplate = 'My toxic trait: {trait} {emoji} What\'s yours?';

        var traitTitle = t('archetypes.' + primary + '.title');
        var text = fmt(shareTemplate, { trait: traitTitle, emoji: meta.emoji });

        var url = encodeURIComponent(window.location.href);
        var tweetText = encodeURIComponent(text);
        window.open('https://twitter.com/intent/tweet?url=' + url + '&text=' + tweetText, '_blank', 'noopener');
      });
    }

    var copyBtn = $('shareCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        var url = window.location.href;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function() {
            showCopiedMsg();
          }).catch(function() {
            prompt('Copy:', url);
          });
        } else {
          prompt('Copy:', url);
        }
      });
    }
  }

  function showCopiedMsg() {
    var msg = $('copiedMsg');
    if (msg) {
      msg.classList.add('show');
      setTimeout(function() { msg.classList.remove('show'); }, 2000);
    }
  }

  // ============================================================
  // RETAKE
  // ============================================================
  function initRetake() {
    var btn = $('retakeBtn');
    if (btn) {
      btn.addEventListener('click', function() {
        currentQuestion = 0;
        answers = [];
        scores = {};
        hideScreen('result-screen');
        showScreen('start-screen');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ============================================================
  // APP LOADER
  // ============================================================
  function hideLoader() {
    var loader = $('app-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(function() { loader.remove(); }, 400);
    }
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    initTheme();
    initLangSelector();
    initStart();
    initShare();
    initRetake();

    // Load i18n
    var inst = getI18n();
    if (inst && typeof inst.loadTranslations === 'function') {
      var lang = inst.currentLang || 'en';
      inst.loadTranslations(lang).then(function() {
        inst.updateUI();
        // Update lang label
        var langLabel = $('currentLang');
        var langNames = {
          ko: '한국어', en: 'English', ja: '日本語', zh: '中文',
          es: 'Español', pt: 'Português', de: 'Deutsch', fr: 'Français',
          hi: 'हिन्दी', ru: 'Русский', id: 'Indonesia', tr: 'Türkçe'
        };
        if (langLabel && langNames[lang]) langLabel.textContent = langNames[lang];
        hideLoader();
      }).catch(function() {
        hideLoader();
      });
    } else {
      hideLoader();
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
