// views/GameView.js
// GalGame 游戏视图

class GameView {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentNPC = null;
        this.setupEventListeners();
        this.initializeUI();
    }

    setupEventListeners() {
        this.eventBus.on('ui:display:dialogue', this.displayDialogue.bind(this), 'game');
        this.eventBus.on('ui:display:narration', this.displayNarration.bind(this), 'game');
        this.eventBus.on('ui:display:error', this.displayError.bind(this), 'game');
        this.eventBus.on('ui:update:npc', this.updateNPCDisplay.bind(this), 'game');
        this.eventBus.on('ui:update:relationship', this.updateRelationshipDisplay.bind(this), 'game');
        this.eventBus.on('ui:change:scene', this.changeScene.bind(this), 'game');
        this.eventBus.on('llm:streaming', this.handleStreaming.bind(this), 'game');
        this.eventBus.on('core:initialized', this.hideLoadingScreen.bind(this), 'system');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    initializeUI() {
        const gameRoot = document.getElementById('game-root');
        gameRoot.innerHTML = `
            <div class="galgame-container fade-in">
                <!-- 背景层 -->
                <div class="game-background" id="gameBackground">
                    <div class="background-image" id="backgroundImage"></div>
                    <div class="background-overlay"></div>
                </div>
                
                <!-- 角色立绘层 -->
                <div class="character-layer" id="characterLayer">
                    <div class="character-sprite" id="characterSprite">
                        <div class="character-placeholder">
                            <div class="character-silhouette">👤</div>
                            <p>选择一个角色开始对话</p>
                        </div>
                    </div>
                </div>
                
                <!-- 顶部信息栏 -->
                <div class="top-bar">
                    <div class="game-title">💕 恋爱模拟器</div>
                    <div class="scene-info" id="sceneInfo">
                        <span id="sceneTime">早晨</span> · <span id="sceneLocation">学校门口</span>
                    </div>
                    <div class="menu-button" onclick="window.gameView.toggleMenu()">☰</div>
                </div>
                
                <!-- 对话框 -->
                <div class="dialogue-box" id="dialogueBox">
                    <div class="dialogue-header">
                        <div class="speaker-info">
                            <div class="speaker-name" id="speakerName">旁白</div>
                            <div class="relationship-indicator" id="relationshipIndicator">
                                <span class="relationship-label">好感度:</span>
                                <div class="relationship-bar">
                                    <div class="relationship-fill" id="relationshipFill" style="width: 50%"></div>
                                </div>
                                <span class="relationship-value" id="relationshipValue">0</span>
                            </div>
                        </div>
                    </div>
                    <div class="dialogue-content" id="dialogueContent">
                        <p class="intro-text">
                            欢迎来到恋爱模拟器！<br><br>
                            在这里，你将与不同性格的角色相遇，通过对话和互动提升好感度，最终收获属于你的浪漫故事。<br><br>
                            <em>点击左侧的角色按钮开始你的恋爱之旅吧！</em>
                        </p>
                    </div>
                    <div class="dialogue-controls">
                        <div class="typing-indicator hidden" id="typingIndicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                </div>
                
                <!-- 输入区域 -->
                <div class="input-area" id="inputArea">
                    <div class="input-wrapper">
                        <input type="text" 
                               id="playerInput" 
                               placeholder="输入你想说的话..." 
                               onkeypress="if(event.key==='Enter') window.gameView.handlePlayerInput()"
                               autocomplete="off">
                        <button class="send-button" onclick="window.gameView.handlePlayerInput()">
                            💬 发送
                        </button>
                    </div>
                    <div class="quick-replies" id="quickReplies">
                        <!-- 快捷回复按钮将动态生成 -->
                    </div>
                </div>
                
                <!-- 侧边栏 - 角色选择 -->
                <div class="sidebar" id="sidebar">
                    <div class="sidebar-header">
                        <h3>角色</h3>
                    </div>
                    <div class="character-list" id="characterList">
                        <!-- 角色列表将动态生成 -->
                    </div>
                </div>
                
                <!-- 菜单面板 -->
                <div class="menu-panel hidden" id="menuPanel">
                    <div class="menu-content">
                        <h2>游戏菜单</h2>
                        <div class="menu-options">
                            <button class="menu-option" onclick="window.gameView.showStats()">
                                📊 查看统计
                            </button>
                            <button class="menu-option" onclick="window.gameView.showSettings()">
                                ⚙️ 设置
                            </button>
                            <button class="menu-option" onclick="window.gameView.showHelp()">
                                ❓ 帮助
                            </button>
                            <button class="menu-option" onclick="window.gameView.toggleMenu()">
                                ✖️ 关闭
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 状态栏 -->
                <div class="status-bar" id="statusBar">
                    <div class="status-left">
                        <span class="status-indicator ready" id="statusIndicator"></span>
                        <span id="statusText">就绪</span>
                    </div>
                    <div class="status-right">
                        <span id="debugToggle" onclick="toggleDebugPanel()" style="cursor: pointer;">
                            🐛 调试
                        </span>
                    </div>
                </div>
            </div>
        `;

        // 聚焦到输入框
        document.getElementById('playerInput').focus();
    }

    /**
     * 初始化角色列表
     */
    initializeCharacterList(npcs) {
        const characterList = document.getElementById('characterList');
        characterList.innerHTML = '';
        
        npcs.forEach(npc => {
            const charCard = document.createElement('div');
            charCard.className = `character-card ${npc.unlocked ? '' : 'locked'}`;
            charCard.innerHTML = `
                <div class="character-avatar">
                    ${npc.unlocked ? '👤' : '🔒'}
                </div>
                <div class="character-info">
                    <div class="character-name">${npc.unlocked ? npc.name : '???'}</div>
                    <div class="character-relationship">
                        ${npc.unlocked ? `好感度: ${npc.relationship}` : '未解锁'}
                    </div>
                </div>
            `;
            
            if (npc.unlocked) {
                charCard.onclick = () => this.selectCharacter(npc.id);
            }
            
            characterList.appendChild(charCard);
        });
    }

    /**
     * 选择角色
     */
    selectCharacter(npcId) {
        this.eventBus.emit('ui:select:npc', { npcId }, 'game');
    }

    /**
     * 更新NPC显示
     */
    updateNPCDisplay(data) {
        const { npc } = data;
        this.currentNPC = npc;
        
        // 更新角色立绘
        const characterSprite = document.getElementById('characterSprite');
        characterSprite.innerHTML = `
            <div class="character-avatar-large">
                <div class="avatar-circle">👤</div>
                <div class="character-name-tag">${npc.name}</div>
            </div>
        `;
        
        // 更新说话人名称
        document.getElementById('speakerName').textContent = npc.name;
        
        // 更新好感度显示
        this.updateRelationshipDisplay({ relationship: npc.relationship });
        
        // 显示角色介绍
        this.displayNarration({
            content: `你选择了与${npc.name}对话。\n${npc.description}`
        });
    }

    /**
     * 更新好感度显示
     */
    updateRelationshipDisplay(data) {
        const { relationship } = data;
        const relationshipFill = document.getElementById('relationshipFill');
        const relationshipValue = document.getElementById('relationshipValue');
        const relationshipIndicator = document.getElementById('relationshipIndicator');
        
        // 计算百分比 (0-100的范围映射到0-100%)
        const percentage = ((relationship + 100) / 200) * 100;
        relationshipFill.style.width = `${percentage}%`;
        relationshipValue.textContent = relationship;
        
        // 根据好感度改变颜色
        let color = '#888';
        if (relationship < -50) color = '#e74c3c';
        else if (relationship < 0) color = '#e67e22';
        else if (relationship < 30) color = '#95a5a6';
        else if (relationship < 60) color = '#3498db';
        else if (relationship < 80) color = '#9b59b6';
        else color = '#e91e63';
        
        relationshipFill.style.backgroundColor = color;
        
        // 显示好感度指示器
        relationshipIndicator.classList.remove('hidden');
    }

    /**
     * 处理玩家输入
     */
    handlePlayerInput() {
        const input = document.getElementById('playerInput');
        const message = input.value.trim();
        
        if (!message) {
            this.showNotification('请输入内容！', 'warning');
            return;
        }
        
        if (!this.currentNPC) {
            this.showNotification('请先选择一个角色！', 'warning');
            return;
        }
        
        // 显示玩家消息
        this.displayPlayerMessage(message);
        
        // 清空输入框
        input.value = '';
        input.focus();
        
        // 显示输入中状态
        this.setStatus('processing', '对方正在输入...');
        document.getElementById('typingIndicator').classList.remove('hidden');
        
        // 发送事件
        this.eventBus.emit('ui:player:message', { message }, 'game');
    }

    /**
     * 显示玩家消息
     */
    displayPlayerMessage(message) {
        const dialogueContent = document.getElementById('dialogueContent');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message player-message slide-in-right';
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="message-text">${this.escapeHtml(message)}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        dialogueContent.appendChild(messageDiv);
        dialogueContent.scrollTop = dialogueContent.scrollHeight;
    }

    /**
     * 显示对话
     */
    displayDialogue(data) {
        const { content, speaker } = data;
        
        document.getElementById('typingIndicator').classList.add('hidden');
        
        const dialogueContent = document.getElementById('dialogueContent');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message npc-message slide-in-left';
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="message-speaker">${speaker || this.currentNPC?.name || 'NPC'}</div>
                <div class="message-text">${this.escapeHtml(content)}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        dialogueContent.appendChild(messageDiv);
        dialogueContent.scrollTop = dialogueContent.scrollHeight;
        
        this.setStatus('ready', '就绪');
    }

    /**
     * 显示旁白
     */
    displayNarration(data) {
        const { content } = data;
        
        const dialogueContent = document.getElementById('dialogueContent');
        const narrationDiv = document.createElement('div');
        narrationDiv.className = 'message narration-message fade-in';
        narrationDiv.innerHTML = `
            <div class="narration-text">${this.escapeHtml(content)}</div>
        `;
        dialogueContent.appendChild(narrationDiv);
        dialogueContent.scrollTop = dialogueContent.scrollHeight;
    }

    /**
     * 显示错误
     */
    displayError(data) {
        const { message } = data;
        this.showNotification(message, 'error');
        this.setStatus('error', '发生错误');
        document.getElementById('typingIndicator').classList.add('hidden');
    }

    /**
     * 改变场景
     */
    changeScene(data) {
        const { scene, timeOfDay, location } = data;
        
        // 更新场景信息
        if (timeOfDay) {
            document.getElementById('sceneTime').textContent = this.getTimeOfDayText(timeOfDay);
        }
        if (location) {
            document.getElementById('sceneLocation').textContent = location;
        }
        
        // 可以在这里添加背景图片切换逻辑
        this.displayNarration({ content: `场景切换到：${location}` });
    }

    /**
     * 处理流式输出
     */
    handleStreaming(data) {
        const { chunk, accumulated } = data;
        this.setStatus('processing', `正在生成回应... (${accumulated.length} 字符)`);
    }

    /**
     * 设置状态
     */
    setStatus(type, text) {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        indicator.className = `status-indicator ${type}`;
        statusText.textContent = text;
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} slide-in-top`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slide-out-top 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 切换菜单
     */
    toggleMenu() {
        const menuPanel = document.getElementById('menuPanel');
        menuPanel.classList.toggle('hidden');
    }

    /**
     * 显示统计
     */
    showStats() {
        this.eventBus.emit('ui:request:stats', {}, 'game');
    }

    /**
     * 显示设置
     */
    showSettings() {
        this.showNotification('设置功能开发中...', 'info');
    }

    /**
     * 显示帮助
     */
    showHelp() {
        this.displayNarration({
            content: `游戏帮助：\n\n1. 点击左侧角色卡片选择对话对象\n2. 在底部输入框输入你想说的话\n3. 通过对话提升好感度\n4. 好感度越高，角色态度越亲密\n\n祝你游戏愉快！`
        });
        this.toggleMenu();
    }

    /**
     * 获取时间文本
     */
    getTimeOfDayText(timeOfDay) {
        const timeMap = {
            'morning': '早晨',
            'afternoon': '下午',
            'evening': '傍晚',
            'night': '夜晚'
        };
        return timeMap[timeOfDay] || timeOfDay;
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
}

export default GameView;

// 确保类在全局可用
window.GameView = GameView;