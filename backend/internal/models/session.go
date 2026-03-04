package models

import "time"

type Session struct {
	ID        string    `gorm:"primaryKey;size:36" json:"id"`
	UserID    string    `gorm:"type:uuid;not null;index" json:"user_id"`
	IPAddress string    `gorm:"size:128" json:"ip_address"`
	Device    string    `gorm:"size:255" json:"device"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
}
