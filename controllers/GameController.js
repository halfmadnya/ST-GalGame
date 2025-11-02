// controllers/GameController.js
// GalGame 游戏控制器

class GameController {
    constructor(serviceLocator, eventBus) {
        this.serviceLocator = serviceLocator;
        this.eventBus = eventBus;
        this.isProcessing = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.eventBus.on('ui:select:npc', this.handleNPCSelection.bind(this), 'game');
        this.eventBus.on('ui:player:message', this.handlePlayerMessage.bind(this), 'game');
        this.eventBus.on('ui:request:stats', this.handleStatsRequest.bind(this), 'game');
    }

    /**
     * 处理NPC选择
     */
    async handleNPCSelection(data) {
        try {
            const { npcId } = data;
            const gameStateService = this.serviceLocator.get('gameStateService');
            const gameState = gameStateService.getState();
            
            // 设置当前NPC
            const success = gameState.setCurrentNPC(npcId);
            
            if (!success) {
                this.eventBus.emit('ui:display:error', {
                    message: '无法选择该角色，可能尚未解锁'
                }, 'game');
                return;
            }
            
            const currentNPC = gameState.getCurrentNPC();
            
            // 更新UI显示
            this.eventBus.emit('ui:update:npc', {
                npc: currentNPC
            }, 'game');
            
            // 生成初始对话
            await this.generateInitialDialogue(currentNPC);
            
        } catch (error) {
            console.error('Error handling NPC selection:', error);
            this.eventBus.emit('ui:display:error', {
                message: '选择角色时发生错误'
            }, 'game');
        }
    }

    /**
     * 生成初始对话
     */
    async generateInitialDialogue(npc) {
        try {
            const gameStateService = this.serviceLocator.get('gameStateService');
            const llmService = this.serviceLocator.get('llmService');
            
            // 获取动态变量
            const gameState = gameStateService.getState();
            const variables = gameState.getAllDynamicVariables();
            
            // 生成提示词
            const systemPrompt = gameStateService.generateGamePrompt({
                variables: variables,
                strategy: 'default',
                useDynamic: true
            });
            
            // 添加角色信息到提示词
            const fullPrompt = `${systemPrompt}

## 当前角色信息：
- 角色名：${npc.name}
- 性格：${npc.personality}
- 描述：${npc.description}
- 当前好感度：${npc.relationship}

## 场景：
玩家刚刚选择了与你对话。请作为${npc.name}，用符合你性格的方式打招呼，并根据当前好感度调整态度。`;

            // 调用LLM生成初始对话
            const response = await llmService.generateResponse(fullPrompt);
            
            if (response.success) {
                this.eventBus.emit('ui:display:dialogue', {
                    content: response.result,
                    speaker: npc.name
                }, 'game');
            }
            
        } catch (error) {
            console.error('Error generating initial dialogue:', error);
            this.eventBus.emit('ui:display:error', {
                message: '生成对话时发生错误'
            }, 'game');
        }
    }

