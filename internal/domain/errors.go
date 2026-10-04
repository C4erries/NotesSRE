package domain

import "errors"

var (
	ErrCategoryNotFound = errors.New("category not found")
	ErrNoteNotFound     = errors.New("note not found")
	ErrInvalidInput     = errors.New("invalid input")
	ErrConflict         = errors.New("entity conflict")
)
