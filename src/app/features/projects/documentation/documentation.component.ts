import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DocumentService } from '../../../core/services/document.service';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectDocument, Project, CreateDocumentRequest, UpdateDocumentRequest } from '../../../core/models';
import { MarkdownEditorComponent } from '../../../shared/components/markdown-editor/markdown-editor.component';
import { PageHeaderComponent, PageHeaderAction } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MarkdownModule, MarkdownEditorComponent, PageHeaderComponent],
  template: `
    <div class="documentation-page">
      <!-- Page Header -->
      <app-page-header 
        *ngIf="project() && !loading() && !error()"
        [title]="'Documentación'"
        [subtitle]="'Crea y gestiona la documentación del proyecto'"
        [actions]="headerActions">
        
        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb" class="mb-3">
          <ol class="breadcrumb mb-0">
            <li class="breadcrumb-item"><a routerLink="/projects" class="text-decoration-none">Proyectos</a></li>
            <li class="breadcrumb-item"><a [routerLink]="['/projects', projectId]" class="text-decoration-none">{{ project()?.name }}</a></li>
            <li class="breadcrumb-item active">Documentación</li>
          </ol>
        </nav>
        
        <!-- Search Box -->
        <div class="search-box mt-2" *ngIf="documents().length > 0 && !isEditing()">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Buscar documentos..."
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            class="form-control">
        </div>
      </app-page-header>

      <div class="documentation-content">
        <!-- Sidebar -->
        <div class="documentation-sidebar" *ngIf="!isEditing()">
          <!-- Documents List -->
          <div class="sidebar-section">
            <h6 class="sidebar-title">Documentos</h6>
            
            <!-- Loading State -->
            <div class="loading-state" *ngIf="loading()">
              <div class="spinner-border spinner-border-sm me-2"></div>
              Cargando...
            </div>

            <!-- Documents -->
            <div class="documents-list" *ngIf="!loading()">
              <div 
                class="document-item"
                *ngFor="let doc of filteredDocuments(); trackBy: trackByDocumentId"
                [class.active]="selectedDocument()?.id === doc.id"
                (click)="selectDocument(doc)">
                
                <div class="document-icon">
                  <i class="fas fa-file-alt"></i>
                </div>
                <div class="document-info">
                  <div class="document-name">{{ doc.documentName }}</div>
                  <div class="document-meta">
                    <span class="last-modified">{{ formatDate(doc.updatedAt) }}</span>
                    <span class="author">by {{ doc.author?.name || 'Unknown' }}</span>
                  </div>
                </div>
                <div class="document-actions">
                  <button 
                    type="button" 
                    class="btn btn-link btn-sm p-0"
                    (click)="editDocument(doc, $event)"
                    title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-link btn-sm p-0 text-danger"
                    (click)="deleteDocument(doc, $event)"
                    title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <!-- Empty State -->
              <div class="empty-state" *ngIf="documents().length === 0">
                <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-2">Aún no hay documentos</p>
                <small class="text-muted">Crea tu primer documento para comenzar</small>
              </div>

              <!-- No Search Results -->
              <div class="empty-state" *ngIf="documents().length > 0 && filteredDocuments().length === 0">
                <i class="fas fa-search fa-2x text-muted mb-3"></i>
                <p class="text-muted mb-2">No se encontraron documentos</p>
                <small class="text-muted">Intenta ajustar tus términos de búsqueda</small>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div class="sidebar-section" *ngIf="availableTags().length > 0">
            <h6 class="sidebar-title">Etiquetas</h6>
            <div class="tags-list">
              <button 
                type="button"
                class="tag-btn"
                *ngFor="let tag of availableTags()"
                [class.active]="selectedTags.includes(tag)"
                (click)="toggleTag(tag)">
                {{ tag }}
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="documentation-main" [class.full-width]="isEditing()">
          <!-- Document View -->
          <div class="document-view" *ngIf="selectedDocument() && !isEditing()">
            <div class="document-header">
              <h2 class="document-title">{{ selectedDocument()!.documentName }}</h2>
              <div class="document-meta">
                <span class="created-info">
                  Creado por {{ selectedDocument()!.author?.name }} el {{ formatDate(selectedDocument()!.createdAt) }}
                </span>
                <span class="updated-info" *ngIf="selectedDocument()!.updatedAt !== selectedDocument()!.createdAt">
                  Última actualización por {{ selectedDocument()!.lastModifier?.name }} el {{ formatDate(selectedDocument()!.updatedAt) }}
                </span>
              </div>
              <div class="document-tags" *ngIf="selectedDocument()!.tags?.length">
                <span class="tag" *ngFor="let tag of selectedDocument()!.tags">{{ tag }}</span>
              </div>
            </div>
            
            <div class="document-content">
              <markdown [data]="selectedDocument()!.content"></markdown>
            </div>
          </div>

          <!-- Document Editor -->
          <div class="document-editor" *ngIf="isEditing()">
            <form [formGroup]="documentForm" (ngSubmit)="saveDocument()">
              <!-- Document Info -->
              <div class="editor-header">
                <div class="form-group">
                  <label for="documentName" class="form-label">Nombre del Documento</label>
                  <input 
                    type="text" 
                    id="documentName" 
                    class="form-control"
                    formControlName="documentName"
                    placeholder="Ingresa el nombre del documento">
                  <div class="invalid-feedback" *ngIf="documentForm.get('documentName')?.invalid && documentForm.get('documentName')?.touched">
                    El nombre del documento es requerido
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="tags" class="form-label">Etiquetas</label>
                  <input 
                    type="text" 
                    id="tags" 
                    class="form-control"
                    formControlName="tagsString"
                    placeholder="Ingresa etiquetas separadas por comas">
                  <small class="form-text text-muted">Separa las etiquetas con comas</small>
                </div>

                <div class="form-check">
                  <input 
                    type="checkbox" 
                    id="isPublic" 
                    class="form-check-input"
                    formControlName="isPublic">
                  <label for="isPublic" class="form-check-label">
                    Hacer este documento público
                  </label>
                </div>
              </div>

              <!-- Markdown Editor -->
              <div class="editor-content">
                <app-markdown-editor
                  [content]="documentForm.get('content')?.value || ''"
                  (contentChange)="onContentChange($event)"
                  placeholder="Comienza a escribir tu documentación usando Markdown...">
                </app-markdown-editor>
              </div>
            </form>
          </div>

          <!-- Welcome State -->
          <div class="welcome-state" *ngIf="!selectedDocument() && !isEditing()">
            <div class="welcome-content">
              <i class="fas fa-book-open fa-4x text-primary mb-4"></i>
              <h3>Documentación del Proyecto</h3>
              <p class="lead">
                Crea documentación completa para tu proyecto usando Markdown.
              </p>
              <p>
                Documenta los requisitos de tu proyecto, arquitectura, referencias de API, guías de usuario 
                y más. Con soporte completo de Markdown, puedes crear contenido rico y formateado 
                que es fácil de leer y mantener.
              </p>
              <button 
                type="button" 
                class="btn btn-primary btn-lg"
                (click)="showCreateModal()">
                <i class="fas fa-plus me-2"></i>
                Crear Primer Documento
              </button>
            </div>
          </div>

          <!-- Error State -->
          <div class="alert alert-danger" *ngIf="error()" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>{{ error() }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .documentation-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      max-width: 300px;

      i {
        position: absolute;
        left: 0.75rem;
        color: var(--gray-400);
        font-size: 0.875rem;
        z-index: 2;
      }

      input {
        padding-left: 2.25rem;
        font-size: 0.875rem;
      }
    }

    .documentation-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .documentation-sidebar {
      width: 300px;
      background: var(--gray-50);
      border-right: 1px solid var(--gray-200);
      overflow-y: auto;
      padding: 1.5rem;

      .sidebar-section {
        margin-bottom: 2rem;

        .sidebar-title {
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 1rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      }

      .documents-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .document-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.2s ease;
        background: white;
        border: 1px solid var(--gray-200);

        &:hover {
          background: var(--primary-25);
          border-color: var(--primary-200);
        }

        &.active {
          background: var(--primary-100);
          border-color: var(--primary-300);

          .document-name {
            color: var(--primary-700);
            font-weight: 600;
          }
        }

        .document-icon {
          color: var(--primary-500);
          font-size: 1rem;
          flex-shrink: 0;
        }

        .document-info {
          flex: 1;
          min-width: 0;

          .document-name {
            font-weight: 500;
            color: var(--gray-900);
            font-size: 0.875rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-bottom: 0.25rem;
          }

          .document-meta {
            font-size: 0.75rem;
            color: var(--gray-500);

            .last-modified {
              margin-right: 0.5rem;
            }
          }
        }

        .document-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.2s ease;

          .btn-link {
            color: var(--gray-400);
            font-size: 0.75rem;
            padding: 0.25rem;

            &:hover {
              color: var(--primary-600);
            }

            &.text-danger:hover {
              color: var(--error-600);
            }
          }
        }

        &:hover .document-actions {
          opacity: 1;
        }
      }

      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;

        .tag-btn {
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-sm);
          background: white;
          color: var(--gray-600);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: var(--gray-100);
            border-color: var(--gray-400);
          }

          &.active {
            background: var(--primary-100);
            border-color: var(--primary-300);
            color: var(--primary-700);
          }
        }
      }

      .loading-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 2rem 1rem;
        color: var(--gray-500);
        font-size: 0.875rem;
      }
    }

    .documentation-main {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      &.full-width {
        width: 100%;
      }
    }

    .document-view {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;

      .document-header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--gray-200);

        .document-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 0.75rem;
        }

        .document-meta {
          font-size: 0.875rem;
          color: var(--gray-600);
          margin-bottom: 1rem;

          .created-info {
            display: block;
            margin-bottom: 0.25rem;
          }

          .updated-info {
            display: block;
            font-style: italic;
          }
        }

        .document-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;

          .tag {
            padding: 0.25rem 0.5rem;
            background: var(--primary-100);
            color: var(--primary-700);
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            font-weight: 500;
          }
        }
      }

      .document-content {
        ::ng-deep {
          h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
            
            &:first-child {
              margin-top: 0;
            }
          }

          h1 { font-size: 2.25rem; color: var(--gray-900); }
          h2 { font-size: 1.875rem; color: var(--gray-900); }
          h3 { font-size: 1.5rem; color: var(--gray-800); }
          h4 { font-size: 1.25rem; color: var(--gray-800); }
          h5 { font-size: 1.125rem; color: var(--gray-700); }
          h6 { font-size: 1rem; color: var(--gray-700); }

          p {
            margin-bottom: 1.25rem;
            line-height: 1.7;
            color: var(--gray-700);
            font-size: 1rem;
          }

          ul, ol {
            margin-bottom: 1.25rem;
            padding-left: 1.75rem;
            
            li {
              margin-bottom: 0.5rem;
              line-height: 1.7;
              color: var(--gray-700);
            }
          }

          blockquote {
            margin: 1.5rem 0;
            padding: 1rem 1.5rem;
            border-left: 4px solid var(--primary-400);
            background: var(--primary-25);
            color: var(--gray-700);
            font-style: italic;
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
          }

          code {
            padding: 0.15rem 0.35rem;
            background: var(--gray-100);
            border-radius: var(--radius-sm);
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 0.875rem;
            color: var(--gray-800);
          }

          pre {
            margin: 1.5rem 0;
            padding: 1.25rem;
            background: var(--gray-900);
            border-radius: var(--radius-lg);
            overflow-x: auto;
            
            code {
              background: transparent;
              color: var(--gray-100);
              padding: 0;
            }
          }

          table {
            width: 100%;
            margin: 1.5rem 0;
            border-collapse: collapse;
            border-radius: var(--radius-md);
            overflow: hidden;
            box-shadow: var(--shadow-sm);
            
            th, td {
              padding: 0.75rem 1rem;
              border: 1px solid var(--gray-300);
              text-align: left;
            }
            
            th {
              background: var(--gray-100);
              font-weight: 600;
              color: var(--gray-900);
            }
            
            td {
              color: var(--gray-700);
              background: white;
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
            border-radius: var(--radius-lg);
            margin: 1rem 0;
            box-shadow: var(--shadow-md);
          }

          hr {
            margin: 3rem 0;
            border: none;
            border-top: 1px solid var(--gray-300);
          }
        }
      }
    }

    .document-editor {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      form {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .editor-header {
        padding: 1.5rem 2rem;
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-50);
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 1.5rem;
        align-items: end;

        .form-group {
          .form-label {
            font-weight: 500;
            color: var(--gray-700);
            margin-bottom: 0.5rem;
            display: block;
          }

          .form-control {
            border: 1px solid var(--gray-300);
            border-radius: var(--radius-md);
            padding: 0.5rem 0.75rem;
            
            &:focus {
              border-color: var(--primary-400);
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
          }
        }

        .form-check {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;

          .form-check-input {
            margin: 0;
          }

          .form-check-label {
            font-size: 0.875rem;
            color: var(--gray-700);
          }
        }
      }

      .editor-content {
        flex: 1;
        overflow: hidden;
      }
    }

    .welcome-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;

      .welcome-content {
        text-align: center;
        max-width: 500px;

        h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 1rem;
        }

        .lead {
          font-size: 1.125rem;
          color: var(--gray-600);
          margin-bottom: 1rem;
        }

        p {
          color: var(--gray-600);
          line-height: 1.6;
          margin-bottom: 2rem;
        }
      }
    }

    @media (max-width: 768px) {
      .documentation-content {
        flex-direction: column;
      }

      .documentation-sidebar {
        width: 100%;
        max-height: 300px;
      }

      .page-header .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;

        .header-actions {
          justify-content: flex-start;

          .search-box input {
            width: 200px;
          }
        }
      }

      .document-editor .editor-header {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class DocumentationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  projectId: number = 0;
  project = signal<Project | null>(null);
  documents = signal<ProjectDocument[]>([]);
  selectedDocument = signal<ProjectDocument | null>(null);
  filteredDocuments = signal<ProjectDocument[]>([]);
  availableTags = signal<string[]>([]);
  
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  isEditing = signal(false);

  searchQuery = '';
  selectedTags: string[] = [];

  documentForm: FormGroup;
  editingDocumentId?: string;

  get headerActions(): PageHeaderAction[] {
    if (this.isEditing()) {
      return [
        {
          label: 'Cancelar',
          icon: 'fas fa-times',
          action: () => this.cancelEdit(),
          variant: 'outline'
        },
        {
          label: this.saving() ? 'Guardando...' : 'Guardar',
          icon: this.saving() ? 'fas fa-spinner fa-spin' : 'fas fa-save',
          action: () => this.saveDocument(),
          variant: 'primary'
        }
      ];
    } else {
      return [
        {
          label: 'Nuevo Documento',
          icon: 'fas fa-plus',
          action: () => this.showCreateModal(),
          variant: 'primary'
        }
      ];
    }
  }

  constructor() {
    this.documentForm = this.fb.group({
      documentName: ['', Validators.required],
      content: [''],
      tagsString: [''],
      isPublic: [false]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = parseInt(params['id']);
      this.loadProject();
      this.loadDocuments();
      this.loadTags();
    });
  }

  private loadProject(): void {
    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => {
        this.project.set(project);
      },
      error: (err) => {
        console.error('Error loading project:', err);
        this.error.set('Error al cargar el proyecto');
      }
    });
  }

  private loadDocuments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.documentService.getProjectDocuments(this.projectId).subscribe({
      next: (documents) => {
        this.documents.set(documents);
        this.filteredDocuments.set(documents);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        this.error.set('Error al cargar los documentos');
        this.loading.set(false);
      }
    });
  }

  private loadTags(): void {
    this.documentService.getDocumentTags(this.projectId).subscribe({
      next: (tags) => {
        this.availableTags.set(tags);
      },
      error: (err) => {
        console.error('Error loading tags:', err);
      }
    });
  }

  selectDocument(document: ProjectDocument): void {
    if (this.isEditing()) {
      // If currently editing, ask for confirmation before switching
      if (confirm('¿Descartar los cambios actuales y ver este documento?')) {
        this.cancelEdit();
        this.selectedDocument.set(document);
      }
    } else {
      this.selectedDocument.set(document);
    }
  }

  showCreateModal(): void {
    this.editingDocumentId = undefined;
    this.documentForm.reset({
      documentName: '',
      content: '',
      tagsString: '',
      isPublic: false
    });
    this.isEditing.set(true);
    this.selectedDocument.set(null);
  }

  editDocument(document: ProjectDocument, event: Event): void {
    event.stopPropagation();
    
    this.editingDocumentId = document.id;
    this.documentForm.patchValue({
      documentName: document.documentName,
      content: document.content,
      tagsString: document.tags?.join(', ') || '',
      isPublic: document.isPublic || false
    });
    this.isEditing.set(true);
    this.selectedDocument.set(null);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editingDocumentId = undefined;
    this.documentForm.reset();
  }

  canSave(): boolean {
    return this.documentForm.valid && this.documentForm.get('content')?.value?.trim();
  }

  saveDocument(): void {
    if (!this.canSave()) return;

    this.saving.set(true);
    this.error.set(null);

    const formValue = this.documentForm.value;
    const tags = formValue.tagsString ? 
      formValue.tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : 
      [];

    if (this.editingDocumentId) {
      // Update existing document
      const updateData: UpdateDocumentRequest = {
        documentName: formValue.documentName,
        content: formValue.content,
        tags: tags,
        isPublic: formValue.isPublic
      };

      this.documentService.updateDocument(this.editingDocumentId, updateData).subscribe({
        next: (updatedDocument) => {
          this.loadDocuments();
          this.loadTags();
          this.selectedDocument.set(updatedDocument);
          this.isEditing.set(false);
          this.saving.set(false);
        },
        error: (err) => {
          console.error('Error updating document:', err);
          this.error.set('Error al actualizar el documento');
          this.saving.set(false);
        }
      });
    } else {
      // Create new document
      const createData: CreateDocumentRequest = {
        projectId: this.projectId,
        documentName: formValue.documentName,
        content: formValue.content,
        tags: tags,
        isPublic: formValue.isPublic
      };

      this.documentService.createDocument(createData).subscribe({
        next: (newDocument) => {
          this.loadDocuments();
          this.loadTags();
          this.selectedDocument.set(newDocument);
          this.isEditing.set(false);
          this.saving.set(false);
        },
        error: (err) => {
          console.error('Error creating document:', err);
          this.error.set('Error al crear el documento');
          this.saving.set(false);
        }
      });
    }
  }

  deleteDocument(document: ProjectDocument, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de que quieres eliminar "${document.documentName}"? Esta acción no se puede deshacer.`)) {
      this.documentService.deleteDocument(document.id).subscribe({
        next: () => {
          this.loadDocuments();
          this.loadTags();
          
          // Clear selection if deleted document was selected
          if (this.selectedDocument()?.id === document.id) {
            this.selectedDocument.set(null);
          }
        },
        error: (err) => {
          console.error('Error deleting document:', err);
          this.error.set('Error al eliminar el documento');
        }
      });
    }
  }

  onContentChange(content: string): void {
    this.documentForm.patchValue({ content });
  }

  onSearch(): void {
    this.filterDocuments();
  }

  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.filterDocuments();
  }

  private filterDocuments(): void {
    let filtered = this.documents();

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.documentName.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by selected tags
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(doc => 
        doc.tags?.some(tag => this.selectedTags.includes(tag))
      );
    }

    this.filteredDocuments.set(filtered);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  trackByDocumentId(index: number, document: ProjectDocument): string {
    return document.id;
  }
}