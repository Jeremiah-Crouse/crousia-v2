// src/components/Editor.jsx
import React, { useMemo, useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS, $convertToMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ParagraphNode, TextNode } from "lexical";
import { getSharedDoc, getSharedProvider, isAdmin } from "../utils/collaboration";

function AutoSavePlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let timeout;
    const save = () => {
      editor.getEditorState().read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        fetch('/api/archive-today', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: markdown })
        }).catch(err => console.error("Save failed", err));
      });
    };
    return editor.registerUpdateListener(() => {
      clearTimeout(timeout);
      timeout = setTimeout(save, 2000);
    });
  }, [editor]);
  return null;
}

const USERNAMES = ['hedgehog', 'shark', 'otter', 'eagle', 'wolf', 'fox', 'bear', 'owl'];
const USERNAME = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];

export default function Editor() {
  const readonly = !isAdmin();
  const [isSynced, setIsSynced] = useState(false);

  const doc = useMemo(() => getSharedDoc(), []);
  
  // Initialize provider and sync state
  const provider = useMemo(() => {
    return getSharedProvider({ readonly, username: USERNAME });
  }, [readonly]);

  useEffect(() => {
    // Check initial state
    setIsSynced(provider.synced);

    // Set up event listeners
    const handleSync = (synced) => setIsSynced(synced);
    provider.on("sync", handleSync);
    
    return () => {
      provider.off("sync", handleSync);
    };
  }, [provider]);

  const providerFactory = (id, yjsDocMap) => {
    yjsDocMap.set(id, doc);
    return provider;
  };

  const initialConfig = {
    namespace: "CrousiaEditor",
    editable: !readonly,
    nodes: [ParagraphNode, TextNode, HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    theme: { paragraph: "editor-paragraph" },
    onError(error) { 
      console.error("Lexical error:", error);
      // If we hit error #92, force a page reload to recover state
      if (error.message.includes('#92')) {
        window.location.reload(); 
      }
    }
  };

  return (
    <div className="editor-container">
      {/* Container visibility logic */}
      <div style={{ opacity: isSynced ? 1 : 0, transition: 'opacity 0.3s' }}>
        <LexicalComposer initialConfig={initialConfig}>
          <CollaborationPlugin
            id="crousia-editor"
            providerFactory={providerFactory}
            username={USERNAME}
          />
          <AutoSavePlugin />
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div>Loading content...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </LexicalComposer>
      </div>

      {/* Loading overlay */}
      {!isSynced && (
        <div className="editor-placeholder">
          Loading content from archive...
        </div>
      )}
    </div>
  );
}