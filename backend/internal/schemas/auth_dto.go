package dto

type SignUpRequest struct {
	Email     string  `json:"email" validate:"required,email,max=255"`
	Username  string  `json:"username" validate:"required,max=16"`
	Password  string  `json:"password" validate:"required,max=255"`
	FirstName string  `json:"first_name" validate:"required,max=32"`
	LastName  *string `json:"last_name,omitempty" validate:"omitempty,max=32"`
}

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
}
