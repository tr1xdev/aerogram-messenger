/**
 * @generated SignedSource<<f1c398224b078875926ed02592bf9257>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type useAppTitle_chats$data = {
  readonly chats: ReadonlyArray<{
    readonly unreadCount: number;
  }>;
  readonly " $fragmentType": "useAppTitle_chats";
};
export type useAppTitle_chats$key = {
  readonly " $data"?: useAppTitle_chats$data;
  readonly " $fragmentSpreads": FragmentRefs<"useAppTitle_chats">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "useAppTitle_chats",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "Chat",
      "kind": "LinkedField",
      "name": "chats",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "unreadCount",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "ChatList",
  "abstractKey": null
};

(node as any).hash = "d0e476b99e84c9334469276b4798f07c";

export default node;
