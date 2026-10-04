package note_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"note-service/internal/application/note"
	"note-service/internal/domain"
)

type mockNoteRepo struct {
	notes map[uuid.UUID]domain.Note
}

func newMockNoteRepo() *mockNoteRepo {
	return &mockNoteRepo{notes: make(map[uuid.UUID]domain.Note)}
}

func (m *mockNoteRepo) Create(ctx context.Context, note *domain.Note) error {
	m.notes[note.ID] = *note
	return nil
}

func (m *mockNoteRepo) List(ctx context.Context, categoryID *uuid.UUID) ([]domain.Note, error) {
	var res []domain.Note
	for _, n := range m.notes {
		if categoryID != nil {
			if n.CategoryID == nil || *n.CategoryID != *categoryID {
				continue
			}
		}
		res = append(res, n)
	}
	return res, nil
}

func (m *mockNoteRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Note, error) {
	n, ok := m.notes[id]
	if !ok {
		return nil, domain.ErrNoteNotFound
	}
	return &n, nil
}

func (m *mockNoteRepo) Update(ctx context.Context, note *domain.Note) error {
	if _, ok := m.notes[note.ID]; !ok {
		return domain.ErrNoteNotFound
	}
	m.notes[note.ID] = *note
	return nil
}

func (m *mockNoteRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if _, ok := m.notes[id]; !ok {
		return domain.ErrNoteNotFound
	}
	delete(m.notes, id)
	return nil
}

type mockCategoryFinder struct {
	categories map[uuid.UUID]domain.Category
}

func newMockCategoryFinder() *mockCategoryFinder {
	return &mockCategoryFinder{categories: make(map[uuid.UUID]domain.Category)}
}

func (m *mockCategoryFinder) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	c, ok := m.categories[id]
	if !ok {
		return nil, domain.ErrCategoryNotFound
	}
	return &c, nil
}

type mockTransactor struct{}

func (m *mockTransactor) WithinTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
	return fn(ctx)
}

func TestNoteService(t *testing.T) {
	noteRepo := newMockNoteRepo()
	catFinder := newMockCategoryFinder()
	transactor := &mockTransactor{}
	svc := note.NewService(noteRepo, catFinder, transactor)
	ctx := context.Background()

	catID := uuid.New()
	catFinder.categories[catID] = domain.Category{
		ID:        catID,
		Title:     "Work",
		Color:     "#123456",
		CreatedAt: time.Now(),
	}

	t.Run("create note success", func(t *testing.T) {
		n, err := svc.Create(ctx, "Test Note", "# Hello Markdown", true, &catID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if n.Title != "Test Note" {
			t.Errorf("expected title 'Test Note', got %s", n.Title)
		}
		if n.CategoryID == nil || *n.CategoryID != catID {
			t.Errorf("expected categoryID %s, got %v", catID, n.CategoryID)
		}
		if !n.IsPinned {
			t.Errorf("expected is_pinned to be true")
		}
	})

	t.Run("create note with non-existent category", func(t *testing.T) {
		nonExistentID := uuid.New()
		_, err := svc.Create(ctx, "Test", "Content", false, &nonExistentID)
		if !errors.Is(err, domain.ErrCategoryNotFound) {
			t.Fatalf("expected ErrCategoryNotFound, got %v", err)
		}
	})

	t.Run("update note", func(t *testing.T) {
		n, err := svc.Create(ctx, "Initial Title", "Initial Content", false, nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		updated, err := svc.Update(ctx, n.ID, "Updated Title", "Updated Content", true, &catID)
		if err != nil {
			t.Fatalf("unexpected update error: %v", err)
		}
		if updated.Title != "Updated Title" {
			t.Errorf("expected 'Updated Title', got %s", updated.Title)
		}
		if !updated.IsPinned {
			t.Errorf("expected is_pinned to be true")
		}
		if updated.CategoryID == nil || *updated.CategoryID != catID {
			t.Errorf("expected categoryID %s, got %v", catID, updated.CategoryID)
		}
	})

	t.Run("delete note", func(t *testing.T) {
		n, err := svc.Create(ctx, "To Delete", "Bye", false, nil)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		err = svc.Delete(ctx, n.ID)
		if err != nil {
			t.Fatalf("failed to delete note: %v", err)
		}

		_, err = svc.GetByID(ctx, n.ID)
		if !errors.Is(err, domain.ErrNoteNotFound) {
			t.Fatalf("expected ErrNoteNotFound after delete, got %v", err)
		}
	})
}
