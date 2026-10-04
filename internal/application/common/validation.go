package common

import (
	"fmt"
	"strings"

	"note-service/internal/domain"
)

// ValidateAndNormalizeTitle trims whitespace and checks length bounds.
func ValidateAndNormalizeTitle(title string, maxLength int) (string, error) {
	trimmed := strings.TrimSpace(title)
	if trimmed == "" || len(trimmed) > maxLength {
		return "", fmt.Errorf("%w: title must be between 1 and %d characters", domain.ErrInvalidInput, maxLength)
	}
	return trimmed, nil
}
