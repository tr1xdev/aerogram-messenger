package loaders

import (
	"context"
	"log"
	"strings"

	"github.com/graph-gophers/dataloader/v7"
	presencepb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/presence/v1"
)

func LoadPresence(ctx context.Context, id string) (string, error) {
	l := ForContext(ctx)
	if l == nil {
		log.Printf("[LOADER-PRESENCE] Warning: No loader in context for user %s", id)
		return "offline", nil
	}

	res, err := l.PresenceLoader.Load(ctx, strings.ToLower(id))()
	if err != nil {
		log.Printf("[LOADER-PRESENCE] Error loading for %s: %v", id, err)
		return "offline", err
	}
	return res, nil
}

func newPresenceBatchFn(client presencepb.PresenceServiceClient) dataloader.BatchFunc[string, string] {
	return func(ctx context.Context, keys []string) []*dataloader.Result[string] {

		output := make([]*dataloader.Result[string], len(keys))

		res, err := client.GetBulk(ctx, &presencepb.GetBulkRequest{UserIds: keys})
		if err != nil {
			for i := range output {
				output[i] = &dataloader.Result[string]{Error: err}
			}
			return output
		}

		for i, id := range keys {
			status := "offline"
			lowerID := strings.ToLower(id)

			if val, ok := res.Statuses[lowerID]; ok {
				status = val
			} else {
				log.Printf("[BATCH-PRESENCE] No status found in gRPC response for user: %s", lowerID)
			}

			output[i] = &dataloader.Result[string]{Data: status}
		}

		return output
	}
}
