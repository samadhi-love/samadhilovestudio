"use client";

import { Component, type ReactNode } from "react";
import {installActionCrashReporting,reportPanelCrash} from "./client-crash-report";
import {installInputSafety} from "./input-safety";

export class StudioErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  private removeCrashReporting?:()=>void;
  private removeInputSafety?:()=>void;
  componentDidMount(){this.removeCrashReporting=installActionCrashReporting();this.removeInputSafety=installInputSafety();}
  componentWillUnmount(){this.removeCrashReporting?.();this.removeInputSafety?.();}
  componentDidCatch(error:Error){reportPanelCrash("studio","render",error);}
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