    /**
     * 处理玩家消息
     */
    async handlePlayerMessage(data) {
        if (this.isProcessing) {
            console.warn('Already processing a message, ignoring new message');
            return;
        }

        this.isProcessing = true;
        
        try {
            const { message } = data;
            const gameStateService = this.serviceLocator.get('gameStateService');
            const llmService = this.serviceLocator.get('llmService');
            const gameState = gameStateService.getState();
            
            const currentNPC = gameState.getCurrentNPC();
            if (!currentNPC) {
                throw new Error('没有选择角色');
            }
            
            // 记录对话历史
            gameState.addToHistory({
                role: 'user',
                content: message,
                type: 'player_message'
            });
            
            // 获取动态变量
            const variables = gameState.getAllDynamicVariables();
            
            // 生成提示词
            const systemPrompt = gameStateService.generateGamePrompt({
                variables: variables,
                strategy: 'quick_chat', // 使用快速对话策略
                useDynamic: true
            });
            
            // 构建完整提示词
            const fullPrompt = `${systemPrompt}

## 当前角色信息：
- 角色名：${currentNPC.name}
- 性格：${currentNPC.personality}
- 当前好感度：${currentNPC.relationship}

## 玩家说：
"${message}"

## 回应要求：
1. 作为${currentNPC.name}，用符合性格的方式回应
2. 根据好感度调整态度和语气
3. 回应要自然、生动，展现角色特点
4. 如果玩家的话让你开心，可以在回应后加上 [好感度+5]
5. 如果玩家的话让你不悦，可以在回应后加上 [好感度-3]
6. 如果是普通对话，不需要标注好感度变化

请直接给出${currentNPC.name}的回应：`;

            // 调用LLM
            const response = await llmService.generateResponse(fullPrompt);
            
            if (!response.success) {
                throw new Error('LLM request failed');
            }
            
            // 解析回应和好感度变化
            const { dialogue, relationshipChange } = this.parseResponse(response.result);
            
            // 更新好感度
            if (relationshipChange !== 0) {
                const newRelationship = gameState.updateNPCRelationship(relationshipChange);
                
                // 更新UI显示
                this.eventBus.emit('ui:update:relationship', {
                    relationship: newRelationship,
                    change: relationshipChange
                }, 'game');
            }
            
            // 记录NPC回应
            gameState.addToHistory({
                role: 'assistant',
                content: dialogue,
                type: 'npc_dialogue'
            });
            
            // 显示对话
            this.eventBus.emit('ui:display:dialogue', {
                content: dialogue,
                speaker: currentNPC.name
            }, 'game');
            
            // 检查是否触发特殊事件
            this.checkSpecialEvents(gameState, currentNPC);
            
        } catch (error) {
            console.error('Error handling player message:', error);
            this.eventBus.emit('ui:display:error', {
                message: '处理消息时发生错误，请重试'
            }, 'game');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 解析LLM回应，提取对话内容和好感度变化
     */
    parseResponse(response) {
        let dialogue = response;
        let relationshipChange = 0;
        
        // 匹配好感度变化标记 [好感度+5] 或 [好感度-3]
        const relationshipMatch = response.match(/\[好感度([+\-]\d+)\]/);
        
        if (relationshipMatch) {
            relationshipChange = parseInt(relationshipMatch[1]);
            // 移除好感度标记
            dialogue = response.replace(/\[好感度[+\-]\d+\]/g, '').trim();
        }
        
        return { dialogue, relationshipChange };
    }

    /**
     * 检查特殊事件
     */
    checkSpecialEvents(gameState, npc) {
        // 好感度达到特定阈值时触发事件
        if (npc.relationship >= 80 && !gameState.gameFlags.get(`${npc.id}_confession`)) {
            // 触发告白事件
            gameState.gameFlags.set(`${npc.id}_confession`, true);
            
            setTimeout(() => {
                this.eventBus.emit('ui:display:narration', {
                    content: `💕 ${npc.name}的好感度已经非常高了！也许是时候更进一步了...`
                }, 'game');
            }, 2000);
        }
        
        // 好感度过低时的警告
        if (npc.relationship <= -50 && !gameState.gameFlags.get(`${npc.id}_warning`)) {
            gameState.gameFlags.set(`${npc.id}_warning`, true);
            
            setTimeout(() => {
                this.eventBus.emit('ui:display:narration', {
                    content: `⚠️ ${npc.name}似乎对你很不满...也许需要改变一下相处方式。`
                }, 'game');
            }, 2000);
        }
    }

    /**
     * 处理统计请求
     */
    handleStatsRequest() {
        try {
            const gameStateService = this.serviceLocator.get('gameStateService');
            const gameState = gameStateService.getState();
            const stats = gameState.getGameStats();
            
            const statsText = `
📊 游戏统计

总角色数：${stats.totalNPCs}
已解锁：${stats.unlockedNPCs}
平均好感度：${stats.averageRelationship.toFixed(1)}
对话次数：${stats.conversationCount}
当前场景：${stats.currentScene}

继续努力提升好感度吧！
            `.trim();
            
            this.eventBus.emit('ui:display:narration', {
                content: statsText
            }, 'game');
            
        } catch (error) {
            console.error('Error handling stats request:', error);
            this.eventBus.emit('ui:display:error', {
                message: '获取统计信息失败'
            }, 'game');
        }
    }
}

export default GameController;