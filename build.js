#!/usr/bin/env node
/**
 * Build Script for Minimal Blog
 * Pure Node.js - no external dependencies required
 * 
 * For GitHub Pages subdirectory deployment:
 * Set basePath to your repository name (e.g., '/my-blog')
 */

const fs = require('fs');
const path = require('path');

// ============================================
// Configuration - EDIT THIS FOR YOUR SETUP
// ============================================

const CONFIG = {
  postsDir: './posts',
  templatesDir: './templates',
  srcDir: './src',
  distDir: './dist',

  // IMPORTANT: For GitHub Pages subdirectory deployment:
  // - If your repo is 'username.github.io' (root site): basePath = ''
  // - If your repo is 'username.github.io/my-blog': basePath = '/my-blog'
  basePath: '/Siliconsoul',

  siteUrl: 'https://github.com/mohamed-rizwan-s/Siliconsoul',
  siteName: 'SiliconSoul',
  siteDescription: 'AI and everything in between. Built by AI.',
  author: 'Mohamed Rizwan',
  postsPerPage: 9,
};

// ============================================
// Path Helpers
// ============================================

/**
 * Get the base path for assets and links
 * Returns empty string for root deployment, or '/repo-name' for subdirectory
 */
function getBasePath() {
  return CONFIG.basePath || '';
}

/**
 * Fix paths in HTML for the current deployment type
 * Replaces template paths with proper paths including basePath
 */
