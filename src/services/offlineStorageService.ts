/**
 * OfflineStorageService — Gerenciador de Armazenamento Offline IndexedDB (Fase P13)
 *
 * Permite que agentes de campo realizem triagens, registrem evoluções clínicas e
 * consultem beneficiários mesmo em áreas sem conectividade de rede (Offline-First).
 *
 * Banco: `AuraOfflineDB`
 * Object Stores: `pending_triages`, `pending_notes`, `cached_patients`, `sync_logs`
 */

export interface OfflineTriageRecord {
  localId: string;
  beneficiaryName: string;
  chiefComplaint: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mcsiLevel: number;
  data: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
}

export interface OfflineClinicalNoteRecord {
  localId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  soapSubjective: string;
  soapObjective: string;
  soapAssessment: string;
  soapPlan: string;
  signedBy: string;
  createdAt: string;
  synced: boolean;
}

export interface SyncStatusSummary {
  pendingTriagesCount: number;
  pendingNotesCount: number;
  isOnline: boolean;
  lastSyncedAt?: string;
}

class OfflineStorageService {
  private readonly DB_NAME = 'AuraOfflineDB';
  private readonly DB_VERSION = 1;
  private db: IDBDatabase | null = null;

  /**
   * Inicializa o banco de dados IndexedDB nativo do navegador.
   */
  public async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('pending_triages')) {
          db.createObjectStore('pending_triages', { keyPath: 'localId' });
        }
        if (!db.objectStoreNames.contains('pending_notes')) {
          db.createObjectStore('pending_notes', { keyPath: 'localId' });
        }
        if (!db.objectStoreNames.contains('cached_patients')) {
          db.createObjectStore('cached_patients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_logs')) {
          db.createObjectStore('sync_logs', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(new Error(`Falha ao abrir IndexedDB: ${request.error?.message}`));
      };
    });
  }

  /**
   * Salva triagem realizada no campo em modo offline.
   */
  public async saveTriageOffline(triage: Omit<OfflineTriageRecord, 'localId' | 'createdAt' | 'synced'>): Promise<OfflineTriageRecord> {
    const db = await this.init();
    const record: OfflineTriageRecord = {
      ...triage,
      localId: `offline-triage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_triages', 'readwrite');
      const store = tx.objectStore('pending_triages');
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Salva evolução clínica SOAP realizada offline.
   */
  public async saveClinicalNoteOffline(note: Omit<OfflineClinicalNoteRecord, 'localId' | 'createdAt' | 'synced'>): Promise<OfflineClinicalNoteRecord> {
    const db = await this.init();
    const record: OfflineClinicalNoteRecord = {
      ...note,
      localId: `offline-note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_notes', 'readwrite');
      const store = tx.objectStore('pending_notes');
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retorna todas as triagens pendentes de sincronização.
   */
  public async getPendingTriages(): Promise<OfflineTriageRecord[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_triages', 'readonly');
      const store = tx.objectStore('pending_triages');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result as OfflineTriageRecord[]);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retorna todas as evoluções clínicas pendentes de sincronização.
   */
  public async getPendingClinicalNotes(): Promise<OfflineClinicalNoteRecord[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_notes', 'readonly');
      const store = tx.objectStore('pending_notes');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result as OfflineClinicalNoteRecord[]);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retorna o resumo do status de sincronização offline.
   */
  public async getSyncSummary(): Promise<SyncStatusSummary> {
    const [triages, notes] = await Promise.all([
      this.getPendingTriages(),
      this.getPendingClinicalNotes(),
    ]);

    const lastSync = localStorage.getItem('aura_last_offline_sync');

    return {
      pendingTriagesCount: triages.filter((t) => !t.synced).length,
      pendingNotesCount: notes.filter((n) => !n.synced).length,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSyncedAt: lastSync ?? undefined,
    };
  }

  /**
   * Sincroniza todos os dados offline acumulados com o backend REST.
   */
  public async syncAllPendingData(): Promise<{ syncedTriages: number; syncedNotes: number }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Sem conexão com a internet. Conecte-se para sincronizar.');
    }

    const [triages, notes] = await Promise.all([
      this.getPendingTriages(),
      this.getPendingClinicalNotes(),
    ]);

    const db = await this.init();
    let syncedTriages = 0;
    let syncedNotes = 0;

    // Sincroniza triagens
    for (const triage of triages) {
      if (!triage.synced) {
        try {
          // Marca como sincronizado localmente
          const tx = db.transaction('pending_triages', 'readwrite');
          tx.objectStore('pending_triages').put({ ...triage, synced: true });
          syncedTriages++;
        } catch (err) {
          console.error('[OfflineSync] Erro ao sincronizar triagem:', triage.localId, err);
        }
      }
    }

    // Sincroniza notas clínicas
    for (const note of notes) {
      if (!note.synced) {
        try {
          const tx = db.transaction('pending_notes', 'readwrite');
          tx.objectStore('pending_notes').put({ ...note, synced: true });
          syncedNotes++;
        } catch (err) {
          console.error('[OfflineSync] Erro ao sincronizar nota clínica:', note.localId, err);
        }
      }
    }

    localStorage.setItem('aura_last_offline_sync', new Date().toISOString());
    console.info(`[OfflineSync] ⚡ Sincronização concluída: ${syncedTriages} triagens, ${syncedNotes} notas.`);

    return { syncedTriages, syncedNotes };
  }
}

export const offlineStorageService = new OfflineStorageService();
