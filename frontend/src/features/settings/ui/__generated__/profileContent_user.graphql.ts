/**
 * @generated SignedSource<<a12eeef62f0bedd028ba7a8572d63d62>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type profileContent_user$data = {
  readonly bio: string | null | undefined;
  readonly botCommands: string | null | undefined;
  readonly botDescription: string | null | undefined;
  readonly createdAt: string;
  readonly displayName: string | null | undefined;
  readonly firstName: string;
  readonly id: string;
  readonly isBot: boolean;
  readonly isVerified: boolean;
  readonly lastName: string | null | undefined;
  readonly photoUrl: string | null | undefined;
  readonly username: string | null | undefined;
  readonly " $fragmentType": "profileContent_user";
};
export type profileContent_user$key = {
  readonly " $data"?: profileContent_user$data;
  readonly " $fragmentSpreads": FragmentRefs<"profileContent_user">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "profileContent_user",
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
      "name": "username",
      "storageKey": null
    },
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
      "name": "photoUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "bio",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isBot",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isVerified",
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
      "name": "botCommands",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "createdAt",
      "storageKey": null
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "b2b2ef73c30aa982ed692cc1bed2ef6b";

export default node;
