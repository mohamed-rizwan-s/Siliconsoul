/**
 * Build Script for Minimal Blog
 * 
 * This script:
 * 1. Parses Markdown files with frontmatter
 * 2. Generates static HTML pages
 * 3. Creates search index JSON
 * 4. Generates sitemap.xml and rss.xml
 * 5. Copies assets to dist folder
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Types
// ============================================

interface PostFrontmatter {
  title: string;
  date: string;
  description: string;
  tags: string[];
  cover?: string;
  author?: string;
  draft?: boolean;
}

interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  html: string;
  readingTime: number;
  excerpt: string;
}

interface SearchIndexItem {
  title: string;
  description: string;
  content: string;
  url: string;
  date: string;
  tags: string[];
  readingTime: number;
}

// ============================================
// Configuration
// ============================================

const CONFIG = {
  postsDir: './posts',
  templatesDir: './templates',
  srcDir: './src',
  distDir: './dist',
  siteUrl: 'https://mohamed-rizwan-s.github.io/Siliconsoul',
  siteName: 'Minimal Blog',
  siteDescription: 'A minimal, elegant blog built with pure HTML, CSS, and JavaScript.',
  author: 'Mohamed Rizwan',
  postsPerPage: 9,
  // Base path for assets and links
  // Set to '' for local development or root domain
  // Set to '/repo-name' for GitHub Pages subdirectory
  basePath: '/Siliconsoul',
};

// ============================================
// Markdown Parser
// ============================================

class MarkdownParser {
  /**
   * Parse frontmatter from markdown content
   */
  static parseFrontmatter(content: string): { frontmatter: PostFrontmatter; body: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error('Invalid frontmatter format');
    }

    const frontmatterText = match[1];
    const body = match[2].trim();

    const frontmatter: Partial<PostFrontmatter> = {};

    // Parse YAML-like frontmatter
    frontmatterText.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;

      const key = line.slice(0, colonIndex).trim();
      let value: string | string[] = line.slice(colonIndex + 1).trim();

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
      if (value === 'true') value = true as any;
      if (value === 'false') value = false as any;

      (frontmatter as any)[key] = value;
    });

    // Set defaults
    frontmatter.author = frontmatter.author || CONFIG.author;
    frontmatter.tags = frontmatter.tags || [];
    frontmatter.draft = frontmatter.draft || false;

    return { frontmatter: frontmatter as PostFrontmatter, body };
  }

  /**
   * Convert markdown to HTML
   */
  static toHtml(markdown: string): string {
    let html = markdown;

    // Escape HTML in code blocks first
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
      const language = lang || 'text';
      codeBlocks.push(`<pre><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>`);
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
    // Fix consecutive blockquotes
    html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');

    // Horizontal rule
    html = html.replace(/^---$/gim, '<hr>');

    // Unordered lists
    html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\s*)+/g, match => `<ul>${match}</ul>`);

    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\s*)+/g, (match, offset, string) => {
      // Check if already wrapped in ul
      if (string.slice(0, offset).endsWith('</ul>')) {
        return match;
      }
      return `<ol>${match}</ol>`;
    });

    // Tables
    html = this.parseTables(html);

    // Paragraphs
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      // Skip if already a block element
      if (block.trim().startsWith('<') && !block.trim().startsWith('<code') && !block.trim().startsWith('<li')) {
        return block;
      }
      // Skip placeholders
      if (block.includes('___CODE_BLOCK_')) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('\n\n');

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
      html = html.replace(`___CODE_BLOCK_${i}___`, block);
    });

    return html.trim();
  }

  /**
   * Parse markdown tables
   */
  private static parseTables(html: string): string {
    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;

    return html.replace(tableRegex, (match, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = bodyRows.trim().split('\n').map((row: string) => {
        const cells = row.split('|').map((c: string) => c.trim()).filter(Boolean);
        return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`;
      });

      return `
        <table>
          <thead>
            <tr>${headers.map((h: string) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.join('')}
          </tbody>
        </table>
      `;
    });
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const div = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => (div as any)[m]);
  }
}

// ============================================
// Template Engine
// ============================================

class TemplateEngine {
  private templates: Map<string, string> = new Map();

  constructor(templatesDir: string) {
    this.loadTemplates(templatesDir);
  }

  /**
   * Load all templates from directory
   */
  private loadTemplates(dir: string): void {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.html')) {
        const name = path.basename(file, '.html');
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        this.templates.set(name, content);
      }
    }
  }

  /**
   * Render a template with variables
   */
  render(templateName: string, variables: Record<string, string>): string {
    let template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      template = template.replace(regex, value);
    }

    return template;
  }

  /**
   * Get raw template content
   */
  getTemplate(name: string): string | undefined {
    return this.templates.get(name);
  }
}

// ============================================
// Post Manager
// ============================================

class PostManager {
  private posts: Post[] = [];

  constructor(private postsDir: string) { }

  /**
   * Load all posts from directory
   */
  loadPosts(): Post[] {
    if (!fs.existsSync(this.postsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.postsDir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(this.postsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      try {
        const { frontmatter, body } = MarkdownParser.parseFrontmatter(content);

        // Skip drafts
        if (frontmatter.draft) continue;

        const slug = path.basename(file, '.md');
        const html = MarkdownParser.toHtml(body);
        const readingTime = this.calculateReadingTime(body);
        const excerpt = this.createExcerpt(body);

        this.posts.push({
          slug,
          frontmatter,
          content: body,
          html,
          readingTime,
          excerpt
        });
      } catch (error) {
        console.warn(`Failed to parse ${file}:`, error);
      }
    }

    // Sort by date (newest first)
    this.posts.sort((a, b) => {
      return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
    });

    return this.posts;
  }

  /**
   * Get all posts
   */
  getPosts(): Post[] {
    return this.posts;
  }

  /**
   * Get posts by tag
   */
  getPostsByTag(tag: string): Post[] {
    return this.posts.filter(post =>
      post.frontmatter.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }

  /**
   * Get all unique tags with counts
   */
  getTags(): Map<string, number> {
    const tags = new Map<string, number>();

    for (const post of this.posts) {
      for (const tag of post.frontmatter.tags) {
        const normalizedTag = tag.toLowerCase();
        tags.set(normalizedTag, (tags.get(normalizedTag) || 0) + 1);
      }
    }

    return new Map([...tags.entries()].sort((a, b) => b[1] - a[1]));
  }

  /**
   * Calculate reading time in minutes
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  /**
   * Create excerpt from content
   */
  private createExcerpt(content: string, maxLength: number = 160): string {
    // Remove markdown syntax
    let text = content
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

    if (text.length <= maxLength) {
      return text;
    }

    return text.slice(0, maxLength).trim() + '...';
  }
}

// ============================================
// Site Generator
// ============================================

class SiteGenerator {
  private templateEngine: TemplateEngine;
  private postManager: PostManager;

  constructor() {
    this.templateEngine = new TemplateEngine(CONFIG.templatesDir);
    this.postManager = new PostManager(CONFIG.postsDir);
  }

  /**
   * Build the entire site
   */
  build(): void {
    console.log('🚀 Building site...\n');

    // Clean and create dist directory
    this.cleanDist();

    // Load posts
    const posts = this.postManager.loadPosts();
    console.log(`✓ Loaded ${posts.length} posts`);

    // Generate pages
    this.generateHomePage(posts);
    this.generateBlogPage(posts);
    this.generatePostPages(posts);
    this.generateTagPages(posts);
    this.generateAboutPage();
    this.generate404Page();

    // Generate static files
    this.generateSearchIndex(posts);
    this.generateSitemap(posts);
    this.generateRss(posts);

    // Copy assets
    this.copyAssets();

    console.log('\n✅ Build complete!');
    console.log(`📁 Output: ${CONFIG.distDir}/`);
  }

  /**
   * Clean dist directory
   */
  private cleanDist(): void {
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

  /**
   * Generate home page
   */
  private generateHomePage(posts: Post[]): void {
    const latestPosts = posts.slice(0, 6);
    const tags = this.postManager.getTags();

    const latestPostsHtml = latestPosts.map(post => this.renderPostCard(post)).join('');
    const tagsCloudHtml = Array.from(tags.entries())
      .slice(0, 10)
      .map(([tag, count]) => `
        <a href="${CONFIG.basePath}/tags/${this.slugify(tag)}.html" class="tag-cloud-item">
          ${this.capitalize(tag)}
          <span class="tag-cloud-count">${count}</span>
        </a>
      `).join('');

    const content = this.templateEngine.render('home', {
      latestPosts: latestPostsHtml,
      tagsCloud: tagsCloudHtml
    });

    const html = this.renderBase({
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

  /**
   * Generate blog listing page
   */
  private generateBlogPage(posts: Post[]): void {
    const tags = this.postManager.getTags();

    const filterTagsHtml = Array.from(tags.keys())
      .slice(0, 8)
      .map(tag => `<button class="filter-tag" data-filter="${tag}">${this.capitalize(tag)}</button>`)
      .join('');

    const postsListHtml = posts.map(post => this.renderPostCard(post)).join('');

    const content = this.templateEngine.render('blog', {
      filterTags: filterTagsHtml,
      postsList: postsListHtml,
      postsCount: posts.length.toString(),
      pagination: ''
    });

    const html = this.renderBase({
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

  /**
   * Generate individual post pages
   */
  private generatePostPages(posts: Post[]): void {
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const prevPost = posts[i + 1];
      const nextPost = posts[i - 1];

      const postTagsHtml = post.frontmatter.tags
        .map(tag => `<a href="${CONFIG.basePath}/tags/${this.slugify(tag)}.html" class="tag-link">${tag}</a>`)
        .join('');

      const postCoverHtml = post.frontmatter.cover
        ? `<div class="post-cover"><img src="${CONFIG.basePath}${post.frontmatter.cover}" alt="${post.frontmatter.title}" loading="lazy"></div>`
        : '';

      const prevPostHtml = prevPost
        ? `<a href="${CONFIG.basePath}/posts/${prevPost.slug}.html" class="post-nav-item">
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
        ? `<a href="${CONFIG.basePath}/posts/${nextPost.slug}.html" class="post-nav-item next">
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
                ${relatedPosts.map(p => this.renderPostCard(p)).join('')}
              </div>
            </div>
          </section>`
        : '';

      const content = this.templateEngine.render('post', {
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        author: post.frontmatter.author || CONFIG.author,
        dateIso: post.frontmatter.date,
        dateFormatted: this.formatDate(post.frontmatter.date),
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

      const html = this.renderBase({
        title: `${post.frontmatter.title} - ${CONFIG.siteName}`,
        description: post.frontmatter.description,
        author: post.frontmatter.author || CONFIG.author,
        keywords: post.frontmatter.tags.join(', '),
        ogType: 'article',
        canonicalUrl: `${CONFIG.siteUrl}/posts/${post.slug}.html`,
        ogImage: post.frontmatter.cover ? `${CONFIG.siteUrl}${post.frontmatter.cover}` : `${CONFIG.siteUrl}/assets/og-image.jpg`,
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

  /**
   * Generate tag pages
   */
  private generateTagPages(allPosts: Post[]): void {
    const tags = this.postManager.getTags();

    for (const [tag, count] of tags) {
      const posts = this.postManager.getPostsByTag(tag);
      const postsListHtml = posts.map(post => this.renderPostCard(post)).join('');

      const content = this.templateEngine.render('tag', {
        tagName: this.capitalize(tag),
        postsCount: count.toString(),
        plural: count === 1 ? '' : 's',
        postsList: postsListHtml,
        pagination: ''
      });

      const html = this.renderBase({
        title: `${this.capitalize(tag)} - ${CONFIG.siteName}`,
        description: `Articles tagged with "${tag}"`,
        author: CONFIG.author,
        keywords: tag,
        ogType: 'website',
        canonicalUrl: `${CONFIG.siteUrl}/tags/${this.slugify(tag)}.html`,
        ogImage: `${CONFIG.siteUrl}/assets/og-image.jpg`,
        content,
        year: new Date().getFullYear().toString(),
        activeHome: '',
        activeBlog: 'active',
        activeAbout: ''
      });

      fs.writeFileSync(path.join(CONFIG.distDir, 'tags', `${this.slugify(tag)}.html`), html);
      console.log(`✓ Generated: tags/${this.slugify(tag)}.html`);
    }
  }

  /**
   * Generate about page
   */
  private generateAboutPage(): void {
    const content = this.templateEngine.render('about', {});

    const html = this.renderBase({
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

  /**
   * Generate 404 page
   */
  private generate404Page(): void {
    const content = this.templateEngine.render('404', {});

    const html = this.renderBase({
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

  /**
   * Generate search index JSON
   */
  private generateSearchIndex(posts: Post[]): void {
    const searchIndex: SearchIndexItem[] = posts.map(post => ({
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      content: post.excerpt,
      url: `${CONFIG.basePath}/posts/${post.slug}.html`,
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

  /**
   * Generate sitemap.xml
   */
  private generateSitemap(posts: Post[]): void {
    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${CONFIG.siteUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${CONFIG.siteUrl}/blog.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${CONFIG.siteUrl}/about.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;

    for (const post of posts) {
      xml += `
  <url>
    <loc>${CONFIG.siteUrl}/posts/${post.slug}.html</loc>
    <lastmod>${post.frontmatter.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    const tags = this.postManager.getTags();
    for (const tag of tags.keys()) {
      xml += `
  <url>
    <loc>${CONFIG.siteUrl}/tags/${this.slugify(tag)}.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    xml += '\n</urlset>';

    fs.writeFileSync(path.join(CONFIG.distDir, 'sitemap.xml'), xml);
    console.log('✓ Generated: sitemap.xml');
  }

  /**
   * Generate RSS feed
   */
  private generateRss(posts: Post[]): void {
    const now = new Date().toUTCString();
    const latestPosts = posts.slice(0, 20);

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${CONFIG.siteName}</title>
    <link>${CONFIG.siteUrl}</link>
    <description>${CONFIG.siteDescription}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${CONFIG.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />`;

    for (const post of latestPosts) {
      const postUrl = `${CONFIG.siteUrl}/posts/${post.slug}.html`;
      const pubDate = new Date(post.frontmatter.date).toUTCString();

      rss += `
    <item>
      <title>${this.escapeXml(post.frontmatter.title)}</title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${this.escapeXml(post.frontmatter.description)}</description>
      ${post.frontmatter.tags.map(tag => `<category>${this.escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
    }

    rss += `
  </channel>
</rss>`;

    fs.writeFileSync(path.join(CONFIG.distDir, 'rss.xml'), rss);
    console.log('✓ Generated: rss.xml');
  }

  /**
   * Copy static assets
   */
  private copyAssets(): void {
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

    // Copy assets if they exist
    const assetsDir = './assets';
    if (fs.existsSync(assetsDir)) {
      const copyRecursive = (src: string, dest: string) => {
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

  /**
   * Render base template with content
   */
  private renderBase(variables: Record<string, string>): string {
    let html = this.templateEngine.render('base', variables);
    return this.fixPaths(html);
  }

  /**
   * Fix paths in HTML for the current deployment type
   * Replaces template paths with proper paths including basePath
   */
  private fixPaths(html: string): string {
    const basePath = CONFIG.basePath;
    if (!basePath) return html;

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

  /**
   * Render a post card
   */
  private renderPostCard(post: Post): string {
    const tagsHtml = post.frontmatter.tags
      .slice(0, 3)
      .map(tag => `<span class="tag-link">${tag}</span>`)
      .join('');

    const imageHtml = post.frontmatter.cover
      ? `<div class="post-card-image"><img src="${CONFIG.basePath}${post.frontmatter.cover}" alt="${post.frontmatter.title}" loading="lazy"></div>`
      : `<div class="post-card-image" style="background: linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--border)) 100%);"></div>`;

    return `
      <article class="post-card">
        <a href="${CONFIG.basePath}/posts/${post.slug}.html" class="post-card-link" style="display: contents;">
          ${imageHtml}
          <div class="post-card-content">
            <div class="post-card-meta">
              <span class="post-card-author">${post.frontmatter.author || CONFIG.author}</span>
              <span>•</span>
              <time datetime="${post.frontmatter.date}">${this.formatDate(post.frontmatter.date)}</time>
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

  /**
   * Format date
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Create URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Capitalize first letter
   */
  private capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// ============================================
// Run Build
// ============================================

const generator = new SiteGenerator();
generator.build();
