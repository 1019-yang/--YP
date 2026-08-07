# AIGC 设计师个人简历展示网站

一套静态个人作品集网站，支持暗色/亮色模式、作品按尺寸分类筛选、图片和视频作品原尺寸大图预览。默认内容为占位资料，替换 `data.js` 与 `assets/` 即可变成真实简历。

## 文件结构

```text
designer-portfolio/
├── index.html          # 页面结构
├── styles.css          # 视觉样式
├── data.js             # 个人资料、作品、经历等全部内容
├── main.js             # 交互逻辑
├── assets/
│   ├── artwork-*.png   # 占位作品图
│   ├── lucide.min.js   # 本地图标库
│   └── resume-placeholder.pdf
└── README.md
```

## 替换个人资料

打开 `data.js`，把 `name`、`tagline`、`bio`、`experience`、`contact` 等字段换成真实内容即可。联系方式改成真实邮箱、微信号和作品主页后，“联系我”按钮会自动指向你的邮箱。

## 添加作品

### 图片作品

1. 把图片放进 `assets/`。
2. 在 `data.js` 的 `works` 数组里新增一条：

```js
{
  type: "image",
  title: "作品名称",
  category: "wide",          // wide / portrait / square / panorama
  ratio: "16:9",
  size: "2400 × 1350",
  tools: "Midjourney · Photoshop",
  year: "2026",
  src: "assets/你的图片.png",
  alt: "图片描述"
}
```

### 视频作品

1. 把视频文件放进 `assets/videos/`（建议 mp4，文件不要过大）。
2. 在 `data.js` 的 `works` 数组里新增一条：

```js
{
  type: "video",
  title: "作品名称",
  category: "video",
  ratio: "16:9",
  duration: "0:15",
  tools: "After Effects · Runway",
  year: "2026",
  src: "assets/videos/你的视频.mp4",
  poster: "assets/封面图.png",
  alt: "视频描述"
}
```

有视频作品后，“视频”分类会自动出现，支持网页内播放和大屏预览。

## 本地预览

直接双击打开 `index.html` 即可预览。

## 部署到 GitHub Pages

1. 在 GitHub 上新建一个公开仓库，例如 `portfolio`。
2. 在本地打开 `designer-portfolio` 文件夹，执行：

```bash
git init
git add .
git commit -m "init portfolio"
git branch -M main
git remote add origin https://github.com/你的用户名/portfolio.git
git push -u origin main
```

3. 在 GitHub 仓库页面打开 Settings → Pages，把 Source 设为 `main` 分支的根目录。
4. 部署完成后访问 `https://你的用户名.github.io/portfolio/`，把这个链接发给 HR 即可。

> 当前 `data.js` 和 `assets/` 均为占位内容，公开部署前请替换为真实资料。
