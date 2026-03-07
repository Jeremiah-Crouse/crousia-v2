// src/components/Editor.jsx
import React, { useMemo } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";

import { ParagraphNode, TextNode } from "lexical";

import { getSharedDoc, getSharedProvider, isAdmin } from "../utils/collaboration";

const USERNAME = "user_" + Math.floor(Math.random() * 1000);

export default function Editor() {
  const readonly = !isAdmin();

  const doc = useMemo(() => getSharedDoc(), []);
  const provider = useMemo(() => getSharedProvider({ readonly, username: USERNAME }), [readonly]);

  const providerFactory = (id, yjsDocMap) => {
    yjsDocMap.set(id, doc);
    return provider;
  };

  const initialConfig = {
    namespace: "CrousiaEditor",
    editable: !readonly,
    nodes: [
      ParagraphNode,
      TextNode,
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      LinkNode
    ],
    theme: {
      paragraph: "editor-paragraph",
    },
    onError(error) {
      console.error("Lexical error:", error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <CollaborationPlugin
          id="crousia-editor"
          providerFactory={providerFactory}
          username={USERNAME}
        />
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div>Start writing...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  );
}
