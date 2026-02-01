/**
 * Copy Code Button Module
 * Adds copy functionality to code blocks
 */

(function() {
  'use strict';

  /**
   * Initialize copy code buttons
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupCopyButtons);
    } else {
      setupCopyButtons();
    }
  }

  /**
   * Setup copy buttons for all code blocks
   */
  function setupCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre > code');
    
    codeBlocks.forEach(codeBlock => {
      const pre = codeBlock.parentElement;
      
      // Skip if already wrapped
      if (pre.parentElement?.classList.contains('code-block-wrapper')) {
        return;
      }
      
      // Wrap the pre element
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      
      // Insert wrapper before pre
      pre.parentNode.insertBefore(wrapper, pre);
      
      // Move pre into wrapper
      wrapper.appendChild(pre);
      
      // Create copy button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
      copyBtn.type = 'button';
      
      // Add click handler
      copyBtn.addEventListener('click', () => copyCode(codeBlock, copyBtn));
      
      // Add button to wrapper
      wrapper.appendChild(copyBtn);
    });
  }

  /**
   * Copy code to clipboard
   * @param {HTMLElement} codeBlock - The code element
   * @param {HTMLElement} button - The copy button
   */
  async function copyCode(codeBlock, button) {
    const code = codeBlock.textContent || '';
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (!successful) {
          throw new Error('Copy command failed');
        }
      }
      
      // Show success state
      showSuccess(button);
    } catch (error) {
      console.error('Failed to copy code:', error);
      showError(button);
    }
  }

  /**
   * Show success state on button
   * @param {HTMLElement} button - The copy button
   */
  function showSuccess(button) {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.classList.add('copied');
    
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, 2000);
  }

  /**
   * Show error state on button
   * @param {HTMLElement} button - The copy button
   */
  function showError(button) {
    const originalText = button.textContent;
    button.textContent = 'Failed';
    button.style.color = 'hsl(0 84% 60%)';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.color = '';
    }, 2000);
  }

  // Initialize
  init();
})();
