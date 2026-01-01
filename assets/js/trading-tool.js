// Trading Tool Page JavaScript

// --- DATA & CONFIG ---
const emotions = [
    // Negative / Risk (Red)
    { name: '愤怒', type: 'risk', en: 'Angry', advice: '反思：是什么导致你今天愤怒？这会如何影响你的交易？\n警示：愤怒会导致冲动交易和报复性交易。建议在做决策前先冷静下来。' },
    { name: '焦虑', type: 'risk', en: 'Anxious', advice: '反思：是什么让你对今天的交易感到焦虑？\n建议：焦虑通常源于不确定性。请检查交易计划，确保仓位大小符合你的风险承受能力。' },
    { name: '恐惧', type: 'risk', en: 'Fearful', advice: '反思：是什么导致你今天恐惧？这会如何影响交易？\n建议：恐惧是自然反应，但不应驱动决策。无论情绪如何，请坚持交易计划和风险管理规则。' },
    { name: '贪婪', type: 'risk', en: 'Greedy', advice: '反思：今天你将如何保持自律的风险管理？\n警示：贪婪会导致过度交易和重仓。请牢记仓位规则和盈利目标。' },
    { name: '困倦', type: 'risk', en: 'Sleepy', advice: '反思：疲劳会如何影响你今天的决策？\n建议：交易需要敏锐的头脑。考虑缩小交易规模或通过休息来保持警觉。' },

    // Adjustment (Gray)
    { name: '不自信', type: 'adjustment', en: 'Lack of Confidence', advice: '反思：交易计划中的哪些方面让你感到不确定？\n建议：缺乏信心往往源于不够清晰。重新检查计划，并在恢复确定性之前考虑缩小仓位。' },

    // Positive / Ideal (Green)
    { name: '自信', type: 'positive', en: 'Confident', advice: '反思：在拥有自信的同时，你将如何保持纪律？\n建议：自信虽好，但要防止演变为自负。请严格执行交易计划和风险管理。' },
    { name: '专注', type: 'positive', en: 'Focused', advice: '反思：你今天交易时段的首要焦点是什么？\n建议：专注是理想的交易状态。利用这种清晰感来维持纪律。' },
    { name: '中立', type: 'positive', en: 'Neutral', advice: '反思：你今天对市场的总体看法是什么？\n建议：中立的情绪状态通常能带来更理性、基于计划的决策。' },
    { name: '放松', type: 'positive', en: 'Relaxed', advice: '反思：在保持冷静的同时，你将如何保持警觉？\n建议：放松有助于决策，但要确保维持专注，避免过于自满。' }
];

const selectedEmotions = new Set();

// Strategy Tags Data
let strategyTags = ['突破', '反转', '趋势跟踪', '区间震荡', '1分钟', '5分钟', '15分钟'];

// Tag Libraries (User customizable)
let tagLibraries = {
    strategy: ['1H趋势', '5min动量', '日线级别', '均线策略', '突破', '反转'],
    entry: ['支撑位反弹', '底背离', '突破颈线', '消息面利好', '趋势回踩', '放量突破'],
    exit: ['达到止盈目标', '跌破支撑', '时间止损', '情绪过热', '反向信号', '止损出局']
};
let currentLibraryType = '';

// ========== DUAL-LAYER TAG SYSTEM (双层标签架构) ==========
// Global Scope: 全局标签设置，对所有交易记录可见
// Local Scope: 局部标签设置，仅对当前交易记录有效

// 局部标签存储 (按交易记录ID存储)
let localTagInstances = {};

// 标签类别映射
const tagCategoryMap = {
    timeframes: { title: '时间框架', type: 'timeframes', globalKey: 'timeframes' },
    orderTypes: { title: '入场订单类型', type: 'orderTypes', globalKey: 'orderTypes' },
    strategy: { title: '策略/周期', type: 'strategy', globalKey: 'strategyTags' },
    entry: { title: '入场理由', type: 'entry', globalKey: 'entryTags' },
    exit: { title: '离场理由', type: 'exit', globalKey: 'exitTags' }
};

// 当前正在编辑的标签信息
let currentEditingTagInfo = {
    tradeId: null,
    categoryType: null,
    container: null
};

// Load config from localStorage on page load
function loadConfigFromStorage() {
    const savedConfig = localStorage.getItem('tradingToolConfig');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            if (config.tagLibraries) {
                tagLibraries = config.tagLibraries;
            }
            // Load global settings if exists
            if (config.globalSettings) {
                globalSettings = { ...globalSettings, ...config.globalSettings };
            }
            // Load local tag instances if exists
            if (config.localTagInstances) {
                localTagInstances = config.localTagInstances;
            }
        } catch (e) {
            console.warn('Failed to load config from localStorage:', e);
        }
    }
}

// ========== 获取标签列表（合并全局和局部） ==========
function getTagsForCategory(type, tradeId = null) {
    const category = tagCategoryMap[type];
    if (!category) return [];
    
    // 获取全局标签
    let globalTags = globalSettings[category.globalKey] || [];
    
    // 如果有交易ID，合并局部标签
    if (tradeId && localTagInstances[tradeId] && localTagInstances[tradeId][type]) {
        const localTags = localTagInstances[tradeId][type];
        // 去重合并
        const merged = [...new Set([...globalTags, ...localTags])];
        return merged;
    }
    
    return globalTags;
}

// ========== 添加标签到全局或局部 ==========
function addTagWithScope(tagName, type, scope = 'global', tradeId = null) {
    const category = tagCategoryMap[type];
    if (!category || !tagName.trim()) return false;
    
    tagName = tagName.trim();
    
    if (scope === 'global') {
        // 添加到全局
        if (!globalSettings[category.globalKey].includes(tagName)) {
            globalSettings[category.globalKey].push(tagName);
            saveToLocalStorage();
            // 同步刷新自定义模板面板中的标签显示
            syncTagDisplayToSettings(category.globalKey);
            return true;
        }
    } else if (scope === 'local' && tradeId) {
        // 添加到局部
        if (!localTagInstances[tradeId]) {
            localTagInstances[tradeId] = {};
        }
        if (!localTagInstances[tradeId][type]) {
            localTagInstances[tradeId][type] = [];
        }
        if (!localTagInstances[tradeId][type].includes(tagName)) {
            localTagInstances[tradeId][type].push(tagName);
            saveToLocalStorage();
            return true;
        }
    }
    return false;
}

// ========== REQUIREMENT 3: GLOBAL SETTINGS & TEMPLATE MANAGEMENT ==========

// Initialize settings panel on page load
function initializeSettingsPanel() {
    renderSettingsTags('strategyTags', globalSettings.strategyTags);
    renderSettingsTags('entryTags', globalSettings.entryTags);
    renderSettingsTags('exitTags', globalSettings.exitTags);
    renderGoalsList();
}

// Add tag from input button click
function addTagFromInput(type, inputId) {
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    if (!value) return;
    
    // Support comma-separated values
    const tags = value.split(',').map(t => t.trim()).filter(t => t);
    tags.forEach(tag => {
        if (!globalSettings[type].includes(tag)) {
            globalSettings[type].push(tag);
        }
    });
    
    input.value = '';
    renderSettingsTags(type, globalSettings[type]);
    saveToLocalStorage();
}

// Handle Enter key in settings input fields
function handleSettingsInputEnter(event, type, inputId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTagFromInput(type, inputId);
    }
}

// Add goal from settings
function addGoalFromSettings() {
    const titleInput = document.getElementById('goalTitleInput');
    const descInput = document.getElementById('goalDescInput');
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    
    if (!title) return;
    
    // Add to global settings
    if (!globalSettings.dailyGoals) {
        globalSettings.dailyGoals = [];
    }
    globalSettings.dailyGoals.push({ title, desc });
    
    // Also add to the current page goals container
    addGoalCard(title, desc);
    
    // Clear inputs and re-render
    titleInput.value = '';
    descInput.value = '';
    renderGoalsList();
    saveToLocalStorage();
}

// Render goals list in settings
function renderGoalsList() {
    const list = document.getElementById('goalsList');
    if (!list) return;
    
    const goals = globalSettings.dailyGoals || [];
    list.innerHTML = goals.map((goal, idx) => `
        <div class="settings-tag-item" style="display: flex; flex-direction: column; align-items: flex-start; padding: 8px 12px;">
            <div style="display: flex; width: 100%; justify-content: space-between; align-items: center;">
                <strong style="color: var(--text-primary);">${goal.title}</strong>
                <span class="settings-tag-remove" onclick="removeGoalItem(${idx})">×</span>
            </div>
            <small style="color: var(--text-secondary);">${goal.desc || ''}</small>
        </div>
    `).join('');
}

