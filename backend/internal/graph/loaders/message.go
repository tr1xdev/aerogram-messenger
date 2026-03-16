package loaders

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/graph-gophers/dataloader/v7"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
)

func LoadMessage(ctx context.Context, id string) (*model.Message, error) {
	l := ForContext(ctx)
	if l == nil {
		return nil, fmt.Errorf("dataloaders not found")
	}
	return l.MessageLoader.Load(ctx, id)()
}

func newMessageBatchFn(store *dbgen.Queries) dataloader.BatchFunc[string, *model.Message] {
	return func(ctx context.Context, keys []string) []*dataloader.Result[*model.Message] {
		output := make([]*dataloader.Result[*model.Message], len(keys))

		uuids := make([]uuid.UUID, 0, len(keys))
		for _, k := range keys {
			if u, err := uuid.Parse(k); err == nil {
				uuids = append(uuids, u)
			}
		}

		messages, err := store.GetMessagesByIDs(ctx, uuids)
		if err != nil {
			for i := range output {
				output[i] = &dataloader.Result[*model.Message]{Error: err}
			}
			return output
		}

		msgMap := make(map[string]*model.Message)
		for _, m := range messages {
			msgMap[m.ID.String()] = helpers.MapDBMessageToModel(&m)
		}

		for i, id := range keys {
			if m, ok := msgMap[id]; ok {
				output[i] = &dataloader.Result[*model.Message]{Data: m}
			} else {
				output[i] = &dataloader.Result[*model.Message]{Error: fmt.Errorf("message %s not found", id)}
			}
		}

		return output
	}
}
