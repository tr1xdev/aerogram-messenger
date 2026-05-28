package model

import (
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
)

type ChatExtended struct {
	dbgen.Dialog
	Role                 string
	UnreadCount          int
	IsPinned             bool
	MyReadSequence       int64
	OpponentReadSequence int64
	ReadOutboxMaxId      int64
	ReadInboxMaxId       int64
}

func (ChatExtended) IsChatResult()    {}
func (ChatExtended) IsMyChatsResult() {}
func (ChatExtended) IsNode()          {}
func (c ChatExtended) GetID() string  { return c.ID.String() }
