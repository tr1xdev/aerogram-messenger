/**
 * @generated SignedSource<<6edb8e3b743e55d871868712cb3858bc>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type chatHeader_user$data = {
  readonly displayName: string | null | undefined;
  readonly firstName: string;
  readonly id: string;
  readonly isTyping: boolean;
  readonly isVerified: boolean;
  readonly lastName: string | null | undefined;
  readonly photoUrl: string | null | undefined;
  readonly status: string;
  readonly username: string | null | undefined;
  readonly " $fragmentType": "chatHeader_user";
};
export type chatHeader_user$key = {
  readonly " $data"?: chatHeader_user$data;
  readonly " $fragmentSpreads": FragmentRefs<"chatHeader_user">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "chatHeader_user",
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
      "name": "status",
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
      "name": "displayName",
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
      "name": "isTyping",
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

(node as any).hash = "d10999fc3f71f1ff9e1c3fd8836c0159";

export default node;
