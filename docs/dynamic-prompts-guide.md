# 动态提示词系统使用指南

## 概述

动态提示词系统是一个灵活、可扩展的提示词管理机制，允许通过外部配置文件控制发送给LLM的提示词内容。系统根据游戏状态变量（如NPC关系值、玩家声望等）动态选择和组合提示词。

## 核心特性

- ✅ **外部配置管理**：使用YAML文件管理提示词，无需修改代码
- ✅ **条件选择**：根据变量值区间自动选择合适的提示词
- ✅ **灵活组合**：支持多种组合策略，按需组装提示词
- ✅ **高度可扩展**：轻松添加新变量、新模板、新策略
- ✅ **缓存优化**：自动缓存生成结果，提升性能
- ✅ **向后兼容**：保留传统提示词生成方式作为降级方案

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    GameStateService                      │
│  ┌────────────────────────────────────────────────┐    │
│  │         DynamicPromptService                    │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │       PromptParser                    │     │    │
│  │  │  - 解析YAML配置                       │     │    │
│  │  │  - 验证配置结构                       │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │  - 加载配置文件                                │    │
│  │  - 选择提示词模板                              │    │
│  │  - 组合最终提示词                              │    │
│  │  - 缓存管理                                    │    │
│  └────────────────────────────────────────────────┘    │
│  - 集成动态提示词                                       │
│  - 管理游戏状态                                         │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│              config/prompts/dynamic-prompts.yaml         │
│  - 变量定义                                              │
│  - 提示词模板                                            │
│  - 组合策略                                              │
└─────────────────────────────────────────────────────────┘
```

## 快速开始

### 1. 初始化系统

```javascript
// 在GameController或初始化代码中
const gameStateService = new GameStateService(eventBus);

// 初始化动态提示词系统
await gameStateService.initializeDynamicPrompts('config/prompts/dynamic-prompts.yaml');
```

### 2. 设置动态变量

```javascript
// 获取游戏状态
const gameState = gameStateService.getState();

// 设置NPC关系值
gameState.setDynamicVariable('npc_relationship', 75);

// 或使用便捷方法
gameState.updateNPCRelationship(10); // 增加10点关系值

// 设置其他变量
gameState.setStoryPhase('climax');
gameState.setDifficultyLevel('hard');
gameState.updatePlayerReputation(50);
```

### 3. 生成提示词

```javascript
// 获取所有动态变量
const variables = gameState.getAllDynamicVariables();

// 生成提示词（使用默认策略）
const prompt = gameStateService.generateGamePrompt({
    variables: variables,
    strategy: 'default',
    useDynamic: true
});

// 发送给LLM
await llmService.generateResponse(prompt);
```

## 配置文件详解

### 变量定义

在 `config/prompts/dynamic-prompts.yaml` 中定义可用变量：

```yaml
variables:
  npc_relationship:
    type: "number"
    description: "NPC与玩家的关系值"
    range: [-100, 100]
  
  story_phase:
    type: "string"
    description: "故事阶段"
    values: ["opening", "development", "climax", "ending"]
```

**变量类型**：
- `number`：数值类型，可定义范围
- `string`：字符串类型，可定义可选值
- `boolean`：布尔类型

### 提示词模板

#### 静态模板

始终包含的固定内容：

```yaml
prompt_templates:
  base_gm:
    type: "static"
    content: |
      你是一个专业的游戏主持人(GM)...
```

#### 条件模板（数值范围）

根据数值变量的范围选择：

```yaml
prompt_templates:
  npc_relationship:
    type: "conditional"
    variable: "npc_relationship"
    conditions:
      - range: [-100, -50]
        label: "敌对"
        content: |
          # NPC关系状态：敌对
          你对玩家充满敌意...
      
      - range: [51, 80]
        label: "友好"
        content: |
          # NPC关系状态：友好
          你对玩家友好...