// Remove goal from settings
function removeGoalItem(index) {
    showConfirmDeleteModal('确定要删除此目标吗？', () => {
        globalSettings.dailyGoals.splice(index, 1);
        renderGoalsList();
        saveToLocalStorage();
    });
}

// Settings Modal Functions
function openSettingsModal() {
    // Re-render to show latest tags
    renderSettingsTags('strategyTags', globalSettings.strategyTags);
    renderSettingsTags('entryTags', globalSettings.entryTags);
    renderSettingsTags('exitTags', globalSettings.exitTags);
    renderGoalsList();
    document.getElementById('settingsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
    document.body.style.overflow = '';
}

// User Manual Modal Functions
function openUserManualModal() {
    document.getElementById('userManualModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUserManualModal() {
    document.getElementById('userManualModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Render tags in settings panel
function renderSettingsTags(type, items) {
    const listIdMap = {
        'strategyTags': 'strategyTagsList',
        'entryTags': 'entryTagsList',
        'exitTags': 'exitTagsList'
    };
    const listId = listIdMap[type];
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = items.map((item, idx) => `
        <div class="settings-tag-item">
            ${item}
            <span class="settings-tag-remove" onclick="removeSettingItem('${type}', ${idx})">×</span>
        </div>
    `).join('');
}

// Sync tag display to settings panel (双向同步)
function syncTagDisplayToSettings(globalKey) {
    renderSettingsTags(globalKey, globalSettings[globalKey]);
}

// Remove item from settings - 同步删除所有交易卡片中的该标签
function removeSettingItem(type, index) {
    showConfirmDeleteModal('确定要删除此标签吗？', () => {
        const removedTag = globalSettings[type][index];
        globalSettings[type].splice(index, 1);
        renderSettingsTags(type, globalSettings[type]);
        
        // 同步移除所有交易卡片中使用该标签的显示
        syncRemoveTagFromAllTrades(type, removedTag);
        
        saveToLocalStorage();
    });
}

// 同步从所有交易中移除已删除的全局标签
function syncRemoveTagFromAllTrades(type, tagName) {
    // 根据 globalKey 找到对应的 category type
    const categoryTypeMap = {
        'strategyTags': 'strategy',
        'entryTags': 'entry',
        'exitTags': 'exit'
    };
    const categoryType = categoryTypeMap[type];
    if (!categoryType) return;
    
    // 遍历所有交易卡片，移除标签容器中的该标签
    document.querySelectorAll('.trade-card-wrapper').forEach(card => {
        const container = card.querySelector(`.tag-section-panel[data-category="${categoryType}"] .tags-container`);
        if (container) {
            container.querySelectorAll('.tag-item').forEach(tagEl => {
                const tagText = tagEl.querySelector('.tag-text')?.textContent || tagEl.textContent.replace('×', '').trim();
                if (tagText === tagName && tagEl.classList.contains('global')) {
                    tagEl.remove();
                }
            });
        }
    });
}

// Save settings (simplified - now uses button-based adding)
function saveSettings() {
    saveToLocalStorage();
}

// Save to localStorage
function saveToLocalStorage() {
    const config = {
        tagLibraries: tagLibraries,
        globalSettings: globalSettings,
        localTagInstances: localTagInstances,
        exportDate: new Date().toISOString(),
        version: '3.0'
    };
    localStorage.setItem('tradingToolConfig', JSON.stringify(config));
}

// Export Template (包含全局和局部配置)
function exportTemplate() {
    const template = {
        global: {
            categories: {
                timeframes: globalSettings.timeframes,
                orderTypes: globalSettings.orderTypes,
                strategy: globalSettings.strategyTags,
                entry: globalSettings.entryTags,
                exit: globalSettings.exitTags
            }
        },
        local_instances: localTagInstances,
        tagLibraries: tagLibraries,
        exportDate: new Date().toISOString(),
        version: '3.0'
    };

    const dataStr = JSON.stringify(template, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `交易工具模板_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import Template
function importTemplate(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const template = JSON.parse(e.target.result);

            // 支持新格式 (v3.0)
            if (template.global && template.global.categories) {
                const cats = template.global.categories;
                globalSettings.symbols = cats.symbols || globalSettings.symbols;
                globalSettings.timeframes = cats.timeframes || globalSettings.timeframes;
                globalSettings.orderTypes = cats.orderTypes || globalSettings.orderTypes;
                globalSettings.strategyTags = cats.strategy || globalSettings.strategyTags;
                globalSettings.entryTags = cats.entry || globalSettings.entryTags;
                globalSettings.exitTags = cats.exit || globalSettings.exitTags;
                initializeSettingsPanel();
            }
            // 兼容旧格式 (v2.0)
            else if (template.globalSettings) {
                globalSettings = template.globalSettings;
                initializeSettingsPanel();
            }
            
            if (template.local_instances) {
                localTagInstances = template.local_instances;
            }
            if (template.tagLibraries) {
                tagLibraries = template.tagLibraries;
            }

            saveToLocalStorage();
            alert('模板导入成功！');
        } catch (error) {
            alert('JSON 解析失败：' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Load config from localStorage first
    loadConfigFromStorage();

    // Initialize settings panel
    initializeSettingsPanel();

    // Set Date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('zh-CN', options);

    // Render Emotions
    const emotionGrid = document.getElementById('emotionGrid');
    emotions.forEach(emo => {
        const chip = document.createElement('div');
        chip.className = `emotion-chip ${emo.type}`;
        chip.textContent = emo.name;
        chip.onclick = () => toggleEmotion(chip, emo);
        emotionGrid.appendChild(chip);
    });

    // Load goals from globalSettings
    const goals = globalSettings.dailyGoals || [];
    goals.forEach(goal => {
        addGoalCard(goal.title, goal.desc);
    });
});

// --- MORNING PREP LOGIC ---
function toggleEmotion(element, emotionData) {
    if (selectedEmotions.has(emotionData)) {
        selectedEmotions.delete(emotionData);
        element.classList.remove('selected');
    } else {
        if (selectedEmotions.size >= 3) {
            alert('最多只能选择3种情绪');
            return;
        }
        selectedEmotions.add(emotionData);
        element.classList.add('selected');
    }
}

function confirmEmotions() {
    if (selectedEmotions.size === 0) {
        alert('请至少选择一种情绪状态');
        return;
    }

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = '';

    selectedEmotions.forEach(emo => {
        const block = document.createElement('div');
        block.style.marginBottom = '12px';
        block.innerHTML = `
            <h4 style="color: var(--accent-color); margin-bottom: 8px;">${emo.name} (${emo.en})</h4>
            <p style="white-space: pre-line; line-height: 1.6; color: var(--text-primary);">${emo.advice}</p>
        `;
        modalContent.appendChild(block);
    });

    document.getElementById('adviceModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('adviceModal').style.display = 'none';
}

// --- GOALS LOGIC ---
function openGoalModal() {
    document.getElementById('newGoalTitle').value = '';
    document.getElementById('newGoalDesc').value = '';
    document.getElementById('goalModal').style.display = 'flex';
    document.getElementById('newGoalTitle').focus();
}

function closeGoalModal() {
    document.getElementById('goalModal').style.display = 'none';
}

function confirmAddGoal() {
    const title = document.getElementById('newGoalTitle').value.trim();
    const desc = document.getElementById('newGoalDesc').value.trim();
    if (title) {
        // Add to globalSettings and save
        if (!globalSettings.dailyGoals) {
            globalSettings.dailyGoals = [];
        }
        globalSettings.dailyGoals.push({ title, desc });
        saveToLocalStorage();
        
        addGoalCard(title, desc);
        closeGoalModal();
    }
}

function addGoalCard(name, desc) {
    const container = document.getElementById('goalsContainer');
    const div = document.createElement('div');
    div.className = 'goal-card';
    div.innerHTML = `
        <div class="goal-title">${name}</div>
        <div class="goal-desc">${desc || ''}</div>
        <div class="goal-delete" onclick="deleteGoalCard(this)">✕</div>
    `;
    container.appendChild(div);
}

function deleteGoalCard(element) {
    const card = element.parentElement;
    showConfirmDeleteModal('确定要删除此目标吗？', () => {
        card.remove();
    });
}

// --- INTRADAY LOG LOGIC ---
let tradeCount = 0;

// Global Settings Data
let globalSettings = {
    symbols: ['NQ', 'ES', 'YM', 'GC', 'CL', 'EUR/USD'],
    timeframes: ['15S', '1M', '3M', '5M', '15M', '30M', '1H'],
    orderTypes: ['限价单', '突破单', '市价单'],
    strategyTags: ['突破', '反转', '趋势跟踪', '区间震荡', '1分钟', '5分钟', '15分钟'],
    entryTags: ['支撑位反弹', '底背离', '突破颈线', '消息面利好', '趋势回踩', '放量突破'],
    exitTags: ['达到止盈目标', '跌破支撑', '时间止损', '情绪过热', '反向信号', '止损出局'],
    dailyGoals: [
        { title: '拒绝FOMO', desc: '耐心等待设置出现' },
        { title: '风险管理', desc: '单笔亏损不超过2%' }
    ]
};

// 生成唯一交易ID
function generateTradeId() {
    return 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 创建标签面板HTML
function createTagSectionHTML(tradeId, type, title) {
    return `
        <div class="tag-section-panel" data-category="${type}">
            <div class="tag-section-header" onclick="toggleTagSection(this)">
                <div class="header-left">
                    <span class="chevron">▶</span>
                    <span class="header-title">${title}</span>
                </div>
                <button class="tag-library-btn" onclick="event.stopPropagation(); openEnhancedTagLibrary('${type}', '${tradeId}')">管理</button>
            </div>
            <div class="tag-section-content">
                <div class="tag-section-inner">
                    <div class="tag-container" data-tag-type="${type}" data-trade-id="${tradeId}">
                        <input type="text" class="tag-input" placeholder="点击选择标签" onclick="openEnhancedTagSelector(this.parentElement, '${type}', '${tradeId}')" onfocus="openEnhancedTagSelector(this.parentElement, '${type}', '${tradeId}')">
                    </div>
                    <div class="tag-area-separator">
                        <span>或输入备注</span>
                    </div>
                    <textarea class="free-text-area" placeholder="在此输入文字详细备注..."></textarea>
                </div>
            </div>
        </div>
    `;
}

function addTradeRow() {
    document.getElementById('emptyState').style.display = 'none';
    const container = document.getElementById('tradesContainer');
    // Get current count of trades to assign correct number
    tradeCount = document.querySelectorAll('.trade-card-wrapper').length + 1;
    
    // 生成唯一交易ID
    const tradeId = generateTradeId();

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    // Generate dropdown options
    const symbolOptions = globalSettings.symbols.map(s => `<option value="${s}">${s}</option>`).join('');
    const timeframeOptions = globalSettings.timeframes.map(t => `<option value="${t}">${t}</option>`).join('');
    const orderTypeOptions = globalSettings.orderTypes.map(o => `<option value="${o}">${o}</option>`).join('');

    const tradeCard = document.createElement('div');
    tradeCard.className = 'trade-card-wrapper';
    tradeCard.style.position = 'relative';
    tradeCard.dataset.tradeId = tradeId;

    tradeCard.innerHTML = `
        <div style="padding: 20px;">
            <!-- Trade Header: Number + Delete Button -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-size: 18px; font-weight: 400; margin: 0; color: #000000;"> <span style="font-weight: 800; font-size: 20px;">${tradeCount}</span></h3>
                <button class="btn-icon" onclick="deleteTradeCard(this)" title="删除" style="color: var(--danger-color);">✕</button>
            </div>

            <!-- Basic Info Row -->
            <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; margin-bottom: 16px;">
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">时间</label>
                    <input type="time" class="input-field" value="${timeStr}" style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">品种</label>
                    <input type="text" class="input-field symbol-input" placeholder="NQ / ES / GC..." style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">方向</label>
                    <select class="select-field" style="width: 100%; padding: 8px; font-size: 14px;">
                        <option value="Long">多</option>
                        <option value="Short">空</option>
                    </select>
                </div>
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">手数</label>
                    <input type="number" class="input-field" placeholder="0.01" step="0.01" style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">实际盈亏比</label>
                    <input type="number" class="input-field r-input" placeholder="1.31" step="0.01" style="width: 100%; padding: 8px; font-size: 14px;" onchange="updateStats()">
                </div>
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">预计止损 ($)</label>
                    <input type="number" class="input-field stop-loss-input" placeholder="-50.00" step="0.01" style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">盈亏 ($)</label>
                    <input type="number" class="input-field pnl-input" placeholder="0.00" step="0.01" style="width: 100%; padding: 8px; font-size: 14px;" onchange="updateRowStatusAuto(this)">
                </div>
                <div style="position: relative;">
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">状态</label>
                    <span class="status-badge status-be" data-status="be" style="font-size: 12px; padding: 4px 10px;">保本</span>
                </div>
            </div>

            <!-- 时间框架/入场订单类型/入场K线序号/离场K线序号 四列一行 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px;">
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">时间框架</label>
                    <select class="select-field timeframe-select" style="width: 100%; padding: 8px; font-size: 14px;">
                        ${timeframeOptions}
                    </select>
                </div>
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">入场订单类型</label>
                    <select class="select-field order-type-select" style="width: 100%; padding: 8px; font-size: 14px;">
                        ${orderTypeOptions}
                    </select>
                </div>
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">入场K线序号</label>
                    <input type="number" class="input-field entry-bar" placeholder="10" style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
                <div>
                    <label class="form-label" style="font-size: 13px; font-weight: 600;">离场K线序号</label>
                    <input type="number" class="input-field exit-bar" placeholder="20" style="width: 100%; padding: 8px; font-size: 14px;">
                </div>
            </div>

            <!-- ========== 双层标签系统 ========== -->
            
            <!-- Row 2: 策略/周期、入场理由、离场理由 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                ${createTagSectionHTML(tradeId, 'strategy', '策略/周期')}
                ${createTagSectionHTML(tradeId, 'entry', '入场理由')}
                ${createTagSectionHTML(tradeId, 'exit', '离场理由')}
            </div>

            <!-- Chart Screenshot - Multi-Image Support -->
            <div>
                <label class="form-label" style="font-size: 11px;">K线截图</label>
                <div class="image-paste-area-multi"
                     contenteditable="true"
                     onpaste="handleMultiImagePaste(event)"
                     ondragover="handleDragOver(event)"
                     ondragleave="handleDragLeave(event)"
                     ondrop="handleMultiImageDrop(event)">
                    <span class="placeholder">点击此处并粘贴截图 (Ctrl+V) 或拖拽图片<br><small>支持多张图片，每张图片占一行</small></span>
                </div>
            </div>
        </div>
    `;

    container.appendChild(tradeCard);
}

function deleteTradeCard(btn) {
    const card = btn.closest('.trade-card-wrapper');
    const tradeId = card.dataset.tradeId;
    
    showConfirmDeleteModal('确定要删除此交易记录吗？', () => {
        // 清除该交易的局部标签
        if (tradeId && localTagInstances[tradeId]) {
            delete localTagInstances[tradeId];
            saveToLocalStorage();
        }
        
        card.remove();
        updateStats();

        // Update trade count and renumber remaining trades
        const cards = document.querySelectorAll('.trade-card-wrapper');
        tradeCount = cards.length;

        cards.forEach((card, idx) => {
            card.querySelector('.trade-number').textContent = `交易 ${idx + 1}`;
        });

        if (tradeCount === 0) {
            document.getElementById('emptyState').style.display = 'block';
        }
    });
}

// ========== NEW REQUIREMENTS FUNCTIONS ==========

// Accordion Toggle for Tag Sections
function toggleTagSection(header) {
    const content = header.nextElementSibling;
    const isExpanded = header.classList.contains('expanded');

    if (isExpanded) {
        header.classList.remove('expanded');
        content.classList.remove('expanded');
    } else {
        header.classList.add('expanded');
        content.classList.add('expanded');
    }
}

// Lightbox Functions
function openLightbox(imgSrc) {
    document.getElementById('lightboxImage').src = imgSrc;
    document.getElementById('lightboxModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightboxModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Close lightbox on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Multi-Image Paste Handler
function handleMultiImagePaste(e) {
    e.preventDefault();
    const pasteArea = e.currentTarget;
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;

    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.includes('image/')) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = function(event) {
                addImageToContainer(pasteArea, event.target.result);
            };
            reader.readAsDataURL(blob);
        }
    }
}

// Multi-Image Drop Handler
function handleMultiImageDrop(e) {
    e.preventDefault();
    const dropArea = e.currentTarget;
    dropArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;

    Array.from(files).forEach(file => {
        if (file.type.includes('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                addImageToContainer(dropArea, event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Add Image to Container with Delete Button
function addImageToContainer(container, imgSrc) {
    // Remove placeholder and add has-images class
    const placeholder = container.querySelector('.placeholder');
    if (placeholder) {
        container.classList.add('has-images');
    }

    // Create image item wrapper
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';

    // Create image
    const img = document.createElement('img');
    img.src = imgSrc;
    img.onclick = () => openLightbox(imgSrc);

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'image-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        imageItem.remove();
        // Check if no images left - reset to show placeholder
        const remainingImages = container.querySelectorAll('.image-item');
        if (remainingImages.length === 0) {
            container.classList.remove('has-images');
            // Re-add placeholder if it doesn't exist
            if (!container.querySelector('.placeholder')) {
                const newPlaceholder = document.createElement('span');
                newPlaceholder.className = 'placeholder';
                newPlaceholder.innerHTML = '点击此处并粘贴截图 (Ctrl+V) 或拖拽图片<br><small>支持多张图片，每张图片占一行</small>';
                container.appendChild(newPlaceholder);
            }
        }
    };

    imageItem.appendChild(img);
    imageItem.appendChild(deleteBtn);
    container.appendChild(imageItem);
}

// Global Config Export with localStorage persistence
function exportGlobalConfig() {
    const config = {
        tagLibraries: tagLibraries,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };

    // Save to localStorage
    localStorage.setItem('tradingToolConfig', JSON.stringify(config));

    // Download as JSON file
    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `交易工具配置_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('配置已导出并保存到本地存储！');
}

// Global Config Import
function importGlobalConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);

            // Validate structure
            if (config.tagLibraries && typeof config.tagLibraries === 'object') {
                // Merge or replace
                const merge = confirm('点击"确定"合并到现有配置，点击"取消"替换整个配置');

                if (merge) {
                    // Merge: Add new tags without duplicates
                    for (const type in config.tagLibraries) {
                        if (tagLibraries[type]) {
                            config.tagLibraries[type].forEach(tag => {
                                if (!tagLibraries[type].includes(tag)) {
                                    tagLibraries[type].push(tag);
                                }
                            });
                        } else {
                            tagLibraries[type] = config.tagLibraries[type];
                        }
                    }
                } else {
                    // Replace: Use imported config entirely
                    tagLibraries = config.tagLibraries;
                }

                // Save to localStorage
                localStorage.setItem('tradingToolConfig', JSON.stringify({
                    tagLibraries: tagLibraries,
                    exportDate: new Date().toISOString(),
                    version: '2.0'
                }));

                alert('配置导入成功并已保存！');
            } else {
                alert('无效的配置文件格式');
            }
        } catch (error) {
            alert('JSON 解析失败：' + error.message);
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// Load config from localStorage on page load
function loadConfigFromStorage() {
    const savedConfig = localStorage.getItem('tradingToolConfig');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            if (config.tagLibraries) {
                tagLibraries = config.tagLibraries;
            }
        } catch (e) {
            console.warn('Failed to load config from localStorage:', e);
        }
    }
}

// Tag Selector Logic - Module 2: Enhanced Dynamic Tag System
let currentTagContainer = null;
let currentDropdown = null;

function openTagSelector(container, type) {
    event.stopPropagation();
    currentTagContainer = container;
    
    // Determine which tags to use based on type
    let tags = [];
    let sectionTitle = '';
    
    if (type === 'strategy') {
        tags = globalSettings.strategyTags || [];
        sectionTitle = '策略/周期标签';
    } else if (type === 'entry') {
        tags = globalSettings.entryTags || [];
        sectionTitle = '入场理由';
    } else if (type === 'exit') {
        tags = globalSettings.exitTags || [];
        sectionTitle = '离场理由';
    } else {
        // Fallback to legacy tag libraries
        tags = tagLibraries[type] || [];
        sectionTitle = '预设标签';
    }

    // Remove existing dropdown
    const existingDropdown = document.querySelector('.tag-selector-dropdown');
    if (existingDropdown) existingDropdown.remove();

    // Create enhanced dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'tag-selector-dropdown';
    currentDropdown = dropdown;

    // Section title
    const title = document.createElement('div');
    title.className = 'dropdown-section-title';
    title.textContent = sectionTitle + ' (点击选择)';
    dropdown.appendChild(title);

    // Render tags
    tags.forEach(tag => {
        const option = document.createElement('div');
        option.className = 'tag-option';
        option.textContent = tag;

        // Check if tag is already selected
        const existingTags = Array.from(container.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
        if (existingTags.includes(tag)) {
            option.classList.add('selected');
        }

        option.onclick = () => addTagToContainer(tag);
        dropdown.appendChild(option);
    });

    // Add "添加新标签" option
    const addNewOption = document.createElement('div');
    addNewOption.className = 'tag-option';
    addNewOption.style.borderTop = '1px solid var(--border-color)';
    addNewOption.style.color = 'var(--accent-color)';
    addNewOption.style.fontWeight = '600';
    addNewOption.textContent = '+ 添加新标签';
    addNewOption.onclick = () => {
        const newTag = prompt('请输入新标签名称：');
        if (newTag && newTag.trim()) {
            const trimmedTag = newTag.trim();
            // Add to global settings
            if (type === 'strategy' && !globalSettings.strategyTags.includes(trimmedTag)) {
                globalSettings.strategyTags.push(trimmedTag);
            } else if (type === 'entry' && !globalSettings.entryTags.includes(trimmedTag)) {
                globalSettings.entryTags.push(trimmedTag);
            } else if (type === 'exit' && !globalSettings.exitTags.includes(trimmedTag)) {
                globalSettings.exitTags.push(trimmedTag);
            }
            saveToLocalStorage();
            addTagToContainer(trimmedTag);
            closeTagSelector();
        }
    };
    dropdown.appendChild(addNewOption);

    // Add hint for custom input
    const hint = document.createElement('div');
    hint.className = 'dropdown-section-title';
    hint.style.marginTop = '8px';
    hint.style.paddingTop = '8px';
    hint.textContent = '或直接输入自定义标签后按回车';
    dropdown.appendChild(hint);

    // Position dropdown
    const rect = container.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = Math.max(rect.width, 200) + 'px';
    document.body.appendChild(dropdown);

    // Focus input
    const input = container.querySelector('.tag-input');
    if (input) input.focus();

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', closeTagSelector);
    }, 100);
}

function addTagToContainer(tagName) {
    if (!currentTagContainer) return;

    // Check if tag already exists
    const existingTags = Array.from(currentTagContainer.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
    if (existingTags.includes(tagName)) return;

    const input = currentTagContainer.querySelector('.tag-input');

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${tagName} <span class="tag-remove" onclick="removeTag(this)">×</span>`;

    // Insert before input
    if (input) {
        currentTagContainer.insertBefore(tag, input);
    } else {
        currentTagContainer.appendChild(tag);
    }

    // Keep dropdown open for more selections
    if (currentDropdown) {
        // Update selected state in dropdown
        const options = currentDropdown.querySelectorAll('.tag-option');
        options.forEach(opt => {
            if (opt.textContent === tagName) {
                opt.classList.add('selected');
            }
        });
    }
}

function removeTag(removeBtn) {
    event.stopPropagation();
    const tag = removeBtn.parentElement;
    const tagName = tag.textContent.replace('×', '').trim();

    // Remove tag
    tag.remove();

    // Update dropdown selected state if open
    if (currentDropdown) {
        const options = currentDropdown.querySelectorAll('.tag-option');
        options.forEach(opt => {
            if (opt.textContent === tagName) {
                opt.classList.remove('selected');
            }
        });
    }
}

function closeTagSelector() {
    const dropdown = document.querySelector('.tag-selector-dropdown');
    if (dropdown) dropdown.remove();
    document.removeEventListener('click', closeTagSelector);
    currentTagContainer = null;
    currentDropdown = null;
}

// ========== 增强版双层标签选择器 ==========
function openEnhancedTagSelector(container, type, tradeId) {
    event.stopPropagation();
    currentTagContainer = container;
    currentEditingTagInfo.tradeId = tradeId;
    currentEditingTagInfo.categoryType = type;
    currentEditingTagInfo.container = container;
    
    // 获取标签列表（合并全局和局部）
    const tags = getTagsForCategory(type, tradeId);
    const categoryInfo = tagCategoryMap[type];
    const sectionTitle = categoryInfo ? categoryInfo.title : '标签';

    // Remove existing dropdown
    const existingDropdown = document.querySelector('.tag-selector-dropdown');
    if (existingDropdown) existingDropdown.remove();

    // Create enhanced dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'tag-selector-dropdown';
    currentDropdown = dropdown;

    // Section title with scope indicator
    const title = document.createElement('div');
    title.className = 'dropdown-section-title';
    title.innerHTML = `<span style="color: var(--accent-color);">🌐</span> ${sectionTitle} (全局标签)`;
    dropdown.appendChild(title);

    // 获取全局标签
    const globalTags = categoryInfo ? (globalSettings[categoryInfo.globalKey] || []) : [];
    
    // Render global tags
    globalTags.forEach(tag => {
        const option = document.createElement('div');
        option.className = 'tag-option';
        option.innerHTML = `<span class="tag-scope-icon global">🌐</span> ${tag}`;

        // Check if tag is already selected
        const existingTags = Array.from(container.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
        if (existingTags.includes(tag)) {
            option.classList.add('selected');
        }

        option.onclick = () => addEnhancedTagToContainer(tag, 'global');
        dropdown.appendChild(option);
    });

    // 如果有局部标签，显示它们
    if (tradeId && localTagInstances[tradeId] && localTagInstances[tradeId][type] && localTagInstances[tradeId][type].length > 0) {
        const localTitle = document.createElement('div');
        localTitle.className = 'dropdown-section-title';
        localTitle.innerHTML = `<span style="color: var(--warning-color);">📌</span> 仅限当前交易`;
        localTitle.style.marginTop = '8px';
        dropdown.appendChild(localTitle);

        localTagInstances[tradeId][type].forEach(tag => {
            const option = document.createElement('div');
            option.className = 'tag-option';
            option.innerHTML = `<span class="tag-scope-icon local">📌</span> ${tag}`;

            const existingTags = Array.from(container.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
            if (existingTags.includes(tag)) {
                option.classList.add('selected');
            }

            option.onclick = () => addEnhancedTagToContainer(tag, 'local');
            dropdown.appendChild(option);
        });
    }

    // Add hint for custom input
    const hint = document.createElement('div');
    hint.className = 'dropdown-section-title';
    hint.style.marginTop = '8px';
    hint.style.paddingTop = '8px';
    hint.style.borderTop = '1px dashed var(--border-color)';
    hint.textContent = '直接输入并按回车添加';
    dropdown.appendChild(hint);

    // Position dropdown
    const rect = container.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = Math.max(rect.width, 220) + 'px';
    document.body.appendChild(dropdown);

    // Focus input
    const input = container.querySelector('.tag-input');
    if (input) input.focus();

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', closeTagSelector);
    }, 100);
}

function addEnhancedTagToContainer(tagName, scope = 'global') {
    if (!currentTagContainer) return;

    // Check if tag already exists
    const existingTags = Array.from(currentTagContainer.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
    if (existingTags.includes(tagName)) return;

    const input = currentTagContainer.querySelector('.tag-input');

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.dataset.scope = scope;
    const scopeIcon = scope === 'local' ? '📌' : '';
    tag.innerHTML = `${scopeIcon}${tagName} <span class="tag-remove" onclick="removeTag(this)">×</span>`;

    // Insert before input
    if (input) {
        currentTagContainer.insertBefore(tag, input);
    } else {
        currentTagContainer.appendChild(tag);
    }

    // Update dropdown selected state
    if (currentDropdown) {
        const options = currentDropdown.querySelectorAll('.tag-option');
        options.forEach(opt => {
            if (opt.textContent.includes(tagName)) {
                opt.classList.add('selected');
            }
        });
    }
}

// ========== 添加标签模态框 ==========
function openAddTagModal(type, tradeId, container) {
    event.stopPropagation();
    currentEditingTagInfo.tradeId = tradeId;
    currentEditingTagInfo.categoryType = type;
    currentEditingTagInfo.container = container;
    
    const categoryInfo = tagCategoryMap[type];
    const title = categoryInfo ? categoryInfo.title : '标签';
    
    document.getElementById('addTagModalTitle').textContent = `添加${title}`;
    document.getElementById('newTagNameInput').value = '';
    document.getElementById('tagScopeGlobal').checked = true;
    document.getElementById('addTagModal').style.display = 'flex';
    document.getElementById('newTagNameInput').focus();
}

function closeAddTagModal() {
    document.getElementById('addTagModal').style.display = 'none';
    currentEditingTagInfo = { tradeId: null, categoryType: null, container: null };
}

function confirmAddNewTag() {
    const tagName = document.getElementById('newTagNameInput').value.trim();
    if (!tagName) {
        alert('请输入标签名称');
        return;
    }
    
    const scope = document.querySelector('input[name="tagScope"]:checked').value;
    const { tradeId, categoryType, container } = currentEditingTagInfo;
    
    // 添加标签到相应的存储
    const added = addTagWithScope(tagName, categoryType, scope, tradeId);
    
    if (added || true) { // 即使标签已存在也添加到容器
        // 添加到当前容器显示
        currentTagContainer = container;
        addEnhancedTagToContainer(tagName, scope);
    }
    
    closeAddTagModal();
}

// ========== 通用删除确认浮窗 ==========
let pendingDeleteCallback = null;

function showConfirmDeleteModal(message, callback) {
    pendingDeleteCallback = callback;
    document.getElementById('confirmDeleteText').textContent = message;
    document.getElementById('confirmDeleteModal').style.display = 'flex';
}

function closeConfirmDeleteModal() {
    document.getElementById('confirmDeleteModal').style.display = 'none';
    pendingDeleteCallback = null;
}

function executeConfirmDelete() {
    if (pendingDeleteCallback) {
        pendingDeleteCallback();
    }
    closeConfirmDeleteModal();
}

// ========== 增强版标签库管理 ==========
function openEnhancedTagLibrary(type, tradeId) {
    event.stopPropagation();
    currentLibraryType = type;
    currentEditingTagInfo.tradeId = tradeId;
    currentEditingTagInfo.categoryType = type;
    
    const categoryInfo = tagCategoryMap[type];
    const title = categoryInfo ? categoryInfo.title : '标签';
    
    document.getElementById('tagLibraryTitle').textContent = `${title}库管理`;
    document.getElementById('newTagName').value = '';
    renderEnhancedTagLibrary();
    document.getElementById('tagLibraryModal').style.display = 'flex';
}

function renderEnhancedTagLibrary() {
    const container = document.getElementById('tagLibraryList');
    container.innerHTML = '';
    
    const categoryInfo = tagCategoryMap[currentLibraryType];
    if (!categoryInfo) return;
    
    // 渲染全局标签
    const globalHeader = document.createElement('div');
    globalHeader.className = 'tag-library-section-header';
    globalHeader.innerHTML = '<span style="color: var(--accent-color);">🌐</span> 全局标签';
    container.appendChild(globalHeader);
    
    const globalTags = globalSettings[categoryInfo.globalKey] || [];
    globalTags.forEach((tag, index) => {
        const item = document.createElement('div');
        item.className = 'tag-library-item';
        item.innerHTML = `
            <span class="tag-name"><span class="tag-scope-icon global">🌐</span> ${tag}</span>
            <div class="tag-library-actions">
                <button class="btn-icon" onclick="renameGlobalTag('${categoryInfo.globalKey}', ${index})" title="重命名" style="font-size: 14px;">✏️</button>
                <button class="btn-icon" onclick="deleteGlobalTag('${categoryInfo.globalKey}', ${index})" title="删除" style="color: var(--danger-color); font-size: 14px;">✕</button>
            </div>
        `;
        container.appendChild(item);
    });
    
    // 渲染局部标签（如果有）
    const tradeId = currentEditingTagInfo.tradeId;
    if (tradeId && localTagInstances[tradeId] && localTagInstances[tradeId][currentLibraryType] && localTagInstances[tradeId][currentLibraryType].length > 0) {
        const localHeader = document.createElement('div');
        localHeader.className = 'tag-library-section-header';
        localHeader.style.marginTop = '16px';
        localHeader.innerHTML = '<span style="color: var(--warning-color);">📌</span> 仅限当前交易';
        container.appendChild(localHeader);
        
        localTagInstances[tradeId][currentLibraryType].forEach((tag, index) => {
            const item = document.createElement('div');
            item.className = 'tag-library-item local-tag';
            item.innerHTML = `
                <span class="tag-name"><span class="tag-scope-icon local">📌</span> ${tag}</span>
                <div class="tag-library-actions">
                    <button class="btn-icon" onclick="renameLocalTag('${tradeId}', '${currentLibraryType}', ${index})" title="重命名" style="font-size: 14px;">✏️</button>
                    <button class="btn-icon" onclick="deleteLocalTag('${tradeId}', '${currentLibraryType}', ${index})" title="删除" style="color: var(--danger-color); font-size: 14px;">✕</button>
                </div>
            `;
            container.appendChild(item);
        });
    }
}

// 全局标签操作
function renameGlobalTag(globalKey, index) {
    const currentName = globalSettings[globalKey][index];
    const newName = prompt('输入新名称:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
        globalSettings[globalKey][index] = newName.trim();
        saveToLocalStorage();
        renderEnhancedTagLibrary();
    }
}

function deleteGlobalTag(globalKey, index) {
    showConfirmDeleteModal('确定要删除此全局标签吗？', () => {
        const removedTag = globalSettings[globalKey][index];
        globalSettings[globalKey].splice(index, 1);
        saveToLocalStorage();
        renderEnhancedTagLibrary();
        // 同步刷新自定义模板面板
        syncTagDisplayToSettings(globalKey);
        // 同步移除所有交易卡片中的该标签
        syncRemoveTagFromAllTrades(globalKey, removedTag);
    });
}

// 局部标签操作
function renameLocalTag(tradeId, type, index) {
    const currentName = localTagInstances[tradeId][type][index];
    const newName = prompt('输入新名称:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
        localTagInstances[tradeId][type][index] = newName.trim();
        saveToLocalStorage();
        renderEnhancedTagLibrary();
    }
}

function deleteLocalTag(tradeId, type, index) {
    showConfirmDeleteModal('确定要删除此局部标签吗？', () => {
        localTagInstances[tradeId][type].splice(index, 1);
        saveToLocalStorage();
        renderEnhancedTagLibrary();
    });
}

// 添加标签到库（支持选择全局或局部）
function addTagToEnhancedLibrary() {
    const name = document.getElementById('newTagName').value.trim();
    if (!name) return;
    
    const categoryInfo = tagCategoryMap[currentLibraryType];
    if (!categoryInfo) return;
    
    // 检查是否已存在于全局
    if (globalSettings[categoryInfo.globalKey].includes(name)) {
        alert('该标签已存在于全局标签中');
        return;
    }
    
    // 默认添加到全局
    globalSettings[categoryInfo.globalKey].push(name);
    saveToLocalStorage();
    document.getElementById('newTagName').value = '';
    renderEnhancedTagLibrary();
}

// Add Enter key handler for custom tag input
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('tag-input')) {
        e.preventDefault();
        const inputValue = e.target.value.trim();
        if (inputValue) {
            const container = e.target.parentElement;
            currentTagContainer = container;

            // Get the category type from the container
            const tagType = container.dataset.tagType;
            const tradeId = container.dataset.tradeId;

            // Add as tag to display
            addTagToContainer(inputValue);

            // Auto sync to global settings (requirement 8)
            if (tagType) {
                addTagWithScope(inputValue, tagType, 'global', tradeId);
            }

            // Clear input
            e.target.value = '';

            // Keep dropdown open if it exists
            const dropdown = document.querySelector('.tag-selector-dropdown');
            if (dropdown) {
                e.target.focus();
            }
        }
    }

    // Close dropdown on Escape
    if (e.key === 'Escape') {
        closeTagSelector();
    }
});

// Tag Library Management
function openTagLibrary(type) {
    event.stopPropagation();
    currentLibraryType = type;
    
    // 扩展支持的类型标题
    const titles = { 
        strategy: '策略/周期标签库', 
        entry: '入场理由标签库', 
        exit: '离场理由标签库' 
    };
    document.getElementById('tagLibraryTitle').textContent = titles[type] || '标签库';
    document.getElementById('newTagName').value = '';
    
    // 使用增强版渲染
    renderEnhancedTagLibrary();
    document.getElementById('tagLibraryModal').style.display = 'flex';
}

function closeTagLibraryModal() {
    document.getElementById('tagLibraryModal').style.display = 'none';
}

function renderTagLibrary() {
    // 调用增强版本
    renderEnhancedTagLibrary();
}

function addTagToLibrary() {
    // 调用增强版本
    addTagToEnhancedLibrary();
}

function renameTag(index) {
    // 先检查是否是新的类别映射
    const categoryInfo = tagCategoryMap[currentLibraryType];
    if (categoryInfo) {
        renameGlobalTag(categoryInfo.globalKey, index);
    } else {
        // 旧的标签库逻辑
        const newName = prompt('输入新名称:', tagLibraries[currentLibraryType][index]);
        if (newName && newName.trim()) {
            tagLibraries[currentLibraryType][index] = newName.trim();
            renderTagLibrary();
        }
    }
}

function deleteTag(index) {
    // 先检查是否是新的类别映射
    const categoryInfo = tagCategoryMap[currentLibraryType];
    if (categoryInfo) {
        deleteGlobalTag(categoryInfo.globalKey, index);
    } else {
        // 旧的标签库逻辑
        showConfirmDeleteModal('确定要删除此标签吗？', () => {
            tagLibraries[currentLibraryType].splice(index, 1);
            renderTagLibrary();
        });
    }
}

// Module 4: JSON Import/Export for Tag Libraries
function exportTagsJSON() {
    // 导出全局标签和局部标签
    const exportData = {
        global: {
            categories: {
                timeframes: globalSettings.timeframes,
                orderTypes: globalSettings.orderTypes,
                strategy: globalSettings.strategyTags,
                entry: globalSettings.entryTags,
                exit: globalSettings.exitTags
            }
        },
        local_instances: localTagInstances,
        tagLibraries: tagLibraries,
        exportDate: new Date().toISOString(),
        version: '3.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `标签库配置_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importTagsJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validate structure
            if (typeof importedData === 'object' && importedData !== null) {
                // Check if user wants to merge or replace
                const merge = confirm('点击"确定"合并到现有标签库，点击"取消"替换整个标签库');

                // 检查是否为新格式 (v3.0)
                if (importedData.global && importedData.global.categories) {
                    const cats = importedData.global.categories;
                    if (merge) {
                        // 合并全局标签
                        ['timeframes', 'orderTypes'].forEach(key => {
                            if (cats[key]) {
                                cats[key].forEach(tag => {
                                    if (!globalSettings[key].includes(tag)) {
                                        globalSettings[key].push(tag);
                                    }
                                });
                            }
                        });
                        ['strategy', 'entry', 'exit'].forEach(key => {
                            const globalKey = key === 'strategy' ? 'strategyTags' : key + 'Tags';
                            if (cats[key]) {
                                cats[key].forEach(tag => {
                                    if (!globalSettings[globalKey].includes(tag)) {
                                        globalSettings[globalKey].push(tag);
                                    }
                                });
                            }
                        });
                    } else {
                        // 替换
                        globalSettings.timeframes = cats.timeframes || globalSettings.timeframes;
                        globalSettings.orderTypes = cats.orderTypes || globalSettings.orderTypes;
                        globalSettings.strategyTags = cats.strategy || globalSettings.strategyTags;
                        globalSettings.entryTags = cats.entry || globalSettings.entryTags;
                        globalSettings.exitTags = cats.exit || globalSettings.exitTags;
                    }
                    
                    // 导入局部标签
                    if (importedData.local_instances) {
                        if (merge) {
                            Object.assign(localTagInstances, importedData.local_instances);
                        } else {
                            localTagInstances = importedData.local_instances;
                        }
                    }
                } else {
                    // 旧格式兼容
                    if (merge) {
                        for (const type in importedData) {
                            if (tagLibraries[type]) {
                                importedData[type].forEach(tag => {
                                    if (!tagLibraries[type].includes(tag)) {
                                        tagLibraries[type].push(tag);
                                    }
                                });
                            } else {
                                tagLibraries[type] = importedData[type];
                            }
                        }
                    } else {
                        tagLibraries = importedData;
                    }
                }

                saveToLocalStorage();
                renderTagLibrary();
                alert('标签库导入成功！');
            } else {
                alert('无效的 JSON 文件格式');
            }
        } catch (error) {
            alert('JSON 解析失败：' + error.message);
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// Auto Update Status Based on PnL
function updateRowStatusAuto(input) {
    const pnl = parseFloat(input.value) || 0;
    // Find the status badge in the parent trade card
    const tradeCard = input.closest('.trade-card-wrapper');
    const statusBadge = tradeCard.querySelector('.status-badge');

    if (pnl > 0) {
        statusBadge.textContent = '盈利';
        statusBadge.className = 'status-badge status-win';
        statusBadge.dataset.status = 'win';
    } else if (pnl < 0) {
        statusBadge.textContent = '亏损';
        statusBadge.className = 'status-badge status-loss';
        statusBadge.dataset.status = 'loss';
    } else {
        statusBadge.textContent = '保本';
        statusBadge.className = 'status-badge status-be';
        statusBadge.dataset.status = 'be';
    }

    updateStats();
}

// Image Paste & Drag Logic
function handlePaste(e) {
    e.preventDefault();
    const pasteArea = e.currentTarget;
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.includes('image/')) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = function(event) {
                pasteArea.innerHTML = `<img src="${event.target.result}">`;
                pasteArea.classList.add('has-image');
                pasteArea.contentEditable = "false";
            };
            reader.readAsDataURL(blob);
            break;
        }
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const dropArea = e.currentTarget;
    dropArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.includes('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            dropArea.innerHTML = `<img src="${event.target.result}">`;
            dropArea.classList.add('has-image');
            dropArea.contentEditable = "false";
        };
        reader.readAsDataURL(files[0]);
    }
}

