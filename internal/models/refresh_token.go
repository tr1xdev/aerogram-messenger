package models

import "time"

type RefreshToken struct {
	ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    string    `gorm:"type:uuid;not null" json:"user_id"`
	Token     string    `gorm:"unique;not null" json:"token"`
	Expiry    time.Time `gorm:"not null" json:"expiry"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
}
