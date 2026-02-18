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
	RoleOwner  UserRole = "owner"
	RoleAdmin  UserRole = "admin"
	RoleMember UserRole = "member"
	RoleBanned UserRole = "banned"
	RoleLeft   UserRole = "left"
)

type Message struct {
	ID            string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	DialogID      string         `gorm:"type:uuid;not null;index:idx_dialog_created"`
	AuthorID      string         `gorm:"type:uuid;not null;index"`
	Content       string         `gorm:"type:text;not null"`
	ReplyToID     *string        `gorm:"type:uuid;index"`
	Sender       *User          `gorm:"-"`
	ForwardFromID *string        `gorm:"type:uuid;index"`
	MediaURL      *string        `gorm:"type:varchar(2048)"`
	MediaType     *string        `gorm:"type:varchar(100)"`
	IsEdited      bool           `gorm:"default:false"`
	IsDeleted     bool           `gorm:"default:false"`
	IsSystem      bool           `gorm:"default:false"`
	ViewsCount    int            `gorm:"default:0"`
	CreatedAt     time.Time      `gorm:"autoCreateTime;index:idx_dialog_created"`
	UpdatedAt     time.Time      `gorm:"autoUpdateTime"`
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

type Dialog struct {
	ID              string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Type            DialogType     `gorm:"type:varchar(20);not null;index"`
	Name            *string        `gorm:"type:varchar(255);index"`
	Username        *string        `gorm:"type:varchar(32);uniqueIndex"`
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
	DialogID        string     `gorm:"type:uuid;primaryKey;index:idx_user_dialog"`
	UserID          string     `gorm:"type:uuid;primaryKey;index:idx_user_dialog"`
	Role            UserRole   `gorm:"type:varchar(20);default:'member';index"`
	JoinedAt        time.Time  `gorm:"autoCreateTime"`
	LastReadAt      time.Time  `gorm:"autoCreateTime"`
	MutedUntil      *time.Time `gorm:"index"`
	IsPinned        bool       `gorm:"default:false"`
	UnreadCount     int        `gorm:"default:0"`
	CustomTitle     *string    `gorm:"type:varchar(100)"`
	NotificationsOn bool       `gorm:"default:true"`
	CreatedAt       time.Time  `gorm:"autoCreateTime"`
	UpdatedAt       time.Time  `gorm:"autoUpdateTime"`
}

type ChatHistory struct {
	ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	DialogID  string    `gorm:"type:uuid;not null;index:idx_dialog_history"`
	MessageID string    `gorm:"type:uuid;not null;uniqueIndex"`
	AuthorID  string    `gorm:"type:uuid;not null;index"`
	IsEdited  bool      `gorm:"default:false"`
	IsDeleted bool      `gorm:"default:false"`
	CreatedAt time.Time `gorm:"autoCreateTime;index:idx_dialog_history"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

type DialogSettings struct {
	DialogID            string    `gorm:"type:uuid;primaryKey"`
	AllowSendMessages   bool      `gorm:"default:true"`
	AllowSendMedia      bool      `gorm:"default:true"`
	AllowSendStickers   bool      `gorm:"default:true"`
	AllowSendPolls      bool      `gorm:"default:true"`
	AllowChangeInfo     bool      `gorm:"default:true"`
	AllowInviteUsers    bool      `gorm:"default:true"`
	AllowPinMessages    bool      `gorm:"default:true"`
	SlowModeDelay       int       `gorm:"default:0"`
	IsHistoryHidden     bool      `gorm:"default:false"`
	IsSignaturesEnabled bool      `gorm:"default:false"`
	CreatedAt           time.Time `gorm:"autoCreateTime"`
	UpdatedAt           time.Time `gorm:"autoUpdateTime"`
}

type MessageAction struct {
	ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	MessageID  string    `gorm:"type:uuid;not null;index"`
	UserID     string    `gorm:"type:uuid;not null;index"`
	ActionType string    `gorm:"type:varchar(50);not null;index"` // like, dislike, forward, save
	CreatedAt  time.Time `gorm:"autoCreateTime"`
}