// Rich Text Notes - Image Paste
function handleNotePaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.includes('image/')) {
            e.preventDefault();
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.maxWidth = '100%';
                img.style.margin = '8px 0';
                img.style.borderRadius = '8px';
                img.style.cursor = 'pointer';
                img.onclick = () => openLightbox(event.target.result);

                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.insertNode(img);
                    range.collapse(false);
                }
            };
            reader.readAsDataURL(blob);
        }
    }
}

// Rich Text Notes - Drag Over
function handleNotesDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.background = 'rgba(0, 122, 255, 0.05)';
}

// Rich Text Notes - Drop Handler
function handleNotesDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.background = '';

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.maxWidth = '100%';
                img.style.margin = '8px 0';
                img.style.borderRadius = '8px';
                img.style.cursor = 'pointer';
                img.onclick = () => openLightbox(event.target.result);

                // Insert at the end of notes area
                const notesArea = document.getElementById('notesArea');
                notesArea.appendChild(img);
                notesArea.appendChild(document.createElement('br'));
            };
            reader.readAsDataURL(file);
        }
    }
}

function updateStats() {
    const pnlInputs = document.querySelectorAll('.pnl-input');
    const statusBadges = document.querySelectorAll('.status-badge');

    let totalPnl = 0;
    let wins = 0;
    let losses = 0;
    let totalClosed = 0;

    pnlInputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        totalPnl += val;
    });

    statusBadges.forEach(badge => {
        const status = badge.dataset.status;
        if (status === 'win') { wins++; totalClosed++; }
        if (status === 'loss') { losses++; totalClosed++; }
        if (status === 'be') { totalClosed++; }
    });

    const winRate = totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : 0;

    document.getElementById('totalTrades').textContent = totalClosed;
    document.getElementById('winRate').textContent = winRate + '%';

    const pnlEl = document.getElementById('netPnL');
    pnlEl.textContent = '$' + totalPnl.toFixed(2);
    pnlEl.className = 'stat-value ' + (totalPnl >= 0 ? 'text-green' : 'text-red');
}

