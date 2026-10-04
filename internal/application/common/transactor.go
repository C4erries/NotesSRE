package common

import "context"

// Transactor allows executing a callback inside a database transaction.
type Transactor interface {
	WithinTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}
