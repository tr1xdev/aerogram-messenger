/**
 * @generated SignedSource<<d4eb354a26dce45594684799962c5745>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type useMarkDialog_chat$data = {
  readonly id: string;
  readonly members: ReadonlyArray<{
    readonly lastReadSequence: any;
    readonly user: {
      readonly id: string;
    };
  }> | null | undefined;
  readonly myReadSequence: any;
  readonly unreadCount: number;
  readonly " $fragmentType": "useMarkDialog_chat";
};
export type useMarkDialog_chat$key = {
  readonly " $data"?: useMarkDialog_chat$data;
  readonly " $fragmentSpreads": FragmentRefs<"useMarkDialog_chat">;
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
  "name": "useMarkDialog_chat",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "unreadCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "myReadSequence",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "ChatMember",
      "kind": "LinkedField",
      "name": "members",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "User",
          "kind": "LinkedField",
          "name": "user",
          "plural": false,
          "selections": [
            (v0/*: any*/)
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "lastReadSequence",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Chat",
  "abstractKey": null
};
})();

(node as any).hash = "a643cf772806b0ed663ea54ab9430a65";

export default node;
