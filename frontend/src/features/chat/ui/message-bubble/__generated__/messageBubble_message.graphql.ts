/**
 * @generated SignedSource<<cf90465762faf8802f0e916b78cb9329>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type messageBubble_message$data = {
  readonly attachments: ReadonlyArray<{
    readonly contentType: string;
    readonly fileName: string;
    readonly fileSize: any;
    readonly id: string;
    readonly url: string;
  }> | null | undefined;
  readonly id: string;
  readonly isEdited: boolean;
  readonly replyTo: {
    readonly id: string;
    readonly sender: {
      readonly firstName: string;
      readonly lastName: string | null | undefined;
    } | null | undefined;
    readonly text: string;
  } | null | undefined;
  readonly sender: {
    readonly firstName: string;
    readonly id: string;
    readonly lastName: string | null | undefined;
    readonly photoUrl: string | null | undefined;
    readonly username: string | null | undefined;
  } | null | undefined;
  readonly sentAt: string;
  readonly sequence: any;
  readonly text: string;
  readonly " $fragmentType": "messageBubble_message";
};
export type messageBubble_message$key = {
  readonly " $data"?: messageBubble_message$data;
  readonly " $fragmentSpreads": FragmentRefs<"messageBubble_message">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "text",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "firstName",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "lastName",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "messageBubble_message",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
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
      "kind": "ScalarField",
      "name": "sequence",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isEdited",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Attachment",
      "kind": "LinkedField",
      "name": "attachments",
      "plural": true,
      "selections": [
        (v0/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "url",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "fileName",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "fileSize",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "contentType",
          "storageKey": null
        }
      ],
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
        (v0/*: any*/),
        (v2/*: any*/),
        (v3/*: any*/),
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
          "name": "photoUrl",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Message",
      "kind": "LinkedField",
      "name": "replyTo",
      "plural": false,
      "selections": [
        (v0/*: any*/),
        (v1/*: any*/),
        {
          "alias": null,
          "args": null,
          "concreteType": "User",
          "kind": "LinkedField",
          "name": "sender",
          "plural": false,
          "selections": [
            (v2/*: any*/),
            (v3/*: any*/)
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Message",
  "abstractKey": null
};
})();

(node as any).hash = "1940ed91b0b79b5bf84629a7f53236c2";

export default node;
