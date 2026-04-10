/**
 * @generated SignedSource<<692cf623fb50da40b958e7aec59b4f9d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useChatManagementDeleteMutation$variables = {
  forEveryone: boolean;
  id: string;
};
export type useChatManagementDeleteMutation$data = {
  readonly deleteChat: {
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
export type useChatManagementDeleteMutation = {
  response: useChatManagementDeleteMutation$data;
  variables: useChatManagementDeleteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "forEveryone"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v2 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "message",
    "storageKey": null
  }
],
v3 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "forEveryone",
        "variableName": "forEveryone"
      },
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
      },
      {
        "kind": "InlineFragment",
        "selections": (v2/*: any*/),
        "type": "ForbiddenError",
        "abstractKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": (v2/*: any*/),
        "type": "InternalError",
        "abstractKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "useChatManagementDeleteMutation",
    "selections": (v3/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "useChatManagementDeleteMutation",
    "selections": (v3/*: any*/)
  },
  "params": {
    "cacheID": "dd62b0321260f600ebf823e35f3b7b70",
    "id": null,
    "metadata": {},
    "name": "useChatManagementDeleteMutation",
    "operationKind": "mutation",
    "text": "mutation useChatManagementDeleteMutation(\n  $id: ID!\n  $forEveryone: Boolean!\n) {\n  deleteChat(id: $id, forEveryone: $forEveryone) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n    ... on ForbiddenError {\n      message\n    }\n    ... on InternalError {\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "95166144a5036e7336c83f1eefb2f716";

export default node;
