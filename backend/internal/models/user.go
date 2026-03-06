package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                 uuid.UUID  `json:"id"`
	Username           *string    `json:"username"`
	FirstName          string     `json:"first_name"`
	LastName           *string    `json:"last_name"`
	Email              string     `json:"email"`
	Password           string     `json:"-"`
	Status             string     `json:"status"`
	IsPremium          bool       `json:"isPremium"`
	IsEmailVerified    bool       `json:"isEmailVerified"`
	VerificationToken  string     `json:"-"`
	VerificationExpiry time.Time  `json:"-"`
	PublicKey          *string    `json:"publicKey"`
	EncryptedPrivKey   *string    `json:"encryptedPrivKey"`
	EncryptionIv       *string    `json:"encryptionIv"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
	DeletedAt          *time.Time `json:"-"`
}
