/**
 * @generated SignedSource<<70efb9c97c8207d226d18c2c9ecc3d52>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type botCreationViewMutation$variables = {
  description?: string | null | undefined;
  firstName: string;
  lastName?: string | null | undefined;
  username: string;
};
export type botCreationViewMutation$data = {
  readonly createBot: {
    readonly __typename: "CreateBotPayload";
    readonly botToken: string;
    readonly user: {
      readonly id: string;
      readonly username: string | null | undefined;
    };
  } | {
    readonly __typename: "ForbiddenError";
    readonly message: string;
  } | {
    readonly __typename: "InternalError";
    readonly message: string;
  } | {
    readonly __typename: "ValidationError";
    readonly field: string | null | undefined;
    readonly message: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
};
export type botCreationViewMutation = {
  response: botCreationViewMutation$data;
  variables: botCreationViewMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "description"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "firstName"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "lastName"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "username"
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "message",
  "storageKey": null
},
v5 = [
  (v4/*: any*/)
],
v6 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "description",
        "variableName": "description"
      },
      {
        "kind": "Variable",
        "name": "firstName",
        "variableName": "firstName"
      },
      {
        "kind": "Variable",
        "name": "lastName",
        "variableName": "lastName"
      },
      {
        "kind": "Variable",
        "name": "username",
        "variableName": "username"
      }
    ],
    "concreteType": null,
    "kind": "LinkedField",
    "name": "createBot",
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
            "name": "botToken",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "User",
            "kind": "LinkedField",
            "name": "user",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "id",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "username",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "type": "CreateBotPayload",
        "abstractKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": [
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "field",
            "storageKey": null
          }
        ],
        "type": "ValidationError",
        "abstractKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": (v5/*: any*/),
        "type": "ForbiddenError",
        "abstractKey": null
      },
      {
        "kind": "InlineFragment",
        "selections": (v5/*: any*/),
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
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "botCreationViewMutation",
    "selections": (v6/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v3/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "botCreationViewMutation",
    "selections": (v6/*: any*/)
  },
  "params": {
    "cacheID": "3f17ae382849139fdbacd1d48971806c",
    "id": null,
    "metadata": {},
    "name": "botCreationViewMutation",
    "operationKind": "mutation",
    "text": "mutation botCreationViewMutation(\n  $username: String!\n  $firstName: String!\n  $lastName: String\n  $description: String\n) {\n  createBot(username: $username, firstName: $firstName, lastName: $lastName, description: $description) {\n    __typename\n    ... on CreateBotPayload {\n      botToken\n      user {\n        id\n        username\n      }\n    }\n    ... on ValidationError {\n      message\n      field\n    }\n    ... on ForbiddenError {\n      message\n    }\n    ... on InternalError {\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "a9ed939107fee5a82083b0a48fd176dd";

export default node;
