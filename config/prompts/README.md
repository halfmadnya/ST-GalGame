# GalGame 提示词配置目录

本目录包含GalGame恋爱模拟器的提示词配置文件。

## 文件说明

### galgame-prompts.json
主配置文件（JSON格式），包含：
- **变量定义**：定义好感度、故事阶段等动态变量
- **提示词模板**：不同好感度区间的提示词内容
- **组合策略**：定义提示词的组合顺序
- **扩展配置**：缓存、计算变量等配置

## 配置结构

```json
{
  "version": "1.0.0",
  "variables": { /* 变量定义 */ },
  "prompt_templates": { /* 提示词模板 */ },
  "composition_strategies": { /* 组合策略 */ },
  "extensions": { /* 扩展配置 */ }
}
```

## 变量定义

### npc_relationship（好感度）
- **类型**：number
- **范围**：-100 到 100
- **说明**：NPC对玩家的好感度

### story_phase（故事阶段）
- **类型**：string
- **可选值**：opening, development, climax, ending
- **说明**：当前故事进展阶段

### conversation_mood（对话氛围）
- **类型**：string
- **可选值**：happy, neutral, tense, romantic
- **说明**：当前对话的氛围

## 提示词模板类型

### Static（静态模板）
始终包含的固定内容，不依赖变量。

```json
{
  "type": "static",
  "content": "固定的提示词内容..."
}
```

### Conditional（条件模板）
基于数值变量的范围选择不同内容。

```json
{
  "type": "conditional",
  "variable": "npc_relationship",
  "conditions": [
    {
      "range": [-100, -50],
      "label": "厌恶",
      "content": "厌恶状态的提示词..."
    }
  ]
}
```

### Enum（枚举模板）
基于字符串变量的精确匹配。

```json
{
  "type": "enum",
  "variable": "story_phase",
  "conditions": [
    {
      "value": "opening",
      "label": "开场",
      "content": "开场阶段的提示词..."
    }
  ]
}
```

## 好感度区间

| 区间 | 标签 | 描述 |
|------|------|------|
| -100 ~ -50 | 厌恶 | 非常反感，主动避开 |
| -49 ~ -10 | 冷淡 | 保持距离，缺乏热情 |
| -9 ~ 20 | 普通 | 正常交流，不亲不疏 |
| 21 ~ 50 | 友好 | 有好感，愿意互动 |
| 51 ~ 75 | 亲密 | 明显喜欢，经常想见 |
| 76 ~ 100 | 恋人 | 深深爱着，想永远在一起 |

## 组合策略

### default（默认策略）
完整的提示词组合，包含所有指导内容。

```json
{
  "description": "默认的完整提示词组合",
  "order": [
    "base_gm",
    "character_guidance",
    "npc_relationship",
    "interaction_rules"
  ]
}
```

### quick_chat（快速对话）
简化版提示词，减少token消耗。

```json
{
  "description": "快速日常对话",
  "order": [
    "base_gm",
    "npc_relationship"
  ]
}
```

### story_event（剧情事件）
重要剧情场景专用。

```json
{
  "description": "重要剧情场景专用",
  "order": [
    "base_gm",
    "character_guidance",
    "npc_relationship",
    "interaction_rules"
  ]
}
```

## 修改提示词

### 1. 调整好感度区间

修改 `npc_relationship` 模板中的 `range` 值：

```json
{
  "range": [51, 75],
  "label": "亲密",
  "content": "你的自定义提示词..."
}
```

### 2. 添加新的变量

在 `variables` 中定义：

```json
"player_mood": {
  "type": "string",
  "description": "玩家情绪",
  "values": ["happy", "sad", "angry"]
}
```

然后创建对应的模板：

```json
"player_mood": {
  "type": "enum",
  "variable": "player_mood",
  "conditions": [
    {
      "value": "happy",
      "label": "开心",
      "content": "玩家心情愉快..."
    }
  ]
}
```

### 3. 创建新的策略

在 `composition_strategies` 中添加：

```json
"custom_strategy": {
  "description": "自定义策略",
  "order": [
    "base_gm",
    "your_template",
    "npc_relationship"
  ]
}
```

## 内容编写建议

### 1. 清晰明确
- 使用简洁的语言
- 避免冗长的描述
- 重点突出关键信息

### 2. 结构化
- 使用标题和列表
- 分段组织内容
- 保持格式一致

### 3. 角色一致性
- 确保不同好感度的提示词保持角色性格一致
- 只调整态度和亲密程度
- 不要改变核心性格特征

### 4. 渐进变化
- 相邻好感度区间的提示词应该有平滑过渡
- 避免态度突变
- 展现情感的自然发展

## 测试提示词

### 1. 检查JSON格式
使用JSON验证工具确保格式正确。

### 2. 测试不同好感度
在游戏中测试各个好感度区间的表现。

### 3. 验证角色一致性
确认角色性格在不同好感度下保持一致。

### 4. 调整优化
根据实际效果调整提示词内容。

## 扩展配置

### 缓存设置

```json
"cache": {
  "enabled": true,
  "ttl": 600
}
```

- `enabled`：是否启用缓存
- `ttl`：缓存时间（秒）

### 计算变量

```json
"computed_variables": {
  "enabled": true
}
```

启用后可以在代码中注册计算变量函数。

## 最佳实践

1. **版本控制**：修改前备份原文件
2. **渐进修改**：一次修改一个部分
3. **充分测试**：修改后测试所有受影响的场景
4. **文档记录**：为复杂逻辑添加注释
5. **保持简洁**：避免过于复杂的提示词

## 故障排查

### 问题：提示词未生效
- 检查JSON格式是否正确
- 确认变量名拼写正确
- 验证好感度值在定义的范围内

### 问题：角色态度不符
- 检查好感度区间设置
- 确认提示词内容正确
- 查看控制台日志

### 问题：配置加载失败
- 确认文件路径正确
- 检查CDN是否可访问
- 查看网络请求状态

## 相关文档

- [GalGame使用指南](../../docs/galgame-guide.md)
- [部署说明](../../DEPLOYMENT.md)
- [项目README](../../README.md)

## 技术支持

如有问题，请：
1. 查看完整文档
2. 检查控制台日志
3. 提交GitHub Issue

---

**配置版本**：1.0.0  
**最后更新**：2024-11-02