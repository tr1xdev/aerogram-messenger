/**
 * @generated SignedSource<<fd10587f8e122af3009b6e9a97830b50>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type messageList_metadata$data = ReadonlyArray<{
  readonly id: string;
  readonly sender: {
    readonly id: string;
  } | null | undefined;
  readonly sentAt: string;
  readonly " $fragmentType": "messageList_metadata";
}>;
export type messageList_metadata$key = ReadonlyArray<{
  readonly " $data"?: messageList_metadata$data;
  readonly " $fragmentSpreads": FragmentRefs<"messageList_metadata">;
}>;

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "messageList_metadata",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "sentAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "User",
      "kind": "LinkedField",
      "name": "sender",
      "plural": false,
      "selections": [
        (v0/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "type": "Message",
  "abstractKey": null
};
})();

(node as any).hash = "abc6cbe0649207fcbf9e8b65860a814d";

export default node;
