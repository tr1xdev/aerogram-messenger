/**
 * @generated SignedSource<<3b48ccdba1bfec91a7b2fd43133ccd1f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type useMessagesQuery$variables = {
  chatId: string;
  count: number;
  cursor?: any | null | undefined;
};
export type useMessagesQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"useMessages_history">;
};
export type useMessagesQuery = {
  response: useMessagesQuery$data;
  variables: useMessagesQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatId"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "count"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "cursor"
  }
],
v1 = {
  "kind": "Variable",
  "name": "chatId",
  "variableName": "chatId"
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstName",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastName",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "text",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useMessagesQuery",
    "selections": [
      {
        "args": [
          (v1/*: any*/),
          {
            "kind": "Variable",
            "name": "count",
            "variableName": "count"
          },
          {
            "kind": "Variable",
            "name": "cursor",
            "variableName": "cursor"
          }
        ],
        "kind": "FragmentSpread",
        "name": "useMessages_history"
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useMessagesQuery",
    "selections": [
      {
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "beforeSequence",
            "variableName": "cursor"
          },
          (v1/*: any*/),
          {
            "kind": "Variable",
            "name": "limit",
            "variableName": "count"
          }
        ],
        "concreteType": null,
        "kind": "LinkedField",
        "name": "messageHistory",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "__typename",
            "storageKey": null
          },
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "Message",
                "kind": "LinkedField",
                "name": "messages",
                "plural": true,
                "selections": [
                  (v2/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sentAt",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "User",
                    "kind": "LinkedField",
                    "name": "sender",
                    "plural": false,
                    "selections": [
                      (v2/*: any*/),
                      (v3/*: any*/),
                      (v4/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "username",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "photoUrl",
                        "storageKey": null
                      },
                      (v5/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v6/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "sequence",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Attachment",
                    "kind": "LinkedField",
                    "name": "attachments",
                    "plural": true,
                    "selections": [
                      (v2/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "url",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "fileName",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "fileSize",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "contentType",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "type",
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Message",
                    "kind": "LinkedField",
                    "name": "replyTo",
                    "plural": false,
                    "selections": [
                      (v2/*: any*/),
                      (v6/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "User",
                        "kind": "LinkedField",
                        "name": "sender",
                        "plural": false,
                        "selections": [
                          (v3/*: any*/),
                          (v4/*: any*/),
                          (v2/*: any*/),
                          (v5/*: any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "isEdited",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "hasMore",
                "storageKey": null
              }
            ],
            "type": "MessageConnection",
            "abstractKey": null
          },
          {
            "kind": "InlineFragment",
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "message",
                "storageKey": null
              }
            ],
            "type": "NotFoundError",
            "abstractKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "28a605bdbbc8dd1ed5d1d489e5cb1549",
    "id": null,
    "metadata": {},
    "name": "useMessagesQuery",
    "operationKind": "query",
    "text": "query useMessagesQuery(\n  $chatId: ID!\n  $count: Int!\n  $cursor: Long\n) {\n  ...useMessages_history_2v0QF4\n}\n\nfragment messageBubble_message on Message {\n  id\n  text\n  sentAt\n  sequence\n  attachments {\n    id\n    url\n    fileName\n    fileSize\n    contentType\n  }\n  sender {\n    id\n    firstName\n    lastName\n    username\n    photoUrl\n  }\n  replyTo {\n    id\n    text\n    sender {\n      firstName\n      lastName\n      id\n    }\n  }\n}\n\nfragment messageList_message on Message {\n  id\n  sentAt\n  sender {\n    id\n  }\n  ...messageBubble_message\n}\n\nfragment messageList_metadata on Message {\n  id\n  sentAt\n  sender {\n    id\n  }\n  ...messageList_message\n  ...messageList_prevMessage\n  ...messageList_nextMessage\n}\n\nfragment messageList_nextMessage on Message {\n  sender {\n    id\n  }\n}\n\nfragment messageList_prevMessage on Message {\n  sender {\n    id\n  }\n}\n\nfragment useMessages_history_2v0QF4 on Query {\n  messageHistory(chatId: $chatId, limit: $count, beforeSequence: $cursor) {\n    __typename\n    ... on MessageConnection {\n      messages {\n        id\n        ...messageList_metadata\n        text\n        sentAt\n        sequence\n        isEdited\n        attachments {\n          id\n          type\n          url\n          fileName\n          fileSize\n          contentType\n        }\n        sender {\n          id\n          firstName\n          lastName\n          photoUrl\n          displayName\n        }\n        replyTo {\n          id\n          text\n          sender {\n            id\n            firstName\n            lastName\n            displayName\n          }\n        }\n      }\n      hasMore\n    }\n    ... on NotFoundError {\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "9421192f7fb6a0a98b55abf9796f22be";

export default node;
