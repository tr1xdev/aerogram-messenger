package geo_svc

import (
	"log"
	"net"

	"github.com/oschwald/geoip2-golang"
)

type Service struct {
	db *geoip2.Reader
}

func New(dbPath string) *Service {
	db, err := geoip2.Open(dbPath)
	if err != nil {
		log.Printf("failed to open geoip database: %v", err)
		return &Service{db: nil}
	}
	return &Service{db: db}
}

func (s *Service) Lookup(ipStr string) string {
	if s.db == nil || ipStr == "" || ipStr == "127.0.0.1" || ipStr == "::1" {
		return "Local Network"
	}

	ip := net.ParseIP(ipStr)
	record, err := s.db.City(ip)
	if err != nil {
		return "Unknown Location"
	}

	city := record.City.Names["en"]
	country := record.Country.Names["en"]

	if city != "" && country != "" {
		return city + ", " + country
	} else if country != "" {
		return country
	}

	return "Unknown Location"
}

func (s *Service) Close() {
	if s.db != nil {
		s.db.Close()
	}
}
