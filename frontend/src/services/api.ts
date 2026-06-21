import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://127.0.0.1:8005' 
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach the latest token ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: auto-refresh on 401 / token-expired ────────────────
// If the backend rejects with 401 ("Token expired" etc.), silently get a fresh
// Firebase ID token and retry the original request exactly once.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry once — guard against infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const firebaseUser = getAuth().currentUser;
        if (firebaseUser) {
          // Force-refresh the token (bypasses the 55-min cache)
          const freshToken = await firebaseUser.getIdToken(true);
          localStorage.setItem('auth_token', freshToken);

          // Patch the failed request with the new token and retry
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  },
);


export interface WordSummary {
  word: string;
  core: string;
  category: string;
}

export interface EmotionMetadata {
  intensity: number;
  definition: string;
  synonyms: string[];
  example: string;
  reflection_prompt: string;
  growth_tip: string;
  body_signal: string;
}

export interface WordDetail extends WordSummary {
  metadata: EmotionMetadata;
}

export interface SearchResponse extends WordSummary { }

export interface DetectedEmotion {
  word: string;
  core: string;
  category: string;
}

export interface JournalResponse {
  entry_id?: string;
  detected_emotions: DetectedEmotion[];
  emotional_observation: string;
  pattern_insight: string;
  reflection_question: string;
  regulation_suggestion: string;
  ruler?: {
    Recognize: string;
    Understand: string;
    Label: string;
    Express: string;
    Regulate: string;
    section_1?: string;
    section_2?: string;
    section_3?: string;
    section_4?: string;
    section_5?: string;
    "What can be done": string;
  };
}

export interface JournalEntry {
  entry_id: string;
  entry_text: string;
  detected_emotions: DetectedEmotion[];
  emotional_observation: string;
  pattern_insight: string;
  reflection_question: string;
  regulation_suggestion: string;
  ruler?: {
    Recognize: string;
    Understand: string;
    Label: string;
    Express: string;
    Regulate: string;
    section_1?: string;
    section_2?: string;
    section_3?: string;
    section_4?: string;
    section_5?: string;
    "What can be done": string;
  };
  created_at: string;
}

export interface WordLearnedEntry {
  entry_id: string;
  word_details: any;
  created_at: string;
}

export interface HistoryEntry {
  type: 'journal' | 'learned_word';
  data: JournalEntry | WordLearnedEntry;
}

export interface JournalHistoryResponse {
  entries: HistoryEntry[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface EmotionSummary {
  emotion_word: string;
  core_emotion: string;
  count: number;
}

export interface JournalStatsResponse {
  total_entries: number;
  date_range_start: string | null;
  date_range_end: string | null;
  top_emotions: EmotionSummary[];
}

export interface JournalError {
  error: string;
  message?: string;
}

export interface AuthUser {
  email: string;
  full_name?: string | null;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token?: string;
}

export const emotionAPI = {
  // Get all core emotions
  getCores: async (): Promise<string[]> => {
    const response = await api.get('/cores');
    return response.data;
  },

  // Get categories for a specific core
  getCategories: async (core: string): Promise<string[]> => {
    const response = await api.get(`/cores/${core}/categories`);
    return response.data;
  },

  // Get filtered words
  getWords: async (core?: string, category?: string): Promise<WordSummary[]> => {
    const params = new URLSearchParams();
    if (core) params.append('core', core);
    if (category) params.append('category', category);

    const response = await api.get(`/words?${params.toString()}`);
    return response.data;
  },

  // Get word details
  getWordDetails: async (wordName: string): Promise<WordDetail> => {
    const response = await api.get(`/words/${wordName}`);
    return response.data;
  },

  // Get daily word (Previous Stage)
  getDailyWord: async (): Promise<WordDetail> => {
    const response = await api.get('/words/daily');
    return response.data;
  },

  // Search words
  searchWords: async (query: string): Promise<SearchResponse[]> => {
    const response = await api.get(`/words/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Journal reflection
  submitJournal: async (entry: string): Promise<JournalResponse | JournalError> => {
    const response = await api.post('/journal', { entry });
    return response.data;
  },

  // Authentication
  register: async (email: string, password: string, fullName?: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, password, full_name: fullName });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Journal History & Stats (New Architect Routes)
  getJournalHistory: async (page: number = 1, pageSize: number = 10): Promise<JournalHistoryResponse> => {
    // Note: The new history endpoint doesn't support pagination yet, returning all for now
    const response = await api.get('/journal/history');
    return response.data;
  },

  getJournalStats: async (): Promise<JournalStatsResponse> => {
    const response = await api.get('/journal/stats');
    return response.data;
  },

  trackWordLearned: async (wordData: any): Promise<void> => {
    await api.post('/journal/track-word', { word_data: wordData });
  },

  removeWordLearned: async (entryId: string): Promise<void> => {
    await api.delete(`/journal/learned-word/${entryId}`);
  },

  // Transcribe a short audio chunk (≤20s) via Sarvam AI STT. Returns transcript only.
  // Frontend sends chunks every 20s and accumulates the text.
  transcribeVoice: async (audioBlob: Blob): Promise<{ transcript: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'journal_voice.webm');
    const response = await api.post('/journal/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  exportReport: async (month?: number, year?: number, timezoneOffset?: number): Promise<void> => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', String(month));
    if (year !== undefined) params.append('year', String(year));
    if (timezoneOffset !== undefined) params.append('timezone_offset', String(timezoneOffset));

    const response = await api.get(`/export/monthly-report?${params.toString()}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const fileName = (month && year) 
      ? `emolit_report_${year}_${String(month).padStart(2, '0')}.pdf`
      : `emolit_monthly_report.pdf`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export default api;
