package dbgen

func (User) IsNode() {}

func (u User) GetID() string {
	return u.ID.String()
}

func (Session) IsNode() {}

func (s Session) GetID() string {
	return s.ID.String()
}

func (Dialog) IsNode() {}

func (d Dialog) GetID() string {
	return d.ID.String()
}

func (User) IsSearchResult() {}

func (Dialog) IsSearchResult() {}

func (Dialog) IsChatResult() {}

func (Dialog) IsJoinChatResult() {}

func (Dialog) IsCreateChatResult() {}