function fixPaths(html) {
  const basePath = getBasePath();

  // Replace href="/..." with href="{basePath}/..."
  // But be careful not to replace external URLs

  // For assets, styles, scripts
  html = html.replace(/href="\/(assets|styles|scripts)\//g, `href="${basePath}/$1/`);
  html = html.replace(/src="\/(assets|scripts)\//g, `src="${basePath}/$1/`);

  // For page links
  html = html.replace(/href="\/blog\.html"/g, `href="${basePath}/blog.html"`);
  html = html.replace(/href="\/about\.html"/g, `href="${basePath}/about.html"`);
  html = html.replace(/href="\/rss\.xml"/g, `href="${basePath}/rss.xml"`);
  html = html.replace(/href="\/404\.html"/g, `href="${basePath}/404.html"`);
  html = html.replace(/href="\/search-index\.json"/g, `href="${basePath}/search-index.json"`);

  // For home link - handle both "/" and "/index.html"
  html = html.replace(/href="\/"/g, `href="${basePath}/"`);

  return html;
}

// ============================================
// Markdown Parser
// ============================================

function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('Invalid frontmatter format');
  }

  const frontmatterText = match[1];
  const body = match[2].trim();

  const frontmatter = {};

  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Remove quotes
    value = value.replace(/^["']|["']$/g, '');

    // Handle arrays (tags)
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map(v => v.trim().replace(/^["']|["']$/g, ''))
        .filter(v => v);
    }

    // Handle booleans
    if (value === 'true') value = true;
    if (value === 'false') value = false;

    frontmatter[key] = value;
  });

  // Set defaults
  frontmatter.author = frontmatter.author || CONFIG.author;
  frontmatter.tags = frontmatter.tags || [];
  frontmatter.draft = frontmatter.draft || false;

  return { frontmatter, body };
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function markdownToHtml(markdown) {
  let html = markdown;

  // Store code blocks
  const codeBlocks = [];
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
    const language = lang || 'text';
    codeBlocks.push(`<pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');

  // Horizontal rule
  html = html.replace(/^---$/gim, '<hr>');

  // Unordered lists
  html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\s*)+/g, match => `<ul>${match}</ul>`);

  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');

  // Tables (simple version)
  html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').map(h => h.trim()).filter(Boolean);
    const rows = bodyRows.trim().split('\n').map(row => {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    });

    return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  });

  // Paragraphs (process line by line to avoid wrapping existing blocks)
  const lines = html.split('\n');
  const result = [];
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      continue;
    }

    // Skip block-level elements
    if (line.startsWith('<') && !line.startsWith('<code') && !line.startsWith('<li')) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push(line);
      continue;
    }

    // Skip placeholders
    if (line.includes('___CODE_BLOCK_')) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push(line);
      continue;
    }

    // Regular text - wrap in paragraph
    if (!inParagraph) {
      result.push('<p>');
      inParagraph = true;
    }
    result.push(line);
  }

  if (inParagraph) {
    result.push('</p>');
  }

  html = result.join('\n');

  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    html = html.replace(`___CODE_BLOCK_${i}___`, block);
  });

  return html.trim();
}

// ============================================
// Template Engine
// ============================================

const templates = new Map();

function loadTemplates(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.html')) {
      const name = path.basename(file, '.html');
      let content = fs.readFileSync(path.join(dir, file), 'utf-8');
      templates.set(name, content);
    }
  }
}

function render(templateName, variables) {
  let template = templates.get(templateName);
  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    template = template.replace(regex, value);
  }

  return template;
}

// ============================================
// Post Manager
// ============================================

function loadPosts() {
  const posts = [];

  if (!fs.existsSync(CONFIG.postsDir)) {
    return posts;
  }

  const files = fs.readdirSync(CONFIG.postsDir);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(CONFIG.postsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const { frontmatter, body } = parseFrontmatter(content);

      if (frontmatter.draft) continue;

      const slug = path.basename(file, '.md');
      const html = markdownToHtml(body);
      const readingTime = Math.ceil(body.split(/\s+/).length / 200);

      // Create excerpt
      let excerpt = body
        .replace(/#+ /g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`{3}[\s\S]*?`{3}/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/> /g, '')
        .replace(/\n+/g, ' ')
        .trim();

      if (excerpt.length > 160) {
        excerpt = excerpt.slice(0, 160).trim() + '...';
      }

      posts.push({
        slug,
        frontmatter,
        content: body,
        html,
        readingTime,
        excerpt
      });
    } catch (error) {
      console.warn(`Failed to parse ${file}:`, error.message);
    }
  }

  // Sort by date (newest first)
  posts.sort((a, b) => {
    return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
  });

  return posts;
}

function getTags(posts) {
  const tags = new Map();

  for (const post of posts) {
    for (const tag of post.frontmatter.tags) {
      const normalizedTag = tag.toLowerCase();
      tags.set(normalizedTag, (tags.get(normalizedTag) || 0) + 1);
    }
  }

  return new Map([...tags.entries()].sort((a, b) => b[1] - a[1]));
}

function getPostsByTag(posts, tag) {
  return posts.filter(post =>
    post.frontmatter.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

// ============================================
// Helpers
// ============================================

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================
// Site Generator
// ============================================

function cleanDist() {
  if (fs.existsSync(CONFIG.distDir)) {
    fs.rmSync(CONFIG.distDir, { recursive: true });
  }
  fs.mkdirSync(CONFIG.distDir, { recursive: true });
  fs.mkdirSync(path.join(CONFIG.distDir, 'posts'), { recursive: true });
  fs.mkdirSync(path.join(CONFIG.distDir, 'tags'), { recursive: true });
  fs.mkdirSync(path.join(CONFIG.distDir, 'styles'), { recursive: true });
  fs.mkdirSync(path.join(CONFIG.distDir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(CONFIG.distDir, 'assets'), { recursive: true });
}

function renderPostCard(post) {
  const basePath = getBasePath();
  const tagsHtml = post.frontmatter.tags
    .slice(0, 3)
    .map(tag => `<span class="tag-link">${tag}</span>`)
    .join('');

  const postUrl = `${basePath}/posts/${post.slug}.html`;

  const imageHtml = post.frontmatter.cover
    ? `<div class="post-card-image"><img src="${post.frontmatter.cover}" alt="${post.frontmatter.title}" loading="lazy"></div>`
    : `<div class="post-card-image" style="background: linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--border)) 100%);"></div>`;

  return `
    <article class="post-card">
      <a href="${postUrl}" style="display: contents; text-decoration: none; color: inherit;">
        ${imageHtml}
        <div class="post-card-content">
          <div class="post-card-meta">
            <span class="post-card-author">${post.frontmatter.author || CONFIG.author}</span>
            <span>•</span>
            <time datetime="${post.frontmatter.date}">${formatDate(post.frontmatter.date)}</time>
          </div>
          <div class="post-card-title-wrapper">
            <h3 class="post-card-title">${post.frontmatter.title}</h3>
            <svg class="post-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 17 17 7"/>
              <path d="M7 7h10v10"/>
            </svg>
          </div>
          <div class="post-card-tags">
            ${tagsHtml}
          </div>
        </div>
      </a>
    </article>
  `;
}

function renderBase(variables) {
  let html = render('base', variables);

  // Fix paths for GitHub Pages subdirectory deployment
  html = fixPaths(html);

  return html;
}

function generateHomePage(posts) {
  const basePath = getBasePath();
  const latestPosts = posts.slice(0, 6);
  const tags = getTags(posts);

  const latestPostsHtml = latestPosts.map(post => renderPostCard(post)).join('');
  const tagsCloudHtml = Array.from(tags.entries())
    .slice(0, 10)
    .map(([tag, count]) => {
      const tagUrl = `${basePath}/tags/${slugify(tag)}.html`;
      return `
        <a href="${tagUrl}" class="tag-cloud-item">
          ${capitalize(tag)}
          <span class="tag-cloud-count">${count}</span>
        </a>
      `;
    }).join('');

  const content = render('home', {
    latestPosts: latestPostsHtml,
    tagsCloud: tagsCloudHtml
  });

  const html = renderBase({
    title: `${CONFIG.siteName} - ${CONFIG.siteDescription}`,
    description: CONFIG.siteDescription,
    author: CONFIG.author,
    keywords: 'blog, design, development, minimal',
    ogType: 'website',
    canonicalUrl: CONFIG.siteUrl,
    ogImage: `${CONFIG.siteUrl}/assets/og-image.jpg`,
    content,
    year: new Date().getFullYear().toString(),
    activeHome: 'active',
    activeBlog: '',
    activeAbout: ''
  });

  fs.writeFileSync(path.join(CONFIG.distDir, 'index.html'), html);
  console.log('✓ Generated: index.html');
}

function generateBlogPage(posts) {
  const tags = getTags(posts);

  const filterTagsHtml = Array.from(tags.keys())
    .slice(0, 8)
    .map(tag => `<button class="filter-tag" data-filter="${tag}">${capitalize(tag)}</button>`)
    .join('');

  const postsListHtml = posts.map(post => renderPostCard(post)).join('');

  const content = render('blog', {
    filterTags: filterTagsHtml,
    postsList: postsListHtml,
    postsCount: posts.length.toString(),
    pagination: ''
  });

  const html = renderBase({
    title: `Blog - ${CONFIG.siteName}`,
    description: 'All articles and thoughts on design, development, and creativity.',
    author: CONFIG.author,
    keywords: 'blog, articles, design, development',
    ogType: 'website',
    canonicalUrl: `${CONFIG.siteUrl}/blog.html`,
    ogImage: `${CONFIG.siteUrl}/assets/og-image.jpg`,
    content,
    year: new Date().getFullYear().toString(),
    activeHome: '',
    activeBlog: 'active',
    activeAbout: ''
  });

  fs.writeFileSync(path.join(CONFIG.distDir, 'blog.html'), html);
  console.log('✓ Generated: blog.html');
}

function generatePostPages(posts) {
  const basePath = getBasePath();

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const prevPost = posts[i + 1];
    const nextPost = posts[i - 1];

    const postTagsHtml = post.frontmatter.tags
      .map(tag => {
        const tagUrl = `${basePath}/tags/${slugify(tag)}.html`;
        return `<a href="${tagUrl}" class="tag-link">${tag}</a>`;
      })
      .join('');

    const postCoverHtml = post.frontmatter.cover
      ? `<div class="post-cover"><img src="${post.frontmatter.cover}" alt="${post.frontmatter.title}" loading="lazy"></div>`
      : '';

    const prevPostHtml = prevPost
      ? `<a href="${basePath}/posts/${prevPost.slug}.html" class="post-nav-item">
          <span class="post-nav-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Previous
          </span>
          <span class="post-nav-title">${prevPost.frontmatter.title}</span>
        </a>`
      : '<div></div>';

    const nextPostHtml = nextPost
      ? `<a href="${basePath}/posts/${nextPost.slug}.html" class="post-nav-item next">
          <span class="post-nav-label">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </span>
          <span class="post-nav-title">${nextPost.frontmatter.title}</span>
        </a>`
      : '<div></div>';

    const relatedPosts = posts
      .filter(p => p.slug !== post.slug && p.frontmatter.tags.some(t => post.frontmatter.tags.includes(t)))
      .slice(0, 3);

    const relatedPostsHtml = relatedPosts.length > 0
      ? `<section class="related-posts">
          <div class="related-posts-container">
            <h2 class="related-posts-title">Related Articles</h2>
            <div class="posts-grid posts-grid-3">
              ${relatedPosts.map(p => renderPostCard(p)).join('')}
            </div>
          </div>
        </section>`
      : '';

    const content = render('post', {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      author: post.frontmatter.author || CONFIG.author,
      dateIso: post.frontmatter.date,
      dateFormatted: formatDate(post.frontmatter.date),
      readingTime: post.readingTime.toString(),
      postTags: postTagsHtml,
      postCover: postCoverHtml,
      content: post.html,
      shareTitle: encodeURIComponent(post.frontmatter.title),
      shareUrl: encodeURIComponent(`${CONFIG.siteUrl}/posts/${post.slug}.html`),
      relatedPosts: relatedPostsHtml,
      prevPost: prevPostHtml,
      nextPost: nextPostHtml
    });

    const html = renderBase({
      title: `${post.frontmatter.title} - ${CONFIG.siteName}`,
      description: post.frontmatter.description,
      author: post.frontmatter.author || CONFIG.author,
      keywords: post.frontmatter.tags.join(', '),
      ogType: 'article',
      canonicalUrl: `${CONFIG.siteUrl}/posts/${post.slug}.html`,
      ogImage: post.frontmatter.cover || `${CONFIG.siteUrl}/assets/og-image.jpg`,
      content,
      year: new Date().getFullYear().toString(),
      activeHome: '',
      activeBlog: 'active',
      activeAbout: ''
    });

    fs.writeFileSync(path.join(CONFIG.distDir, 'posts', `${post.slug}.html`), html);
    console.log(`✓ Generated: posts/${post.slug}.html`);
  }
}

function generateTagPages(posts) {
  const basePath = getBasePath();
  const tags = getTags(posts);

  for (const [tag, count] of tags) {
    const tagPosts = getPostsByTag(posts, tag);
    const postsListHtml = tagPosts.map(post => renderPostCard(post)).join('');

    const content = render('tag', {
      tagName: capitalize(tag),
      postsCount: count.toString(),
      plural: count === 1 ? '' : 's',
      postsList: postsListHtml,
      pagination: ''
    });

    const html = renderBase({
      title: `${capitalize(tag)} - ${CONFIG.siteName}`,
      description: `Articles tagged with "${tag}"`,
      author: CONFIG.author,
      keywords: tag,
      ogType: 'website',
      canonicalUrl: `${CONFIG.siteUrl}/tags/${slugify(tag)}.html`,
      ogImage: `${CONFIG.siteUrl}/assets/og-image.jpg`,
      content,
      year: new Date().getFullYear().toString(),
      activeHome: '',
      activeBlog: 'active',
      activeAbout: ''
    });

    fs.writeFileSync(path.join(CONFIG.distDir, 'tags', `${slugify(tag)}.html`), html);
    console.log(`✓ Generated: tags/${slugify(tag)}.html`);
  }
}

function generateAboutPage() {
  const content = render('about', {});

  const html = renderBase({
    title: `About - ${CONFIG.siteName}`,
    description: `About ${CONFIG.author} and ${CONFIG.siteName}`,
    author: CONFIG.author,
    keywords: 'about, profile',
    ogType: 'website',
    canonicalUrl: `${CONFIG.siteUrl}/about.html`,
    ogImage: `${CONFIG.siteUrl}/assets/og-image.jpg`,
    content,
    year: new Date().getFullYear().toString(),
    activeHome: '',
    activeBlog: '',
    activeAbout: 'active'
  });

  fs.writeFileSync(path.join(CONFIG.distDir, 'about.html'), html);
  console.log('✓ Generated: about.html');
}

function generate404Page() {
  const content = render('404', {});

  const html = renderBase({
    title: `404 - Page Not Found - ${CONFIG.siteName}`,
    description: 'The page you are looking for does not exist.',
    author: CONFIG.author,
    keywords: '',
    ogType: 'website',
    canonicalUrl: `${CONFIG.siteUrl}/404.html`,
    ogImage: `${CONFIG.siteUrl}/assets/og-image.jpg`,
    content,
    year: new Date().getFullYear().toString(),
    activeHome: '',
    activeBlog: '',
    activeAbout: ''
  });

  fs.writeFileSync(path.join(CONFIG.distDir, '404.html'), html);
  console.log('✓ Generated: 404.html');
}

function generateSearchIndex(posts) {
  const basePath = getBasePath();
  const searchIndex = posts.map(post => ({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    content: post.excerpt,
    url: `${basePath}/posts/${post.slug}.html`,
    date: post.frontmatter.date,
    tags: post.frontmatter.tags,
    readingTime: post.readingTime
  }));

  fs.writeFileSync(
    path.join(CONFIG.distDir, 'search-index.json'),
    JSON.stringify(searchIndex, null, 2)
  );
  console.log('✓ Generated: search-index.json');
}

function generateSitemap(posts) {
  const now = new Date().toISOString();
  const baseUrl = CONFIG.siteUrl + getBasePath();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;

  for (const post of posts) {
    xml += `
  <url>
    <loc>${baseUrl}/posts/${post.slug}.html</loc>
    <lastmod>${post.frontmatter.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  const tags = getTags(posts);
  for (const tag of tags.keys()) {
    xml += `
  <url>
    <loc>${baseUrl}/tags/${slugify(tag)}.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }

  xml += '\n</urlset>';

  fs.writeFileSync(path.join(CONFIG.distDir, 'sitemap.xml'), xml);
  console.log('✓ Generated: sitemap.xml');
}

function generateRss(posts) {
  const now = new Date().toUTCString();
  const latestPosts = posts.slice(0, 20);
  const baseUrl = CONFIG.siteUrl + getBasePath();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${CONFIG.siteName}</title>
    <link>${baseUrl}</link>
    <description>${CONFIG.siteDescription}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />`;

  for (const post of latestPosts) {
    const postUrl = `${baseUrl}/posts/${post.slug}.html`;
    const pubDate = new Date(post.frontmatter.date).toUTCString();

    rss += `
    <item>
      <title>${escapeXml(post.frontmatter.title)}</title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.frontmatter.description)}</description>
      ${post.frontmatter.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
  }

  rss += `
  </channel>
</rss>`;

  fs.writeFileSync(path.join(CONFIG.distDir, 'rss.xml'), rss);
  console.log('✓ Generated: rss.xml');
}

function copyAssets() {
  // Copy styles
  const stylesDir = path.join(CONFIG.srcDir, 'styles');
  if (fs.existsSync(stylesDir)) {
    const styles = fs.readdirSync(stylesDir);
    for (const file of styles) {
      fs.copyFileSync(
        path.join(stylesDir, file),
        path.join(CONFIG.distDir, 'styles', file)
      );
    }
    console.log('✓ Copied styles');
  }

  // Copy scripts
  const scriptsDir = path.join(CONFIG.srcDir, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const scripts = fs.readdirSync(scriptsDir);
    for (const file of scripts) {
      fs.copyFileSync(
        path.join(scriptsDir, file),
        path.join(CONFIG.distDir, 'scripts', file)
      );
    }
    console.log('✓ Copied scripts');
  }

  // Copy assets
  const assetsDir = './assets';
  if (fs.existsSync(assetsDir)) {
    const copyRecursive = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    copyRecursive(assetsDir, path.join(CONFIG.distDir, 'assets'));
    console.log('✓ Copied assets');
  }
}

// ============================================
// Main Build Function
// ============================================

function build() {
  console.log('🚀 Building site...\n');

  const basePath = getBasePath();
  if (basePath) {
    console.log(`📁 Base path: ${basePath}`);
    console.log('💡 GitHub Pages subdirectory deployment enabled\n');
  }

  // Load templates
  loadTemplates(CONFIG.templatesDir);
  console.log(`✓ Loaded ${templates.size} templates\n`);

  // Clean and create dist directory
  cleanDist();

  // Load posts
  const posts = loadPosts();
  console.log(`✓ Loaded ${posts.length} posts\n`);

  if (posts.length === 0) {
    console.log('⚠️ No posts found. Create some Markdown files in /posts directory.');
  }

  // Generate pages
  generateHomePage(posts);
  generateBlogPage(posts);
  generatePostPages(posts);
  generateTagPages(posts);
  generateAboutPage();
  generate404Page();

  // Generate static files
  generateSearchIndex(posts);
  generateSitemap(posts);
  generateRss(posts);

  // Copy assets
  copyAssets();

  console.log('\n✅ Build complete!');
  console.log(`📁 Output: ${CONFIG.distDir}/`);

  if (basePath) {
    console.log(`\n💡 GitHub Pages Deployment:`);
    console.log('   1. Upload the /dist folder contents to your repository');
    console.log('   2. Go to Settings > Pages');
    console.log('   3. Set source to "Deploy from a branch"');
    console.log('   4. Select your branch and / (root) folder');
  }
}

// Run build
build();
