/**
 * @generated SignedSource<<dfd35f76285fbd71ee58bb8fa645b0a0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type channelContentGenerateInviteLinkMutation$variables = {
  id: string;
};
export type channelContentGenerateInviteLinkMutation$data = {
  readonly exportChatInvite: {
    readonly __typename: "ChatInvite";
    readonly code: string;
    readonly inviteLink: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type channelContentGenerateInviteLinkMutation = {
  response: channelContentGenerateInviteLinkMutation$data;
  variables: channelContentGenerateInviteLinkMutation$variables;
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
        "name": "chatID",
        "variableName": "id"
      }
    ],
    "concreteType": null,
    "kind": "LinkedField",
    "name": "exportChatInvite",
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
            "name": "code",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "inviteLink",
            "storageKey": null
          }
        ],
        "type": "ChatInvite",
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
    "name": "channelContentGenerateInviteLinkMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "channelContentGenerateInviteLinkMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "316e7c0058e1d19c22d73052b0d01c88",
    "id": null,
    "metadata": {},
    "name": "channelContentGenerateInviteLinkMutation",
    "operationKind": "mutation",
    "text": "mutation channelContentGenerateInviteLinkMutation(\n  $id: ID!\n) {\n  exportChatInvite(chatID: $id) {\n    __typename\n    ... on ChatInvite {\n      code\n      inviteLink\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "d405b79cd6907f552914e3b10d3e00e1";

export default node;
