"use client";

import { Component, type ReactNode } from "react";

export class StudioErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="listener-shell"><section className="panel form-panel" role="alert">
      <h1>This workspace could not display.</h1>
      <p>Your account's saved songs and original recordings have not been removed. Unsaved work may be available in device recovery after reloading.</p>
      <p>Try reopening the workspace. If the problem returns, keep a note of the tool and action that triggered it.</p>
      <button type="button" className="primary" onClick={() => window.location.reload()}>Reload Studio</button>
    </section></main>;
  }
}
