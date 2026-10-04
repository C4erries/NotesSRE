package http

import (
	"context"
	"errors"
	"log/slog"

	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
	"note-service/internal/domain"
	"note-service/internal/infrastructure/http/generated"
)

type CategoryService interface {
	Create(ctx context.Context, title, color string) (*domain.Category, error)
	List(ctx context.Context) ([]domain.Category, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type NoteService interface {
	Create(ctx context.Context, title, content string, isPinned bool, categoryID *uuid.UUID) (*domain.Note, error)
	List(ctx context.Context, categoryID *uuid.UUID) ([]domain.Note, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Note, error)
	Update(ctx context.Context, id uuid.UUID, title, content string, isPinned bool, categoryID *uuid.UUID) (*domain.Note, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type HealthChecker interface {
	Ping(ctx context.Context) error
}

type Server struct {
	categoryService CategoryService
	noteService     NoteService
	healthChecker   HealthChecker
	logger          *slog.Logger
}

func NewServer(
	categoryService CategoryService,
	noteService NoteService,
	healthChecker HealthChecker,
	logger *slog.Logger,
) *Server {
	return &Server{
		categoryService: categoryService,
		noteService:     noteService,
		healthChecker:   healthChecker,
		logger:          logger,
	}
}

var _ generated.StrictServerInterface = (*Server)(nil)

func (s *Server) ListCategories(ctx context.Context, _ generated.ListCategoriesRequestObject) (generated.ListCategoriesResponseObject, error) {
	categories, err := s.categoryService.List(ctx)
	if err != nil {
		s.logger.Error("failed to list categories", slog.String("error", err.Error()))
		return generated.ListCategories500JSONResponse{Error: "failed to list categories"}, nil
	}

	res := make(generated.ListCategories200JSONResponse, 0, len(categories))
	for _, c := range categories {
		res = append(res, toGeneratedCategory(&c))
	}

	return res, nil
}

func (s *Server) CreateCategory(ctx context.Context, request generated.CreateCategoryRequestObject) (generated.CreateCategoryResponseObject, error) {
	if request.Body == nil {
		return generated.CreateCategory400JSONResponse{Error: "missing request body"}, nil
	}

	category, err := s.categoryService.Create(ctx, request.Body.Title, request.Body.Color)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidInput) {
			return generated.CreateCategory400JSONResponse{Error: err.Error()}, nil
		}
		s.logger.Error("failed to create category", slog.String("error", err.Error()))
		return generated.CreateCategory500JSONResponse{Error: "failed to create category"}, nil
	}

	return generated.CreateCategory201JSONResponse(toGeneratedCategory(category)), nil
}

func (s *Server) DeleteCategory(ctx context.Context, request generated.DeleteCategoryRequestObject) (generated.DeleteCategoryResponseObject, error) {
	err := s.categoryService.Delete(ctx, uuid.UUID(request.Id))
	if err != nil {
		if errors.Is(err, domain.ErrCategoryNotFound) {
			return generated.DeleteCategory404JSONResponse{Error: "category not found"}, nil
		}
		s.logger.Error("failed to delete category", slog.String("error", err.Error()))
		return generated.DeleteCategory500JSONResponse{Error: "failed to delete category"}, nil
	}

	return generated.DeleteCategory204Response{}, nil
}

func (s *Server) ListNotes(ctx context.Context, request generated.ListNotesRequestObject) (generated.ListNotesResponseObject, error) {
	var categoryID *uuid.UUID
	if request.Params.CategoryId != nil {
		id := uuid.UUID(*request.Params.CategoryId)
		categoryID = &id
	}

	notes, err := s.noteService.List(ctx, categoryID)
	if err != nil {
		s.logger.Error("failed to list notes", slog.String("error", err.Error()))
		return generated.ListNotes500JSONResponse{Error: "failed to list notes"}, nil
	}

	res := make(generated.ListNotes200JSONResponse, 0, len(notes))
	for _, n := range notes {
		res = append(res, toGeneratedNote(&n))
	}

	return res, nil
}

func (s *Server) CreateNote(ctx context.Context, request generated.CreateNoteRequestObject) (generated.CreateNoteResponseObject, error) {
	if request.Body == nil {
		return generated.CreateNote400JSONResponse{Error: "missing request body"}, nil
	}

	var categoryID *uuid.UUID
	if request.Body.CategoryId != nil {
		id := uuid.UUID(*request.Body.CategoryId)
		categoryID = &id
	}

	isPinned := false
	if request.Body.IsPinned != nil {
		isPinned = *request.Body.IsPinned
	}

	note, err := s.noteService.Create(ctx, request.Body.Title, request.Body.Content, isPinned, categoryID)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidInput) || errors.Is(err, domain.ErrCategoryNotFound) {
			return generated.CreateNote400JSONResponse{Error: err.Error()}, nil
		}
		s.logger.Error("failed to create note", slog.String("error", err.Error()))
		return generated.CreateNote500JSONResponse{Error: "failed to create note"}, nil
	}

	return generated.CreateNote201JSONResponse(toGeneratedNote(note)), nil
}

