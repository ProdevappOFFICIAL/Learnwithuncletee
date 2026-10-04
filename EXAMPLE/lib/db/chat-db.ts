export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: any[];
}

export interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  model?: string;
}

const DB_NAME = 'learningdeck_chat_db';
const DB_VERSION = 1;

export class ChatDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('conversationId', 'conversationId', { unique: false });
        }
      };
    });
  }

  async saveMessage(message: Message): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readwrite');
      const store = transaction.objectStore('messages');
      const request = store.put(message);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('conversationId');
      const request = index.getAll(conversationId);
      request.onsuccess = () => {
        const messages = request.result as Message[];
        messages.sort((a, b) => a.timestamp - b.timestamp);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const request = store.put(conversation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConversations(): Promise<Conversation[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const request = store.getAll();
      request.onsuccess = () => {
        const conversations = request.result as Conversation[];
        conversations.sort((a, b) => b.timestamp - a.timestamp);
        resolve(conversations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteConversation(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['conversations', 'messages'], 'readwrite');
      
      const convStore = transaction.objectStore('conversations');
      convStore.delete(id);

      const msgStore = transaction.objectStore('messages');
      const index = msgStore.index('conversationId');
      const request = index.openCursor(id);
      
      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const chatDB = new ChatDB();
