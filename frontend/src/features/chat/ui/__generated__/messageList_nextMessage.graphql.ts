/**
 * @generated SignedSource<<7be4c61d031fbc0ba1a69c8724f8f4bd>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type messageList_nextMessage$data = {
  readonly sender: {
    readonly id: string;
  } | null | undefined;
  readonly " $fragmentType": "messageList_nextMessage";
};
export type messageList_nextMessage$key = {
  readonly " $data"?: messageList_nextMessage$data;
  readonly " $fragmentSpreads": FragmentRefs<"messageList_nextMessage">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "messageList_nextMessage",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "User",
      "kind": "LinkedField",
      "name": "sender",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "id",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Message",
  "abstractKey": null
};

(node as any).hash = "9ae816c3d6a3ec605617ba555296951a";

export default node;
