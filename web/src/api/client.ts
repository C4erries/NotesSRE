import type {
  Category,
  CreateCategoryRequest,
  CreateNoteRequest,
  HealthResponse,
  Note,
  UpdateNoteRequest,
} from '../types'

const BASE_URL = ''

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return {} as T
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errorMsg = data?.error || `HTTP error ${res.status}: ${res.statusText}`
    throw new Error(errorMsg)
  }
  return data as T
}

export const api = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}/api/v1/categories`)
    return handleResponse<Category[]>(res)
  },

  async createCategory(req: CreateCategoryRequest): Promise<Category> {
    const res = await fetch(`${BASE_URL}/api/v1/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    return handleResponse<Category>(res)
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/categories/${id}`, {
      method: 'DELETE',
    })
    return handleResponse<void>(res)
  },

  // Notes
  async getNotes(categoryId?: string | null): Promise<Note[]> {
    const url = categoryId
      ? `${BASE_URL}/api/v1/notes?category_id=${encodeURIComponent(categoryId)}`
      : `${BASE_URL}/api/v1/notes`
    const res = await fetch(url)
    return handleResponse<Note[]>(res)
  },

  async getNoteById(id: string): Promise<Note> {
    const res = await fetch(`${BASE_URL}/api/v1/notes/${id}`)
    return handleResponse<Note>(res)
  },

  async createNote(req: CreateNoteRequest): Promise<Note> {
    const res = await fetch(`${BASE_URL}/api/v1/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    return handleResponse<Note>(res)
  },

  async updateNote(id: string, req: UpdateNoteRequest): Promise<Note> {
    const res = await fetch(`${BASE_URL}/api/v1/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    return handleResponse<Note>(res)
  },

  async deleteNote(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/notes/${id}`, {
      method: 'DELETE',
    })
    return handleResponse<void>(res)
  },

  // Health
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${BASE_URL}/healthz`)
    return handleResponse<HealthResponse>(res)
  },
}
