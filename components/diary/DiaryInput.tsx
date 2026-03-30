'use client';
import { Sparkles, Loader2 } from 'lucide-react';
import { RefObject } from 'react';

export function DiaryInput({
  newEntry,
  setNewEntry,
  handleSubmit,
  isSubmitting,
  submitError,
  t,
  textareaRef
}: {
  newEntry: string;
  setNewEntry: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  t: (key: string) => string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <section className="bg-white p-10 rounded-3xl shadow-lg shadow-indigo-50/50 border border-slate-100 space-y-6">
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          <p className="font-bold mb-1">Error saving entry:</p>
          <p>{submitError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 whitespace-nowrap mr-2">
              {t('dash.prompts')}
            </span>
            {[
              { id: 'gratitude', label: t('dash.prompt.gratitude'), text: t('dash.prompt.gratitude.text') },
              { id: 'goals', label: t('dash.prompt.goals'), text: t('dash.prompt.goals.text') },
              { id: 'reflection', label: t('dash.prompt.reflection'), text: t('dash.prompt.reflection.text') },
            ].map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => {
                  const templateText = prompt.text;
                  if (!newEntry.trim()) {
                    setNewEntry(templateText);
                  } else {
                    setNewEntry(newEntry + "\n\n" + templateText);
                  }
                  textareaRef.current?.focus();
                }}
                className="px-4 py-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-full text-xs font-medium text-gray-600 transition-all whitespace-nowrap border border-transparent hover:border-indigo-100 active:scale-95"
              >
                {prompt.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder={t('dash.placeholder')}
              className="w-full min-h-[200px] p-6 bg-gray-50 border-none rounded-[2rem] text-base focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-none placeholder:text-gray-400"
            />
            <div className="absolute bottom-6 left-6 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${newEntry.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                {newEntry.length > 0 ? t('dash.writingMood') : t('dash.readyToListen')}
              </span>
            </div>
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                {newEntry.length} {t('dash.chars')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newEntry.trim()}
            className="group flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-full text-base font-semibold hover:bg-slate-800 transition-all duration-300 hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('dash.reflecting')}
              </>
            ) : (
              <>
                {t('dash.save')}
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
