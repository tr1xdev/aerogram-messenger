package loaders

import (
	"context"
	"strings"

	"github.com/graph-gophers/dataloader/v7"
	presencepb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/presence/v1"
)

func LoadPresence(ctx context.Context, id string) (string, error) {
	l := ForContext(ctx)
	if l == nil {
		return "offline", nil
	}
	return l.PresenceLoader.Load(ctx, strings.ToLower(id))()
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
			}
			output[i] = &dataloader.Result[string]{Data: status}
		}

		return output
	}
}
