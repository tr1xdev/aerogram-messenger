/**
 * @generated SignedSource<<b5d5438b1393e0062acc4e36eec467e1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type messageList_prevMessage$data = {
  readonly sender: {
    readonly id: string;
  } | null | undefined;
  readonly " $fragmentType": "messageList_prevMessage";
};
export type messageList_prevMessage$key = {
  readonly " $data"?: messageList_prevMessage$data;
  readonly " $fragmentSpreads": FragmentRefs<"messageList_prevMessage">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "messageList_prevMessage",
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

(node as any).hash = "3076732803f6e26c86e0b012cfab9bb6";

export default node;
