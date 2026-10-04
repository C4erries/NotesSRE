package http_test

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"note-service/internal/domain"
	httpPkg "note-service/internal/infrastructure/http"
	"note-service/internal/infrastructure/http/generated"
)

type mockCatService struct {
	cats []domain.Category
}

func (m *mockCatService) Create(ctx context.Context, title, color string) (*domain.Category, error) {
	if title == "" {
		return nil, domain.ErrInvalidInput
	}
	cat := &domain.Category{
		ID:        uuid.New(),
		Title:     title,
		Color:     color,
		CreatedAt: time.Now(),
	}
	m.cats = append(m.cats, *cat)
	return cat, nil
}

func (m *mockCatService) List(ctx context.Context) ([]domain.Category, error) {
	return m.cats, nil
}

func (m *mockCatService) Delete(ctx context.Context, id uuid.UUID) error {
	for i, c := range m.cats {
		if c.ID == id {
			m.cats = append(m.cats[:i], m.cats[i+1:]...)
			return nil
		}
	}
	return domain.ErrCategoryNotFound
}

type mockNoteService struct{}

func (m *mockNoteService) Create(ctx context.Context, title, content string, isPinned bool, categoryID *uuid.UUID) (*domain.Note, error) {
	return &domain.Note{
		ID:        uuid.New(),
		Title:     title,
		Content:   content,
		IsPinned:  isPinned,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}, nil
}
func (m *mockNoteService) List(ctx context.Context, categoryID *uuid.UUID) ([]domain.Note, error) {
	return []domain.Note{}, nil
}
func (m *mockNoteService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Note, error) {
	return nil, domain.ErrNoteNotFound
}
func (m *mockNoteService) Update(ctx context.Context, id uuid.UUID, title, content string, isPinned bool, categoryID *uuid.UUID) (*domain.Note, error) {
	return nil, domain.ErrNoteNotFound
}
func (m *mockNoteService) Delete(ctx context.Context, id uuid.UUID) error {
	return domain.ErrNoteNotFound
}

type mockHealthChecker struct {
	err error
}

func (m *mockHealthChecker) Ping(ctx context.Context) error {
	return m.err
}

func setupTestRouter(hc *mockHealthChecker, catSvc *mockCatService) http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	srv := httpPkg.NewServer(catSvc, &mockNoteService{}, hc, logger)
	strictHandler := generated.NewStrictHandler(srv, nil)

	mux := http.NewServeMux()
	generated.HandlerWithOptions(strictHandler, generated.StdHTTPServerOptions{
		BaseRouter: mux,
	})

	var handler http.Handler = mux
	handler = httpPkg.CORSMiddleware(handler)
	return handler
}

func TestHealthz_Success(t *testing.T) {
	handler := setupTestRouter(&mockHealthChecker{err: nil}, &mockCatService{})

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", rec.Code)
	}

	var resp generated.HealthResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if resp.Status != "ok" || resp.Db != "up" {
		t.Fatalf("unexpected health response: %+v", resp)
	}
}

func TestHealthz_DBDown(t *testing.T) {
	handler := setupTestRouter(&mockHealthChecker{err: errors.New("connection refused")}, &mockCatService{})

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 Service Unavailable, got %d", rec.Code)
	}

	var resp generated.HealthResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if resp.Status != "error" || resp.Db != "down" {
		t.Fatalf("unexpected health response: %+v", resp)
	}
}

func TestCategories_CreateAndList(t *testing.T) {
	catSvc := &mockCatService{}
	handler := setupTestRouter(&mockHealthChecker{err: nil}, catSvc)

	body := `{"title":"Work","color":"#FF5733"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/categories", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", rec.Code, rec.Body.String())
	}

	reqList := httptest.NewRequest(http.MethodGet, "/api/v1/categories", nil)
	recList := httptest.NewRecorder()
	handler.ServeHTTP(recList, reqList)

	if recList.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", recList.Code)
	}

	var cats []generated.Category
	if err := json.Unmarshal(recList.Body.Bytes(), &cats); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if len(cats) != 1 || cats[0].Title != "Work" {
		t.Fatalf("unexpected categories: %+v", cats)
	}
}