// --- EXCEL EXPORT LOGIC (UPDATED: Date column, new fields, dynamic filename, Apple Design styling) ---
function exportToExcel() {
    const date = document.getElementById('currentDate').textContent;
    const dateYYYYMMDD = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format
    const dateDashed = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    const emotions = Array.from(selectedEmotions).map(e => e.name).join(', ');
    const newsChecked = document.querySelector('input[name="news"]:checked')?.value === 'checked' ? '是' : '否';
    const marketAnalysis = document.querySelector('.textarea-field').value;
    const goals = Array.from(document.querySelectorAll('.goal-card')).map(g =>
        g.querySelector('.goal-title').textContent + ': ' + g.querySelector('.goal-desc').textContent
    ).join('\n');

    // Collect trades from card structure (new format with all fields)
    const trades = [];
    const tradeCards = document.querySelectorAll('.trade-card-wrapper');
    // 收集所有交易的截图用于后续导出
    const allTradeImages = [];
    
    tradeCards.forEach((card, idx) => {
        // Get basic info - updated selectors
        const inputs = card.querySelectorAll('input[type="time"], input[type="text"], input[type="number"], select');
        const time = inputs[0]?.value || '';
        const symbol = card.querySelector('.symbol-input')?.value || '';
        const direction = inputs[2]?.value || '';
        const lots = inputs[3]?.value || '';
        const rr = inputs[4]?.value || '';
        const stopLoss = card.querySelector('.stop-loss-input')?.value || '';
        const pnl = card.querySelector('.pnl-input')?.value || '';

        // Get new fields
        const timeframe = card.querySelector('.timeframe-select')?.value || '';
        const orderType = card.querySelector('.order-type-select')?.value || '';
        const entryBar = card.querySelector('.entry-bar')?.value || '';
        const exitBar = card.querySelector('.exit-bar')?.value || '';

        const statusBadge = card.querySelector('.status-badge');
        const status = statusBadge ? statusBadge.textContent : '保本';

        // Get tags from each section
        const tagContainers = card.querySelectorAll('.tag-container');
        const strategyTags = tagContainers[0] ? Array.from(tagContainers[0].querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim()).join(', ') : '';
        const entryTags = tagContainers[1] ? Array.from(tagContainers[1].querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim()).join(', ') : '';
        const exitTags = tagContainers[2] ? Array.from(tagContainers[2].querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim()).join(', ') : '';

        // Get free text notes
        const textAreas = card.querySelectorAll('.free-text-area');
        const strategyNote = textAreas[0]?.value || '';
        const entryNote = textAreas[1]?.value || '';
        const exitNote = textAreas[2]?.value || '';
        
        // 获取K线截图 - 收集所有图片的base64
        const imageArea = card.querySelector('.image-paste-area-multi');
        const images = imageArea ? imageArea.querySelectorAll('img') : [];
        const imageCount = images.length;
        const imageSrcs = Array.from(images).map(img => img.src);
        
        // 保存截图信息
        allTradeImages.push({
            tradeNum: idx + 1,
            symbol: symbol,
            images: imageSrcs
        });
        
        // 生成K线截图列内容 - 列出对应的图片文件名
        let screenshotInfo = '';
        if (imageCount > 0) {
            const fileNames = [];
            for (let i = 0; i < imageCount; i++) {
                fileNames.push(`trade_${idx + 1}_${i + 1}.png`);
            }
            screenshotInfo = fileNames.join(', ');
        }

        // 自我评分数据（每行都记录）
        const riskScoreVal = scores.risk;
        const emotionScoreVal = scores.emotion;
        const disciplineScoreVal = scores.discipline;
        const executionScoreVal = scores.execution;

        trades.push({
            '序号': idx + 1,
            '日期': dateDashed,
            '时间': time,
            '品种': symbol,
            '方向': direction,
            '手数': lots,
            '实际盈亏比': rr,
            '预计止损 ($)': stopLoss,
            '盈亏 ($)': pnl,
            '状态': status,
            '时间框架': timeframe,
            '入场订单类型': orderType,
            '入场K线序号': entryBar,
            '离场K线序号': exitBar,
            '策略/周期标签': strategyTags,
            '策略/周期备注': strategyNote,
            '入场理由标签': entryTags,
            '入场理由备注': entryNote,
            '离场理由标签': exitTags,
            '离场理由备注': exitNote,
            'K线截图': screenshotInfo,
            '风险管理': riskScoreVal + '%',
            '情绪控制': emotionScoreVal + '%',
            '计划遵守度': disciplineScoreVal + '%',
            '执行情况': executionScoreVal + '%'
        });
    });

    const riskScore = scores.risk;
    const emotionScore = scores.emotion;
    const disciplineScore = scores.discipline;
    const executionScore = scores.execution;
    const totalScore = Math.round(
        riskScore * 0.4 + emotionScore * 0.3 + disciplineScore * 0.2 + executionScore * 0.1
    );

    const notes = document.getElementById('notesArea').innerText;
    
    // 收集复盘笔记中的图片
    const notesArea = document.getElementById('notesArea');
    const noteImages = Array.from(notesArea.querySelectorAll('img')).map(img => img.src);

    // ========== 1. 导出Excel文件 ==========
    const wb = XLSX.utils.book_new();

    // Sheet 1: 交易记录
    if (trades.length > 0) {
        const wsTrades = XLSX.utils.json_to_sheet(trades);
        
        // 设置列宽
        const colWidths = [
            { wch: 6 },   // A: 序号
            { wch: 12 },  // B: 日期
            { wch: 8 },   // C: 时间
            { wch: 10 },  // D: 品种
            { wch: 6 },   // E: 方向
            { wch: 8 },   // F: 手数
            { wch: 12 },  // G: 实际盈亏比
            { wch: 14 },  // H: 预计止损
            { wch: 12 },  // I: 盈亏 ($)
            { wch: 8 },   // J: 状态
            { wch: 10 },  // K: 时间框架
            { wch: 14 },  // L: 入场订单类型
            { wch: 12 },  // M: 入场K线序号
            { wch: 12 },  // N: 离场K线序号
            { wch: 16 },  // O: 策略/周期标签
            { wch: 20 },  // P: 策略/周期备注
            { wch: 16 },  // Q: 入场理由标签
            { wch: 20 },  // R: 入场理由备注
            { wch: 16 },  // S: 离场理由标签
            { wch: 20 },  // T: 离场理由备注
            { wch: 30 },  // U: K线截图
            { wch: 10 },  // V: 风险管理
            { wch: 10 },  // W: 情绪控制
            { wch: 10 },  // X: 计划遵守度
            { wch: 10 }   // Y: 执行情况
        ];
        wsTrades['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, wsTrades, '交易记录');
    }

    // Sheet 2: 总结
    const summaryData = [
        ['交易日志总结'],
        [''],
        ['日期', date],
        [''],
        ['【盘前准备】'],
        ['情绪状态', emotions],
        ['市场新闻检查', newsChecked],
        ['市场分析', marketAnalysis],
        ['每日目标', goals],
        [''],
        ['【时段统计】'],
        ['总交易数', document.getElementById('totalTrades').textContent],
        ['胜率', document.getElementById('winRate').textContent],
        ['净盈亏', document.getElementById('netPnL').textContent],
        [''],
        ['【自我评分】'],
        ['风险管理 (40%)', riskScore + '%'],
        ['情绪控制 (30%)', emotionScore + '%'],
        ['计划遵守度 (20%)', disciplineScore + '%'],
        ['执行情况 (10%)', executionScore + '%'],
        [''],
        ['总得分', totalScore],
        [''],
        ['【复盘笔记】'],
        [notes]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 50 }];
    wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    
    XLSX.utils.book_append_sheet(wb, wsSummary, '总结');

    // 导出Excel
    XLSX.writeFile(wb, `交易日志_${dateYYYYMMDD}.xlsx`);
    
    // ========== 2. 导出Markdown复盘笔记 ==========
    exportReviewNotesToMarkdown(date, dateYYYYMMDD, notes, noteImages);
    
    // ========== 3. 导出图片ZIP压缩包 ==========
    exportImagesToZip(dateYYYYMMDD, allTradeImages, noteImages);
}

