# 部署说明

## CDN部署指南

本项目已配置为支持从CDN加载，可以在本地通过小白X插件打开index.html文件。

### 部署步骤

#### 1. 上传到GitHub仓库

将整个项目上传到GitHub仓库：
```
https://github.com/halfmadnya/ST-GalGame
```

#### 2. 通过jsDelivr CDN访问

项目会自动通过以下CDN地址访问：
```
https://cdn.jsdelivr.net/gh/halfmadnya/ST-GalGame@main/
```

#### 3. 本地使用

1. 下载 `index.html` 文件到本地
2. 在支持小白X插件的环境中打开
3. 所有资源会自动从CDN加载

### 配置说明

#### config.js

项目的核心配置文件，自动检测运行环境：

```javascript
// 判断是否从本地文件打开
const isLocalFile = window.location.protocol === 'file:';

// 如果是本地文件，使用CDN；否则使用相对路径
const BASE_URL = isLocalFile ? CDN_BASE_URL : './';
```

#### 资源加载

所有资源都通过 `window.GameConfig` 获取正确的路径：

- **样式文件**：`GameConfig.getStylePath('assets/styles/galgame.css')`
- **模块文件**：`GameConfig.getModulePath('core/EventBus.js')`
- **配置文件**：`GameConfig.getConfigPath('config/prompts/galgame-prompts.json')`

### 文件结构

```
ST-GalGame/
├── index.html                          # 主页面（可单独下载使用）
├── config.js                           # 配置文件（CDN加载）
├── assets/                             # 资源文件
│   └── styles/
│       └── galgame.css                 # 样式文件
├── config/                             # 配置文件
│   └── prompts/
│       └── galgame-prompts.json        # 提示词配置（JSON格式）
├── core/                               # 核心模块
├── models/                             # 数据模型
├── services/                           # 服务层
├── controllers/                        # 控制器
├── views/                              # 视图层
└── utils/                              # 工具类
```

### 使用方式

#### 方式1：完全在线（推荐）

直接访问GitHub Pages或通过CDN：
```
https://cdn.jsdelivr.net/gh/halfmadnya/ST-GalGame@main/index.html
```

#### 方式2：本地+CDN（当前配置）

1. 下载 `index.html` 到本地
2. 在小白X环境中打开
3. 所有资源自动从CDN加载

#### 方式3：完全本地

1. 克隆整个仓库到本地
2. 修改 `config.js` 中的 `BASE_URL` 为 `'./'`
3. 在本地服务器中运行

### 更新部署

#### 更新代码

1. 修改代码并提交到GitHub
2. 推送到main分支
3. jsDelivr会自动更新（可能有缓存延迟）

#### 清除CDN缓存

如果需要立即更新，可以使用jsDelivr的清除缓存功能：
```
https://purge.jsdelivr.net/gh/halfmadnya/ST-GalGame@main/文件路径
```

或者使用版本标签：
```
https://cdn.jsdelivr.net/gh/halfmadnya/ST-GalGame@v1.0.0/
```

### 配置文件格式

#### JSON格式（推荐）

使用 `galgame-prompts.json`：
- ✅ 浏览器原生支持
- ✅ 解析速度快
- ✅ 不需要额外的库
- ✅ 易于调试

#### YAML格式（可选）

使用 `galgame-prompts.yaml`：
- ⚠️ 需要YAML解析库
- ⚠️ 解析速度较慢
- ✅ 更易读
- ✅ 支持注释

### 环境要求

#### 浏览器要求

- 支持ES6模块
- 支持Fetch API
- 支持Promise
- 推荐使用Chrome、Firefox、Edge等现代浏览器

#### 小白X插件

- 需要支持 `callGenerate` 函数
- 需要支持iframe环境
- 需要支持跨域资源加载

### 故障排查

#### 问题1：资源加载失败

**症状**：控制台显示404错误

**解决方案**：
1. 检查GitHub仓库是否公开
2. 确认文件路径正确
3. 检查jsDelivr CDN是否可访问
4. 查看 `config.js` 中的 `CDN_BASE_URL` 是否正确

#### 问题2：模块加载失败

**症状**：控制台显示模块导入错误

**解决方案**：
1. 确认所有模块文件都已上传
2. 检查模块路径是否正确
3. 查看浏览器是否支持ES6模块
4. 检查CORS设置

#### 问题3：配置文件解析失败

**症状**：提示词系统初始化失败

**解决方案**：
1. 确认使用JSON格式的配置文件
2. 检查JSON格式是否正确
3. 查看配置文件是否成功加载
4. 检查控制台错误信息

#### 问题4：样式未加载

**症状**：页面显示异常，没有样式

**解决方案**：
1. 检查CSS文件是否成功加载
2. 查看 `config.js` 是否正确加载
3. 确认 `getStylePath` 函数返回正确路径
4. 检查浏览器控制台的网络请求

### 性能优化

#### CDN缓存

jsDelivr会自动缓存文件：
- 默认缓存时间：7天
- 可以通过版本标签控制缓存
- 使用 `@latest` 获取最新版本

#### 资源压缩

建议压缩以下文件：
- CSS文件
- JavaScript文件
- JSON配置文件

#### 懒加载

可以实现模块的懒加载：
```javascript
// 按需加载模块
const module = await import(BASE_URL + 'path/to/module.js');
```

### 安全考虑

#### CORS设置

jsDelivr自动设置CORS头：
```
Access-Control-Allow-Origin: *
```

#### 内容安全

- 所有代码都是公开的
- 不要在代码中包含敏感信息
- API密钥应该在服务器端管理

### 监控和日志

#### 控制台日志

项目包含详细的日志输出：
```javascript
console.log('[GameCore] Initializing...');
console.log('[Config] Base URL:', BASE_URL);
```

#### 错误追踪

所有错误都会输出到控制台：
```javascript
console.error('Failed to load module:', error);
```

### 版本管理

#### 使用Git标签

```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0

# 使用特定版本
https://cdn.jsdelivr.net/gh/halfmadnya/ST-GalGame@v1.0.0/
```

#### 版本号规范

遵循语义化版本：
- 主版本号：不兼容的API修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

### 备份和恢复

#### 备份策略

1. GitHub仓库自动备份
2. 定期导出重要配置
3. 保存关键版本的标签

#### 恢复方法

```bash
# 恢复到特定版本
git checkout v1.0.0

# 或使用CDN的特定版本
https://cdn.jsdelivr.net/gh/halfmadnya/ST-GalGame@v1.0.0/
```

### 联系和支持

如有问题，请：
1. 查看项目文档
2. 检查GitHub Issues
3. 提交新的Issue

---

**最后更新**：2024-11-02
**维护者**：halfmadnya