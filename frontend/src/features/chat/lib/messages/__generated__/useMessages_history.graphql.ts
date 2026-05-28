/**
 * @generated SignedSource<<e1e5dd5f5b3582a3710b16c0bacccc8c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type useMessages_history$data = {
  readonly messageHistory: {
    readonly __typename: "MessageConnection";
    readonly hasMore: boolean;
    readonly messages: ReadonlyArray<{
      readonly attachments: ReadonlyArray<{
        readonly contentType: string;
        readonly fileName: string;
        readonly fileSize: any;
        readonly id: string;
        readonly type: string;
        readonly url: string;
      }> | null | undefined;
      readonly id: string;
      readonly isEdited: boolean;
      readonly replyTo: {
        readonly id: string;
        readonly sender: {
          readonly displayName: string | null | undefined;
          readonly firstName: string;
          readonly id: string;
          readonly lastName: string | null | undefined;
        } | null | undefined;
        readonly text: string;
      } | null | undefined;
      readonly sender: {
        readonly displayName: string | null | undefined;
        readonly firstName: string;
        readonly id: string;
        readonly lastName: string | null | undefined;
        readonly photoUrl: string | null | undefined;
      } | null | undefined;
      readonly sentAt: string;
      readonly sequence: any;
      readonly text: string;
      readonly " $fragmentSpreads": FragmentRefs<"messageList_metadata">;
    }>;
  } | {
    readonly __typename: "NotFoundError";
    readonly message: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
  readonly " $fragmentType": "useMessages_history";
};
export type useMessages_history$key = {
  readonly " $data"?: useMessages_history$data;
  readonly " $fragmentSpreads": FragmentRefs<"useMessages_history">;
};

import useMessagesRefetchQuery_graphql from './useMessagesRefetchQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "text",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstName",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastName",
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
  "argumentDefinitions": [
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
  "kind": "Fragment",
  "metadata": {
    "refetch": {
      "connection": null,
      "fragmentPathInResult": [],
      "operation": useMessagesRefetchQuery_graphql
    }
  },
  "name": "useMessages_history",
  "selections": [
    {
      "alias": null,
      "args": [
        {
          "kind": "Variable",
          "name": "beforeSequence",
          "variableName": "cursor"
        },
        {
          "kind": "Variable",
          "name": "chatId",
          "variableName": "chatId"
        },
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
                (v0/*: any*/),
                {
                  "args": null,
                  "kind": "FragmentSpread",
                  "name": "messageList_metadata"
                },
                (v1/*: any*/),
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
                  "concreteType": "Attachment",
                  "kind": "LinkedField",
                  "name": "attachments",
                  "plural": true,
                  "selections": [
                    (v0/*: any*/),
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "type",
                      "storageKey": null
                    },
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
                    }
                  ],
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
                    (v0/*: any*/),
                    (v2/*: any*/),
                    (v3/*: any*/),
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
                    (v0/*: any*/),
                    (v1/*: any*/),
                    {
                      "alias": null,
                      "args": null,
                      "concreteType": "User",
                      "kind": "LinkedField",
                      "name": "sender",
                      "plural": false,
                      "selections": [
                        (v0/*: any*/),
                        (v2/*: any*/),
                        (v3/*: any*/),
                        (v4/*: any*/)
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
  ],
  "type": "Query",
  "abstractKey": null
};
})();

(node as any).hash = "0c24e8dbea4e2f9ce0fe211adbe5abad";

export default node;