// ========== 复盘笔记Markdown导出函数 ==========
function exportReviewNotesToMarkdown(date, dateYYYYMMDD, notes, noteImages) {
    // 构建Markdown内容 - 仅输出复盘笔记区域的内容
    let md = `# 复盘笔记 - ${date}\n\n`;
    
    // 复盘笔记文本
    md += notes || '无';
    md += '\n\n';
    
    // 复盘笔记附图引用
    if (noteImages && noteImages.length > 0) {
        md += `---\n\n`;
        md += `## 附图\n\n`;
        noteImages.forEach((_, idx) => {
            md += `![附图${idx + 1}](images/note_${idx + 1}.png)\n`;
        });
    }
    
    // 创建并下载Markdown文件
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `复盘笔记_${dateYYYYMMDD}.md`);
}

// ========== 图片ZIP导出函数 ==========
async function exportImagesToZip(dateYYYYMMDD, allTradeImages, noteImages) {
    // 检查是否有图片需要导出
    const hasTradeImages = allTradeImages.some(t => t.images && t.images.length > 0);
    const hasNoteImages = noteImages && noteImages.length > 0;
    
    if (!hasTradeImages && !hasNoteImages) {
        console.log('没有图片需要导出');
        return;
    }
    
    // 检查JSZip是否加载
    if (typeof JSZip === 'undefined') {
        console.error('JSZip库未加载');
        alert('图片压缩库加载失败，请检查网络连接后刷新页面');
        return;
    }
    
    try {
        const zip = new JSZip();
        const imagesFolder = zip.folder('images');
        
        // 添加交易截图
        for (const tradeImg of allTradeImages) {
            if (tradeImg.images && tradeImg.images.length > 0) {
                for (let i = 0; i < tradeImg.images.length; i++) {
                    const imgSrc = tradeImg.images[i];
                    const fileName = `trade_${tradeImg.tradeNum}_${i + 1}.png`;
                    
                    try {
                        const imageData = await getImageAsBase64Data(imgSrc);
                        if (imageData) {
                            imagesFolder.file(fileName, imageData, { base64: true });
                        }
                    } catch (err) {
                        console.warn(`图片 ${fileName} 添加失败:`, err);
                    }
                }
            }
        }
        
        // 添加复盘笔记图片
        if (noteImages && noteImages.length > 0) {
            for (let i = 0; i < noteImages.length; i++) {
                const imgSrc = noteImages[i];
                const fileName = `note_${i + 1}.png`;
                
                try {
                    const imageData = await getImageAsBase64Data(imgSrc);
                    if (imageData) {
                        imagesFolder.file(fileName, imageData, { base64: true });
                    }
                } catch (err) {
                    console.warn(`复盘图片 ${fileName} 添加失败:`, err);
                }
            }
        }
        
        // 生成ZIP并下载
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `复盘笔记图片_${dateYYYYMMDD}.zip`);
        
        console.log('图片ZIP导出成功');
        
    } catch (err) {
        console.error('图片ZIP导出失败:', err);
        alert(`图片导出失败: ${err.message}`);
    }
}

