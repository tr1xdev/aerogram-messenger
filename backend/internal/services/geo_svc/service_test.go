package geo_svc

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGeoLookup_Real(t *testing.T) {
	dbPath := "../../../assets/GeoLite2-City.mmdb"
	svc := New(dbPath)
	defer svc.Close()

	t.Run("PublicIP", func(t *testing.T) {
		if svc.db == nil {
			t.Skip("GeoIP database not found, skipping real lookup test")
		}

		res := svc.Lookup("8.8.8.8")
		assert.NotEqual(t, "Unknown Location", res)
		assert.NotEqual(t, "Local Network", res)
		assert.Contains(t, res, "United States")
	})

	t.Run("LocalAndEdgeCases", func(t *testing.T) {
		assert.Equal(t, "Local Network", svc.Lookup("127.0.0.1"))
		assert.Equal(t, "Local Network", svc.Lookup("::1"))
		assert.Equal(t, "Local Network", svc.Lookup(""))
	})
}

func TestNew_ErrorHandling(t *testing.T) {
	svc := New("/non/existent/path")
	assert.NotNil(t, svc)
	assert.Nil(t, svc.db)
	assert.Equal(t, "Local Network", svc.Lookup("1.1.1.1"))
}
