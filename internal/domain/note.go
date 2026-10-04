package domain

import (
	"time"

	"github.com/google/uuid"
)

type Note struct {
	ID         uuid.UUID
	CategoryID *uuid.UUID
	Title      string
	Content    string
	IsPinned   bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
