/**
 * @generated SignedSource<<70c44525210d5bd4309db4c62ee5d62a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type channelContentQuery$variables = {
  id: string;
};
export type channelContentQuery$data = {
  readonly chat: {
    readonly __typename: "Chat";
    readonly id: string;
    readonly members: ReadonlyArray<{
      readonly role: string;
      readonly user: {
        readonly displayName: string | null | undefined;
        readonly firstName: string;
        readonly id: string;
        readonly photoUrl: string | null | undefined;
      };
    }> | null | undefined;
    readonly membersCount: number;
    readonly myRole: string;
    readonly photoUrl: string | null | undefined;
    readonly slug: string | null | undefined;
    readonly title: string;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
  readonly chatInvites: {
    readonly __typename: "ChatInvitesList";
    readonly invites: ReadonlyArray<{
      readonly code: string;
      readonly inviteLink: string;
    }>;
  } | {
    // This will never be '%other', but we need some
    // value in case none of the concrete values match.
    readonly __typename: "%other";
  };
  readonly me: {
    readonly id: string;
  };
};
export type channelContentQuery = {
  response: channelContentQuery$data;
  variables: channelContentQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = [
  (v1/*: any*/)
],
v3 = {
  "alias": null,
  "args": null,
  "concreteType": "User",
  "kind": "LinkedField",
  "name": "me",
  "plural": false,
  "selections": (v2/*: any*/),
  "storageKey": null
},
v4 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "photoUrl",
  "storageKey": null
},
v7 = {
  "kind": "InlineFragment",
  "selections": [
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "title",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "slug",
      "storageKey": null
    },
    (v6/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "membersCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "myRole",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ChatMember",
      "kind": "LinkedField",
      "name": "members",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "User",
          "kind": "LinkedField",
          "name": "user",
          "plural": false,
          "selections": [
            (v1/*: any*/),
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "displayName",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "firstName",
              "storageKey": null
            },
            (v6/*: any*/)
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "role",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Chat",
  "abstractKey": null
},
v8 = {
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
  "name": "chatInvites",
  "plural": false,
  "selections": [
    (v5/*: any*/),
    {
      "kind": "InlineFragment",
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "ChatInvite",
          "kind": "LinkedField",
          "name": "invites",
          "plural": true,
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
          "storageKey": null
        }
      ],
      "type": "ChatInvitesList",
      "abstractKey": null
    }
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "channelContentQuery",
    "selections": [
      (v3/*: any*/),
      {
        "alias": null,
        "args": (v4/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "chat",
        "plural": false,
        "selections": [
          (v5/*: any*/),
          (v7/*: any*/)
        ],
        "storageKey": null
      },
      (v8/*: any*/)
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "channelContentQuery",
    "selections": [
      (v3/*: any*/),
      {
        "alias": null,
        "args": (v4/*: any*/),
        "concreteType": null,
        "kind": "LinkedField",
        "name": "chat",
        "plural": false,
        "selections": [
          (v5/*: any*/),
          (v7/*: any*/),
          {
            "kind": "InlineFragment",
            "selections": (v2/*: any*/),
            "type": "Node",
            "abstractKey": "__isNode"
          }
        ],
        "storageKey": null
      },
      (v8/*: any*/)
    ]
  },
  "params": {
    "cacheID": "7704ef0b51ec1be79318e99731f66f69",
    "id": null,
    "metadata": {},
    "name": "channelContentQuery",
    "operationKind": "query",
    "text": "query channelContentQuery(\n  $id: ID!\n) {\n  me {\n    id\n  }\n  chat(id: $id) {\n    __typename\n    ... on Chat {\n      id\n      title\n      slug\n      photoUrl\n      membersCount\n      myRole\n      members {\n        user {\n          id\n          displayName\n          firstName\n          photoUrl\n        }\n        role\n      }\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  chatInvites(chatID: $id) {\n    __typename\n    ... on ChatInvitesList {\n      invites {\n        code\n        inviteLink\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "440c368944ae60ff905aa0a6ba22f45e";

export default node;
