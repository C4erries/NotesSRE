package domain

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID        uuid.UUID
	Title     string
	Color     string
	CreatedAt time.Time
}
