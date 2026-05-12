/**
 * @generated SignedSource<<125e566a39e34d47084b0e8876cf256b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type channelContentRotateInviteMutation$variables = {
  chatID: string;
  inviteCode: string;
};
export type channelContentRotateInviteMutation$data = {
  readonly revokeChatInvite: {
    readonly __typename: "SuccessResult";
    readonly success: boolean;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type channelContentRotateInviteMutation = {
  response: channelContentRotateInviteMutation$data;
  variables: channelContentRotateInviteMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatID"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "inviteCode"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "chatID",
        "variableName": "chatID"
      },
      {
        "kind": "Variable",
        "name": "inviteCode",
        "variableName": "inviteCode"
      }
    ],
    "concreteType": null,
    "kind": "LinkedField",
    "name": "revokeChatInvite",
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
    "name": "channelContentRotateInviteMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "channelContentRotateInviteMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "3dc65bdd9d05e496779a5ce3e528ff98",
    "id": null,
    "metadata": {},
    "name": "channelContentRotateInviteMutation",
    "operationKind": "mutation",
    "text": "mutation channelContentRotateInviteMutation(\n  $chatID: ID!\n  $inviteCode: String!\n) {\n  revokeChatInvite(chatID: $chatID, inviteCode: $inviteCode) {\n    __typename\n    ... on SuccessResult {\n      success\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "121d6dd0c1bcedb9635b4b3461fe000d";

export default node;
