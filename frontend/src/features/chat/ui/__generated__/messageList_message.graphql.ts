/**
 * @generated SignedSource<<9212fe70c124a4e27fde983c11ff820b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type messageList_message$data = {
  readonly id: string;
  readonly sender: {
    readonly id: string;
  } | null | undefined;
  readonly sentAt: string;
  readonly " $fragmentSpreads": FragmentRefs<"messageBubble_message">;
  readonly " $fragmentType": "messageList_message";
};
export type messageList_message$key = {
  readonly " $data"?: messageList_message$data;
  readonly " $fragmentSpreads": FragmentRefs<"messageList_message">;
};

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
  "metadata": null,
  "name": "messageList_message",
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
      "name": "messageBubble_message"
    }
  ],
  "type": "Message",
  "abstractKey": null
};
})();

(node as any).hash = "85eaf2616df2c691d767a9a2c608e64d";

export default node;
