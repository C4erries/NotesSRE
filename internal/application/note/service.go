package note

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"note-service/internal/application/common"
	"note-service/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, note *domain.Note) error
	List(ctx context.Context, categoryID *uuid.UUID) ([]domain.Note, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Note, error)
	Update(ctx context.Context, note *domain.Note) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type CategoryFinder interface {
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error)
}

type Service struct {
	noteRepo       Repository
	categoryFinder CategoryFinder
	transactor     common.Transactor
}

func NewService(noteRepo Repository, categoryFinder CategoryFinder, transactor common.Transactor) *Service {
	return &Service{
		noteRepo:       noteRepo,
		categoryFinder: categoryFinder,
		transactor:     transactor,
	}
}

func (s *Service) Create(ctx context.Context, title, content string, isPinned bool, categoryID *uuid.UUID) (*domain.Note, error) {
	normTitle, err := common.ValidateAndNormalizeTitle(title, 255)
	if err != nil {
		return nil, err
	}

	if categoryID != nil {
		if _, err := s.categoryFinder.GetByID(ctx, *categoryID); err != nil {
			return nil, fmt.Errorf("referenced category: %w", err)
		}
	}

	now := time.Now().UTC()
	note := &domain.Note{
		ID:         uuid.New(),
		CategoryID: categoryID,
		Title:      normTitle,
		Content:    content,
		IsPinned:   isPinned,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := s.noteRepo.Create(ctx, note); err != nil {
		return nil, fmt.Errorf("create note: %w", err)
	}

	return note, nil
}

func (s *Service) List(ctx context.Context, categoryID *uuid.UUID) ([]domain.Note, error) {
	notes, err := s.noteRepo.List(ctx, categoryID)
	if err != nil {
		return nil, fmt.Errorf("list notes: %w", err)
	}
	if notes == nil {
		notes = []domain.Note{}
	}
	return notes, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*domain.Note, error) {
	note, err := s.noteRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get note by id: %w", err)
	}
	return note, nil
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, title, content string, isPinned bool, categoryID *uuid.UUID) (*domain.Note, error) {
	normTitle, err := common.ValidateAndNormalizeTitle(title, 255)
	if err != nil {
		return nil, err
	}

	var updatedNote *domain.Note
	err = s.transactor.WithinTransaction(ctx, func(txCtx context.Context) error {
		existing, err := s.noteRepo.GetByID(txCtx, id)
		if err != nil {
			return err
		}

		if categoryID != nil {
			if _, err := s.categoryFinder.GetByID(txCtx, *categoryID); err != nil {
				return fmt.Errorf("referenced category: %w", err)
			}
		}

		existing.Title = normTitle
		existing.Content = content
		existing.IsPinned = isPinned
		existing.CategoryID = categoryID
		existing.UpdatedAt = time.Now().UTC()

		if err := s.noteRepo.Update(txCtx, existing); err != nil {
			return fmt.Errorf("update note: %w", err)
		}

		updatedNote = existing
		return nil
	})

	if err != nil {
		return nil, err
	}

	return updatedNote, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.noteRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("delete note: %w", err)
	}
	return nil
}
