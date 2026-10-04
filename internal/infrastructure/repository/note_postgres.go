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

type NotePostgres struct {
	transactor *db.Transactor
}

func NewNotePostgres(transactor *db.Transactor) *NotePostgres {
	return &NotePostgres{
		transactor: transactor,
	}
}

func (r *NotePostgres) Create(ctx context.Context, note *domain.Note) error {
	query := `
		INSERT INTO notes (id, category_id, title, content, is_pinned, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.transactor.GetDB(ctx).Exec(
		ctx,
		query,
		note.ID,
		note.CategoryID,
		note.Title,
		note.Content,
		note.IsPinned,
		note.CreatedAt,
		note.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert note: %w", err)
	}
	return nil
}

func (r *NotePostgres) List(ctx context.Context, categoryID *uuid.UUID) ([]domain.Note, error) {
	var (
		rows pgx.Rows
		err  error
	)

	if categoryID != nil {
		query := `
			SELECT id, category_id, title, content, is_pinned, created_at, updated_at
			FROM notes
			WHERE category_id = $1
			ORDER BY is_pinned DESC, updated_at DESC
		`
		rows, err = r.transactor.GetDB(ctx).Query(ctx, query, *categoryID)
	} else {
		query := `
			SELECT id, category_id, title, content, is_pinned, created_at, updated_at
			FROM notes
			ORDER BY is_pinned DESC, updated_at DESC
		`
		rows, err = r.transactor.GetDB(ctx).Query(ctx, query)
	}

	if err != nil {
		return nil, fmt.Errorf("select notes: %w", err)
	}
	defer rows.Close()

	var notes []domain.Note
	for rows.Next() {
		var n domain.Note
		if err := rows.Scan(&n.ID, &n.CategoryID, &n.Title, &n.Content, &n.IsPinned, &n.CreatedAt, &n.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan note: %w", err)
		}
		notes = append(notes, n)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate notes: %w", err)
	}

	return notes, nil
}

func (r *NotePostgres) GetByID(ctx context.Context, id uuid.UUID) (*domain.Note, error) {
	query := `
		SELECT id, category_id, title, content, is_pinned, created_at, updated_at
		FROM notes
		WHERE id = $1
	`
	var n domain.Note
	err := r.transactor.GetDB(ctx).QueryRow(ctx, query, id).Scan(
		&n.ID,
		&n.CategoryID,
		&n.Title,
		&n.Content,
		&n.IsPinned,
		&n.CreatedAt,
		&n.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNoteNotFound
		}
		return nil, fmt.Errorf("select note by id: %w", err)
	}
	return &n, nil
}

func (r *NotePostgres) Update(ctx context.Context, note *domain.Note) error {
	query := `
		UPDATE notes
		SET category_id = $1, title = $2, content = $3, is_pinned = $4, updated_at = $5
		WHERE id = $6
	`
	tag, err := r.transactor.GetDB(ctx).Exec(
		ctx,
		query,
		note.CategoryID,
		note.Title,
		note.Content,
		note.IsPinned,
		note.UpdatedAt,
		note.ID,
	)
	if err != nil {
		return fmt.Errorf("update note: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNoteNotFound
	}
	return nil
}

func (r *NotePostgres) Delete(ctx context.Context, id uuid.UUID) error {
	query := `
		DELETE FROM notes
		WHERE id = $1
	`
	tag, err := r.transactor.GetDB(ctx).Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete note: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNoteNotFound
	}
	return nil
}
