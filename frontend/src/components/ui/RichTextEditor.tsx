import React, { useState, useEffect } from 'react';
import { EditorContent, useEditor, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Heading1, Heading2, Heading3, Pilcrow, List, ListOrdered, 
  CheckSquare, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Link as LinkIcon, Image as ImageIcon, Paperclip,
  Code, Undo, Redo, Save, Check, Loader2, Video as VideoIcon, ExternalLink
} from 'lucide-react';

const ResizableMediaNodeView = (props: any) => {
  const { node, updateAttributes, extension, selected, editor, getPos } = props;
  const isVideo = extension.name === 'video';
  const isIframe = extension.name === 'iframe';
  
  const [isEditorFocused, setIsEditorFocused] = useState(editor.isFocused);
  useEffect(() => {
    const handleFocus = () => setIsEditorFocused(true);
    const handleBlur = () => setIsEditorFocused(false);
    editor.on('focus', handleFocus);
    editor.on('blur', handleBlur);
    return () => {
      editor.off('focus', handleFocus);
      editor.off('blur', handleBlur);
    };
  }, [editor]);

  const showSelection = selected && isEditorFocused;

  const width = node.attrs.width || '400px';
  const height = node.attrs.height || 'auto';

  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.pageX;
    
    const target = (e.currentTarget as HTMLElement).closest('.node-view-wrapper') as HTMLElement;
    const startWidth = target?.clientWidth || parseInt(String(width));

    const onMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = startWidth;
      const dx = moveEvent.pageX - startX;

      if (direction === 'e') newWidth = startWidth + dx;
      if (direction === 'w') newWidth = startWidth - dx;

      updateAttributes({ width: Math.max(100, newWidth) + 'px' });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    editor.chain().focus().setNodeSelection(getPos()).setTextAlign(align).run();
  };

  const align = node.attrs.textAlign;
  let justifyClass = 'justify-start';
  if (align === 'center') justifyClass = 'justify-center';
  if (align === 'right') justifyClass = 'justify-end';

  return (
    <NodeViewWrapper 
      className={`node-view-wrapper relative flex w-full my-6 outline-none ${justifyClass}`} 
    >
      <div className={`relative inline-block group max-w-full ${showSelection ? 'ring-2 ring-blue-500 rounded-sm' : ''}`}>
        {isVideo ? (
        <video src={node.attrs.src} controls style={{ width, height: 'auto' }} className="max-w-full rounded-sm object-contain bg-black cursor-pointer" onMouseDown={(e) => e.stopPropagation()} onDoubleClick={() => window.open(node.attrs.src, '_blank')} />
      ) : isIframe ? (
        <div className="max-w-full rounded-sm overflow-hidden bg-muted/20" style={{ width, height: 'auto', aspectRatio: '16/9' }}>
          <iframe src={node.attrs.src} className="w-full h-full border-0" />
        </div>
      ) : (
        <img src={node.attrs.src} style={{ width, height: 'auto' }} className="max-w-full rounded-sm object-contain cursor-pointer" draggable={false} onDoubleClick={() => window.open(node.attrs.src, '_blank')} />
      )}
      
      {/* Side Handles (Jira Style) */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity opacity-0 ${showSelection ? 'opacity-100' : 'group-hover:opacity-100'}`}>
         {/* Right Edge */}
         <div onMouseDown={(e) => handleResize(e, 'e')} className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 border border-white cursor-col-resize pointer-events-auto rounded-full shadow" />
         {/* Left Edge */}
         <div onMouseDown={(e) => handleResize(e, 'w')} className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 border border-white cursor-col-resize pointer-events-auto rounded-full shadow" />
      </div>

      {/* Floating Toolbar (Jira Style) */}
      {showSelection && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-700 rounded shadow-xl z-50 pointer-events-auto">
          <button type="button" onMouseDown={(e) => { e.preventDefault(); handleAlign('left'); }} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Alinhar à Esquerda"><AlignLeft className="w-4 h-4" /></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); handleAlign('center'); }} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Centralizar"><AlignCenter className="w-4 h-4" /></button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); handleAlign('right'); }} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Alinhar à Direita"><AlignRight className="w-4 h-4" /></button>
          <div className="w-[1px] h-4 bg-zinc-700 mx-1" />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); updateAttributes({ width: '100%' }); }} className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded text-[11px] font-medium" title="Largura Total">100%</button>
          <div className="w-[1px] h-4 bg-zinc-700 mx-1" />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); window.open(node.attrs.src, '_blank'); }} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Abrir em Nova Aba"><ExternalLink className="w-4 h-4" /></button>
        </div>
      )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = Image.extend({
  inline: false,
  group: 'block',
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: '400px' },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableMediaNodeView);
  }
});

export const Video = Node.create({
  name: 'video',
  group: 'block',
  inline: false,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, controls: { default: true }, width: { default: '480px' } };
  },
  parseHTML() { return [{ tag: 'video' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', class: 'max-w-full rounded-sm my-2', style: `width: ${HTMLAttributes.width}` })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableMediaNodeView);
  }
});

export const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  inline: false,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, frameborder: { default: 0 }, allowfullscreen: { default: true }, width: { default: '480px' } };
  },
  parseHTML() { return [{ tag: 'iframe' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'aspect-video w-full rounded-sm overflow-hidden my-2 bg-muted/20', style: `width: ${HTMLAttributes.width}` }, 
      ['iframe', mergeAttributes(HTMLAttributes, { class: 'w-full h-full border-0' })]
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableMediaNodeView);
  }
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  isSaving?: boolean;
  hasChanges?: boolean;
  onUploadMedia?: (file: File) => Promise<{ url: string, name: string, type: string } | null>;
}

const MenuBar = ({ editor, onUploadMedia }: { editor: any, onUploadMedia?: (file: File) => Promise<{ url: string, name: string, type: string } | null> }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const btnClass = "p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors";
  const activeClass = "bg-emerald-500/10 text-emerald-500";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadMedia) return;

    setIsUploading(true);
    try {
      const result = await onUploadMedia(file);
      if (result) {
        if (result.type.startsWith('image/')) {
          editor.chain().focus().setImage({ src: result.url }).run();
        } else if (result.type.startsWith('video/')) {
          editor.chain().focus().insertContent(`<video src="${result.url}" controls></video>`).run();
        } else {
          editor.chain().focus()
            .insertContent(`<a href="${result.url}" target="_blank" class="text-emerald-500 font-medium underline">📎 ${result.name}</a>&nbsp;`)
            .run();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL do link:', previousUrl)
    
    // cancelled
    if (url === null) return;
    
    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // if no text is selected, insert the URL as text
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>&nbsp;`).run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex items-center flex-wrap gap-1 p-2 border-b border-border/60 bg-muted/20 rounded-t-lg sticky top-0 z-10">
      
      {/* Undo/Redo */}
      <button type="button" title="Desfazer" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btnClass}><Undo className="w-4 h-4" /></button>
      <button type="button" title="Refazer" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btnClass}><Redo className="w-4 h-4" /></button>
      
      <div className="w-[1px] h-4 bg-border mx-1" />
      
      {/* Headings & Text - Dropdown */}
      <select
        className="h-7 text-xs bg-transparent hover:bg-muted/50 border border-transparent hover:border-border/50 text-foreground cursor-pointer outline-none rounded px-1 transition-colors"
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'p') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: parseInt(val) as any }).run();
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? '1' :
          editor.isActive('heading', { level: 2 }) ? '2' :
          editor.isActive('heading', { level: 3 }) ? '3' : 'p'
        }
      >
        <option value="p" className="bg-background">Texto normal</option>
        <option value="1" className="bg-background">Título 1</option>
        <option value="2" className="bg-background">Título 2</option>
        <option value="3" className="bg-background">Título 3</option>
      </select>
      
      <div className="w-[1px] h-4 bg-border mx-1" />

      {/* Basic Marks */}
      <button type="button" title="Negrito" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnClass} ${editor.isActive('bold') ? activeClass : ''}`}><Bold className="w-4 h-4" /></button>
      <button type="button" title="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnClass} ${editor.isActive('italic') ? activeClass : ''}`}><Italic className="w-4 h-4" /></button>
      <button type="button" title="Sublinhado" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btnClass} ${editor.isActive('underline') ? activeClass : ''}`}><UnderlineIcon className="w-4 h-4" /></button>
      <button type="button" title="Tachado" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btnClass} ${editor.isActive('strike') ? activeClass : ''}`}><Strikethrough className="w-4 h-4" /></button>
      
      <div className="w-[1px] h-4 bg-border mx-1" />

      {/* Colors & Highlight */}
      <div className="flex items-center gap-1 relative" title="Cor do Texto">
        <input
          type="color"
          onChange={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
          value={editor.getAttributes('textStyle').color || '#f0f5ff'}
          className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
        />
      </div>
      <button type="button" title="Destaque" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`${btnClass} ${editor.isActive('highlight') ? activeClass : ''}`}><Highlighter className="w-4 h-4" /></button>
      
      <div className="w-[1px] h-4 bg-border mx-1" />

      {/* Lists */}
      <button type="button" title="Lista com marcadores" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btnClass} ${editor.isActive('bulletList') ? activeClass : ''}`}><List className="w-4 h-4" /></button>
      <button type="button" title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btnClass} ${editor.isActive('orderedList') ? activeClass : ''}`}><ListOrdered className="w-4 h-4" /></button>
      <button type="button" title="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()} className={`${btnClass} ${editor.isActive('taskList') ? activeClass : ''}`}><CheckSquare className="w-4 h-4" /></button>
      
      <div className="w-[1px] h-4 bg-border mx-1" />

      {/* Align */}
      <button type="button" title="Alinhar à Esquerda" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`${btnClass} ${editor.isActive({ textAlign: 'left' }) ? activeClass : ''}`}><AlignLeft className="w-4 h-4" /></button>
      <button type="button" title="Centralizar" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`${btnClass} ${editor.isActive({ textAlign: 'center' }) ? activeClass : ''}`}><AlignCenter className="w-4 h-4" /></button>
      <button type="button" title="Alinhar à Direita" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`${btnClass} ${editor.isActive({ textAlign: 'right' }) ? activeClass : ''}`}><AlignRight className="w-4 h-4" /></button>
      <button type="button" title="Justificar" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`${btnClass} ${editor.isActive({ textAlign: 'justify' }) ? activeClass : ''}`}><AlignJustify className="w-4 h-4" /></button>
      
      <div className="w-[1px] h-4 bg-border mx-1" />

      {/* Blocks */}
      <button type="button" title="Inserir Link" onClick={setLink} className={`${btnClass} ${editor.isActive('link') ? activeClass : ''}`}><LinkIcon className="w-4 h-4" /></button>
      
      <button 
        type="button" 
        title="Anexar Mídia ou Arquivo" 
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()} 
        className={btnClass}
      >
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      </button>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
      
      <button type="button" title="Código" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${btnClass} ${editor.isActive('codeBlock') ? activeClass : ''}`}><Code className="w-4 h-4" /></button>
      
      <div className="flex-1" />
      
    </div>
  );
};

export function RichTextEditor({ value, onChange, onSave, onUploadMedia, placeholder = "Adicione uma descrição detalhada...", isSaving = false, hasChanges = false }: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const blurTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHasMounted(true);
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: 'list-disc ml-6 mt-1 mb-2' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal ml-6 mt-1 mb-2' } },
        listItem: { HTMLAttributes: { class: 'marker:text-emerald-500 m-0 p-0 leading-tight' } },
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'image', 'video', 'iframe'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      ResizableImage,
      Video,
      Iframe,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm dark:prose-invert prose-emerald text-white max-w-4xl mx-auto w-full min-h-[150px] p-4 focus:outline-none focus:ring-0',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });


  // Effect to sync value if it changes outside (e.g. initial load)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !isFocused) {
      editor.commands.setContent(value);
    }
  }, [value, editor, isFocused]);

  if (!hasMounted) {
    return <div className="min-h-[150px] w-full border border-border/60 rounded-lg bg-muted/10 p-4 text-muted-foreground">{placeholder}</div>;
  }

  return (
    <div 
      className="flex flex-col gap-2 relative"
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        // If focus moves completely outside the container, hide the toolbar
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsFocused(false);
        }
      }}
    >
      <div className={`w-full border rounded-lg transition-colors ${isFocused ? 'border-emerald-500/50 bg-background shadow-sm ring-2 ring-emerald-500/10' : 'border-border/60 bg-muted/5 hover:border-border'}`}>
        <div className={`transition-all duration-300 overflow-hidden ${isFocused ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <MenuBar editor={editor} onUploadMedia={onUploadMedia} />
        </div>
        <EditorContent editor={editor} className="cursor-text" />
      </div>

      {hasChanges && onSave && (
        <div className="flex justify-end gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            type="button"
            onClick={() => {
              if (editor) {
                editor.commands.setContent(value);
                onChange(value);
              }
            }}
            disabled={isSaving}
            className="px-4 py-2 text-[13px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onMouseDown={(e) => { e.preventDefault(); onSave(); }}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Check className="w-4 h-4 animate-pulse" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      )}
    </div>
  );
}
