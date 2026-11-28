import { useEffect, useMemo, useState } from 'react';
import {
  Expand,
  Maximize2,
  MessageSquarePlus,
  Minimize2,
  Minus,
  PanelLeft,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ChatComposer } from './ChatComposer';
import { ChatSessionRail } from './ChatSessionRail';
import { ChatThread } from './ChatThread';
import { CameraCapture } from './CameraCapture';
import { useChatUpload } from './useChatUpload';
import { useAiChat } from './useAiChat';

export type AiChatMode = 'closed' | 'minimized' | 'drawer' | 'full';

const modelLabel = 'DeepSeek 4.1 Flash';

export const AiChatDrawer = ({
  mode,
  onModeChange,
  onClose,
}: {
  mode: AiChatMode;
  onModeChange: (mode: AiChatMode) => void;
  onClose: () => void;
}) => {
  const { user, can } = useAuth();
  const enabled =
    Boolean(user) &&
    can('ai.use') &&
    ['ADMIN', 'OWNER', 'MEMBER'].includes(String(user?.role ?? ''));
  const chat = useAiChat(user?.id, enabled);
  const [railOpen, setRailOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const uploader = useChatUpload((message) => setAttachError(message));

  const activeTitle = useMemo(
    () => chat.sessions.find((session) => session.id === chat.activeId)?.title ?? 'New chat',
    [chat.sessions, chat.activeId],
  );

  const lastAssistant = [...chat.messages].reverse().find((message) => message.role === 'assistant');
  const open = mode === 'drawer' || mode === 'full';

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        onModeChange(open ? 'minimized' : 'drawer');
      }
      if (event.key === 'Escape' && open) {
        if (railOpen) setRailOpen(false);
        else onModeChange('drawer' === mode ? 'minimized' : 'drawer');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, open, mode, railOpen, onModeChange]);

  if (!enabled) {
    return null;
  }

  if (mode === 'closed') {
    return (
      <button
        type="button"
        onClick={() => onModeChange('drawer')}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-3 text-sm font-extrabold text-lime-accent shadow-xl transition-transform hover:-translate-y-0.5 hover:bg-brand-800"
        aria-label="Open the AI school assistant"
        title="Uncle Tee AI (Ctrl+Shift+A)"
      >
        <Sparkles size={17} aria-hidden="true" /> Ask AI
      </button>
    );
  }

  const beginNew = () => {
    chat.newChat();
    setRailOpen(false);
  };

  const selectSession = (id: string) => {
    void chat.openSession(id);
    setRailOpen(false);
  };

  const sendDraft = () => {
    void chat.send(chat.draft, chat.attachments);
  };

  const uploadImages = async (files: File[]) => {
    setAttachError(null);
    const uploaded = await uploader.uploadFiles(files);
    if (uploaded.length) chat.addAttachments(uploaded);
  };

  const captureImage = async (file: File) => {
    setCameraOpen(false);
    await uploadImages([file]);
  };

  const chooseSuggestion = (text: string) => {
    chat.setDraft(text);
    window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Message the school agent"]')?.focus();
    }, 50);
  };

  const close = () => {
    if (chat.streaming) chat.stop();
    setCameraOpen(false);
    onClose();
  };

  const rail = (
    <ChatSessionRail
      sessions={chat.sessions}
      activeId={chat.activeId}
      loading={chat.sessionsLoading}
      error={chat.sessionsError}
      onSelect={selectSession}
      onNew={beginNew}
      onRename={(id, title) => void chat.rename(id, title)}
      onDelete={(id) => void chat.remove(id)}
    />
  );

  const header = (variant: 'drawer' | 'full' | 'minimized') => (
    <div className="flex items-center gap-2 border-b border-line bg-white px-3 py-2.5 sm:px-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-lime-accent">
        <Sparkles size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-extrabold text-ink">
          Uncle Tee AI <span className="ml-1 hidden text-[10px] font-bold uppercase tracking-wide text-brand-600 sm:inline">School agent</span>
        </p>
        <p className="truncate text-[10px] font-semibold text-muted">
          {variant === 'minimized' ? activeTitle : `${modelLabel} · ${activeTitle}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {variant !== 'minimized' && (
          <>
            <button
              type="button"
              onClick={() => setRailOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50 md:hidden"
              aria-label="Open chat list"
              title="Chats"
            >
              <PanelLeft size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={beginNew}
              className="flex h-9 w-9 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
              aria-label="New chat"
              title="New chat"
            >
              <MessageSquarePlus size={15} aria-hidden="true" />
            </button>
          </>
        )}
        {variant === 'full' ? (
          <button
            type="button"
            onClick={() => onModeChange('drawer')}
            className="flex h-9 w-9 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
            aria-label="Exit full screen"
            title="Exit full screen"
          >
            <Minimize2 size={15} aria-hidden="true" />
          </button>
        ) : variant === 'drawer' ? (
          <>
            <button
              type="button"
              onClick={() => onModeChange('minimized')}
              className="flex h-9 w-9 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
              aria-label="Minimize assistant"
              title="Minimize"
            >
              <Minus size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onModeChange('full')}
              className="flex h-9 w-9 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
              aria-label="Maximize assistant"
              title="Full screen"
            >
              <Maximize2 size={15} aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onModeChange('drawer')}
              className="flex h-9 w-9 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
              aria-label="Open assistant"
              title="Open"
            >
              <Expand size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onModeChange('full')}
              className="flex h-9 w-9 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
              aria-label="Open full screen"
              title="Full screen"
            >
              <Maximize2 size={15} aria-hidden="true" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={close}
          className="flex h-9 w-9 items-center justify-center rounded border border-line text-muted hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
          aria-label="Close assistant"
          title="Close"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  const conversation = (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatThread
        messages={chat.messages}
        streaming={chat.streaming}
        loading={chat.loadingSession}
        streamError={chat.streamError}
        onRegenerate={() => void chat.regenerate()}
        onSuggestion={chooseSuggestion}
      />
      {attachError && (
        <p role="alert" className="mx-4 mb-2 border-l-2 border-rose-400 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:mx-6">
          {attachError}
        </p>
      )}
      <ChatComposer
        value={chat.draft}
        onChange={chat.setDraft}
        onSend={sendDraft}
        onStop={chat.stop}
        streaming={chat.streaming}
        autoFocus={open}
        attachments={chat.attachments}
        onRemoveAttachment={chat.removeAttachment}
        onUploadFiles={uploadImages}
        uploading={uploader.uploading}
        onOpenCamera={() => setCameraOpen(true)}
      />
      <CameraCapture open={cameraOpen} busy={uploader.uploading} onClose={() => setCameraOpen(false)} onCapture={captureImage} />
    </div>
  );

  if (mode === 'minimized') {
    const preview = lastAssistant?.content?.replace(/[#*_>`]/g, '').trim();
    return (
      <div
        className="fixed bottom-4 right-4 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded border border-line bg-white shadow-2xl"
        role="dialog"
        aria-label="Uncle Tee AI minimized"
      >
        {header('minimized')}
        <div className="max-h-[260px] overflow-y-auto px-4 py-3">
          {chat.streaming ? (
            <p className="flex items-center gap-2 text-xs font-semibold text-brand-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
              Working{lastAssistant?.parts?.steps?.length ? ` · ${lastAssistant.parts.steps.length} step(s)` : ''}…
            </p>
          ) : preview ? (
            <p className="line-clamp-4 text-xs leading-5 text-muted">{preview}</p>
          ) : (
            <p className="text-xs leading-5 text-muted">Ask about exams, pupils, results or deployments.</p>
          )}
          {chat.messages.length > 0 && (
            <button
              type="button"
              onClick={() => onModeChange('drawer')}
              className="mt-2 text-[11px] font-extrabold text-brand-700 underline underline-offset-2"
            >
              Continue this chat
            </button>
          )}
        </div>
        <ChatComposer
          value={chat.draft}
          onChange={chat.setDraft}
          onSend={sendDraft}
          onStop={chat.stop}
          streaming={chat.streaming}
          attachments={chat.attachments}
          onRemoveAttachment={chat.removeAttachment}
          onUploadFiles={uploadImages}
          uploading={uploader.uploading}
          onOpenCamera={() => setCameraOpen(true)}
        />
        <CameraCapture open={cameraOpen} busy={uploader.uploading} onClose={() => setCameraOpen(false)} onCapture={captureImage} />
      </div>
    );
  }

  if (mode === 'full') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="Uncle Tee AI">
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-72 shrink-0 md:block">{rail}</aside>
          <div className="flex min-w-0 flex-1 flex-col">
            {header('full')}
            {conversation}
          </div>
        </div>
        {railOpen && (
          <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-label="Chat list">
            <button type="button" aria-label="Close chat list" onClick={() => setRailOpen(false)} className="absolute inset-0 bg-brand-900/60" />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">{rail}</aside>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Uncle Tee AI">
      <button type="button" aria-label="Close assistant" onClick={close} className="absolute inset-0 bg-brand-900/40" />
      <aside className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-white shadow-2xl sm:w-[600px] lg:w-[720px]">
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-60 shrink-0 md:block">{rail}</aside>
          <div className="flex min-w-0 flex-1 flex-col">
            {header('drawer')}
            {conversation}
          </div>
        </div>
        {railOpen && (
          <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-label="Chat list">
            <button type="button" aria-label="Close chat list" onClick={() => setRailOpen(false)} className="absolute inset-0 bg-brand-900/60" />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">{rail}</aside>
          </div>
        )}
      </aside>
    </div>
  );
};
