import { Component, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  template: `
    <div class="markdown-editor">
      <!-- Editor Toolbar -->
      <div class="editor-toolbar">
        <div class="toolbar-section">
          <button 
            type="button" 
            class="toolbar-btn"
            [class.active]="activeTab() === 'edit'"
            (click)="setActiveTab('edit')"
            title="Edit">
            <i class="fas fa-edit"></i>
            <span>Edit</span>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            [class.active]="activeTab() === 'preview'"
            (click)="setActiveTab('preview')"
            title="Preview">
            <i class="fas fa-eye"></i>
            <span>Preview</span>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            [class.active]="activeTab() === 'split'"
            (click)="setActiveTab('split')"
            title="Split View">
            <i class="fas fa-columns"></i>
            <span>Split</span>
          </button>
        </div>

        <div class="toolbar-section" *ngIf="activeTab() === 'edit' || activeTab() === 'split'">
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertMarkdown('**', '**', 'bold text')"
            title="Bold">
            <i class="fas fa-bold"></i>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertMarkdown('*', '*', 'italic text')"
            title="Italic">
            <i class="fas fa-italic"></i>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertMarkdown('~~', '~~', 'strikethrough text')"
            title="Strikethrough">
            <i class="fas fa-strikethrough"></i>
          </button>
          
          <div class="toolbar-separator"></div>
          
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertHeading(1)"
            title="Heading 1">
            <span>H1</span>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertHeading(2)"
            title="Heading 2">
            <span>H2</span>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertHeading(3)"
            title="Heading 3">
            <span>H3</span>
          </button>
          
          <div class="toolbar-separator"></div>
          
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertList('unordered')"
            title="Bullet List">
            <i class="fas fa-list-ul"></i>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertList('ordered')"
            title="Numbered List">
            <i class="fas fa-list-ol"></i>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertLink()"
            title="Link">
            <i class="fas fa-link"></i>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertImage()"
            title="Image">
            <i class="fas fa-image"></i>
          </button>
          
          <div class="toolbar-separator"></div>
          
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertCodeBlock()"
            title="Code Block">
            <i class="fas fa-code"></i>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertTable()"
            title="Table">
            <i class="fas fa-table"></i>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="insertQuote()"
            title="Quote">
            <i class="fas fa-quote-left"></i>
          </button>
        </div>

        <div class="toolbar-section toolbar-right">
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="toggleFullscreen()"
            [title]="isFullscreen() ? 'Exit Fullscreen' : 'Fullscreen'">
            <i class="fas" [class.fa-expand]="!isFullscreen()" [class.fa-compress]="isFullscreen()"></i>
          </button>
          <button 
            type="button" 
            class="toolbar-btn"
            (click)="showHelp()"
            title="Markdown Help">
            <i class="fas fa-question-circle"></i>
          </button>
        </div>
      </div>

      <!-- Editor Content -->
      <div class="editor-content" [class.fullscreen]="isFullscreen()">
        <!-- Edit Only -->
        <div class="editor-pane" *ngIf="activeTab() === 'edit'">
          <textarea
            #editorTextarea
            class="editor-textarea"
            [(ngModel)]="content"
            (input)="onContentChange($event)"
            [placeholder]="placeholder"
            [disabled]="disabled">
          </textarea>
        </div>

        <!-- Preview Only -->
        <div class="preview-pane" *ngIf="activeTab() === 'preview'">
          <div class="preview-content">
            <markdown [data]="content" *ngIf="content"></markdown>
            <div class="empty-preview" *ngIf="!content">
              <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
              <p class="text-muted">Nothing to preview</p>
              <small class="text-muted">Switch to Edit mode to start writing</small>
            </div>
          </div>
        </div>

        <!-- Split View -->
        <div class="split-view" *ngIf="activeTab() === 'split'">
          <div class="editor-pane split">
            <textarea
              #splitEditorTextarea
              class="editor-textarea"
              [(ngModel)]="content"
              (input)="onContentChange($event)"
              [placeholder]="placeholder"
              [disabled]="disabled">
            </textarea>
          </div>
          <div class="preview-pane split">
            <div class="preview-content">
              <markdown [data]="content" *ngIf="content"></markdown>
              <div class="empty-preview" *ngIf="!content">
                <i class="fas fa-file-alt fa-2x text-muted mb-2"></i>
                <p class="text-muted">Nothing to preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Word Count -->
      <div class="editor-status" *ngIf="showWordCount">
        <span class="word-count">
          {{ getWordCount() }} words, {{ getCharCount() }} characters
        </span>
      </div>

      <!-- Help Modal -->
      <div class="help-modal" *ngIf="showHelpModal()" (click)="hideHelp()">
        <div class="help-content" (click)="$event.stopPropagation()">
          <div class="help-header">
            <h5>Markdown Syntax Guide</h5>
            <button type="button" class="btn-close" (click)="hideHelp()"></button>
          </div>
          <div class="help-body">
            <div class="help-section">
              <h6>Headers</h6>
              <code># H1<br>## H2<br>### H3</code>
            </div>
            <div class="help-section">
              <h6>Text Formatting</h6>
              <code>**bold**<br>*italic*<br>~~strikethrough~~</code>
            </div>
            <div class="help-section">
              <h6>Lists</h6>
              <code>- Bullet point<br>1. Numbered list</code>
            </div>
            <div class="help-section">
              <h6>Links & Images</h6>
              <code>[Link text](url)<br>![Alt text](image-url)</code>
            </div>
            <div class="help-section">
              <h6>Code</h6>
              <code>\`inline code\`<br>\`\`\`<br>code block<br>\`\`\`</code>
            </div>
            <div class="help-section">
              <h6>Tables</h6>
              <code>| Header 1 | Header 2 |<br>|----------|----------|<br>| Cell 1   | Cell 2   |</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .markdown-editor {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      background: white;
      min-height: 400px;

      &.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        border-radius: 0;
        min-height: 100vh;
      }
    }

    .editor-toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--gray-200);
      background: var(--gray-50);
      flex-wrap: wrap;

      .toolbar-section {
        display: flex;
        align-items: center;
        gap: 0.25rem;

        &.toolbar-right {
          margin-left: auto;
        }
      }

      .toolbar-btn {
        padding: 0.375rem 0.5rem;
        border: 1px solid var(--gray-300);
        border-radius: var(--radius-sm);
        background: white;
        color: var(--gray-600);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        min-width: 32px;
        justify-content: center;

        &:hover {
          background: var(--gray-100);
          color: var(--gray-900);
          border-color: var(--gray-400);
        }

        &.active {
          background: var(--primary-100);
          color: var(--primary-700);
          border-color: var(--primary-300);
        }

        i {
          font-size: 0.75rem;
        }

        span {
          font-size: 0.75rem;
          font-weight: 500;
        }
      }

      .toolbar-separator {
        width: 1px;
        height: 20px;
        background: var(--gray-300);
        margin: 0 0.25rem;
      }
    }

    .editor-content {
      flex: 1;
      display: flex;
      min-height: 300px;

      &.fullscreen {
        min-height: calc(100vh - 100px);
      }
    }

    .editor-pane {
      flex: 1;
      
      &.split {
        border-right: 1px solid var(--gray-200);
      }

      .editor-textarea {
        width: 100%;
        height: 100%;
        min-height: 300px;
        border: none;
        outline: none;
        padding: 1rem;
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        resize: none;
        background: transparent;

        .fullscreen & {
          min-height: calc(100vh - 150px);
        }

        &:focus {
          outline: none;
        }

        &::placeholder {
          color: var(--gray-400);
        }
      }
    }

    .preview-pane {
      flex: 1;
      overflow-y: auto;
      
      &.split {
        border-left: 1px solid var(--gray-200);
      }

      .preview-content {
        padding: 1rem;
        
        ::ng-deep {
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-weight: 600;
            
            &:first-child {
              margin-top: 0;
            }
          }

          h1 { font-size: 2rem; color: var(--gray-900); }
          h2 { font-size: 1.5rem; color: var(--gray-900); }
          h3 { font-size: 1.25rem; color: var(--gray-800); }
          h4 { font-size: 1.125rem; color: var(--gray-800); }
          h5 { font-size: 1rem; color: var(--gray-700); }
          h6 { font-size: 0.875rem; color: var(--gray-700); }

          p {
            margin-bottom: 1rem;
            line-height: 1.6;
            color: var(--gray-700);
          }

          ul, ol {
            margin-bottom: 1rem;
            padding-left: 1.5rem;
            
            li {
              margin-bottom: 0.25rem;
              line-height: 1.6;
              color: var(--gray-700);
            }
          }

          blockquote {
            margin: 1rem 0;
            padding: 0.75rem 1rem;
            border-left: 4px solid var(--primary-300);
            background: var(--primary-25);
            color: var(--gray-700);
            font-style: italic;
          }

          code {
            padding: 0.125rem 0.25rem;
            background: var(--gray-100);
            border-radius: var(--radius-sm);
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 0.875rem;
            color: var(--gray-800);
          }

          pre {
            margin: 1rem 0;
            padding: 1rem;
            background: var(--gray-900);
            border-radius: var(--radius-md);
            overflow-x: auto;
            
            code {
              background: transparent;
              color: var(--gray-100);
              padding: 0;
            }
          }

          table {
            width: 100%;
            margin: 1rem 0;
            border-collapse: collapse;
            
            th, td {
              padding: 0.5rem 0.75rem;
              border: 1px solid var(--gray-300);
              text-align: left;
            }
            
            th {
              background: var(--gray-50);
              font-weight: 600;
              color: var(--gray-900);
            }
            
            td {
              color: var(--gray-700);
            }
          }

          a {
            color: var(--primary-600);
            text-decoration: none;
            
            &:hover {
              color: var(--primary-700);
              text-decoration: underline;
            }
          }

          img {
            max-width: 100%;
            height: auto;
            border-radius: var(--radius-md);
            margin: 0.5rem 0;
          }

          hr {
            margin: 2rem 0;
            border: none;
            border-top: 1px solid var(--gray-300);
          }
        }
      }

      .empty-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        text-align: center;
      }
    }

    .split-view {
      display: flex;
      flex: 1;
    }

    .editor-status {
      padding: 0.5rem 1rem;
      border-top: 1px solid var(--gray-200);
      background: var(--gray-50);
      font-size: 0.75rem;
      color: var(--gray-500);
      text-align: right;
    }

    .help-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;

      .help-content {
        background: white;
        border-radius: var(--radius-lg);
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;

        .help-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--gray-200);

          h5 {
            margin: 0;
            font-weight: 600;
            color: var(--gray-900);
          }

          .btn-close {
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            color: var(--gray-500);

            &:hover {
              color: var(--gray-900);
            }
          }
        }

        .help-body {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;

          .help-section {
            h6 {
              margin: 0 0 0.5rem 0;
              font-weight: 600;
              color: var(--gray-900);
              font-size: 0.875rem;
            }

            code {
              display: block;
              padding: 0.75rem;
              background: var(--gray-100);
              border-radius: var(--radius-md);
              font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
              font-size: 0.75rem;
              color: var(--gray-700);
              white-space: pre-line;
              line-height: 1.4;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .editor-toolbar {
        padding: 0.5rem;
        gap: 0.25rem;

        .toolbar-btn {
          padding: 0.25rem;
          min-width: 28px;
          
          span {
            display: none;
          }
        }
      }

      .split-view {
        flex-direction: column;
        
        .editor-pane.split {
          border-right: none;
          border-bottom: 1px solid var(--gray-200);
        }
        
        .preview-pane.split {
          border-left: none;
        }
      }
    }
  `]
})
export class MarkdownEditorComponent implements OnInit {
  @Input() content: string = '';
  @Input() placeholder: string = 'Start writing your documentation...';
  @Input() disabled: boolean = false;
  @Input() showWordCount: boolean = true;
  @Input() height: string = '400px';