```

#### 枚举模板（精确值匹配）

根据字符串变量的精确值选择：

```yaml
prompt_templates:
  story_phase:
    type: "enum"
    variable: "story_phase"
    conditions:
      - value: "opening"
        label: "开场阶段"
        content: |
          # 故事阶段：开场
          ...
      
      - value: "climax"
        label: "高潮阶段"
        content: |
          # 故事阶段：高潮
          ...
```

### 组合策略

定义提示词的组合顺序：

```yaml
composition_strategies:
  default:
    description: "默认的提示词组合顺序"
    order:
      - "base_gm"
      - "npc_relationship"
      - "player_reputation"
      - "story_phase"
      - "game_rules"
  
  simplified:
    description: "简化版提示词"
    order:
      - "base_gm"
      - "npc_relationship"
      - "game_rules"
```

## 高级用法

### 注册计算变量

动态计算的变量值：

```javascript
const dynamicPromptService = gameStateService.getDynamicPromptService();

// 注册计算变量
dynamicPromptService.registerComputedVariable('player_danger_level', (variables) => {
    const hpPercentage = variables.player_hp_percentage || 100;
    const enemyCount = variables.enemy_count || 0;
    
    if (hpPercentage < 30 && enemyCount > 2) {
        return 'critical';
    } else if (hpPercentage < 60 || enemyCount > 0) {
        return 'moderate';
    }
    return 'safe';
});
```

### 使用不同策略

```javascript
// 战斗场景使用战斗专用策略
const combatPrompt = gameStateService.generateGamePrompt({
    variables: variables,
    strategy: 'combat_focused'
});

// 快速响应使用简化策略
const quickPrompt = gameStateService.generateGamePrompt({
    variables: variables,
    strategy: 'simplified'
});
```

### 扩展配置文件

在主配置中引用额外的配置文件：

```yaml
extensions:
  additional_files:
    - "config/prompts/custom-prompts.yaml"
    - "config/prompts/event-prompts.yaml"
```

### 缓存管理

```javascript
const dynamicPromptService = gameStateService.getDynamicPromptService();

// 清除缓存
dynamicPromptService.clearCache();

// 获取服务状态
const status = dynamicPromptService.getStatus();
console.log(status);
// {
//   initialized: true,
//   version: "1.0.0",
//   cacheSize: 5,
//   strategiesCount: 3,
//   templatesCount: 8,
//   computedVariablesCount: 1
// }
```

## 实际应用示例

### 示例1：NPC对话系统

```javascript
// 玩家与NPC互动
function interactWithNPC(npcId, action) {
    const gameState = gameStateService.getState();
    
    // 根据行动更新关系值
    if (action === 'help') {
        gameState.updateNPCRelationship(10);
    } else if (action === 'attack') {
        gameState.updateNPCRelationship(-30);
    }
    
    // 生成包含关系状态的提示词
    const variables = gameState.getAllDynamicVariables();
    const prompt = gameStateService.generateGamePrompt({
        variables: variables
    });
    
    // 发送给LLM，LLM会根据关系值调整回应
    return llmService.generateResponse(prompt);
}
```

### 示例2：故事进度控制

```javascript
// 推进故事阶段
function advanceStory(currentProgress) {
    const gameState = gameStateService.getState();
    
    if (currentProgress < 25) {
        gameState.setStoryPhase('opening');
    } else if (currentProgress < 75) {
        gameState.setStoryPhase('development');
    } else if (currentProgress < 95) {
        gameState.setStoryPhase('climax');
    } else {
        gameState.setStoryPhase('ending');
    }
    
    // 提示词会自动包含当前故事阶段的指导
    const prompt = gameStateService.generateGamePrompt({
        variables: gameState.getAllDynamicVariables()
    });
    
    return prompt;
}
```

### 示例3：难度自适应

```javascript
// 根据玩家表现调整难度
function adjustDifficulty(playerPerformance) {
    const gameState = gameStateService.getState();
    
    if (playerPerformance.winRate > 0.8) {
        gameState.setDifficultyLevel('hard');
    } else if (playerPerformance.winRate < 0.3) {
        gameState.setDifficultyLevel('easy');
    } else {
        gameState.setDifficultyLevel('normal');
    }
    
    // LLM会根据难度等级调整挑战强度
    const prompt = gameStateService.generateGamePrompt({
        variables: gameState.getAllDynamicVariables(),
        strategy: 'combat_focused'
    });
    
    return prompt;
}
```

## 扩展指南

### 添加新变量

1. 在 `dynamic-prompts.yaml` 中定义变量：

```yaml
variables:
  player_mood:
    type: "string"
    description: "玩家情绪状态"
    values: ["happy", "neutral", "angry", "sad"]
