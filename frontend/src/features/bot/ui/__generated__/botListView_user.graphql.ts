/**
 * @generated SignedSource<<308c5ce0e12c83d30ae37def87e1c488>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type botListView_user$data = {
  readonly botDescription: string | null | undefined;
  readonly firstName: string;
  readonly id: string;
  readonly isVerified: boolean;
  readonly lastName: string | null | undefined;
  readonly photoUrl: string | null | undefined;
  readonly status: string;
  readonly username: string | null | undefined;
  readonly " $fragmentType": "botListView_user";
};
export type botListView_user$key = {
  readonly " $data"?: botListView_user$data;
  readonly " $fragmentSpreads": FragmentRefs<"botListView_user">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "botListView_user",
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
      "name": "lastName",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "botDescription",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "photoUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "status",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isVerified",
      "storageKey": null
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "4d6b7a569afc2bc44abe459039d70489";

export default node;
