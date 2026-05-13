/**
 * @generated SignedSource<<5ac106c468ec41be9408ea25d1ee47f9>>
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
  readonly " $fragmentSpreads": FragmentRefs<"messageList_message" | "messageList_nextMessage" | "messageList_prevMessage">;
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
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "messageList_message"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "messageList_prevMessage"
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "messageList_nextMessage"
    }
  ],
  "type": "Message",
  "abstractKey": null
};
})();

(node as any).hash = "9baf6c30e49a9acd0aeb77a1c132dc71";

export default node;