  @Output() contentChange = new EventEmitter<string>();

  activeTab = signal<'edit' | 'preview' | 'split'>('edit');
  isFullscreen = signal(false);
  showHelpModal = signal(false);

  ngOnInit(): void {
    // Set default tab based on screen size
    if (window.innerWidth > 768) {
      this.activeTab.set('split');
    }
  }

  setActiveTab(tab: 'edit' | 'preview' | 'split'): void {
    this.activeTab.set(tab);
  }

  onContentChange(event: any): void {
    this.content = event.target.value;
    this.contentChange.emit(this.content);
  }

  insertMarkdown(before: string, after: string = '', placeholder: string = ''): void {
    const textarea = this.getActiveTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = before + textToInsert + after;
    
    textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    
    // Update content
    this.content = textarea.value;
    this.contentChange.emit(this.content);
    
    // Set cursor position
    const newCursorPos = start + before.length + textToInsert.length;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  }

  insertHeading(level: number): void {
    const prefix = '#'.repeat(level) + ' ';
    this.insertAtLineStart(prefix, `Heading ${level}`);
  }

  insertList(type: 'ordered' | 'unordered'): void {
    const prefix = type === 'ordered' ? '1. ' : '- ';
    this.insertAtLineStart(prefix, 'List item');
  }

