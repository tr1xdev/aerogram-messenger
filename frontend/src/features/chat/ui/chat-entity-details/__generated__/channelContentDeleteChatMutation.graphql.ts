/**
 * @generated SignedSource<<3ec598d36d2128570a4726bd263c52d0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type channelContentDeleteChatMutation$variables = {
  forEveryone?: boolean | null | undefined;
  id: string;
};
export type channelContentDeleteChatMutation$data = {
  readonly deleteChat: {
    readonly __typename: "SuccessResult";
    readonly success: boolean;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type channelContentDeleteChatMutation = {
  response: channelContentDeleteChatMutation$data;
  variables: channelContentDeleteChatMutation$variables;
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
    "name": "channelContentDeleteChatMutation",
    "selections": (v2/*: any*/),
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
    "name": "channelContentDeleteChatMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "71daf76b78133843c12fe2bfc50e8169",
    "id": null,
    "metadata": {},
    "name": "channelContentDeleteChatMutation",
    "operationKind": "mutation",
    "text": "mutation channelContentDeleteChatMutation(\n  $id: ID!\n  $forEveryone: Boolean\n) {\n  deleteChat(id: $id, forEveryone: $forEveryone) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "1b3478ef04b395779bf6ee85e5b50a5b";

export default node;
