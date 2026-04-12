package dbgen

func (User) IsNode() {}

func (u User) GetID() string {
	return u.ID.String()
}

func (Session) IsNode() {}

func (s Session) GetID() string {
	return s.ID.String()
}
