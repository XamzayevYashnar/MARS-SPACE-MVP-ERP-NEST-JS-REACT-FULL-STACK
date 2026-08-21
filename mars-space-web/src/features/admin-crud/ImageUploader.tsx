import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';
import { getApiErrorMessage } from '@/shared/lib/apiError';
import { uploadImage } from './uploadImage';

export interface ImageUploaderProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
}

/** Drop-zone image uploader → POST /admin/uploads/image, stores the URL. */
export function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      onChange(result.url);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-medium text-ice">{label}</p>}
      {value ? (
        <div className="relative w-full overflow-hidden rounded-md border border-hairline">
          <img src={value} alt="" className="max-h-48 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t('actions.close')}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-sm bg-void/80 text-ice hover:bg-void"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) void handleFile(file);
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed py-10 text-sm text-dust transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol',
            dragOver ? 'border-oxide bg-oxide/5' : 'border-hairline hover:border-dust/40',
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          <span>Drag & drop or click to upload</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
