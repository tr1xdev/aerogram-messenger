/**
 * @generated SignedSource<<cbd2ad63a313a2695ff06a6698c130de>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type useMessagesRefetchQuery$variables = {
  chatId: string;
  count?: number | null | undefined;
  cursor?: any | null | undefined;
};
export type useMessagesRefetchQuery$data = {
  readonly " $fragmentSpreads": FragmentRefs<"useMessages_history">;
};
export type useMessagesRefetchQuery = {
  response: useMessagesRefetchQuery$data;
  variables: useMessagesRefetchQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatId"
  },
  {
    "defaultValue": 50,
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
  "name": "text",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useMessagesRefetchQuery",
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
    "name": "useMessagesRefetchQuery",
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
                  (v3/*: any*/),
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
                    "kind": "ScalarField",
                    "name": "sequence",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "isEdited",
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
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "firstName",
                        "storageKey": null
                      },
                      {
                        "alias": null,
                        "args": null,
                        "kind": "ScalarField",
                        "name": "photoUrl",
                        "storageKey": null
                      },
                      (v4/*: any*/)
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
                      (v3/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "User",
                        "kind": "LinkedField",
                        "name": "sender",
                        "plural": false,
                        "selections": [
                          (v4/*: any*/),
                          (v2/*: any*/)
                        ],
                        "storageKey": null
                      }
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
    "cacheID": "9e44bceb04316f6f97b930127f92ccf0",
    "id": null,
    "metadata": {},
    "name": "useMessagesRefetchQuery",
    "operationKind": "query",
    "text": "query useMessagesRefetchQuery(\n  $chatId: ID!\n  $count: Int = 50\n  $cursor: Long\n) {\n  ...useMessages_history_2v0QF4\n}\n\nfragment useMessages_history_2v0QF4 on Query {\n  messageHistory(chatId: $chatId, limit: $count, beforeSequence: $cursor) {\n    __typename\n    ... on MessageConnection {\n      messages {\n        id\n        text\n        sentAt\n        sequence\n        isEdited\n        sender {\n          id\n          firstName\n          photoUrl\n          displayName\n        }\n        replyTo {\n          id\n          text\n          sender {\n            displayName\n            id\n          }\n        }\n      }\n      hasMore\n    }\n    ... on NotFoundError {\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1c95ecd62c7d9a5332caa3e749607260";

export default node;
