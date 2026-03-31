# BioForm（bio-nocode-platform）

面向细胞实验场景的本地零代码数据应用：用自然语言生成表单、列表与图表，数据存于浏览器 IndexedDB。

## 环境要求

- Node.js 18+

## 安装与运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

## 配置

### DeepSeek API Key

在应用内「设置」页面填写 Key；也可按需扩展为环境变量（当前以界面存储为主）。

### 可选：品牌文案（Vite 环境变量）

在项目根目录 `.env` 中可设置：

- `VITE_APP_NAME`：产品名称
- `VITE_APP_TAGLINE`：副标题/标语

## 使用提示

- 可直接进入 **构建器**（`/builder`），用自然语言主导字段与页面；首页 **模板** 与构建器 **领域参考** 仅影响首轮提示侧重，不代替对话。
- 构建器内可打开 **运行选项**，控制运行页是否允许删除记录、导出表格。
- 首次访问首页会显示简短引导；清除站点本地数据后可再次看到。

## 技术栈

React、TypeScript、Vite、Ant Design、Dexie（IndexedDB）、Zustand。
