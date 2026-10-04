package category_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"note-service/internal/application/category"
	"note-service/internal/domain"
)

type mockCategoryRepo struct {
	categories map[uuid.UUID]domain.Category
}

func newMockCategoryRepo() *mockCategoryRepo {
	return &mockCategoryRepo{categories: make(map[uuid.UUID]domain.Category)}
}

func (m *mockCategoryRepo) Create(ctx context.Context, cat *domain.Category) error {
	m.categories[cat.ID] = *cat
	return nil
}

func (m *mockCategoryRepo) List(ctx context.Context) ([]domain.Category, error) {
	var res []domain.Category
	for _, c := range m.categories {
		res = append(res, c)
	}
	return res, nil
}

func (m *mockCategoryRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	c, ok := m.categories[id]
	if !ok {
		return nil, domain.ErrCategoryNotFound
	}
	return &c, nil
}

func (m *mockCategoryRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if _, ok := m.categories[id]; !ok {
		return domain.ErrCategoryNotFound
	}
	delete(m.categories, id)
	return nil
}

type mockTransactor struct{}

func (m *mockTransactor) WithinTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
	return fn(ctx)
}

func TestCategoryService_Create(t *testing.T) {
	repo := newMockCategoryRepo()
	svc := category.NewService(repo, &mockTransactor{})
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		cat, err := svc.Create(ctx, "Work", "#FF5733")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if cat.Title != "Work" {
			t.Errorf("expected title Work, got %s", cat.Title)
		}
		if cat.Color != "#FF5733" {
			t.Errorf("expected color #FF5733, got %s", cat.Color)
		}
	})

	t.Run("empty title", func(t *testing.T) {
		_, err := svc.Create(ctx, "   ", "#FF5733")
		if !errors.Is(err, domain.ErrInvalidInput) {
			t.Fatalf("expected ErrInvalidInput, got %v", err)
		}
	})

	t.Run("invalid hex color", func(t *testing.T) {
		_, err := svc.Create(ctx, "Work", "not-a-color")
		if !errors.Is(err, domain.ErrInvalidInput) {
			t.Fatalf("expected ErrInvalidInput, got %v", err)
		}
	})
}

func TestCategoryService_Delete(t *testing.T) {
	repo := newMockCategoryRepo()
	svc := category.NewService(repo, &mockTransactor{})
	ctx := context.Background()

	cat, err := svc.Create(ctx, "Personal", "#00FF00")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	err = svc.Delete(ctx, cat.ID)
	if err != nil {
		t.Fatalf("failed to delete category: %v", err)
	}

	err = svc.Delete(ctx, cat.ID)
	if !errors.Is(err, domain.ErrCategoryNotFound) {
		t.Fatalf("expected ErrCategoryNotFound on repeated delete, got %v", err)
	}
}
