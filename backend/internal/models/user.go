package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID                 string  `gorm:"primaryKey;size:36"`
	Username           *string `gorm:"size:16;uniqueIndex"`
	FirstName          string  `gorm:"size:50;not null"`
	LastName           *string `gorm:"size:50"`
	Email              string  `gorm:"size:255;uniqueIndex;not null"`
	Password           string  `gorm:"not null"`
	Status             string  `gorm:"size:20;default:'OFFLINE'"`
	IsPremium          bool    `gorm:"not null;default:false"`
	IsEmailVerified    bool    `gorm:"default:false"`
	VerificationToken  string
	VerificationExpiry time.Time
	PublicKey          *string
	EncryptedPrivKey   *string
	EncryptionIv       *string
	CreatedAt          time.Time
	UpdatedAt          time.Time
	DeletedAt          gorm.DeletedAt `gorm:"index"`
}
