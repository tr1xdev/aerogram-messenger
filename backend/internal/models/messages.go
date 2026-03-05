package models

import (
	"time"

	"github.com/google/uuid"
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
	ID            uuid.UUID      `json:"id"`
	DialogID      uuid.UUID      `json:"chatId"`
	AuthorID      uuid.UUID      `json:"senderId"`
	Content       string         `json:"text"`
	IsEncrypted   bool           `json:"isEncrypted"`
	EncryptionIv  *string        `json:"encryptionIv"`
	Sequence      int64          `json:"sequence"`
	ReplyToID     *uuid.UUID     `json:"replyToId,omitempty"`
	ForwardFromID *uuid.UUID     `json:"forwardFromId,omitempty"`
	MediaURL      *string        `json:"mediaUrl,omitempty"`
	MediaType     *string        `json:"mediaType,omitempty"`
	IsEdited      bool           `json:"isEdited"`
	IsDeleted     bool           `json:"isDeleted"`
	IsSystem      bool           `json:"isSystem"`
	CreatedAt     time.Time      `json:"sentAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `json:"-"`
	Sender        *User          `json:"sender,omitempty"`
}

type Dialog struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Type            DialogType     `gorm:"type:varchar(20);not null;index" json:"type"`
	Name            *string        `gorm:"type:varchar(255);index" json:"name,omitempty"`
	Username        *string        `gorm:"type:varchar(32);uniqueIndex:idx_dialog_username,where:username IS NOT NULL" json:"username,omitempty"`
	PhotoURL        *string        `gorm:"type:varchar(2048)" json:"photo_url,omitempty"`
	Bio             *string        `gorm:"type:text" json:"bio,omitempty"`
	Description     *string        `gorm:"type:text" json:"description,omitempty"`
	InviteLink      *string        `gorm:"type:varchar(255);uniqueIndex" json:"invite_link,omitempty"`
	PinnedMessageID *uuid.UUID     `gorm:"type:uuid" json:"pinned_message_id,omitempty"`
	CreatorID       *uuid.UUID     `gorm:"type:uuid;index" json:"creator_id,omitempty"`
	LastMessageID   *uuid.UUID     `gorm:"type:uuid" json:"last_message_id,omitempty"`
	LastMessageAt   *time.Time     `gorm:"index" json:"last_message_at,omitempty"`
	MembersCount    int            `gorm:"default:1" json:"members_count"`
	IsVerified      bool           `gorm:"default:false" json:"is_verified"`
	IsActive        bool           `gorm:"default:true" json:"is_active"`
	CreatedAt       time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

type DialogMember struct {
	DialogID          uuid.UUID  `gorm:"type:uuid;primaryKey;index:idx_user_dialog" json:"dialog_id"`
	UserID            uuid.UUID  `gorm:"type:uuid;primaryKey;index:idx_user_dialog" json:"user_id"`
	Role              UserRole   `gorm:"type:varchar(20);default:'member';index" json:"role"`
	JoinedAt          time.Time  `gorm:"autoCreateTime" json:"joined_at"`
	LastReadMessageID *uuid.UUID `gorm:"type:uuid;index" json:"last_read_message_id,omitempty"`
	LastReadSequence  int64      `gorm:"index" json:"last_read_sequence"`
	MutedUntil        *time.Time `gorm:"index" json:"muted_until,omitempty"`
	IsPinned          bool       `gorm:"default:false" json:"is_pinned"`
	CustomTitle       *string    `gorm:"type:varchar(100)" json:"custom_title,omitempty"`
	NotificationsOn   bool       `gorm:"default:true" json:"notifications_on"`
	CreatedAt         time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
}

type DialogSettings struct {
	DialogID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"dialog_id"`
	Permissions         uint64    `gorm:"default:0" json:"permissions"`
	SlowModeDelay       int       `gorm:"default:0" json:"slow_mode_delay"`
	IsHistoryHidden     bool      `gorm:"default:false" json:"is_history_hidden"`
	IsSignaturesEnabled bool      `gorm:"default:false" json:"is_signatures_enabled"`
	CreatedAt           time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt           time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
