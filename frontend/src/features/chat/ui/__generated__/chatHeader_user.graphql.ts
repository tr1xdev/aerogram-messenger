/**
 * @generated SignedSource<<a34c9da3f4994201bfd6fe5f8426658b>>
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

(node as any).hash = "7cd31190d956534a515a3479262ed42c";

export default node;
