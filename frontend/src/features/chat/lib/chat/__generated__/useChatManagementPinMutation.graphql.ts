/**
 * @generated SignedSource<<a03944a023fe1d33433c2c7a40b88723>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useChatManagementPinMutation$variables = {
  id: string;
  pinned: boolean;
};
export type useChatManagementPinMutation$data = {
  readonly pinChat: {
    readonly __typename: "ForbiddenError";
    readonly message: string;
  } | {
    readonly __typename: "InternalError";
    readonly message: string;
  } | {
    readonly __typename: "SuccessResult";
    readonly success: boolean;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type useChatManagementPinMutation = {
  response: useChatManagementPinMutation$data;
  variables: useChatManagementPinMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "pinned"
  }
],
v1 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v2 = [
  {
    "kind": "ClientExtension",
    "selections": [
      {
        "alias": null,
        "args": [
          {
            "kind": "Variable",
            "name": "id",
            "variableName": "id"
          },
          {
            "kind": "Variable",
            "name": "pinned",
            "variableName": "pinned"
          }
        ],
        "concreteType": null,
        "kind": "LinkedField",
        "name": "pinChat",
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
          },
          {
            "kind": "InlineFragment",
            "selections": (v1/*: any*/),
            "type": "ForbiddenError",
            "abstractKey": null
          },
          {
            "kind": "InlineFragment",
            "selections": (v1/*: any*/),
            "type": "InternalError",
            "abstractKey": null
          }
        ],
        "storageKey": null
      }
    ]
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "useChatManagementPinMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useChatManagementPinMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "6b8e8fc9814e5baec72f779865a02db8",
    "id": null,
    "metadata": {},
    "name": "useChatManagementPinMutation",
    "operationKind": "mutation",
    "text": null
  }
};
})();

(node as any).hash = "f0ebf66de42e0ea6a2a0054459268b61";

export default node;
