/* Toxic Trait Tribunal - Text Message Tribunal Mechanic */
(function() {
  'use strict';

  // ============================================================
  // I18N HELPERS
  // ============================================================
  function getI18n() {
    try {
      if (typeof i18n !== 'undefined') return i18n;
    } catch (e) { /* silent */ }
    return null;
  }

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

  function fmt(template, values) {
    return template.replace(/\{(\w+)\}/g, function(_, k) {
      return values[k] !== undefined ? values[k] : '{' + k + '}';
    });
  }

  // ============================================================
  // ARCHETYPE DEFINITIONS
  // ============================================================
  // 8 Toxic Archetypes (mapped as "verdicts")
  var ARCHETYPES = {
    puppeteer:    { emoji: '\uD83C\uDFAD', dims: ['manipulation', 'deflection'] },
    ghost:        { emoji: '\uD83D\uDC7B', dims: ['avoidance', 'passive_aggression'] },
    victim:       { emoji: '\uD83D\uDE22', dims: ['deflection', 'volatility'] },
    prosecutor:   { emoji: '\u2696\uFE0F', dims: ['passive_aggression', 'projection'] },
    spy:          { emoji: '\uD83D\uDD75\uFE0F', dims: ['surveillance', 'jealousy'] },
    saboteur:     { emoji: '\uD83D\uDCA3', dims: ['avoidance', 'volatility'] },
    mirror:       { emoji: '\uD83E\uDE9E', dims: ['projection', 'manipulation'] },
    thermometer:  { emoji: '\uD83C\uDF21\uFE0F', dims: ['volatility', 'jealousy'] }
  };

  var DIMENSIONS = [
    'manipulation', 'passive_aggression', 'deflection',
    'avoidance', 'jealousy', 'volatility', 'projection', 'surveillance'
  ];

  var DIM_CSS = {
    manipulation: 'manipulation',
    passive_aggression: 'passive-aggression',
    deflection: 'deflection',
    avoidance: 'avoidance',
    jealousy: 'jealousy',
    volatility: 'volatility',
    projection: 'projection',
    surveillance: 'surveillance'
  };

  // ============================================================
  // SCENARIO DATA
  // Phase 1: 8 text message conversations
  // Each has 3 options, each mapped to dimension scores
  // ============================================================
  var TEXT_SCENARIOS = [
    {
      id: 'msg1',
      avatar: '\uD83D\uDE4D',
      options: [
        { dims: {} },                                       // understanding (clean)
        { dims: { manipulation: 2, passive_aggression: 1 } }, // guilt-trip
        { dims: { avoidance: 2, passive_aggression: 1 } }    // silent treatment
      ]
    },
    {
      id: 'msg2',
      avatar: '\uD83D\uDC91',
      options: [
        { dims: {} },                                         // open
        { dims: { deflection: 2, volatility: 1 } },           // defensive
        { dims: { projection: 2, deflection: 1 } }            // deflect with accusation
      ]
    },
    {
      id: 'msg3',
      avatar: '\uD83D\uDCBC',
      options: [
        { dims: { volatility: 1 } },                          // confront (mild)
        { dims: { passive_aggression: 2, manipulation: 1 } },  // gossip
        { dims: { passive_aggression: 2, deflection: 1 } }     // passive-aggressive email
      ]
    },
    {
      id: 'msg4',
      avatar: '\uD83D\uDC94',
      options: [
        { dims: { avoidance: 1 } },                           // ignore (mild avoidance)
        { dims: { manipulation: 2, volatility: 1 } },         // play along
        { dims: { surveillance: 1, projection: 1 } }           // screenshot to friends
      ]
    },
    {
      id: 'msg5',
      avatar: '\uD83C\uDF89',
      options: [
        { dims: {} },                                         // celebrate (clean)
        { dims: { jealousy: 2, projection: 1 } },             // compare
        { dims: { passive_aggression: 1, jealousy: 1 } }       // minimize
      ]
    },
    {
      id: 'msg6',
      avatar: '\uD83D\uDCF1',
      options: [
        { dims: {} },                                         // let it go (clean)
        { dims: { surveillance: 1, volatility: 1 } },         // double text
        { dims: { volatility: 2, projection: 1 } }             // confront aggressively
      ]
    },
    {
      id: 'msg7',
      avatar: '\uD83D\uDCAC',
      options: [
        { dims: {} },                                         // ask why (clean)
        { dims: { manipulation: 2, passive_aggression: 1 } },  // create rival chat
        { dims: { deflection: 2, manipulation: 1 } }           // play victim
      ]
    },
    {
      id: 'msg8',
      avatar: '\uD83D\uDE28',
      options: [
        { dims: {} },                                         // mature response (clean)
        { dims: { volatility: 2, avoidance: 1 } },             // catastrophize
        { dims: { avoidance: 2, deflection: 1 } }              // avoid
      ]
    }
  ];

  // Phase 2: 4 social media posts
  // 4 emoji reactions each, mapped to dimensions
  var SOCIAL_SCENARIOS = [
    {
      id: 'social1',
      avatarEmoji: '\uD83C\uDFD6\uFE0F',
      reactions: [
        { emoji: '\uD83D\uDE0D', dims: {} },                           // heart eyes (clean)
        { emoji: '\uD83D\uDE24', dims: { jealousy: 2, volatility: 1 } },  // angry
        { emoji: '\uD83D\uDE44', dims: { passive_aggression: 2 } },       // eye roll
        { emoji: '\uD83D\uDC80', dims: { projection: 1, avoidance: 1 } }  // skull
      ]
    },
    {
      id: 'social2',
      avatarEmoji: '\uD83D\uDCAA',
      reactions: [
        { emoji: '\uD83D\uDE0D', dims: {} },                                  // genuinely happy
        { emoji: '\uD83D\uDE24', dims: { jealousy: 2, volatility: 1 } },       // angry/envious
        { emoji: '\uD83D\uDE44', dims: { passive_aggression: 1, projection: 1 } }, // eye roll
        { emoji: '\uD83D\uDC80', dims: { manipulation: 1, deflection: 1 } }     // skull (dismissive)
      ]
    },
    {
      id: 'social3',
      avatarEmoji: '\uD83D\uDE36',
      reactions: [
        { emoji: '\uD83D\uDE0D', dims: { manipulation: 1 } },                  // like it (sus)
        { emoji: '\uD83D\uDE24', dims: { volatility: 2, projection: 1 } },       // it's about me!
        { emoji: '\uD83D\uDE44', dims: {} },                                    // eye roll (healthy)
        { emoji: '\uD83D\uDC80', dims: { passive_aggression: 1, surveillance: 1 } } // dead
      ]
    },
    {
      id: 'social4',
      avatarEmoji: '\uD83D\uDC6B',
      reactions: [
        { emoji: '\uD83D\uDE0D', dims: {} },                                    // genuinely happy
        { emoji: '\uD83D\uDE24', dims: { jealousy: 2, surveillance: 1 } },        // angry/jealous
        { emoji: '\uD83D\uDE44', dims: { passive_aggression: 1, deflection: 1 } },// eye roll
        { emoji: '\uD83D\uDC80', dims: { avoidance: 1, volatility: 1 } }          // skull
      ]
    }
  ];

  var TOTAL_ROUNDS = TEXT_SCENARIOS.length + SOCIAL_SCENARIOS.length; // 12

  // ============================================================
  // APP STATE
  // ============================================================
  var currentRound = 0;
  var dimScores = {};
  var toxicCount = 0; // how many "toxic" (non-clean) answers

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
      el.classList.remove('fade-in');
      void el.offsetWidth;
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
      document.documentElement.setAttribute('data-theme', 'light');
      if (icon) icon.textContent = '\uD83C\uDF19';
    }
    var btn = $('themeToggle');
    if (btn) {
      btn.addEventListener('click', function() {
        var isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('theme', 'dark');
          if (icon) icon.textContent = '\u2600\uFE0F';
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
          localStorage.setItem('theme', 'light');
          if (icon) icon.textContent = '\uD83C\uDF19';
        }
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

  // ============================================================
  // START
  // ============================================================
  function initStart() {
    var btn = $('startBtn');
    if (btn) {
      btn.addEventListener('click', function() {
        resetState();
        hideScreen('start-screen');
        showScreen('quiz-screen');
        renderRound(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  function resetState() {
    currentRound = 0;
    toxicCount = 0;
    dimScores = {};
    DIMENSIONS.forEach(function(d) { dimScores[d] = 0; });
  }

  // ============================================================
  // ROUND RENDERING
  // ============================================================
  function renderRound(idx) {
    currentRound = idx;
    updateMeter();

    var container = $('scenarioContainer');
    if (!container) return;
    container.innerHTML = '';

    if (idx < TEXT_SCENARIOS.length) {
      // Phase 1: Text Message
      updatePhaseLabel('messages');
      renderTextScenario(container, TEXT_SCENARIOS[idx], idx);
    } else {
      // Phase 2: Social Media
      var sIdx = idx - TEXT_SCENARIOS.length;
      updatePhaseLabel('social');
      renderSocialScenario(container, SOCIAL_SCENARIOS[sIdx], idx);
    }
  }

  function updatePhaseLabel(phase) {
    var icon = $('phaseIcon');
    var text = $('phaseText');
    if (phase === 'messages') {
      if (icon) icon.textContent = '\uD83D\uDCAC';
      if (text) text.textContent = t('phase.messages');
    } else {
      if (icon) icon.textContent = '\uD83D\uDCF1';
      if (text) text.textContent = t('phase.social');
    }
  }

  function updateMeter() {
    var bar = $('toxMeterBar');
    var count = $('roundCount');
    if (bar) {
      var pct = (currentRound / TOTAL_ROUNDS) * 100;
      bar.style.width = pct + '%';
    }
    if (count) {
      var template = t('meter.count');
      if (template === 'meter.count') template = '{current} / {total}';
      count.textContent = fmt(template, { current: currentRound + 1, total: TOTAL_ROUNDS });
    }
  }

  // ============================================================
  // TEXT MESSAGE SCENARIO (Phase 1)
  // ============================================================
  function renderTextScenario(container, scenario, roundIdx) {
    var chatDiv = document.createElement('div');
    chatDiv.className = 'chat-container fade-in';

    // Chat header
    var header = document.createElement('div');
    header.className = 'chat-header';
    header.innerHTML = '<div class="chat-avatar">' + scenario.avatar + '</div>' +
      '<div><div class="chat-name">' + t('scenarios.' + scenario.id + '.name') + '</div>' +
      '<div class="chat-status">' + t('chat.online') + '</div></div>';
    chatDiv.appendChild(header);

    // Chat body with message bubbles
    var body = document.createElement('div');
    body.className = 'chat-body';

    // Timestamp
    var ts = document.createElement('div');
    ts.className = 'chat-timestamp';
    ts.textContent = t('chat.today');
    body.appendChild(ts);

    // Their message(s) - can have multiple bubbles
    var msgs = t('scenarios.' + scenario.id + '.messages');
    if (typeof msgs === 'string') msgs = [msgs];
    if (Array.isArray(msgs)) {
      msgs.forEach(function(msg) {
        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble theirs';
        bubble.textContent = msg;
        body.appendChild(bubble);
      });
    } else {
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble theirs';
      bubble.textContent = t('scenarios.' + scenario.id + '.messages');
      body.appendChild(bubble);
    }

    chatDiv.appendChild(body);

    // Reply options
    var replyDiv = document.createElement('div');
    replyDiv.className = 'reply-options';

    scenario.options.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.className = 'reply-option';
      btn.textContent = t('scenarios.' + scenario.id + '.options.' + i);
      btn.addEventListener('click', function() {
        handleTextReply(chatDiv, body, replyDiv, btn, opt, roundIdx, i);
      });
      replyDiv.appendChild(btn);
    });

    chatDiv.appendChild(replyDiv);
    container.appendChild(chatDiv);
  }

  function handleTextReply(chatDiv, body, replyDiv, btn, opt, roundIdx, optIdx) {
    // Disable all reply buttons
    var allBtns = replyDiv.querySelectorAll('.reply-option');
    allBtns.forEach(function(b) { b.classList.add('disabled'); });
    btn.classList.add('selected');

    // Add the user's reply as a bubble
    var myBubble = document.createElement('div');
    myBubble.className = 'chat-bubble mine';
    myBubble.textContent = btn.textContent;
    body.appendChild(myBubble);

    // Apply scores
    applyDimScores(opt.dims);

    // Determine if toxic
    var isToxic = Object.keys(opt.dims).length > 0;
    if (isToxic) toxicCount++;

    // Show stamp
    setTimeout(function() {
      showStamp(chatDiv, isToxic);
    }, 400);

    // Advance after delay
    setTimeout(function() {
      if (currentRound < TOTAL_ROUNDS - 1) {
        renderRound(currentRound + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showVerdictScreen();
      }
    }, 1400);
  }

  // ============================================================
  // SOCIAL MEDIA SCENARIO (Phase 2)
  // ============================================================
  function renderSocialScenario(container, scenario, roundIdx) {
    var postDiv = document.createElement('div');
    postDiv.className = 'social-post fade-in';

    // Post header
    var header = document.createElement('div');
    header.className = 'social-post-header';
    header.innerHTML = '<div class="social-avatar">' + scenario.avatarEmoji + '</div>' +
      '<div class="social-user-info">' +
      '<div class="social-username">' + t('scenarios.' + scenario.id + '.username') + '</div>' +
      '<div class="social-handle">' + t('scenarios.' + scenario.id + '.handle') + '</div>' +
      '</div>';
    postDiv.appendChild(header);

    // Post image area (optional)
    var hasImage = t('scenarios.' + scenario.id + '.image');
    if (hasImage && hasImage !== 'scenarios.' + scenario.id + '.image') {
      var imgDiv = document.createElement('div');
      imgDiv.className = 'social-post-image';
      imgDiv.textContent = hasImage;
      postDiv.appendChild(imgDiv);
    }

    // Post content
    var content = document.createElement('div');
    content.className = 'social-post-content';
    content.textContent = t('scenarios.' + scenario.id + '.content');
    postDiv.appendChild(content);

    // Engagement stats
    var engagement = document.createElement('div');
    engagement.className = 'social-engagement';
    engagement.textContent = t('scenarios.' + scenario.id + '.engagement');
    postDiv.appendChild(engagement);

    // Reaction bar
    var reactionBar = document.createElement('div');
    reactionBar.className = 'reaction-bar';

    scenario.reactions.forEach(function(reaction, i) {
      var btn = document.createElement('button');
      btn.className = 'reaction-btn';
      btn.textContent = reaction.emoji;
      btn.setAttribute('aria-label', reaction.emoji);
      btn.addEventListener('click', function() {
        handleReaction(postDiv, reactionBar, btn, reaction, roundIdx);
      });
      reactionBar.appendChild(btn);
    });

    postDiv.appendChild(reactionBar);
    container.appendChild(postDiv);
  }

  function handleReaction(postDiv, reactionBar, btn, reaction, roundIdx) {
    // Disable all
    var allBtns = reactionBar.querySelectorAll('.reaction-btn');
    allBtns.forEach(function(b) { b.classList.add('disabled'); });
    btn.classList.add('selected');

    // Apply scores
    applyDimScores(reaction.dims);

    var isToxic = Object.keys(reaction.dims).length > 0;
    if (isToxic) toxicCount++;

    // Show stamp
    setTimeout(function() {
      showStamp(postDiv, isToxic);
    }, 300);

    // Advance
    setTimeout(function() {
      if (currentRound < TOTAL_ROUNDS - 1) {
        renderRound(currentRound + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showVerdictScreen();
      }
    }, 1200);
  }

  // ============================================================
  // SCORING
  // ============================================================
  function applyDimScores(dims) {
    if (!dims) return;
    Object.keys(dims).forEach(function(d) {
      dimScores[d] = (dimScores[d] || 0) + dims[d];
    });
  }

  // ============================================================
  // STAMP ANIMATION
  // ============================================================
  function showStamp(containerEl, isToxic) {
    // Remove existing stamp if any
    var existing = containerEl.querySelector('.stamp-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'stamp-overlay';
    var stamp = document.createElement('div');
    stamp.className = 'stamp ' + (isToxic ? 'toxic' : 'clean');
    stamp.textContent = isToxic ? t('stamp.toxic') : t('stamp.clean');
    overlay.appendChild(stamp);
    containerEl.appendChild(overlay);
  }

  // ============================================================
  // VERDICT / RESULT
  // ============================================================
  function showVerdictScreen() {
    hideScreen('quiz-screen');
    showScreen('result-screen');

    // Determine dominant archetype
    var archetypeScores = {};
    Object.keys(ARCHETYPES).forEach(function(key) {
      var arch = ARCHETYPES[key];
      var score = 0;
      arch.dims.forEach(function(d) {
        score += dimScores[d] || 0;
      });
      archetypeScores[key] = score;
    });

    var sorted = Object.keys(archetypeScores).sort(function(a, b) {
      return archetypeScores[b] - archetypeScores[a];
    });

    var primary = sorted[0];
    var archData = ARCHETYPES[primary];

    // Emoji
    var emojiEl = $('resultEmoji');
    if (emojiEl) emojiEl.textContent = archData.emoji;

    // Title
    var titleEl = $('resultTitle');
    if (titleEl) titleEl.textContent = t('archetypes.' + primary + '.title');

    // Desc
    var descEl = $('resultDesc');
    if (descEl) descEl.textContent = t('archetypes.' + primary + '.desc');

    // Defense brief
    var defenseEl = $('defenseText');
    if (defenseEl) defenseEl.textContent = t('archetypes.' + primary + '.defense');

    // Overall toxicity percentage (40-90 range for drama)
    var totalDim = 0;
    var maxPossible = 0;
    DIMENSIONS.forEach(function(d) {
      totalDim += dimScores[d] || 0;
    });
    // Max possible ~36 (if every answer is maximally toxic)
    maxPossible = 36;
    var rawPct = totalDim / maxPossible * 100;
    var toxicity = Math.round(35 + (rawPct / 100) * 55);
    if (toxicity > 92) toxicity = 92;
    if (toxicity < 35) toxicity = 35;

    // Animate meter
    var meterFill = $('meterFill');
    var meterValue = $('meterValue');
    if (meterFill) {
      meterFill.style.width = '0%';
      setTimeout(function() {
        meterFill.style.width = toxicity + '%';
      }, 300);
    }
    if (meterValue) {
      animateCounter(meterValue, 0, toxicity, 1200);
    }

    // Breakdown bars
    renderBreakdown();

    // Percentile stat
    var pStat = $('percentile-stat');
    if (pStat) {
      var pctVal = Math.floor(Math.random() * 12) + 6;
      var template = t('result.percentileStat');
      if (template === 'result.percentileStat') template = 'Only <strong>{percent}%</strong> of participants share your toxic trait profile';
      pStat.innerHTML = template.replace('{percent}', pctVal);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // GA4 event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'test_complete', {
        event_category: 'toxic_trait_tribunal',
        primary_trait: primary,
        toxicity_level: toxicity
      });
    }
  }

  function renderBreakdown() {
    var container = $('breakdownBars');
    if (!container) return;
    container.innerHTML = '';

    // Sort dimensions by score
    var sortedDims = DIMENSIONS.slice().sort(function(a, b) {
      return (dimScores[b] || 0) - (dimScores[a] || 0);
    });

    sortedDims.forEach(function(dim) {
      var score = dimScores[dim] || 0;
      // Max single dim ~8
      var pct = Math.min(Math.round((score / 8) * 100), 100);

      var row = document.createElement('div');
      row.className = 'tox-dimension';

      var header = document.createElement('div');
      header.className = 'tox-dim-header';

      var name = document.createElement('span');
      name.className = 'tox-dim-name';
      name.textContent = t('dimensions.' + dim);

      var value = document.createElement('span');
      value.className = 'tox-dim-value';
      value.textContent = pct + '%';

      header.appendChild(name);
      header.appendChild(value);

      var barBg = document.createElement('div');
      barBg.className = 'tox-dim-bar-bg';
      var bar = document.createElement('div');
      bar.className = 'tox-dim-bar ' + (DIM_CSS[dim] || dim);

      row.appendChild(header);
      barBg.appendChild(bar);
      row.appendChild(barBg);
      container.appendChild(row);

      // Animate
      setTimeout(function() {
        bar.style.width = pct + '%';
      }, 400);
    });
  }

  function animateCounter(el, from, to, duration) {
    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
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
        var archetypeScores = {};
        Object.keys(ARCHETYPES).forEach(function(key) {
          var arch = ARCHETYPES[key];
          var score = 0;
          arch.dims.forEach(function(d) {
            score += dimScores[d] || 0;
          });
          archetypeScores[key] = score;
        });
        var sorted = Object.keys(archetypeScores).sort(function(a, b) {
          return archetypeScores[b] - archetypeScores[a];
        });
        var primary = sorted[0];
        var archData = ARCHETYPES[primary];

        var shareTemplate = t('share.text');
        if (shareTemplate === 'share.text') shareTemplate = 'The Tribunal found me guilty: {trait} {emoji} What\'s your verdict?';

        var traitTitle = t('archetypes.' + primary + '.title');
        var text = fmt(shareTemplate, { trait: traitTitle, emoji: archData.emoji });

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
        resetState();
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

    var inst = getI18n();
    if (inst && typeof inst.loadTranslations === 'function') {
      var lang = inst.currentLang || 'en';
      inst.loadTranslations(lang).then(function() {
        inst.updateUI();
        var langLabel = $('currentLang');
        var langNames = {
          ko: '\uD55C\uAD6D\uC5B4', en: 'English', ja: '\u65E5\u672C\u8A9E', zh: '\u4E2D\u6587',
          es: 'Espa\u00F1ol', pt: 'Portugu\u00EAs', de: 'Deutsch', fr: 'Fran\u00E7ais',
          hi: '\u0939\u093F\u0928\u094D\u0926\u0940', ru: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
          id: 'Indonesia', tr: 'T\u00FCrk\u00E7e'
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
