// examples/dynamic-prompts-example.js
// 动态提示词系统使用示例

import EventBus from '../core/EventBus.js';
import GameStateService from '../services/GameStateService.js';
import LLMService from '../services/LLMService.js';

/**
 * 示例1：基础使用
 */
async function example1_BasicUsage() {
    console.log('=== 示例1：基础使用 ===\n');
    
    const eventBus = new EventBus();
    const gameStateService = new GameStateService(eventBus);
    
    // 初始化动态提示词系统
    await gameStateService.initializeDynamicPrompts('config/prompts/dynamic-prompts.yaml');
    
    // 获取游戏状态
    const gameState = gameStateService.getState();
    
    // 设置一些动态变量
    gameState.setDynamicVariable('npc_relationship', 60);
    gameState.setDynamicVariable('player_reputation', 200);
    gameState.setStoryPhase('development');
    
    // 生成提示词
    const variables = gameState.getAllDynamicVariables();
    const prompt = gameStateService.generateGamePrompt({
        variables: variables,
        strategy: 'default'
    });
    
    console.log('生成的提示词：');
    console.log(prompt);
    console.log('\n');
}

/**
 * 示例2：NPC关系系统
 */
async function example2_NPCRelationship() {
    console.log('=== 示例2：NPC关系系统 ===\n');
    
    const eventBus = new EventBus();
    const gameStateService = new GameStateService(eventBus);
    await gameStateService.initializeDynamicPrompts('config/prompts/dynamic-prompts.yaml');
    
    const gameState = gameStateService.getState();
    
    // 模拟玩家与NPC的互动
    console.log('初始关系值：', gameState.getDynamicVariable('npc_relationship'));
    
    // 玩家帮助NPC
    console.log('\n玩家帮助了NPC...');
    gameState.updateNPCRelationship(15);
    console.log('关系值变化：+15，当前值：', gameState.getDynamicVariable('npc_relationship'));
    
    // 生成提示词（此时应该使用"中立"或"友好"的提示词）
    let prompt = gameStateService.generateGamePrompt({
        variables: gameState.getAllDynamicVariables()
    });
    console.log('\n当前提示词片段（关系部分）：');
    console.log(prompt.match(/# NPC关系状态：.*/)?.[0] || '未找到关系状态');
    
    // 玩家继续帮助NPC
    console.log('\n玩家再次帮助NPC...');
    gameState.updateNPCRelationship(40);
    console.log('关系值变化：+40，当前值：', gameState.getDynamicVariable('npc_relationship'));
    
    // 生成新提示词（此时应该使用"友好"的提示词）
    prompt = gameStateService.generateGamePrompt({
        variables: gameState.getAllDynamicVariables()
    });
    console.log('\n当前提示词片段（关系部分）：');
    console.log(prompt.match(/# NPC关系状态：.*/)?.[0] || '未找到关系状态');
    
    // 玩家攻击NPC
    console.log('\n玩家攻击了NPC！');
    gameState.updateNPCRelationship(-80);
    console.log('关系值变化：-80，当前值：', gameState.getDynamicVariable('npc_relationship'));
    
    // 生成新提示词（此时应该使用"敌对"的提示词）
    prompt = gameStateService.generateGamePrompt({
        variables: gameState.getAllDynamicVariables()
    });
    console.log('\n当前提示词片段（关系部分）：');
    console.log(prompt.match(/# NPC关系状态：.*/)?.[0] || '未找到关系状态');
    console.log('\n');
}

/**
 * 示例3：故事进度控制
 */
async function example3_StoryProgression() {
    console.log('=== 示例3：故事进度控制 ===\n');
    
    const eventBus = new EventBus();
    const gameStateService = new GameStateService(eventBus);
    await gameStateService.initializeDynamicPrompts('config/prompts/dynamic-prompts.yaml');
    
    const gameState = gameStateService.getState();
    
    const phases = ['opening', 'development', 'climax', 'ending'];
    
    for (const phase of phases) {
        console.log(`\n--- 故事阶段：${phase} ---`);
        gameState.setStoryPhase(phase);
        
        const prompt = gameStateService.generateGamePrompt({
            variables: gameState.getAllDynamicVariables()
        });
        
        console.log('提示词片段（故事阶段部分）：');
        console.log(prompt.match(/# 故事阶段：.*/)?.[0] || '未找到故事阶段');
    }
    console.log('\n');
}

/**
 * 示例4：使用不同策略
 */
async function example4_DifferentStrategies() {
    console.log('=== 示例4：使用不同策略 ===\n');
    
    const eventBus = new EventBus();
    const gameStateService = new GameStateService(eventBus);
    await gameStateService.initializeDynamicPrompts('config/prompts/dynamic-prompts.yaml');
    
    const gameState = gameStateService.getState();
    gameState.setDynamicVariable('npc_relationship', 50);
    gameState.setDifficultyLevel('hard');
    
    const variables = gameState.getAllDynamicVariables();
    
    // 获取可用策略
    const dynamicPromptService = gameStateService.getDynamicPromptService();
    const strategies = dynamicPromptService.getAvailableStrategies();
    
    console.log('可用策略：', strategies);
    console.log('\n');
    
    // 使用不同策略生成提示词
    for (const strategy of strategies) {
        console.log(`--- 策略：${strategy} ---`);
        const prompt = gameStateService.generateGamePrompt({
            variables: variables,
            strategy: strategy
        });
        console.log(`提示词长度：${prompt.length} 字符`);
        console.log('包含的模板数量：', prompt.split('\n\n').length);
        console.log('\n');
    }
}

/**
 * 示例5：计算变量
 */
async function example5_ComputedVariables() {
    console.log('=== 示例5：计算变量 ===\n');
    
    const eventBus = new EventBus();
    const gameStateService = new GameStateService(eventBus);
    await gameStateService.initializeDynamicPrompts('config/prompts/dynamic-prompts.yaml');
    
    const dynamicPromptService = gameStateService.getDynamicPromptService();
    
    // 注册计算变量：根据玩家生命值和敌人数量计算危险等级
    dynamicPromptService.registerComputedVariable('danger_level', (variables) => {
        const hpPercentage = variables.player_hp_percentage || 100;
        const enemyCount = variables.enemy_count || 0;
        
        if (hpPercentage < 30 && enemyCount > 2) {
            return 'critical';
        } else if (hpPercentage < 60 || enemyCount > 0) {
            return 'moderate';
        }
        return 'safe';
    });
    
    // 测试不同场景
    const scenarios = [
        { player_hp_percentage: 100, enemy_count: 0, desc: '满血无敌人' },
        { player_hp_percentage: 50, enemy_count: 1, desc: '半血有敌人' },
        { player_hp_percentage: 20, enemy_count: 3, desc: '低血多敌人' }
    ];
    
    for (const scenario of scenarios) {
        console.log(`\n场景：${scenario.desc}`);
        console.log(`  生命值：${scenario.player_hp_percentage}%`);
        console.log(`  敌人数：${scenario.enemy_count}`);
        
        const gameState = gameStateService.getState();
        const variables = {
            ...gameState.getAllDynamicVariables(),
            player_hp_percentage: scenario.player_hp_percentage,
            enemy_count: scenario.enemy_count
        };
        
        const prompt = gameStateService.generateGamePrompt({ variables });
        
        // 计算变量会在生成过程中自动计算
        console.log(`  计算的危险等级：${scenario.player_hp_percentage < 30 && scenario.enemy_count > 2 ? 'critical' : scenario.player_hp_percentage < 60 || scenario.enemy_count > 0 ? 'moderate' : 'safe'}`);
    }
    console.log('\n');
}

/**
 * 示例6：缓存管理
 */
async function example6_CacheManagement() {
    console.log('=== 示例6：缓存管理 ===\n');
    
    const eventBus = new EventBus();
    const gameStateService = new GameStateService(eventBus);
    await gameStateService.initializeDynamicPrompts('config/prompts/dynamic-prompts.yaml');
    
    const dynamicPromptService = gameStateService.getDynamicPromptService();
    const gameState = gameStateService.getState();
    
    // 生成几次提示词
    console.log('生成提示词（第1次）...');
    let startTime = Date.now();
    gameStateService.generateGamePrompt({
        variables: gameState.getAllDynamicVariables()
    });
    console.log(`耗时：${Date.now() - startTime}ms`);
    
    console.log('\n生成提示词（第2次，相同参数）...');
    startTime = Date.now();
    gameStateService.generateGamePrompt({
        variables: gameState.getAllDynamicVariables()
    });
    console.log(`耗时：${Date.now() - startTime}ms（应该更快，因为使用了缓存）`);
    
    // 查看缓存状态
    const status = dynamicPromptService.getStatus();
    console.log('\n服务状态：');
    console.log(`  已初始化：${status.initialized}`);
    console.log(`  版本：${status.version}`);
    console.log(`  缓存大小：${status.cacheSize}`);
    console.log(`  策略数量：${status.strategiesCount}`);
    console.log(`  模板数量：${status.templatesCount}`);
    
    // 清除缓存
    console.log('\n清除缓存...');
    dynamicPromptService.clearCache();
    console.log(`缓存已清除，当前大小：${dynamicPromptService.getStatus().cacheSize}`);
    console.log('\n');
}

/**
 * 示例7：变量验证
 */
async function example7_VariableValidation() {
    console.log('=== 示例7：变量验证 ===\n');
    
    const eventBus = new EventBus();
    const gameStateService = new GameStateService(eventBus);
    await gameStateService.initializeDynamicPrompts('config/prompts/dynamic-prompts.yaml');
    
    const dynamicPromptService = gameStateService.getDynamicPromptService();
    
    // 测试变量验证
    const testCases = [
        { name: 'npc_relationship', value: 50, expected: true },
        { name: 'npc_relationship', value: 150, expected: false },
        { name: 'npc_relationship', value: -50, expected: true },
        { name: 'story_phase', value: 'climax', expected: true },
        { name: 'story_phase', value: 'invalid', expected: false }
    ];
    
    console.log('变量验证测试：\n');
    for (const test of testCases) {
        const isValid = dynamicPromptService.validateVariableValue(test.name, test.value);
        const result = isValid === test.expected ? '✓' : '✗';
        console.log(`${result} ${test.name} = ${test.value}: ${isValid ? '有效' : '无效'} (预期: ${test.expected ? '有效' : '无效'})`);
    }
    console.log('\n');
}

/**
 * 运行所有示例
 */
async function runAllExamples() {
    try {
        await example1_BasicUsage();
        await example2_NPCRelationship();
        await example3_StoryProgression();
        await example4_DifferentStrategies();
        await example5_ComputedVariables();
        await example6_CacheManagement();
        await example7_VariableValidation();
        
        console.log('所有示例运行完成！');
    } catch (error) {
        console.error('运行示例时出错：', error);
    }
}

// 导出示例函数
export {
    example1_BasicUsage,
    example2_NPCRelationship,
    example3_StoryProgression,
    example4_DifferentStrategies,
    example5_ComputedVariables,
    example6_CacheManagement,
    example7_VariableValidation,
    runAllExamples
};

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllExamples();
}