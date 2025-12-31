import { PluginBaseShortcut } from '@/plugins/PluginBaseShortcut'
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useConfigStore } from '@/stores/config';
import { scrollToLine } from '@/utils/scrollToLine';

export class Find extends PluginBaseShortcut {
  constructor() {
    super();
    this.name = 'Find';
    this.description = 'Find text in the editor';
    this.performing = false;
    this.context = null;
    this.searchUI = null;
    this.highlightLayer = null;
    this.currentResults = null;
    this.activeResultIndex = 0;
    this.menuItem = {
      id: 'find',
      title: 'Find', 
      shortcut: 'CmdOrCtrl+F',
      submenu: 'Edit'
    };
  }

  async initialize(context) {
    this.context = context;
    this.createSearchUI();
    
    await listen('menu', (event) => {
      if (event.payload === 'find') {
        this.debouncedPerform(context);
      }
    });
  }

  perform(context) {
    if (this.performing) return
    this.performing = true
    
    this.showSearch()
    
    this.performing = false
  }

  createSearchUI() {
    if (this.searchUI) return;

    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'find-search-container';
    searchContainer.style.cssText = `
      position: absolute;
      top: 10px;
      right: 20px;
      z-index: 1000;
      display: none;
      text-align: right;
      width: 400px;
    `;

    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search...';
    searchInput.className = 'find-search-input';
    searchInput.autocomplete = 'off';
    searchInput.setAttribute('autocapitalize', 'off');
    searchInput.setAttribute('autocorrect', 'off');
    searchInput.setAttribute('spellcheck', 'false');
    searchInput.style.cssText = `
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: var(--color-background);
      color: var(--color-text);
      font-size: 13px;
      width: 200px;
      outline: none;
    `;

    // Event listeners
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.jumpToActiveResult();
        this.hideSearch();
        e.preventDefault();
      } else if (e.key === 'Escape') {
        this.hideSearch();
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        this.moveActiveResult(1);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        this.moveActiveResult(-1);
        e.preventDefault();
      }
    });

    searchInput.addEventListener('input', (e) => {
      // Real-time search as user types
      if (e.target.value.trim()) {
        this.performSearch(e.target.value);
      } else {
        this.clearResults();
      }
    });

    searchContainer.appendChild(searchInput);
    document.body.appendChild(searchContainer);

    // Add jump to line event listener
    searchContainer.addEventListener('jumpToLine', (e) => {
      const lineNumber = e.detail;
      if (this.context?.editor) {
        scrollToLine(this.context.editor, lineNumber);
      }
    });

    this.searchUI = {
      container: searchContainer,
      input: searchInput,
      results: null
    };
  }


  showSearch() {
    if (this.searchUI) {
      this.searchUI.container.style.display = 'block';
      this.searchUI.input.value = '';
      this.searchUI.input.focus();
    }
    this.clearResults();
  }

  hideSearch() {
    if (this.searchUI) {
      this.searchUI.container.style.display = 'none';
      this.searchUI.input.value = '';
    }
    this.clearResults();
  }

  async performSearch(query) {
    if (!query || !this.context) return;
    
    // First restore original content to remove previous highlights
    this.clearResults();
    
    try {
      const configStore = useConfigStore();
      
      const result = await invoke('search_text', {
        filename: configStore.filename,
        query: query,
        caseSensitive: false
      });
      
      console.log('Search results:', result);
      this.currentResults = result;
      this.displayResults(result, query);
      return result;
    } catch (error) {
      console.error('Search error:', error);
      return null;
    }
  }

  displayResults(results, query) {
    if (!results || !results.matches) return;

    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'find-results';
    resultsDiv.style.cssText = `
      background: rgb(48, 47, 50);
      border: 1px solid rgb(55, 55, 55);
      border-radius: 4px;
      margin-top: 5px;
      overflow-y: auto;
      font-size: 12px;
      z-index: 11;
    `;

    if (results.matches.length === 0) {
      resultsDiv.innerHTML = '<div style="padding: 8px; color: #999;">No matches</div>';
      this.activeResultIndex = 0;
    } else {
      this.activeResultIndex = 0;
      const matchesHtml = results.matches.map((match, index) => {
        const highlightedContent = this.highlightMatch(match.line_content.trim(), query);
        const isActive = index === 0;
        return `
          <div class="find-result-item" 
               style="padding: 16px 8px; cursor: pointer; ${isActive ? 'border-left: 3px solid rgb(122, 113, 139);' : ''}"
               data-line="${match.line_number}"
               data-index="${index}"
               onclick="this.closest('.find-search-container').dispatchEvent(new CustomEvent('jumpToLine', { detail: ${match.line_number} }))">
            <strong>Line ${match.line_number}:</strong> ${highlightedContent}
          </div>
        `;
      }).join('');
      
      // Jump to first result immediately
      if (results.matches.length > 0 && this.context?.editor) {
        scrollToLine(this.context.editor, results.matches[0].line_number, { keepFocus: true });
        this.searchUI.input.focus();
      }
      
      resultsDiv.innerHTML = `
        <div style="padding: 4px 8px; font-weight: bold;">
          ${results.total_matches} match${results.total_matches !== 1 ? 'es' : ''}
        </div>
        ${matchesHtml}
      `;
    }

    this.searchUI.container.appendChild(resultsDiv);
    this.searchUI.results = resultsDiv;
  }

  highlightMatch(content, query) {
    if (!query || !content) return this.escapeHtml(content);
    
    const escapedContent = this.escapeHtml(content);
    const escapedQuery = this.escapeHtml(query);
    
    // Create a case-insensitive regex to find all matches
    const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    return escapedContent.replace(regex, '<mark style="background: #ffeb3b; color: #000; padding: 1px 2px; border-radius: 2px;">$1</mark>');
  }

  moveActiveResult(direction) {
    if (!this.currentResults || !this.currentResults.matches || this.currentResults.matches.length === 0) return;
    
    const totalResults = this.currentResults.matches.length;
    this.activeResultIndex = (this.activeResultIndex + direction + totalResults) % totalResults;
    
    this.updateActiveResultDisplay();
    this.jumpToActiveResult(true);
  }
  
  updateActiveResultDisplay() {
    if (!this.searchUI.results) return;
    
    const resultItems = this.searchUI.results.querySelectorAll('.find-result-item');
    resultItems.forEach((item, index) => {
      if (index === this.activeResultIndex) {
        item.style.borderLeft = '3px solid rgb(122, 113, 139)';
      } else {
        item.style.borderLeft = '';
      }
    });
  }
  
  jumpToActiveResult(keepSearchFocus = false) {
    if (!this.currentResults || !this.currentResults.matches || this.currentResults.matches.length === 0) return;
    
    const activeMatch = this.currentResults.matches[this.activeResultIndex];
    if (activeMatch && this.context?.editor) {
      scrollToLine(this.context.editor, activeMatch.line_number, { keepFocus: keepSearchFocus });
      if (keepSearchFocus) {
        this.searchUI.input.focus();
      }
    }
  }

  clearResults() {
    if (this.searchUI.results) {
      this.searchUI.results.remove();
      this.searchUI.results = null;
    }
    this.activeResultIndex = 0;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Legacy method for compatibility
  async search(query) {
    return this.performSearch(query);
  }

}