  insertLink(): void {
    this.insertMarkdown('[', '](url)', 'Link text');
  }

  insertImage(): void {
    this.insertMarkdown('![', '](image-url)', 'Alt text');
  }

  insertCodeBlock(): void {
    this.insertMarkdown('```\n', '\n```', 'code');
  }

  insertTable(): void {
    const table = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
    this.insertAtLineStart('', table);
  }

  insertQuote(): void {
    this.insertAtLineStart('> ', 'Quote text');
  }

  private insertAtLineStart(prefix: string, placeholder: string): void {
    const textarea = this.getActiveTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = textarea.value.split('\n');
    let currentLine = 0;
    let charCount = 0;

    // Find current line
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= start) {
        currentLine = i;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }

    // Insert prefix at line start
    const lineStart = charCount;
    const newContent = textarea.value.substring(0, lineStart) + 
                      prefix + 
                      (lines[currentLine] || placeholder) + 
                      textarea.value.substring(lineStart + (lines[currentLine]?.length || 0));

    textarea.value = newContent;
    this.content = newContent;
    this.contentChange.emit(this.content);

    // Set cursor position
    textarea.focus();
    textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length + placeholder.length);
  }

  private getActiveTextarea(): HTMLTextAreaElement | null {
    const editTextarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
    return editTextarea;
  }

  toggleFullscreen(): void {
    this.isFullscreen.set(!this.isFullscreen());
    
    if (this.isFullscreen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  showHelp(): void {
    this.showHelpModal.set(true);
  }

  hideHelp(): void {
    this.showHelpModal.set(false);
  }

  getWordCount(): number {
    if (!this.content) return 0;
    return this.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  getCharCount(): number {
    return this.content.length;
  }
}