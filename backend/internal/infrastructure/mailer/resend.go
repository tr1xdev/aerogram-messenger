package mailer

import (
	"bytes"
	"context"
	"fmt"
	"html/template"

	"github.com/resend/resend-go/v3"
)

type ResendService struct {
	client *resend.Client
	tmpl   *template.Template
	from   string
}

func NewResendService(apiKey, from, tmplPath string) (*ResendService, error) {
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return nil, err
	}

	return &ResendService{
		client: resend.NewClient(apiKey),
		tmpl:   tmpl,
		from:   from,
	}, nil
}

func (s *ResendService) SendCode(ctx context.Context, to, code, name string) error {
	var body bytes.Buffer
	if err := s.tmpl.Execute(&body, struct{ FirstName, Code string }{name, code}); err != nil {
		return err
	}

	_, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.from,
		To:      []string{to},
		Subject: fmt.Sprintf("%s is your code", code),
		Html:    body.String(),
	})
	return err
}
