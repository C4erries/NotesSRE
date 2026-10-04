package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type txContextKey struct{}

// DBTX is the common database interface implemented by pgxpool.Pool and pgx.Tx.
type DBTX interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type Transactor struct {
	pool *pgxpool.Pool
}

func NewTransactor(pool *pgxpool.Pool) *Transactor {
	return &Transactor{pool: pool}
}

// WithinTransaction executes fn inside a database transaction stored in ctx.
func (t *Transactor) WithinTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
	tx, err := t.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}

	ctxWithTx := context.WithValue(ctx, txContextKey{}, tx)

	if err := fn(ctxWithTx); err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return fmt.Errorf("transaction error: %w, rollback error: %v", err, rbErr)
		}
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

// GetDB returns the transaction if present in ctx, otherwise returns the underlying pool.
func (t *Transactor) GetDB(ctx context.Context) DBTX {
	if tx, ok := ctx.Value(txContextKey{}).(pgx.Tx); ok && tx != nil {
		return tx
	}
	return t.pool
}

// Ping checks database connectivity.
func (t *Transactor) Ping(ctx context.Context) error {
	return t.pool.Ping(ctx)
}

// Close closes the pool.
func (t *Transactor) Close() {
	t.pool.Close()
}
