/**
 * @generated SignedSource<<013bd49759dc5521f625bf7c8542bc29>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type channelContentDeleteMutation$variables = {
  id: string;
};
export type channelContentDeleteMutation$data = {
  readonly deleteChat: {
    readonly __typename: "SuccessResult";
    readonly success: boolean;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type channelContentDeleteMutation = {
  response: channelContentDeleteMutation$data;
  variables: channelContentDeleteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": null,
    "kind": "LinkedField",
    "name": "deleteChat",
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
            "kind": "ScalarField",
            "name": "success",
            "storageKey": null
          }
        ],
        "type": "SuccessResult",
        "abstractKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "channelContentDeleteMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "channelContentDeleteMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "8d391ecfef0d4f7ca58a0f4d65c3ee96",
    "id": null,
    "metadata": {},
    "name": "channelContentDeleteMutation",
    "operationKind": "mutation",
    "text": "mutation channelContentDeleteMutation(\n  $id: ID!\n) {\n  deleteChat(id: $id) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "85498d4f669921ba31594f5ba543c72a";

export default node;
