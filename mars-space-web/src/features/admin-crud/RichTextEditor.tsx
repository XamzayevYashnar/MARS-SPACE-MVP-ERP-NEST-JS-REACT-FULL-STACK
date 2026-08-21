import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

/** TipTap editor with a restricted toolbar (spec §6.4). Emits HTML. */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose-invert min-h-[160px] max-w-none px-3 py-2 text-ice focus:outline-none [&_h2]:font-display [&_h2]:text-h3 [&_a]:text-oxide',
      },
    },
  });

  // Keep the editor in sync when the value is reset externally (e.g. tab switch).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn(
      'inline-flex h-8 w-8 items-center justify-center rounded-sm text-dust transition-colors hover:bg-basalt-raised hover:text-ice focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol',
      active && 'bg-basalt-raised text-oxide',
    );

  const setLink = () => {
    const url = window.prompt('URL');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="rounded-sm border border-hairline bg-basalt-raised">
      <div className="flex flex-wrap gap-1 border-b border-hairline p-1">
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading 2">
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Heading 3">
          <Heading3 className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Ordered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Quote">
          <Quote className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()} aria-label="Code">
          <Code className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive('link'))} onClick={setLink} aria-label="Link">
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
