/**
 * @generated SignedSource<<da8f2fcb7247710988c0599da1d5ed2e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type settingsDialog_user$data = {
  readonly id: string;
  readonly " $fragmentSpreads": FragmentRefs<"profileContent_user">;
  readonly " $fragmentType": "settingsDialog_user";
};
export type settingsDialog_user$key = {
  readonly " $data"?: settingsDialog_user$data;
  readonly " $fragmentSpreads": FragmentRefs<"settingsDialog_user">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "settingsDialog_user",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "id",
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "profileContent_user"
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "1d41bd9ba51491724bb0fb0c333877cf";

export default node;
