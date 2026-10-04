export interface Category {
  id: string
  title: string
  color: string
  created_at: string
}

export interface CreateCategoryRequest {
  title: string
  color: string
}

export interface Note {
  id: string
  category_id: string | null
  title: string
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface CreateNoteRequest {
  title: string
  content: string
  category_id?: string | null
  is_pinned?: boolean
}

export interface UpdateNoteRequest {
  title: string
  content: string
  category_id?: string | null
  is_pinned: boolean
}

export interface HealthResponse {
  status: string
  db: string
}