// 获取图片的Base64数据（不含前缀）
async function getImageAsBase64Data(src) {
    try {
        if (src.startsWith('data:')) {
            // 已经是Base64，提取纯数据部分
            return src.split(',')[1];
        } else {
            // URL图片，需要转换
            const response = await fetch(src);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
    } catch (err) {
        console.warn('图片Base64转换失败:', err);
        return null;
    }
}

// --- POST MARKET LOGIC ---
const scores = { risk: 0, emotion: 0, discipline: 0, execution: 0 };
const weights = { risk: 0.4, emotion: 0.3, discipline: 0.2, execution: 0.1 };

function updateSlider(id, element) {
    const value = parseInt(element.value);
    const label = document.getElementById('val-' + id);
    label.textContent = value + '%';

    // Color Logic for Label
    label.className = 'slider-value'; // reset
    if (value < 60) label.classList.add('color-red');
    else if (value < 80) label.classList.add('color-yellow');
    else label.classList.add('color-green');

    // Color Logic for Slider Track
    let color = '#FF3B30'; // Red
    if (value >= 60 && value < 80) color = '#FFCC00'; // Yellow
    if (value >= 80) color = '#34C759'; // Green

    element.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${value}%, #E5E5EA ${value}%, #E5E5EA 100%)`;

    scores[id] = value;
    calculateTotalScore();
}

function calculateTotalScore() {
    const total = (scores.risk * weights.risk) +
                  (scores.emotion * weights.emotion) +
                  (scores.discipline * weights.discipline) +
                  (scores.execution * weights.execution);

    const finalScore = Math.round(total);
    const scoreDisplay = document.getElementById('totalScoreDisplay');
    const scoreBox = document.getElementById('totalScoreBox');

    scoreDisplay.textContent = finalScore;

    // Color Logic for Total Score Box
    scoreBox.className = 'score-box'; // reset
    if (finalScore < 60) scoreBox.classList.add('color-red');
    else if (finalScore < 80) scoreBox.classList.add('color-yellow');
    else scoreBox.classList.add('color-green');
}
