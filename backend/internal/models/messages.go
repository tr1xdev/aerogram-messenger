package models

import (
	"time"

	"gorm.io/gorm"
)

type DialogType string

const (
	Private DialogType = "private"
	Group   DialogType = "group"
	Channel DialogType = "channel"
)

type UserRole string

const (
	RoleOwner      UserRole = "owner"
	RoleAdmin      UserRole = "admin"
	RoleMember     UserRole = "member"
	RoleBanned     UserRole = "banned"
	RoleLeft       UserRole = "left"
	RoleKicked     UserRole = "kicked"
	RoleRestricted UserRole = "restricted"
)

type Message struct {
	ID            string         `gorm:"type:uuid;primaryKey"`
	DialogID      string         `gorm:"type:uuid;not null;index:idx_dialog_seq"`
	AuthorID      string         `gorm:"type:uuid;not null;index"`
	Content       string         `gorm:"type:text;not null"`
	IsEncrypted   bool           `gorm:"type:bool;default:false;not null"`
	EncryptionIV  *string        `gorm:"type:text"`
	Sequence      int64          `gorm:"autoIncrement;uniqueIndex;index:idx_dialog_seq"`
	ReplyToID     *string        `gorm:"type:uuid;index"`
	Sender        *User          `gorm:"-"`
	ForwardFromID *string        `gorm:"type:uuid;index"`
	MediaURL      *string        `gorm:"type:varchar(2048)"`
	MediaType     *string        `gorm:"type:varchar(100)"`
	IsEdited      bool           `gorm:"default:false"`
	IsDeleted     bool           `gorm:"default:false"`
	IsSystem      bool           `gorm:"default:false"`
	CreatedAt     time.Time      `gorm:"autoCreateTime"`
	UpdatedAt     time.Time      `gorm:"autoUpdateTime"`
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

type Dialog struct {
	ID              string         `gorm:"type:uuid;primaryKey"`
	Type            DialogType     `gorm:"type:varchar(20);not null;index"`
	Name            *string        `gorm:"type:varchar(255);index"`
	Username        *string        `gorm:"type:varchar(32);uniqueIndex:,where:username IS NOT NULL"`
	PhotoURL        *string        `gorm:"type:varchar(2048)"`
	Bio             *string        `gorm:"type:text"`
	Description     *string        `gorm:"type:text"`
	InviteLink      *string        `gorm:"type:varchar(255);uniqueIndex"`
	PinnedMessageID *string        `gorm:"type:uuid"`
	CreatorID       *string        `gorm:"type:uuid;index"`
	LastMessageID   *string        `gorm:"type:uuid"`
	LastMessageAt   *time.Time     `gorm:"index"`
	MembersCount    int            `gorm:"default:1"`
	IsVerified      bool           `gorm:"default:false"`
	IsActive        bool           `gorm:"default:true"`
	CreatedAt       time.Time      `gorm:"autoCreateTime"`
	UpdatedAt       time.Time      `gorm:"autoUpdateTime"`
	DeletedAt       gorm.DeletedAt `gorm:"index"`
}

type DialogMember struct {
	DialogID          string     `gorm:"type:uuid;primaryKey;index:idx_user_dialog"`
	UserID            string     `gorm:"type:uuid;primaryKey;index:idx_user_dialog"`
	Role              UserRole   `gorm:"type:varchar(20);default:'member';index"`
	JoinedAt          time.Time  `gorm:"autoCreateTime"`
	LastReadMessageID *string    `gorm:"type:uuid;index"`
	LastReadSequence  int64      `gorm:"index"`
	MutedUntil        *time.Time `gorm:"index"`
	IsPinned          bool       `gorm:"default:false"`
	CustomTitle       *string    `gorm:"type:varchar(100)"`
	NotificationsOn   bool       `gorm:"default:true"`
	CreatedAt         time.Time  `gorm:"autoCreateTime"`
	UpdatedAt         time.Time  `gorm:"autoUpdateTime"`
}

type MessageRevision struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	MessageID string    `gorm:"type:uuid;not null;index"`
	OldText   string    `gorm:"type:text;not null"`
	EditorID  string    `gorm:"type:uuid;not null;index"`
	CreatedAt time.Time `gorm:"autoCreateTime;index"`
}

type MessageAction struct {
	ID         string    `gorm:"type:uuid;primaryKey"`
	MessageID  string    `gorm:"type:uuid;not null;index"`
	UserID     string    `gorm:"type:uuid;not null;index"`
	ActionType int16     `gorm:"not null;index"`
	CreatedAt  time.Time `gorm:"autoCreateTime"`
}

type DialogSettings struct {
	DialogID            string    `gorm:"type:uuid;primaryKey"`
	Permissions         uint64    `gorm:"default:0"`
	SlowModeDelay       int       `gorm:"default:0"`
	IsHistoryHidden     bool      `gorm:"default:false"`
	IsSignaturesEnabled bool      `gorm:"default:false"`
	CreatedAt           time.Time `gorm:"autoCreateTime"`
	UpdatedAt           time.Time `gorm:"autoUpdateTime"`
}
