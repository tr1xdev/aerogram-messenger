package ua_svc

import (
	"fmt"

	"github.com/ua-parser/uap-go/uaparser"
)

type Service struct {
	parser *uaparser.Parser
}

func New() *Service {
	return &Service{
		parser: uaparser.NewFromSaved(),
	}
}

func (s *Service) Parse(uaString string) string {
	if uaString == "" {
		return "Unknown Device"
	}

	client := s.parser.Parse(uaString)

	device := client.Device.Family
	os := client.Os.Family

	if device == "Other" || device == "" {
		if os != "Other" && os != "" {
			return fmt.Sprintf("%s (%s)", client.UserAgent.Family, os)
		}
		return client.UserAgent.Family
	}

	if os != "Other" && os != "" {
		return fmt.Sprintf("%s (%s)", device, os)
	}

	return device
}
