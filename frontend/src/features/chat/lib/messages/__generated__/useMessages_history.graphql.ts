/**
 * @generated SignedSource<<9354fddd914342f732d790e09470ebe8>>
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
      readonly id: string;
      readonly isEdited: boolean;
      readonly replyTo: {
        readonly id: string;
        readonly sender: {
          readonly displayName: string | null | undefined;
        } | null | undefined;
        readonly text: string;
      } | null | undefined;
      readonly sender: {
        readonly displayName: string | null | undefined;
        readonly firstName: string;
        readonly id: string;
        readonly photoUrl: string | null | undefined;
      } | null | undefined;
      readonly sentAt: string;
      readonly sequence: any;
      readonly text: string;
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
                  "concreteType": "User",
                  "kind": "LinkedField",
                  "name": "sender",
                  "plural": false,
                  "selections": [
                    (v0/*: any*/),
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
                    (v2/*: any*/)
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
  ],
  "type": "Query",
  "abstractKey": null
};
})();

(node as any).hash = "1c95ecd62c7d9a5332caa3e749607260";

export default node;
