import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { Upload, X, Image as ImageIcon, Loader, Target } from 'lucide-react';
import { toast } from 'sonner';
import { FocalPointPicker } from './FocalPointPicker';

interface FocalPoint {
  x: number;
  y: number;
}

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onFocalPointChange?: (point: FocalPoint) => void;
  focalPoint?: FocalPoint;
  label: string;
  folder?: string;
  showFocalPoint?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onFocalPointChange,
  focalPoint = { x: 50, y: 50 },
  label,
  folder = 'images',
  showFocalPoint = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showFocalPicker, setShowFocalPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen sadece görsel dosyası yükleyin');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setUploading(true);
    setProgress(0);

    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(prog));
      },
      (error) => {
        console.error('Upload error:', error);
        toast.error('Yükleme başarısız oldu');
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onChange(downloadURL);
        setUploading(false);
        setProgress(0);
        toast.success('Görsel yüklendi! ✨');
      }
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-mocha-400 uppercase tracking-widest">
        {label}
      </label>

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
          ${isDragging
            ? 'border-gold bg-gold/5 scale-[1.02]'
            : value
              ? 'border-cream-200 bg-cream-50/50'
              : 'border-cream-200 hover:border-gold hover:bg-gold/5'
          }
          ${uploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader size={32} className="text-gold animate-spin" />
            <div className="w-full bg-cream-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm font-bold text-mocha-600">
              Yükleniyor... {progress}%
            </p>
          </div>
        ) : value ? (
          <div className="relative group">
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-3">
              <Upload size={32} className="text-white" />
              <p className="text-white text-sm font-bold">Yeni Görsel Yükle</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center">
              <ImageIcon size={28} className="text-mocha-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-mocha-600 mb-1">
                Görseli sürükle-bırak veya tıkla
              </p>
              <p className="text-xs text-mocha-400">
                PNG, JPG, WEBP (Max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* URL Display */}
      {value && !uploading && (
        <div className="flex items-center gap-2 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
          <span className="text-[9px] font-mono text-emerald-600 truncate flex-1">
            {value}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success('URL kopyalandı!');
            }}
            className="text-[9px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 px-2 py-1"
          >
            KOPYALA
          </button>
        </div>
      )}

      {/* Focal Point Button */}
      {showFocalPoint && value && !uploading && (
        <button
          onClick={() => setShowFocalPicker(true)}
          className="w-full flex items-center justify-center gap-2 bg-gold/10 hover:bg-gold/20 border border-gold/20 hover:border-gold/30 rounded-xl p-3 transition-all group"
        >
          <Target size={16} className="text-gold" />
          <span className="text-xs font-bold text-gold">
            Odak Noktası Seç {focalPoint.x !== 50 || focalPoint.y !== 50 ? `(${focalPoint.x}%, ${focalPoint.y}%)` : ''}
          </span>
        </button>
      )}

      {/* Focal Point Picker Modal */}
      {showFocalPicker && value && (
        <FocalPointPicker
          imageUrl={value}
          value={focalPoint}
          onChange={(point) => {
            onFocalPointChange?.(point);
          }}
          onClose={() => setShowFocalPicker(false)}
        />
      )}
    </div>
  );
};
