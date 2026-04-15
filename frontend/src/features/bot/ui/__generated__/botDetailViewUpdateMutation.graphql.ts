/**
 * @generated SignedSource<<5325dd5b13e4b0d9551a1f4d3c6d5f5d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateUserInput = {
  bio?: string | null | undefined;
  botCommands?: string | null | undefined;
  botDescription?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  photoUrl?: string | null | undefined;
  username?: string | null | undefined;
};
export type botDetailViewUpdateMutation$variables = {
  id: string;
  input: UpdateUserInput;
};
export type botDetailViewUpdateMutation$data = {
  readonly updateBot: {
    readonly botDescription: string | null | undefined;
    readonly firstName: string;
    readonly id: string;
    readonly username: string | null | undefined;
  };
};
export type botDetailViewUpdateMutation = {
  response: botDetailViewUpdateMutation$data;
  variables: botDetailViewUpdateMutation$variables;
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
    "name": "input"
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
      },
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "updateBot",
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
      },
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
        "name": "botDescription",
        "storageKey": null
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
    "name": "botDetailViewUpdateMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "botDetailViewUpdateMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "2d382204901e8e275912e734929de176",
    "id": null,
    "metadata": {},
    "name": "botDetailViewUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation botDetailViewUpdateMutation(\n  $id: ID!\n  $input: UpdateUserInput!\n) {\n  updateBot(id: $id, input: $input) {\n    id\n    username\n    firstName\n    botDescription\n  }\n}\n"
  }
};
})();

(node as any).hash = "ec6e122f8546b89429f4bcbbda9f47a4";

export default node;
