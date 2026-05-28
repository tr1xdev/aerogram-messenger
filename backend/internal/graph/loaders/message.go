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
	if l == nil || l.MessageLoader == nil {
		return nil, fmt.Errorf("message loader not initialized")
	}
	return l.MessageLoader.Load(ctx, id)()
}

func newMessageBatchFn(store *dbgen.Queries, enricher *helpers.ChatEnricher) dataloader.BatchFunc[string, *model.Message] {
	return func(ctx context.Context, keys []string) []*dataloader.Result[*model.Message] {
		output := make([]*dataloader.Result[*model.Message], len(keys))

		if enricher == nil {
			for i := range output {
				output[i] = &dataloader.Result[*model.Message]{Error: fmt.Errorf("enricher is nil")}
			}
			return output
		}

		uuids := make([]uuid.UUID, 0, len(keys))
		for _, k := range keys {
			rawID := helpers.ToRawID(k)
			if u, err := uuid.Parse(rawID); err == nil {
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
			enriched, err := enricher.EnrichMessage(ctx, m.ID.String())
			if err != nil {
				continue
			}
			msgMap[m.ID.String()] = enriched
		}

		for i, id := range keys {
			rawID := helpers.ToRawID(id)
			if m, ok := msgMap[rawID]; ok {
				output[i] = &dataloader.Result[*model.Message]{Data: m}
			} else {
				output[i] = &dataloader.Result[*model.Message]{Error: fmt.Errorf("message %s not found", id)}
			}
		}

		return output
	}
}
