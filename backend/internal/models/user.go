package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID                 string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Username           string `gorm:"type:varchar(16);uniqueIndex"`
	FirstName          string `gorm:"type:varchar(50);not null"`
	LastName           string `gorm:"type:varchar(50)"`
	Email              string `gorm:"type:varchar(255);uniqueIndex;not null"`
	Password           string `gorm:"type:text;not null"`
	Status             string `gorm:"type:varchar(20);default:'OFFLINE'"`
	IsPremium          bool   `gorm:"type:bool;not null"`
	IsEmailVerified    bool   `gorm:"type:bool;default:false"`
	VerificationToken  string `gorm:"type:text"`
	VerificationExpiry time.Time
	PublicKey          *string        `gorm:"type:text"`
	EncryptedPrivKey   *string        `gorm:"type:text"`
	EncryptionIv       *string        `gorm:"type:text"`
	CreatedAt          time.Time      `gorm:"autoCreateTime"`
	UpdatedAt          time.Time      `gorm:"autoUpdateTime"`
	DeletedAt          gorm.DeletedAt `gorm:"index"`
}
