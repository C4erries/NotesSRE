package category

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"note-service/internal/application/common"
	"note-service/internal/domain"
)

var hexColorRegex = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)

type Repository interface {
	Create(ctx context.Context, category *domain.Category) error
	List(ctx context.Context) ([]domain.Category, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type Service struct {
	repo       Repository
	transactor common.Transactor
}

func NewService(repo Repository, transactor common.Transactor) *Service {
	return &Service{
		repo:       repo,
		transactor: transactor,
	}
}

func (s *Service) Create(ctx context.Context, title, color string) (*domain.Category, error) {
	normTitle, err := common.ValidateAndNormalizeTitle(title, 100)
	if err != nil {
		return nil, err
	}

	color = strings.TrimSpace(color)
	if !hexColorRegex.MatchString(color) {
		return nil, fmt.Errorf("%w: color must be a valid 6-character hex color (e.g. #FF5733)", domain.ErrInvalidInput)
	}

	cat := &domain.Category{
		ID:        uuid.New(),
		Title:     normTitle,
		Color:     strings.ToUpper(color),
		CreatedAt: time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, cat); err != nil {
		return nil, fmt.Errorf("create category: %w", err)
	}

	return cat, nil
}

func (s *Service) List(ctx context.Context) ([]domain.Category, error) {
	categories, err := s.repo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	if categories == nil {
		categories = []domain.Category{}
	}
	return categories, nil
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("delete category: %w", err)
	}
	return nil
}
