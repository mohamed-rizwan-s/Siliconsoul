# Minimal Blog

A modern, elegant, premium-looking blog built with **pure HTML, CSS, and JavaScript**—no frameworks, no dependencies, no backend required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

## ✨ Features

- ⚡ **Lightning Fast** - Zero JavaScript frameworks, under 50KB total
- 🎨 **Beautiful Design** - shadcn/ui inspired aesthetic with soft shadows and rounded corners
- 🌓 **Dark/Light Mode** - Automatic theme switching with localStorage persistence
- 🔍 **Client-Side Search** - Instant search using prebuilt JSON index
- 🏷️ **Tag Filtering** - Browse posts by topic
- 📱 **Fully Responsive** - Mobile-first design
- 🔒 **SEO Optimized** - Meta tags, sitemap.xml, RSS feed
- ♿ **Accessible** - ARIA labels, semantic HTML, keyboard navigation
- 📝 **Markdown Support** - Write posts in Markdown with YAML frontmatter
- 💻 **Syntax Highlighting** - Code blocks with copy-to-clipboard
- 📊 **Reading Time** - Automatic calculation
- 🖼️ **Lazy Loading** - Images load as needed

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (for the build script)
- npm or yarn

### Installation

1. **Clone or download this repository**

```bash
git clone https://github.com/yourusername/minimal-blog.git
cd minimal-blog
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the site**

```bash
npm run build
```

4. **Preview locally**

```bash
npm run preview
```

Open http://localhost:3000 to view your blog.

## 📝 Writing Posts

Create a new Markdown file in the `/posts` directory:

```markdown
---
title: Your Post Title
date: 2024-01-15
description: A brief description of your post
tags: [javascript, tutorial]
cover: /assets/images/your-image.jpg
author: Your Name
---

Your content here in **Markdown** format.

## Subheading

- List item 1
- List item 2

```javascript
// Code blocks work too
console.log('Hello, world!');
```
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title |
| `date` | Yes | Publication date (YYYY-MM-DD) |
| `description` | Yes | Short description for SEO and previews |
| `tags` | No | Array of tags |
| `cover` | No | Cover image URL |
| `author` | No | Author name (defaults to site author) |
| `draft` | No | Set to `true` to hide post |

After adding a post, rebuild the site:

```bash
npm run build
```

## 📁 Project Structure

```
my-blog/
├── posts/                  # Markdown blog posts
│   ├── post-1.md
│   └── post-2.md
├── templates/              # HTML templates
│   ├── base.html           # Base layout
│   ├── home.html           # Homepage
│   ├── blog.html           # Blog listing
│   ├── post.html           # Single post
│   ├── tag.html            # Tag page
│   ├── about.html          # About page
│   └── 404.html            # 404 page
├── src/
│   ├── styles/
│   │   ├── main.css        # Main stylesheet
│   │   └── prism.css       # Syntax highlighting
│   ├── scripts/
│   │   ├── theme.js        # Dark/light mode
│   │   ├── search.js       # Client-side search
│   │   ├── navigation.js   # Mobile nav, lazy loading
│   │   ├── prism.js        # Syntax highlighter
│   │   └── copy-code.js    # Copy code button
│   └── lib/
│       └── build.ts        # Build script
├── assets/                 # Static assets (images, fonts)
├── dist/                   # Generated static site
├── package.json
└── README.md
```

## 🛠️ Customization

### Site Configuration

Edit `src/lib/build.ts` to customize:

```typescript
const CONFIG = {
  siteUrl: 'https://github.com/mohamed-rizwan-s/Siliconsoul',
  siteName: 'Your Blog Name',
  siteDescription: 'Your blog description',
  author: 'Your Name',
  postsPerPage: 9,
};
```

### Styling

The design uses CSS custom properties (variables) for easy theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --radius: 0.75rem;
  /* ... */
}
```

Edit `src/styles/main.css` to customize colors, spacing, typography, and more.

### Adding Pages

1. Create a template in `/templates/`
2. Add generation logic in `src/lib/build.ts`
3. Rebuild the site

## 📤 Deployment

### GitHub Pages

1. **Create a repository** on GitHub

2. **Update `package.json`** with your repository URL:

```json
{
  "homepage": "https://github.com/mohamed-rizwan-s/Siliconsoul"
}
```

3. **Update build config** in `src/lib/build.ts`:

```typescript
const CONFIG = {
  siteUrl: 'https://github.com/mohamed-rizwan-s/Siliconsoul',
  // ...
};
```

4. **Build and deploy**:

```bash
npm run build
npm run deploy
```

Or use GitHub Actions for automatic deployment on push (see `.github/workflows/deploy.yml`).

### Netlify

1. Push your code to GitHub
2. Connect your repository to [Netlify](https://netlify.com)
3. Set build command: `npm run build`
4. Set publish directory: `dist`

### Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Framework preset: `Other`
4. Build command: `npm run build`
5. Output directory: `dist`

### Manual Deployment

Simply upload the contents of the `dist/` folder to any static hosting service.

## 🧪 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build the static site |
| `npm run preview` | Preview the built site locally |
| `npm run clean` | Remove the dist folder |
| `npm run deploy` | Deploy to GitHub Pages |

### Watch Mode

For development with auto-rebuild:

```bash
npm run watch
```

This watches for changes in posts and templates, rebuilding automatically.

## 🎨 Design System

The blog follows a consistent design system inspired by shadcn/ui:

- **Colors**: Neutral palette with HSL color space
- **Typography**: Inter font family
- **Spacing**: 4px base unit (0.25rem)
- **Shadows**: Soft, layered shadows
- **Radii**: 12px default (`rounded-xl`)
- **Transitions**: 150-300ms ease

## 🔍 SEO

The blog includes:

- Semantic HTML5 structure
- Meta tags (description, Open Graph, Twitter Cards)
- Canonical URLs
- Sitemap.xml generation
- RSS feed generation
- Structured data ready

## ♿ Accessibility

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Color contrast compliance
- Screen reader tested

## 📄 License

MIT License - feel free to use this template for personal or commercial projects.

## 🙏 Credits

- Design inspired by [shadcn/ui](https://ui.shadcn.com)
- Fonts by [Google Fonts](https://fonts.google.com)
- Icons from [Lucide](https://lucide.dev)

## 💬 Support

If you find this template helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting issues
- 🔀 Contributing improvements

---

Built with ♥ and vanilla web technologies.