```

2. 在 `GameState` 中初始化：

```javascript
_initializeDynamicVariables() {
    // ... 现有变量
    this.dynamicVariables.set('player_mood', 'neutral');
}
```

3. 创建对应的提示词模板：

```yaml
prompt_templates:
  player_mood:
    type: "enum"
    variable: "player_mood"
    conditions:
      - value: "happy"
        content: "玩家心情愉快..."
      - value: "angry"
        content: "玩家情绪激动..."
```

4. 添加到组合策略中：

```yaml
composition_strategies:
  default:
    order:
      - "base_gm"
      - "player_mood"  # 新增
      - "npc_relationship"
      # ...
```

### 创建自定义策略

```yaml
composition_strategies:
  exploration_focused:
    description: "探索场景专用"
    order:
      - "base_gm"
      - "world_state"
      - "exploration_hints"
      - "game_rules"
```

## 最佳实践

1. **变量命名**：使用清晰的命名，如 `npc_relationship` 而非 `nr`
2. **范围设计**：确保数值范围覆盖所有可能值，避免遗漏
3. **内容简洁**：提示词内容应简洁明确，避免冗余
4. **策略分离**：为不同场景创建专用策略，提高效率
5. **渐进式采用**：可以先在部分功能中使用，逐步扩展
6. **监控性能**：定期检查缓存命中率和生成时间
7. **版本管理**：配置文件应纳入版本控制

## 故障排查

### 问题：提示词未生成

**检查**：
- 服务是否已初始化
- 配置文件路径是否正确
- 变量值是否在定义的范围内

### 问题：使用了传统提示词

**原因**：
- 动态提示词服务初始化失败
- `useDynamic` 参数设为 `false`
- 配置文件解析错误

**解决**：查看控制台错误信息，检查配置文件格式

### 问题：变量值无效

**检查**：
```javascript
const dynamicPromptService = gameStateService.getDynamicPromptService();
const isValid = dynamicPromptService.validateVariableValue('npc_relationship', 150);
// false - 超出范围 [-100, 100]
```

## API参考

### GameState

- `setDynamicVariable(name, value)` - 设置单个变量
- `getDynamicVariable(name)` - 获取单个变量
- `setDynamicVariables(variables)` - 批量设置变量
- `getAllDynamicVariables()` - 获取所有变量
- `updateNPCRelationship(delta)` - 更新NPC关系值
- `updatePlayerReputation(delta)` - 更新玩家声望
- `setStoryPhase(phase)` - 设置故事阶段
- `setDifficultyLevel(level)` - 设置难度等级

### DynamicPromptService

- `initialize(configPath)` - 初始化服务
- `generatePrompt(variables, strategy)` - 生成提示词
- `registerComputedVariable(name, func)` - 注册计算变量
- `clearCache()` - 清除缓存
- `getStatus()` - 获取服务状态
- `validateVariableValue(name, value)` - 验证变量值

### GameStateService

- `initializeDynamicPrompts(configPath)` - 初始化动态提示词
- `generateGamePrompt(options)` - 生成游戏提示词
- `getDynamicPromptService()` - 获取动态提示词服务实例

## 总结

动态提示词系统提供了一个强大而灵活的机制来管理游戏中的LLM提示词。通过外部配置文件和条件选择，你可以轻松实现复杂的提示词逻辑，而无需修改代码。系统的高度可扩展性确保了它能够随着游戏的发展而成长。