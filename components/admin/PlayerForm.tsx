'use client';

import { useState } from 'react';
import { Player, Position } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { X, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface PlayerFormProps {
  onSubmit: (player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialPlayer?: Player;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGE_SIZE = 500; // Max dimension for compression

export function PlayerForm({ onSubmit, onCancel, initialPlayer }: PlayerFormProps) {
  const { isAdmin: currentUserIsAdmin, currentPlayer } = useAuth();

  const [name, setName] = useState(initialPlayer?.name || '');
  const [positionPreference, setPositionPreference] = useState<Position>(
    initialPlayer?.positionPreference || 'Farketmez'
  );
  const [photoUrl, setPhotoUrl] = useState(initialPlayer?.photoUrl || '');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(initialPlayer?.isAdmin || false);
  const [isUploading, setIsUploading] = useState(false);

  // Non-admin users can only edit their own profile
  const isEditingOwnProfile = !currentUserIsAdmin && initialPlayer?.id === currentPlayer?.id;
  const canEditAdminStatus = currentUserIsAdmin;

  // Convert file to base64 with compression
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Compress image using canvas
  const compressImage = (dataUrl: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with quality 0.7
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  const handleFileUpload = async (file: File) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert('Dosya boyutu çok büyük! Maksimum 2MB.');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin.');
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Compress image
      const compressed = await compressImage(base64, MAX_IMAGE_SIZE, MAX_IMAGE_SIZE);

      setPhotoUrl(compressed);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Fotoğraf işlenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // For editing, only include password if it's provided
    const submitData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      positionPreference,
      photoUrl: photoUrl || null,
      password: initialPlayer ? (password || initialPlayer.password) : password,
      isAdmin,
    };

    onSubmit(submitData);
  };

  const positions: Position[] = ['Forvet', 'Orta Saha', 'Defans', 'Kaleci', 'Farketmez'];

  return (
    <GlassCard className="p-6 bg-white/80 dark:bg-slate-900/70 border-slate-200/70 dark:border-slate-700/60 shadow-xl backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
        {initialPlayer ? 'Oyuncu Düzenle' : 'Yeni Oyuncu Ekle'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Ad Soyad *
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Ahmet Yılmaz"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Mevki Tercihi
          </label>
          <select
            value={positionPreference}
            onChange={(e) => setPositionPreference(e.target.value as Position)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white text-slate-900 dark:bg-slate-900/70 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Şifre {initialPlayer ? '(Boş bırakırsanız değiştirilmez)' : '*'}
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={initialPlayer ? '•••••••••' : 'Şifre girin'}
            required={!initialPlayer}
          />
          {isEditingOwnProfile && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Şifrenizi sadece siz değiştirebilirsiniz.</p>
          )}
        </div>

        {canEditAdminStatus && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
              />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin Yetkisi</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">Admin kullanıcılar tüm oyuncuları yönetebilir ve sahadaki her slotu boşaltabilir.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Fotoğraf
          </label>
          <div className="flex flex-col gap-3">
            {/* Upload Button */}
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 dark:bg-slate-900/70 dark:hover:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-700/60 rounded-lg cursor-pointer transition-colors">
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 text-slate-500 dark:text-slate-300 animate-spin" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Yükleniyor...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Fotoğraf Seç (Maks 2MB)</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
              />
            </label>

            {/* Preview */}
            {photoUrl && (
              <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <img
                  src={photoUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-300 dark:border-slate-700"
                />
                <div className="flex-1">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {photoUrl.length > 1000 ? `${(photoUrl.length / 1024).toFixed(1)} KB` : 'Küçük boyut'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl('');
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 rounded-lg transition-colors"
                  title="Fotoğrafı kaldır"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" variant="primary" className="flex-1" disabled={isUploading}>
            {initialPlayer ? 'Güncelle' : 'Ekle'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isUploading}>
            İptal
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
