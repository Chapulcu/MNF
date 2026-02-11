'use client';

import { useEffect, useState } from 'react';
import { updatePitchState, getPitchState } from '@/lib/api/pitchState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';

export function MatchSchedulePanel() {
  const { toast } = useToast();
  const [scheduledAt, setScheduledAt] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const state = await getPitchState();
        setScheduledAt(state.scheduledAt ? toLocalDatetimeInput(new Date(state.scheduledAt)) : '');
        setIsActive(!!state.isActive);
      } catch (error) {
        console.error('Failed to load pitch schedule:', error);
      }
    };
    load();
  }, []);

  const toLocalDatetimeInput = (date: Date) => {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePitchState({
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        isActive,
      });
      toast('Maç planı güncellendi.', 'success');
    } catch (error) {
      console.error('Failed to update pitch schedule:', error);
      toast('Maç planı güncellenemedi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await updatePitchState({
        scheduledAt: null,
        isActive: false,
      });
      setScheduledAt('');
      setIsActive(false);
      toast('Plan temizlendi.', 'success');
    } catch (error) {
      console.error('Failed to clear pitch schedule:', error);
      toast('Plan temizlenemedi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-300 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/30">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Maç Planlama</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Tarih/saat girip sahayı aktif edebilirsiniz.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Maç Tarihi ve Saati
            </label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
              />
              Sahayı aktif et
            </label>
          </div>
        </div>

        <Alert variant="info">
          Saha aktif değilse oyuncular slotlara yerleşemez. Maç saatine geldiğinde aktif edebilirsiniz.
        </Alert>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={handleClear} disabled={saving}>
            Temizle
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
}
