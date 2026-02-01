# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Site
```bash
npm run build
```

### 3. Preview Locally
```bash
npm run preview
```

Open http://localhost:3000 to view your blog.

---

## 📝 Adding a New Post

1. Create a new file in `/posts/` directory:
```bash
touch posts/my-new-post.md
```

2. Add frontmatter and content:
```markdown
---
title: My New Post
date: 2024-02-01
description: A brief description of my post
tags: [javascript, tutorial]
cover: /assets/images/my-image.jpg
---

Your content here in **Markdown**.
```

3. Rebuild the site:
```bash
npm run build
```

---

## 📤 Deploy to GitHub Pages

1. Update `build.js` with your info:
```javascript
const CONFIG = {
  siteUrl: 'https://github.com/mohamed-rizwan-s/Siliconsoul',
  siteName: 'Your Blog Name',
  author: 'Your Name',
  // ...
};
```

2. Build and deploy:
```bash
npm run build
npm run deploy
```

---

## 📁 Project Structure

```
my-blog/
├── posts/           # Markdown blog posts
├── templates/       # HTML templates
├── src/
│   ├── styles/      # CSS files
│   ├── scripts/     # JavaScript files
│   └── lib/         # Build script (TypeScript)
├── assets/          # Images, fonts, etc.
├── dist/            # Generated static site
├── build.js         # Build script (Node.js)
└── package.json
```

---

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build the static site |
| `npm run preview` | Preview locally |
| `npm run clean` | Remove dist folder |
| `npm run deploy` | Deploy to GitHub Pages |

---

## 🎨 Customization

### Change Colors
Edit `src/styles/main.css`:
```css
:root {
  --primary: 240 5.9% 10%;    /* Change primary color */
  --radius: 0.75rem;           /* Change border radius */
}
```

### Change Site Info
Edit `build.js`:
```javascript
const CONFIG = {
  siteName: 'Your Blog Name',
  siteDescription: 'Your description',
  author: 'Your Name',
};
```

---

## 💡 Tips

- **Draft posts**: Add `draft: true` to frontmatter
- **No cover image**: Omit the `cover` field
- **Multiple tags**: Use array syntax: `tags: [tag1, tag2]`
- **Custom styling**: Edit CSS variables in `main.css`

---

## 📚 Learn More

See [README.md](README.md) for full documentation.