func (s *Server) GetNoteById(ctx context.Context, request generated.GetNoteByIdRequestObject) (generated.GetNoteByIdResponseObject, error) {
	note, err := s.noteService.GetByID(ctx, uuid.UUID(request.Id))
	if err != nil {
		if errors.Is(err, domain.ErrNoteNotFound) {
			return generated.GetNoteById404JSONResponse{Error: "note not found"}, nil
		}
		s.logger.Error("failed to get note by id", slog.String("error", err.Error()))
		return generated.GetNoteById500JSONResponse{Error: "failed to get note"}, nil
	}

	return generated.GetNoteById200JSONResponse(toGeneratedNote(note)), nil
}

func (s *Server) UpdateNote(ctx context.Context, request generated.UpdateNoteRequestObject) (generated.UpdateNoteResponseObject, error) {
	if request.Body == nil {
		return generated.UpdateNote400JSONResponse{Error: "missing request body"}, nil
	}

	var categoryID *uuid.UUID
	if request.Body.CategoryId != nil {
		id := uuid.UUID(*request.Body.CategoryId)
		categoryID = &id
	}

	note, err := s.noteService.Update(
		ctx,
		uuid.UUID(request.Id),
		request.Body.Title,
		request.Body.Content,
		request.Body.IsPinned,
		categoryID,
	)
	if err != nil {
		if errors.Is(err, domain.ErrNoteNotFound) {
			return generated.UpdateNote404JSONResponse{Error: "note not found"}, nil
		}
		if errors.Is(err, domain.ErrInvalidInput) || errors.Is(err, domain.ErrCategoryNotFound) {
			return generated.UpdateNote400JSONResponse{Error: err.Error()}, nil
		}
		s.logger.Error("failed to update note", slog.String("error", err.Error()))
		return generated.UpdateNote500JSONResponse{Error: "failed to update note"}, nil
	}

	return generated.UpdateNote200JSONResponse(toGeneratedNote(note)), nil
}

func (s *Server) DeleteNote(ctx context.Context, request generated.DeleteNoteRequestObject) (generated.DeleteNoteResponseObject, error) {
	err := s.noteService.Delete(ctx, uuid.UUID(request.Id))
	if err != nil {
		if errors.Is(err, domain.ErrNoteNotFound) {
			return generated.DeleteNote404JSONResponse{Error: "note not found"}, nil
		}
		s.logger.Error("failed to delete note", slog.String("error", err.Error()))
		return generated.DeleteNote500JSONResponse{Error: "failed to delete note"}, nil
	}

	return generated.DeleteNote204Response{}, nil
}

func (s *Server) GetHealthz(ctx context.Context, _ generated.GetHealthzRequestObject) (generated.GetHealthzResponseObject, error) {
	if err := s.healthChecker.Ping(ctx); err != nil {
		s.logger.Warn("health check failed: database unavailable", slog.String("error", err.Error()))
		return generated.GetHealthz503JSONResponse{
			Status: "error",
			Db:     "down",
		}, nil
	}

	return generated.GetHealthz200JSONResponse{
		Status: "ok",
		Db:     "up",
	}, nil
}

func toGeneratedCategory(c *domain.Category) generated.Category {
	return generated.Category{
		Id:        openapi_types.UUID(c.ID),
		Title:     c.Title,
		Color:     c.Color,
		CreatedAt: c.CreatedAt,
	}
}

func toGeneratedNote(n *domain.Note) generated.Note {
	var catID *openapi_types.UUID
	if n.CategoryID != nil {
		id := openapi_types.UUID(*n.CategoryID)
		catID = &id
	}
	return generated.Note{
		Id:         openapi_types.UUID(n.ID),
		CategoryId: catID,
		Title:      n.Title,
		Content:    n.Content,
		IsPinned:   n.IsPinned,
		CreatedAt:  n.CreatedAt,
		UpdatedAt:  n.UpdatedAt,
	}
}
