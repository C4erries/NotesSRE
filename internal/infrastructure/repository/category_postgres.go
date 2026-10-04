package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"note-service/internal/domain"
	"note-service/internal/infrastructure/db"
)

type CategoryPostgres struct {
	transactor *db.Transactor
}

func NewCategoryPostgres(transactor *db.Transactor) *CategoryPostgres {
	return &CategoryPostgres{
		transactor: transactor,
	}
}

func (r *CategoryPostgres) Create(ctx context.Context, cat *domain.Category) error {
	query := `
		INSERT INTO categories (id, title, color, created_at)
		VALUES ($1, $2, $3, $4)
	`
	_, err := r.transactor.GetDB(ctx).Exec(ctx, query, cat.ID, cat.Title, cat.Color, cat.CreatedAt)
	if err != nil {
		return fmt.Errorf("insert category: %w", err)
	}
	return nil
}

func (r *CategoryPostgres) List(ctx context.Context) ([]domain.Category, error) {
	query := `
		SELECT id, title, color, created_at
		FROM categories
		ORDER BY created_at ASC
	`
	rows, err := r.transactor.GetDB(ctx).Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("select categories: %w", err)
	}
	defer rows.Close()

	var categories []domain.Category
	for rows.Next() {
		var cat domain.Category
		if err := rows.Scan(&cat.ID, &cat.Title, &cat.Color, &cat.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		categories = append(categories, cat)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate categories: %w", err)
	}

	return categories, nil
}

func (r *CategoryPostgres) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	query := `
		SELECT id, title, color, created_at
		FROM categories
		WHERE id = $1
	`
	var cat domain.Category
	err := r.transactor.GetDB(ctx).QueryRow(ctx, query, id).Scan(&cat.ID, &cat.Title, &cat.Color, &cat.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrCategoryNotFound
		}
		return nil, fmt.Errorf("select category by id: %w", err)
	}
	return &cat, nil
}

func (r *CategoryPostgres) Delete(ctx context.Context, id uuid.UUID) error {
	query := `
		DELETE FROM categories
		WHERE id = $1
	`
	tag, err := r.transactor.GetDB(ctx).Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete category: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrCategoryNotFound
	}
	return nil
}
